// ROLET — Fully on-chain duel program
// Combines Tasks 1-3: data structures, ER game loop, L1 settlement.

use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::anchor::{commit, delegate, ephemeral};
use ephemeral_rollups_sdk::cpi::DelegateConfig;
use ephemeral_rollups_sdk::ephem::MagicIntentBundleBuilder;
use solana_keccak_hasher::hashv as keccak_hashv;
/// mpl-core `Key::AssetV1`. Kept as a byte so this program does not link mpl-core.
const CORE_ASSET_V1: u8 = 1;

/// MagicBlock devnet EU validator. A delegated match runs there.
pub const ER_VALIDATOR: Pubkey = pubkey!("MEUGGrYPxKk17hCr7wpT6s8dtNokZj5U2L57vjYMS8e");

declare_id!("mspQcUFhmAGYUsnBbcUndhaZiris53KtwYCjDHU91oH");

// ============================================================
// Constants
// ============================================================
pub const STARTING_HP: u8 = 4;
pub const CHAMBER_COUNT: u8 = 8;
pub const LIVE_ROUNDS: u8 = 5;
pub const BLANK_ROUNDS: u8 = 3;
pub const HAND_SIZE: usize = 4;
pub const CARD_VARIANTS: u8 = 12;
pub const TURN_TIMEOUT_SLOTS: u64 = 150;
/// Entropy is pinned to the first produced slot at or after
/// `final_reveal_slot + SEED_DELAY_SLOTS`. Its hash does not exist yet when
/// the last secret is revealed, so neither player can grind the outcome.
pub const SEED_DELAY_SLOTS: u64 = 2;
/// After both secrets are revealed the lobby is committed to launching:
/// either participant may call init_match while the seed slot is still in
/// the SlotHashes window. close_lobby is rejected until this many slots past
/// seed_slot (kept well below the ~512-slot SlotHashes depth), and after that
/// it only reclaims rent — no durability refund (RISK-A).
pub const LAUNCH_WINDOW_SLOTS: u64 = 300;

#[ephemeral]
#[program]
pub mod rolet {
    use super::*;

    // --------------------------------------------------------
    // INIT_MATCH — seeds chambers + deals starting hands
    // --------------------------------------------------------
    pub fn init_match(ctx: Context<InitMatch>, match_id: u64) -> Result<()> {
        // SECURITY: no caller-supplied commits/secrets. Both secrets were
        // committed in the lobby (open_lobby / join_lobby), revealed and
        // verified against those commits in reveal_secret, and re-checked
        // below so init_match is self-contained. The entropy slot was pinned
        // to a FUTURE slot at final reveal time, so the caller (host or
        // guest) can only trigger the deterministic launch.
        let lobby = &mut ctx.accounts.lobby;
        require!(!lobby.launched, RoletError::LobbyAlreadyLaunched);
        require!(lobby.guest.is_some(), RoletError::LobbyNotReady);
        // The launcher is a participant, signing with the wallet or its key.
        resolve_actor(
            ctx.accounts.signer.key(),
            &ctx.accounts.launcher_profile,
            ctx.accounts.authority.key(),
            Clock::get()?.unix_timestamp,
        )?;
        require!(
            lobby.host_revealed && lobby.guest_revealed,
            RoletError::SecretsNotRevealed
        );
        // Defense in depth: pair each revealed secret with the commit hash
        // recorded in the lobby at open_lobby / join_lobby. Even if a future
        // code path ever wrote host_secret/guest_secret without verifying,
        // init_match can never seed from an uncommitted secret.
        // Commits are bound to (player, match_id) — see lobby_commitment.
        let guest_key = lobby.guest.ok_or(RoletError::LobbyNotReady)?;
        require!(
            lobby_commitment(&lobby.host_secret, &lobby.host, lobby.match_id)
                == lobby.host_commit,
            RoletError::InvalidReveal
        );
        require!(
            lobby_commitment(&lobby.guest_secret, &guest_key, lobby.match_id)
                == lobby.guest_commit,
            RoletError::InvalidReveal
        );

        let clock = Clock::get()?;
        require!(clock.slot > lobby.seed_slot, RoletError::SeedSlotNotReached);
        let slot_entropy = {
            let data = ctx.accounts.slot_hashes.try_borrow_data()?;
            find_seed_slot_hash(&data, lobby.seed_slot)?
        };

        let seed = k_hash(&[
            &lobby.host_secret,
            &lobby.guest_secret,
            &slot_entropy,
            &match_id.to_le_bytes(),
        ]);
        lobby.launched = true;

        let m = &mut ctx.accounts.match_state;
        m.match_id = match_id;
        m.player_one = ctx.accounts.player_one.key();
        m.player_two = ctx.accounts.player_two.key();
        m.player_one_hp = STARTING_HP;
        m.player_two_hp = STARTING_HP;
        m.turn_number = 0;
        m.status = MatchStatus::Active;
        m.winner = None;
        m.silence_target = None;
        m.blocker_active_for = None;
        m.double_strike_for = None;
        m.revealed_chamber = None;
        m.skip_turn_for = None;
        m.last_action_slot = clock.slot;
        m.started_at = clock.unix_timestamp;
        m.bump = ctx.bumps.match_state;

        m.current_turn = if seed[0] & 1 == 0 {
            m.player_one
        } else {
            m.player_two
        };

        m.gun = build_gun(&seed);
        m.player_one_cards = deal_hand(&seed, 0xA1);
        m.player_two_cards = deal_hand(&seed, 0xB2);

        emit!(MatchInitialized {
            match_id,
            seed,
            first_turn: m.current_turn,
        });
        Ok(())
    }

    // --------------------------------------------------------
    // PLAY_CARD — applies card effects
    // --------------------------------------------------------
    pub fn play_card(ctx: Context<PlayCard>, slot: u8, card: Card) -> Result<()> {
        let signer = ctx.accounts.actor.key();
        let now = Clock::get()?.unix_timestamp;

        // Resolve "real" actor — wallet OR registered session key for the
        // current player's profile (PlayerProfile lives on L1; ER reads it
        // transparently as a non-delegated read-only account).
        let actor = resolve_actor(
            signer,
            &ctx.accounts.current_profile,
            ctx.accounts.match_state.current_turn,
            now,
        )?;

        let m = &mut ctx.accounts.match_state;
        require!(m.status == MatchStatus::Active, RoletError::MatchNotActive);
        require!(m.current_turn == actor, RoletError::NotYourTurn);
        require!(
            m.silence_target != Some(actor),
            RoletError::SilencedThisTurn
        );
        require!((slot as usize) < HAND_SIZE, RoletError::InvalidSlot);

        let hand = if actor == m.player_one {
            &mut m.player_one_cards
        } else {
            &mut m.player_two_cards
        };
        let held = hand.slots[slot as usize].ok_or(RoletError::EmptySlot)?;
        require!(held == card, RoletError::CardMismatch);
        hand.slots[slot as usize] = None;

        match card {
            Card::HawkEye => {
                let idx = m.gun.current_chamber;
                require!(idx < CHAMBER_COUNT, RoletError::ChamberOutOfRange);
                require!(
                    m.gun.chambers[idx as usize] != Chamber::Empty,
                    RoletError::ChamberAlreadyFired
                );
                m.revealed_chamber = Some(idx);
                emit!(CardPlayed { actor, card, detail: idx as u64 });
            }
            Card::BulletExtractor => {
                let idx = m.gun.current_chamber as usize;
                require!(idx < CHAMBER_COUNT as usize, RoletError::ChamberOutOfRange);
                let ejected = m.gun.chambers[idx];
                require!(ejected != Chamber::Empty, RoletError::ChamberAlreadyFired);
                match ejected {
                    Chamber::Live => m.gun.loaded_count = m.gun.loaded_count.saturating_sub(1),
                    Chamber::Blank => m.gun.blank_count = m.gun.blank_count.saturating_sub(1),
                    Chamber::Empty => unreachable!(),
                }
                m.gun.chambers[idx] = Chamber::Empty;
                m.gun.current_chamber = m.gun.current_chamber.saturating_add(1);
                m.revealed_chamber = None;
                emit!(CardPlayed { actor, card, detail: idx as u64 });
            }
            Card::Silence => {
                let opponent = if actor == m.player_one { m.player_two } else { m.player_one };
                m.silence_target = Some(opponent);
                emit!(CardPlayed { actor, card, detail: 0 });
            }
            Card::Blocker => {
                m.blocker_active_for = Some(actor);
                emit!(CardPlayed { actor, card, detail: 0 });
            }
            Card::DoubleStrike => {
                m.double_strike_for = Some(actor);
                emit!(CardPlayed { actor, card, detail: 0 });
            }
            Card::Healer => {
                if actor == m.player_one {
                    m.player_one_hp = (m.player_one_hp.saturating_add(1)).min(STARTING_HP);
                } else {
                    m.player_two_hp = (m.player_two_hp.saturating_add(1)).min(STARTING_HP);
                }
                emit!(CardPlayed { actor, card, detail: 1 });
            }
            Card::RestoreBullet => {
                // Find the first Empty chamber and reload it as Live.
                let mut found: Option<usize> = None;
                for (i, c) in m.gun.chambers.iter().enumerate() {
                    if *c == Chamber::Empty {
                        found = Some(i);
                        break;
                    }
                }
                let idx = found.ok_or(RoletError::NoChamberToRestore)?;
                m.gun.chambers[idx] = Chamber::Live;
                m.gun.loaded_count = m.gun.loaded_count.saturating_add(1);
                emit!(CardPlayed { actor, card, detail: idx as u64 });
            }
            Card::Shuffler => {
                // Re-shuffle ONLY the un-fired chambers using fresh entropy.
                let clock = Clock::get()?;
                let reseed = k_hash(&[
                    &m.match_id.to_le_bytes(),
                    &m.turn_number.to_le_bytes(),
                    &clock.slot.to_le_bytes(),
                    b"SHUFFLER",
                ]);
                // Collect unfired contents
                let mut unfired: Vec<(usize, Chamber)> = m
                    .gun
                    .chambers
                    .iter()
                    .enumerate()
                    .filter(|(_, c)| **c != Chamber::Empty)
                    .map(|(i, c)| (i, *c))
                    .collect();
                let n = unfired.len();
                if n > 1 {
                    let mut stream = reseed;
                    for i in (1..n).rev() {
                        let j = (stream[i % 32] as usize) % (i + 1);
                        unfired.swap(i, j);
                        stream = k_hash(&[&stream, &[i as u8]]);
                    }
                    // Write back into the same indices
                    let indices: Vec<usize> = unfired.iter().map(|(i, _)| *i).collect();
                    let contents: Vec<Chamber> = unfired.iter().map(|(_, c)| *c).collect();
                    for (k, idx) in indices.iter().enumerate() {
                        m.gun.chambers[*idx] = contents[k];
                    }
                }
                m.gun.shuffle_seed = u64::from_le_bytes(reseed[0..8].try_into().unwrap());
                m.revealed_chamber = None;
                emit!(CardPlayed { actor, card, detail: n as u64 });
            }
            Card::CardThief => {
                // Steal first non-empty card from opponent into first empty
                // slot in your own hand. Avoid double-borrow of `m` by
                // computing indices first, then mutating one side at a time.
                let actor_is_p1 = actor == m.player_one;
                let (opp_slot, stolen) = {
                    let opp_hand = if actor_is_p1 { &m.player_two_cards } else { &m.player_one_cards };
                    let oi = (0..HAND_SIZE)
                        .find(|i| opp_hand.slots[*i].is_some())
                        .ok_or(RoletError::CardThiefNoTarget)?;
                    (oi, opp_hand.slots[oi])
                };
                let own_slot = {
                    let own_hand = if actor_is_p1 { &m.player_one_cards } else { &m.player_two_cards };
                    (0..HAND_SIZE)
                        .find(|i| own_hand.slots[*i].is_none())
                        .ok_or(RoletError::CardThiefNoTarget)?
                };
                if actor_is_p1 {
                    m.player_two_cards.slots[opp_slot] = None;
                    m.player_one_cards.slots[own_slot] = stolen;
                } else {
                    m.player_one_cards.slots[opp_slot] = None;
                    m.player_two_cards.slots[own_slot] = stolen;
                }
                emit!(CardPlayed { actor, card, detail: opp_slot as u64 });
            }
            Card::RandomInsight => {
                // Reveal a pseudorandom unfired chamber.
                let clock = Clock::get()?;
                let pick_seed = k_hash(&[
                    &m.match_id.to_le_bytes(),
                    &m.turn_number.to_le_bytes(),
                    &clock.slot.to_le_bytes(),
                    b"INSIGHT",
                ]);
                let unfired: Vec<u8> = m
                    .gun
                    .chambers
                    .iter()
                    .enumerate()
                    .filter(|(_, c)| **c != Chamber::Empty)
                    .map(|(i, _)| i as u8)
                    .collect();
                if unfired.is_empty() {
                    return err!(RoletError::NoUnfiredChambers);
                }
                let pick = unfired[(pick_seed[0] as usize) % unfired.len()];
                m.revealed_chamber = Some(pick);
                emit!(CardPlayed { actor, card, detail: pick as u64 });
            }
            Card::LastChance => {
                // Only playable as a desperation move.
                let actor_hp = if actor == m.player_one { m.player_one_hp } else { m.player_two_hp };
                require!(actor_hp == 1, RoletError::LastChanceRequiresOneHp);
                let opponent = if actor == m.player_one { m.player_two } else { m.player_one };
                m.skip_turn_for = Some(opponent);
                emit!(CardPlayed { actor, card, detail: 0 });
            }
            Card::HandOfFate => {
                // Re-roll the current chamber's content.
                let idx = m.gun.current_chamber as usize;
                require!(idx < CHAMBER_COUNT as usize, RoletError::ChamberOutOfRange);
                let prev = m.gun.chambers[idx];
                require!(prev != Chamber::Empty, RoletError::ChamberAlreadyFired);
                let clock = Clock::get()?;
                let roll = k_hash(&[
                    &m.match_id.to_le_bytes(),
                    &m.turn_number.to_le_bytes(),
                    &clock.slot.to_le_bytes(),
                    b"FATE",
                ])[0];
                let next = if roll & 1 == 0 { Chamber::Live } else { Chamber::Blank };
                // Update counts based on transition
                match (prev, next) {
                    (Chamber::Live, Chamber::Blank) => {
                        m.gun.loaded_count = m.gun.loaded_count.saturating_sub(1);
                        m.gun.blank_count = m.gun.blank_count.saturating_add(1);
                    }
                    (Chamber::Blank, Chamber::Live) => {
                        m.gun.blank_count = m.gun.blank_count.saturating_sub(1);
                        m.gun.loaded_count = m.gun.loaded_count.saturating_add(1);
                    }
                    _ => {} // unchanged
                }
                m.gun.chambers[idx] = next;
                m.revealed_chamber = None;
                emit!(CardPlayed { actor, card, detail: u8::from(next) as u64 });
            }
        }

        m.last_action_slot = Clock::get()?.slot;
        Ok(())
    }

    // --------------------------------------------------------
    // PULL_TRIGGER — tactical chamber duel core mechanic
    // --------------------------------------------------------
    pub fn pull_trigger(ctx: Context<PullTrigger>, target_self: bool) -> Result<()> {
        let signer = ctx.accounts.actor.key();
        let now = Clock::get()?.unix_timestamp;
        let actor = resolve_actor(
            signer,
            &ctx.accounts.current_profile,
            ctx.accounts.match_state.current_turn,
            now,
        )?;

        let m = &mut ctx.accounts.match_state;
        require!(m.status == MatchStatus::Active, RoletError::MatchNotActive);
        require!(m.current_turn == actor, RoletError::NotYourTurn);

        // LastChance: if this player was flagged to be skipped, just consume
        // the flag and pass the turn back without firing.
        if m.skip_turn_for == Some(actor) {
            m.skip_turn_for = None;
            m.current_turn = if actor == m.player_one { m.player_two } else { m.player_one };
            m.turn_number = m.turn_number.saturating_add(1);
            m.last_action_slot = Clock::get()?.slot;
            return Ok(());
        }

        let idx = m.gun.current_chamber;
        require!(idx < CHAMBER_COUNT, RoletError::ChamberOutOfRange);
        let chamber = m.gun.chambers[idx as usize];
        require!(chamber != Chamber::Empty, RoletError::ChamberAlreadyFired);

        let target = if target_self {
            actor
        } else if actor == m.player_one {
            m.player_two
        } else {
            m.player_one
        };

        m.gun.chambers[idx as usize] = Chamber::Empty;
        m.gun.current_chamber = idx.saturating_add(1);
        m.revealed_chamber = None;

        let mut keep_turn = false;

        match chamber {
            Chamber::Live => {
                m.gun.loaded_count = m.gun.loaded_count.saturating_sub(1);
                let mut damage: u8 = 1;
                if m.double_strike_for == Some(actor) {
                    damage = 2;
                    m.double_strike_for = None;
                }
                if m.blocker_active_for == Some(target) {
                    damage = 0;
                    m.blocker_active_for = None;
                }
                if target == m.player_one {
                    m.player_one_hp = m.player_one_hp.saturating_sub(damage);
                } else {
                    m.player_two_hp = m.player_two_hp.saturating_sub(damage);
                }
                emit!(TriggerPulled { actor, target, chamber: chamber.into(), damage });
                if m.player_one_hp == 0 || m.player_two_hp == 0 {
                    m.status = MatchStatus::Completed;
                    m.winner = Some(if m.player_one_hp == 0 { m.player_two } else { m.player_one });
                    // PLAN_B: client observes status == Completed and issues
                    // the undelegate tx via TS SDK before calling settle_match.
                    return Ok(());
                }
            }
            Chamber::Blank => {
                m.gun.blank_count = m.gun.blank_count.saturating_sub(1);
                keep_turn = target_self;
                emit!(TriggerPulled { actor, target, chamber: chamber.into(), damage: 0 });
            }
            Chamber::Empty => unreachable!(),
        }

        if m.silence_target == Some(actor) {
            m.silence_target = None;
        }

        if !keep_turn {
            m.current_turn = if actor == m.player_one { m.player_two } else { m.player_one };
            m.turn_number = m.turn_number.saturating_add(1);
        }

        if m.gun.loaded_count == 0 && m.gun.blank_count == 0 {
            let clock = Clock::get()?;
            let reseed = k_hash(&[
                &m.match_id.to_le_bytes(),
                &m.turn_number.to_le_bytes(),
                &clock.slot.to_le_bytes(),
            ]);
            m.gun = build_gun(&reseed);
        }

        m.last_action_slot = Clock::get()?.slot;
        Ok(())
    }

    // --------------------------------------------------------
    // SETTLE_MATCH — L1 finalization after ER commit
    // --------------------------------------------------------
    pub fn settle_match(ctx: Context<SettleMatch>) -> Result<()> {
        let m = &ctx.accounts.match_state;
        require!(m.status == MatchStatus::Completed, RoletError::MatchNotCompleted);
        let winner_key = m.winner.ok_or(RoletError::WinnerNotSet)?;

        let p1_key = ctx.accounts.profile_one.authority;
        let p2_key = ctx.accounts.profile_two.authority;
        require!(
            (p1_key == m.player_one && p2_key == m.player_two)
                || (p1_key == m.player_two && p2_key == m.player_one),
            RoletError::ProfileMismatch
        );
        require!(
            winner_key == p1_key || winner_key == p2_key,
            RoletError::WinnerMismatch
        );

        // NOTE: durability is consumed at lobby entry (open_lobby/join_lobby),
        // NOT here — a match costs exactly 1 durability per player.

        let p1 = &mut ctx.accounts.profile_one;
        let p2 = &mut ctx.accounts.profile_two;

        let reward = ctx.accounts.vault.reward_sol;
        if winner_key == p1.authority {
            p1.stats.wins = p1.stats.wins.saturating_add(1);
            p2.stats.losses = p2.stats.losses.saturating_add(1);
            p1.stats.total_rewards_claimed = p1.stats.total_rewards_claimed.saturating_add(reward);
        } else {
            p2.stats.wins = p2.stats.wins.saturating_add(1);
            p1.stats.losses = p1.stats.losses.saturating_add(1);
            p2.stats.total_rewards_claimed = p2.stats.total_rewards_claimed.saturating_add(reward);
        }
        p1.stats.matches_played = p1.stats.matches_played.saturating_add(1);
        p2.stats.matches_played = p2.stats.matches_played.saturating_add(1);

        require!(
            ctx.accounts.treasury_sol.lamports() >= reward,
            RoletError::InsufficientVault
        );

        // Pay the winner from the SOL treasury (PDA-signed transfer).
        let vault = &ctx.accounts.vault;
        let vault_key = vault.key();
        let treasury_seeds: &[&[u8]] = &[
            b"treasury-sol",
            vault_key.as_ref(),
            core::slice::from_ref(&vault.treasury_bump),
        ];
        let signer_seeds: &[&[&[u8]]] = &[treasury_seeds];

        anchor_lang::system_program::transfer(
            anchor_lang::context::CpiContext::new_with_signer(
                ctx.accounts.system_program.key(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.treasury_sol.to_account_info(),
                    to: ctx.accounts.winner.to_account_info(),
                },
                signer_seeds,
            ),
            reward,
        )?;

        let vault = &mut ctx.accounts.vault;
        vault.total_paid_out = vault.total_paid_out.saturating_add(reward);
        vault.matches_settled = vault.matches_settled.saturating_add(1);

        emit!(MatchSettled {
            match_id: m.match_id,
            winner: winner_key,
            loser: if winner_key == p1.authority { p2.authority } else { p1.authority },
            reward,
            p1_durability_remaining: p1.durability_remaining,
            p2_durability_remaining: p2.durability_remaining,
        });
        Ok(())
    }

    // --------------------------------------------------------
    // SET_CHARACTER_NFT — enroll a wallet with a character asset.
    // If the profile already exists, this updates the equipped NFT.
    // Durability resets ONLY when a different NFT is equipped — re-sending
    // the same asset never refills durability.
    // --------------------------------------------------------
    pub fn set_character_nft(
        ctx: Context<SetCharacterNft>,
        sns_domain: String,
        durability_max: u8,
    ) -> Result<()> {
        require!(sns_domain.len() <= 32, RoletError::SnsDomainTooLong);
        require!(durability_max > 0, RoletError::InvalidDurability);

        // Validate the provided asset: it must be a real Core asset whose
        // update authority is the program PDA (i.e. minted under our
        // authority) and whose on-chain owner is the player's wallet.
        let info = fetch_character_asset(&ctx.accounts.character_nft.to_account_info())?;
        let program_id = ctx.program_id.key();
        require!(
            info.update_authority == program_id,
            RoletError::InvalidCharacterNft
        );
        require!(
            info.owner == ctx.accounts.authority.key(),
            RoletError::InvalidCharacterNft
        );

        let clock = Clock::get()?;
        let p = &mut ctx.accounts.profile;
        let is_new_nft = p.character_nft != ctx.accounts.character_nft.key();
        p.authority = ctx.accounts.authority.key();
        p.sns_domain = sns_domain;
        p.character_nft = ctx.accounts.character_nft.key();
        if is_new_nft {
            // Only a brand-new character purchase resets durability.
            p.durability_remaining = durability_max;
            p.durability_max = durability_max;
        }

        if p.created_at == 0 {
            // First-time enrollment: reset stats to a clean slate.
            p.stats = PlayerStats {
                matches_played: 0,
                wins: 0,
                losses: 0,
                total_damage_dealt: 0,
                total_rewards_claimed: 0,
                elo_rating: 1000,
            };
            p.session_key = None;
            p.session_key_expiry = 0;
            p.created_at = clock.unix_timestamp;
        }

        p.bump = ctx.bumps.profile;

        emit!(ProfileCreated {
            authority: p.authority,
            sns_domain: p.sns_domain.clone(),
            character_nft: p.character_nft,
        });
        Ok(())
    }

    // --------------------------------------------------------
    // PURCHASE_CHARACTER — buy a character NFT + enroll profile in one tx.
    // The buyer transfers the configured price; 70% goes to the SOL
    // treasury PDA (future winner payouts), 30% to the ops wallet.
    // The asset must already be minted with update_authority = program_id
    // (client mints it via mpl-core createV1 before this call).
    // --------------------------------------------------------
    pub fn purchase_character(
        ctx: Context<PurchaseCharacter>,
        sns_domain: String,
        durability_max: u8,
    ) -> Result<()> {
        require!(sns_domain.len() <= 32, RoletError::SnsDomainTooLong);
        require!(durability_max > 0, RoletError::InvalidDurability);

        let price = ctx.accounts.vault.character_price_sol;
        require!(price > 0, RoletError::InvalidPurchaseAmount);
        require!(
            ctx.accounts.buyer.lamports() >= price,
            RoletError::InvalidPurchaseAmount
        );

        // Split: 90% treasury (winner rewards pool), 5% ops (team maintenance),
        // and 5% insurance reserve (held in treasury_sol).
        let ops_share = (price as u128 * 500 / 10000) as u64; // 5% ops
        let treasury_total = price - ops_share; // 95% (90% winner pool + 5% insurance reserve)

        anchor_lang::system_program::transfer(
            anchor_lang::context::CpiContext::new(
                ctx.accounts.system_program.key(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.buyer.to_account_info(),
                    to: ctx.accounts.treasury_sol.to_account_info(),
                },
            ),
            treasury_total,
        )?;

        anchor_lang::system_program::transfer(
            anchor_lang::context::CpiContext::new(
                ctx.accounts.system_program.key(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.buyer.to_account_info(),
                    to: ctx.accounts.ops_wallet.to_account_info(),
                },
            ),
            ops_share,
        )?;

        // Validate asset + set profile (same logic as set_character_nft).
        let info = fetch_character_asset(&ctx.accounts.character_nft.to_account_info())?;
        require!(
            info.update_authority == ctx.program_id.key(),
            RoletError::InvalidCharacterNft
        );
        require!(
            info.owner == ctx.accounts.buyer.key(),
            RoletError::InvalidCharacterNft
        );

        let clock = Clock::get()?;
        let p = &mut ctx.accounts.profile;
        let is_new_nft = p.character_nft != ctx.accounts.character_nft.key();
        // Re-buying the equipped NFT would charge without benefit — reject.
        require!(is_new_nft, RoletError::CharacterNftInUse);
        p.authority = ctx.accounts.buyer.key();
        p.sns_domain = sns_domain;
        p.character_nft = ctx.accounts.character_nft.key();
        // A brand-new character purchase resets durability.
        p.durability_remaining = durability_max;
        p.durability_max = durability_max;

        if p.created_at == 0 {
            p.stats = PlayerStats {
                matches_played: 0,
                wins: 0,
                losses: 0,
                total_damage_dealt: 0,
                total_rewards_claimed: 0,
                elo_rating: 1000,
            };
            p.session_key = None;
            p.session_key_expiry = 0;
            p.created_at = clock.unix_timestamp;
        }

        p.bump = ctx.bumps.profile;

        emit!(ProfileCreated {
            authority: p.authority,
            sns_domain: p.sns_domain.clone(),
            character_nft: p.character_nft,
        });
        Ok(())
    }

    // --------------------------------------------------------
    // INIT_VAULT — one-time admin bootstrap (deploy script)
    // --------------------------------------------------------
    // --------------------------------------------------------
    // REGISTER_SESSION_KEY — wallet authorizes a temp keypair (L1)
    // After this, that keypair can sign play_card / pull_trigger txs
    // until expiry without ever opening Phantom again.
    // --------------------------------------------------------
    pub fn register_session_key(
        ctx: Context<RegisterSessionKey>,
        session_pubkey: Pubkey,
        duration_seconds: i64,
    ) -> Result<()> {
        require!(duration_seconds > 0, RoletError::InvalidSessionDuration);
        require!(duration_seconds <= 24 * 60 * 60, RoletError::InvalidSessionDuration);

        let now = Clock::get()?.unix_timestamp;
        let p = &mut ctx.accounts.profile;
        p.session_key = Some(session_pubkey);
        p.session_key_expiry = now.saturating_add(duration_seconds);

        emit!(SessionKeyRegistered {
            authority: p.authority,
            session_key: session_pubkey,
            expires_at: p.session_key_expiry,
        });
        Ok(())
    }

    pub fn init_vault(
        ctx: Context<InitVault>,
        reward_sol: u64,
        character_price_sol: u64,
    ) -> Result<()> {
        let (expected_treasury, treasury_bump) = Pubkey::find_program_address(
            &[b"treasury-sol", ctx.accounts.vault.key().as_ref()],
            ctx.program_id,
        );
        require!(
            ctx.accounts.treasury_sol.key() == expected_treasury,
            RoletError::TreasuryMismatch
        );

        let v = &mut ctx.accounts.vault;
        v.authority = ctx.accounts.authority.key();
        v.treasury_sol = ctx.accounts.treasury_sol.key();
        v.ops_wallet = ctx.accounts.ops_wallet.key();
        v.character_price_sol = character_price_sol;
        v.reward_sol = reward_sol;
        v.total_paid_out = 0;
        v.matches_settled = 0;
        v.treasury_bump = treasury_bump;
        v.bump = ctx.bumps.vault;

        emit!(VaultInitialized {
            authority: v.authority,
            reward_mint: ctx.accounts.treasury_sol.key(),
            base_reward_per_match: reward_sol,
        });
        Ok(())
    }

    // --------------------------------------------------------
    // UPDATE_VAULT_PARAMS — vault authority adjusts economy knobs
    // without redeploying (e.g. character price, per-match reward).
    // --------------------------------------------------------
    pub fn update_vault_params(
        ctx: Context<UpdateVaultParams>,
        reward_sol: Option<u64>,
        character_price_sol: Option<u64>,
    ) -> Result<()> {
        let v = &mut ctx.accounts.vault;
        if let Some(r) = reward_sol {
            v.reward_sol = r;
        }
        if let Some(p) = character_price_sol {
            v.character_price_sol = p;
        }
        emit!(VaultParamsUpdated {
            authority: v.authority,
            reward_sol: v.reward_sol,
            character_price_sol: v.character_price_sol,
        });
        Ok(())
    }

    // --------------------------------------------------------
    // OPEN_LOBBY — host creates a waiting room PDA
    // --------------------------------------------------------
    pub fn open_lobby(
        ctx: Context<OpenLobby>,
        match_id: u64,
        host_commit: [u8; 32],
    ) -> Result<()> {
        // The signer is the wallet or its registered, unexpired session key.
        resolve_actor(
            ctx.accounts.signer.key(),
            &ctx.accounts.host_profile,
            ctx.accounts.authority.key(),
            Clock::get()?.unix_timestamp,
        )?;
        let host_profile = &mut ctx.accounts.host_profile;
        require!(
            host_profile.durability_remaining > 0,
            RoletError::NoDurability
        );
        host_profile.durability_remaining = host_profile.durability_remaining - 1;

        let lobby = &mut ctx.accounts.lobby;
        lobby.match_id = match_id;
        lobby.host = ctx.accounts.authority.key();
        lobby.host_commit = host_commit;
        lobby.guest = None;
        lobby.guest_commit = [0u8; 32];
        lobby.guest_secret = [0u8; 32];
        lobby.host_secret = [0u8; 32];
        lobby.host_revealed = false;
        lobby.guest_revealed = false;
        lobby.seed_slot = 0;
        lobby.launched = false;
        lobby.bump = ctx.bumps.lobby;
        emit!(LobbyOpened { match_id, host: lobby.host });
        Ok(())
    }

    // --------------------------------------------------------
    // JOIN_LOBBY — guest fills the second seat. Only the COMMIT is stored;
    // the secret is revealed later via reveal_secret.
    // --------------------------------------------------------
    pub fn join_lobby(ctx: Context<JoinLobby>, guest_commit: [u8; 32]) -> Result<()> {
        resolve_actor(
            ctx.accounts.signer.key(),
            &ctx.accounts.guest_profile,
            ctx.accounts.authority.key(),
            Clock::get()?.unix_timestamp,
        )?;
        let lobby = &mut ctx.accounts.lobby;
        require!(lobby.guest.is_none(), RoletError::LobbyFull);
        require!(!lobby.launched, RoletError::LobbyAlreadyLaunched);
        require!(
            ctx.accounts.authority.key() != lobby.host,
            RoletError::CannotSelfMatch
        );

        let guest_profile = &mut ctx.accounts.guest_profile;
        require!(
            guest_profile.durability_remaining > 0,
            RoletError::NoDurability
        );
        guest_profile.durability_remaining = guest_profile.durability_remaining - 1;

        // RISK-B defense in depth: a commit can never be copied verbatim.
        // (The binding of player + match_id into the preimage already makes a
        // copied commit unrevealable; this rejects it up front.)
        require!(guest_commit != lobby.host_commit, RoletError::DuplicateCommit);

        lobby.guest = Some(ctx.accounts.authority.key());
        lobby.guest_commit = guest_commit;
        lobby.guest_secret = [0u8; 32];
        lobby.guest_revealed = false;
        emit!(LobbyReady {
            match_id: lobby.match_id,
            host: lobby.host,
            guest: ctx.accounts.authority.key(),
        });
        Ok(())
    }

    // --------------------------------------------------------
    // REVEAL_SECRET — host or guest reveals their committed secret once
    // both commits are locked. When the second secret lands, the entropy
    // slot is pinned to a future slot (unknown to everyone at that time).
    // --------------------------------------------------------
    pub fn reveal_secret(ctx: Context<RevealSecret>, secret: [u8; 32]) -> Result<()> {
        let lobby = &mut ctx.accounts.lobby;
        require!(!lobby.launched, RoletError::LobbyAlreadyLaunched);
        let guest = lobby.guest.ok_or(RoletError::LobbyNotReady)?;
        let player = resolve_actor(
            ctx.accounts.signer.key(),
            &ctx.accounts.player_profile,
            ctx.accounts.authority.key(),
            Clock::get()?.unix_timestamp,
        )?;
        // RISK-B: the preimage binds the revealing player and this match_id,
        // so a commit/secret copied from the other seat or another lobby
        // never verifies.
        let hashed = lobby_commitment(&secret, &player, lobby.match_id);

        if player == lobby.host {
            require!(!lobby.host_revealed, RoletError::AlreadyRevealed);
            require!(hashed == lobby.host_commit, RoletError::InvalidReveal);
            lobby.host_secret = secret;
            lobby.host_revealed = true;
        } else if player == guest {
            require!(!lobby.guest_revealed, RoletError::AlreadyRevealed);
            require!(hashed == lobby.guest_commit, RoletError::InvalidReveal);
            lobby.guest_secret = secret;
            lobby.guest_revealed = true;
        } else {
            return err!(RoletError::NotAParticipant);
        }

        if lobby.host_revealed && lobby.guest_revealed {
            let slot = Clock::get()?.slot;
            lobby.seed_slot = slot.saturating_add(SEED_DELAY_SLOTS);
        }
        emit!(SecretRevealed {
            match_id: lobby.match_id,
            player,
            seed_slot: lobby.seed_slot,
        });
        Ok(())
    }

    // --------------------------------------------------------
    // CLOSE_LOBBY — host cancels or reclaims rent.
    // * No guest yet              -> host durability refunded (+1).
    // * Guest joined, <2 reveals  -> both durabilities refunded (+1 each);
    //                                guest_profile must be supplied.
    // * Both revealed, not launched (RISK-A): the outcome becomes computable
    //   once seed_slot is produced, so a refund would be a free re-roll.
    //     - within seed_slot + LAUNCH_WINDOW_SLOTS -> REJECTED; launch it
    //       (host or guest can call init_match).
    //     - after the window (seed hash expired)   -> rent reclaim only,
    //       NO durability refund for either side.
    // * Match launched            -> rent reclaim only, no refund.
    // --------------------------------------------------------
    pub fn close_lobby(ctx: Context<CloseLobby>) -> Result<()> {
        resolve_actor(
            ctx.accounts.signer.key(),
            &ctx.accounts.host_profile,
            ctx.accounts.authority.key(),
            Clock::get()?.unix_timestamp,
        )?;
        let lobby = &ctx.accounts.lobby;
        if lobby.launched {
            emit!(LobbyClosed {
                match_id: lobby.match_id,
                host: lobby.host,
                refunded: false,
            });
            return Ok(());
        }

        if lobby.host_revealed && lobby.guest_revealed {
            let slot = Clock::get()?.slot;
            require!(
                slot > lobby.seed_slot.saturating_add(LAUNCH_WINDOW_SLOTS),
                RoletError::LobbyMustLaunch
            );
            emit!(LobbyClosed {
                match_id: lobby.match_id,
                host: lobby.host,
                refunded: false,
            });
            return Ok(());
        }

        let host_profile = &mut ctx.accounts.host_profile;
        host_profile.durability_remaining = host_profile
            .durability_remaining
            .saturating_add(1)
            .min(host_profile.durability_max);

        if let Some(guest) = lobby.guest {
            let guest_profile = ctx
                .accounts
                .guest_profile
                .as_mut()
                .ok_or(RoletError::GuestProfileRequired)?;
            require!(
                guest_profile.authority == guest,
                RoletError::ProfileMismatch
            );
            guest_profile.durability_remaining = guest_profile
                .durability_remaining
                .saturating_add(1)
                .min(guest_profile.durability_max);
        }

        emit!(LobbyClosed {
            match_id: lobby.match_id,
            host: lobby.host,
            refunded: true,
        });
        Ok(())
    }

    // --------------------------------------------------------
    // CLAIM_TIMEOUT — if the player on turn stalls for more than
    // TURN_TIMEOUT_SLOTS (L1 slots), the waiting player wins by forfeit.
    // Afterwards settle_match works as usual.
    // --------------------------------------------------------
    pub fn claim_timeout(ctx: Context<ClaimTimeout>) -> Result<()> {
        let claimant = ctx.accounts.claimant.key();
        let m = &mut ctx.accounts.match_state;
        require!(m.status == MatchStatus::Active, RoletError::MatchNotActive);
        require!(
            claimant == m.player_one || claimant == m.player_two,
            RoletError::NotAParticipant
        );
        require!(claimant != m.current_turn, RoletError::CannotClaimOwnTimeout);
        let slot = Clock::get()?.slot;
        require!(
            slot > m.last_action_slot.saturating_add(TURN_TIMEOUT_SLOTS),
            RoletError::TimeoutNotReached
        );

        let staller = m.current_turn;
        if staller == m.player_one {
            m.player_one_hp = 0;
        } else {
            m.player_two_hp = 0;
        }
        m.status = MatchStatus::Completed;
        m.winner = Some(claimant);
        m.last_action_slot = slot;
        emit!(MatchForfeited {
            match_id: m.match_id,
            winner: claimant,
            staller,
        });
        Ok(())
    }

    /// Lock MatchState onto the EU rollup. Lobby accounts stay on devnet.
    /// The account must stay untyped: ownership moves to the delegation program
    /// before Anchor would write it back.
    pub fn delegate_match(ctx: Context<DelegateMatch>, match_id: u64) -> Result<()> {
        let state = read_match_state(&ctx.accounts.match_state.to_account_info())?;
        require!(state.match_id == match_id, RoletError::LobbyMismatch);
        require!(state.status == MatchStatus::Active, RoletError::MatchNotActive);
        require!(
            ctx.accounts.payer.key() == state.player_one
                || ctx.accounts.payer.key() == state.player_two,
            RoletError::NotAParticipant
        );
        let match_id_le = match_id.to_le_bytes();
        ctx.accounts.delegate_match_state(
            &ctx.accounts.payer,
            &[b"match", match_id_le.as_ref()],
            DelegateConfig {
                commit_frequency_ms: 30_000,
                validator: Some(ER_VALIDATOR),
            },
        )?;
        Ok(())
    }

    /// Commit the rollup copy and return MatchState to this program.
    /// settle_match stays on devnet and runs only after this lands.
    pub fn commit_and_undelegate_match(ctx: Context<CommitMatch>) -> Result<()> {
        resolve_actor(
            ctx.accounts.payer.key(),
            &ctx.accounts.launcher_profile,
            ctx.accounts.authority.key(),
            Clock::get()?.unix_timestamp,
        )?;
        let state = read_match_state(&ctx.accounts.match_state.to_account_info())?;
        require!(
            state.status == MatchStatus::Active || state.status == MatchStatus::Completed,
            RoletError::MatchNotActive
        );
        require!(
            ctx.accounts.authority.key() == state.player_one
                || ctx.accounts.authority.key() == state.player_two,
            RoletError::NotAParticipant
        );
        MagicIntentBundleBuilder::new(
            ctx.accounts.payer.to_account_info(),
            ctx.accounts.magic_context.to_account_info(),
            ctx.accounts.magic_program.to_account_info(),
        )
        .commit_and_undelegate(&[ctx.accounts.match_state.to_account_info()])
        .build_and_invoke()?;
        Ok(())
    }
}

// ============================================================
// Actor resolution — wallet OR registered session key
// ============================================================
/// Deserialized identity info for a Metaplex Core asset used as a character.
pub struct CharacterNftInfo {
    pub update_authority: Pubkey,
    pub owner: Pubkey,
}

/// Reads a Metaplex Core asset account directly from its bytes and extracts
/// the update authority and current owner. Used to validate that a player's
/// character NFT was minted under the program's collection (update authority
/// is the program PDA) and is owned by the player's wallet.
///
/// Layout (Core AssetV1): byte 0 = Key (1 = AssetV1), bytes 1..33 = owner,
/// bytes 33..34 = key of the update authority enum (1 = Address), then
/// bytes 34..66 = the address itself.
pub fn fetch_character_asset(ai: &AccountInfo) -> Result<CharacterNftInfo> {
    let data = ai.try_borrow_data()?;
    require!(data.len() >= 66, RoletError::InvalidCharacterNft);
    require!(data[0] == CORE_ASSET_V1, RoletError::InvalidCharacterNft);

    let owner = Pubkey::try_from(&data[1..33]).map_err(|_| error!(RoletError::InvalidCharacterNft))?;

    // The UpdateAuthority enum encodes its variant key in byte 33
    // (Address = 1). The embedded address follows in bytes 34..66.
    let update_authority = match data[33] {
        1 => Pubkey::try_from(&data[34..66]).map_err(|_| error!(RoletError::InvalidCharacterNft))?,
        _ => return Err(RoletError::InvalidCharacterNft.into()),
    };

    Ok(CharacterNftInfo { update_authority, owner })
}

fn read_match_state(ai: &AccountInfo) -> Result<MatchState> {
    let bytes = ai.try_borrow_data()?.to_vec();
    MatchState::try_deserialize(&mut &bytes[..]).map_err(|_| error!(RoletError::MatchNotActive))
}

fn resolve_actor(
    signer: Pubkey,
    profile: &Account<PlayerProfile>,
    expected: Pubkey,
    now: i64,
) -> Result<Pubkey> {
    // Fast path: signer is the wallet itself.
    if signer == expected {
        return Ok(signer);
    }
    // Session-key path: signer must be the profile's registered session key
    // and not be expired.
    if let Some(sk) = profile.session_key {
        if sk == signer && profile.session_key_expiry > now {
            return Ok(profile.authority);
        }
    }
    err!(RoletError::UnauthorizedActor)
}

/// Returns the hash of the first produced slot at or after `seed_slot` from
/// the raw SlotHashes sysvar data (entries are sorted newest -> oldest:
/// u64 len, then [slot u64 LE, hash 32] * len). Skipped slots are handled by
/// taking the earliest entry >= seed_slot; if the window no longer proves
/// which entry that is (sysvar keeps ~512 slots), the seed has expired.
fn k_hash(parts: &[&[u8]]) -> [u8; 32] {
    keccak_hashv(parts).to_bytes()
}

/// Commitment preimage: keccak256(secret || player_pubkey || match_id_le).
/// Binding the player and match makes a commit non-transferable between
/// seats and lobbies (RISK-B). Client (useRolet.ts) must hash identically.
pub fn lobby_commitment(secret: &[u8; 32], player: &Pubkey, match_id: u64) -> [u8; 32] {
    k_hash(&[secret.as_ref(), player.as_ref(), &match_id.to_le_bytes()])
}

fn find_seed_slot_hash(data: &[u8], seed_slot: u64) -> Result<[u8; 32]> {
    require!(data.len() >= 8, RoletError::SeedSlotExpired);
    let len = u64::from_le_bytes(data[0..8].try_into().unwrap()) as usize;
    let mut candidate: Option<[u8; 32]> = None;
    for i in 0..len {
        let off = 8 + i * 40;
        if off + 40 > data.len() {
            break;
        }
        let slot = u64::from_le_bytes(data[off..off + 8].try_into().unwrap());
        if slot >= seed_slot {
            let mut h = [0u8; 32];
            h.copy_from_slice(&data[off + 8..off + 40]);
            candidate = Some(h);
        } else {
            // First entry older than seed_slot: candidate is the earliest
            // produced slot at or after seed_slot.
            return candidate.ok_or(error!(RoletError::SeedSlotNotReached));
        }
    }
    err!(RoletError::SeedSlotExpired)
}

// ============================================================
// Deterministic PRNG helpers
// ============================================================
fn build_gun(seed: &[u8; 32]) -> GunState {
    let mut chambers = [Chamber::Empty; 8];
    for i in 0..LIVE_ROUNDS as usize {
        chambers[i] = Chamber::Live;
    }
    for i in 0..BLANK_ROUNDS as usize {
        chambers[LIVE_ROUNDS as usize + i] = Chamber::Blank;
    }
    let mut stream = k_hash(&[seed, b"GUN"]);
    for i in (1..CHAMBER_COUNT as usize).rev() {
        let j = (stream[i % 32] as usize) % (i + 1);
        chambers.swap(i, j);
        stream = k_hash(&[&stream, &[i as u8]]);
    }
    GunState {
        chambers,
        current_chamber: 0,
        loaded_count: LIVE_ROUNDS,
        blank_count: BLANK_ROUNDS,
        shuffle_seed: u64::from_le_bytes(seed[0..8].try_into().unwrap()),
    }
}

fn deal_hand(seed: &[u8; 32], domain: u8) -> CardHand {
    let mut stream = k_hash(&[seed, &[domain]]);
    let mut slots: [Option<Card>; HAND_SIZE] = [None; HAND_SIZE];
    for i in 0..HAND_SIZE {
        let pick = stream[i] % CARD_VARIANTS;
        slots[i] = Some(card_from_index(pick));
        stream = k_hash(&[&stream, &[i as u8, domain]]);
    }
    CardHand { slots }
}

fn card_from_index(i: u8) -> Card {
    match i {
        0 => Card::RestoreBullet,
        1 => Card::HawkEye,
        2 => Card::Silence,
        3 => Card::Blocker,
        4 => Card::BulletExtractor,
        5 => Card::Shuffler,
        6 => Card::DoubleStrike,
        7 => Card::Healer,
        8 => Card::CardThief,
        9 => Card::RandomInsight,
        10 => Card::LastChance,
        _ => Card::HandOfFate,
    }
}

impl From<Chamber> for u8 {
    fn from(c: Chamber) -> u8 {
        match c {
            Chamber::Empty => 0,
            Chamber::Blank => 1,
            Chamber::Live => 2,
        }
    }
}

// ============================================================
// L1 STATE
// ============================================================
#[account]
#[derive(InitSpace)]
pub struct PlayerProfile {
    pub authority: Pubkey,
    #[max_len(32)]
    pub sns_domain: String,
    pub character_nft: Pubkey,
    pub durability_remaining: u8,
    pub durability_max: u8,
    pub stats: PlayerStats,
    pub session_key: Option<Pubkey>,
    pub session_key_expiry: i64,
    pub created_at: i64,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct PlayerStats {
    pub matches_played: u32,
    pub wins: u32,
    pub losses: u32,
    pub total_damage_dealt: u64,
    pub total_rewards_claimed: u64,
    pub elo_rating: u16,
}

#[account]
#[derive(InitSpace)]
pub struct GameVault {
    pub authority: Pubkey,
    /// SOL treasury PDA that receives NFT revenue share and pays winners.
    pub treasury_sol: Pubkey,
    /// Team wallet receiving the non-vault share (30%) of NFT revenue.
    pub ops_wallet: Pubkey,
    /// Character NFT price, in lamports.
    pub character_price_sol: u64,
    /// Base winner reward per match, in lamports.
    pub reward_sol: u64,
    /// Cumulative lamports paid out to winners.
    pub total_paid_out: u64,
    pub matches_settled: u64,
    /// Canonical bump of the treasury_sol PDA (program-owned).
    pub treasury_bump: u8,
    pub bump: u8,
}

// ============================================================
// LOBBY STATE (L1, temporary — closed after match launches)
// ============================================================
#[account]
#[derive(InitSpace)]
pub struct LobbyState {
    pub match_id: u64,
    pub host: Pubkey,
    pub host_commit: [u8; 32],
    pub guest: Option<Pubkey>,
    pub guest_commit: [u8; 32],
    /// Zero until the guest calls reveal_secret (never set at join).
    pub guest_secret: [u8; 32],
    /// Zero until the host calls reveal_secret.
    pub host_secret: [u8; 32],
    pub host_revealed: bool,
    pub guest_revealed: bool,
    /// Pinned future slot whose hash seeds the match (set on final reveal).
    pub seed_slot: u64,
    /// True once init_match has created the MatchState for this lobby.
    pub launched: bool,
    pub bump: u8,
}

// ============================================================
// EPHEMERAL STATE (delegated to MagicBlock ER)
// ============================================================
#[account]
#[derive(InitSpace)]
pub struct MatchState {
    pub match_id: u64,
    pub player_one: Pubkey,
    pub player_two: Pubkey,
    pub player_one_hp: u8,
    pub player_two_hp: u8,
    pub current_turn: Pubkey,
    pub turn_number: u16,
    pub gun: GunState,
    pub player_one_cards: CardHand,
    pub player_two_cards: CardHand,
    pub status: MatchStatus,
    pub winner: Option<Pubkey>,
    pub silence_target: Option<Pubkey>,
    pub blocker_active_for: Option<Pubkey>,
    pub double_strike_for: Option<Pubkey>,
    pub revealed_chamber: Option<u8>,
    /// Player whose next turn will be skipped entirely (LastChance card).
    pub skip_turn_for: Option<Pubkey>,
    pub last_action_slot: u64,
    pub started_at: i64,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, InitSpace, PartialEq, Eq)]
pub enum MatchStatus {
    AwaitingOpponent,
    Active,
    Completed,
    Abandoned,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, InitSpace)]
pub struct GunState {
    pub chambers: [Chamber; 8],
    pub current_chamber: u8,
    pub loaded_count: u8,
    pub blank_count: u8,
    pub shuffle_seed: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, InitSpace, PartialEq, Eq)]
pub enum Chamber {
    Empty,
    Blank,
    Live,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, InitSpace)]
pub struct CardHand {
    pub slots: [Option<Card>; 4],
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, InitSpace, PartialEq, Eq)]
pub enum Card {
    RestoreBullet,
    HawkEye,
    Silence,
    Blocker,
    BulletExtractor,
    Shuffler,
    DoubleStrike,
    Healer,
    CardThief,
    RandomInsight,
    LastChance,
    HandOfFate,
}

// ============================================================
// Account contexts
// ============================================================
// NOTE: All large Account<...> fields are wrapped in Box<...> to push
// account deserialization buffers onto the heap instead of the 4 KB
// program stack. Required for SettleMatch (10+ accounts including two
// large PlayerProfiles) and prophylactic for InitMatch.
#[derive(Accounts)]
#[instruction(match_id: u64)]
pub struct InitMatch<'info> {
    #[account(
        init,
        payer = signer,
        space = 8 + MatchState::INIT_SPACE,
        seeds = [b"match", match_id.to_le_bytes().as_ref()],
        bump,
    )]
    pub match_state: Box<Account<'info, MatchState>>,
    #[account(
        mut,
        seeds = [b"lobby", match_id.to_le_bytes().as_ref()],
        bump = lobby.bump,
        constraint = lobby.match_id == match_id @ RoletError::LobbyMismatch,
    )]
    pub lobby: Box<Account<'info, LobbyState>>,
    /// CHECK: must equal lobby.host (host signed open_lobby)
    #[account(address = lobby.host @ RoletError::LobbyMismatch)]
    pub player_one: UncheckedAccount<'info>,
    /// CHECK: must equal lobby.guest (guest signed join_lobby)
    #[account(
        constraint = lobby.guest == Some(player_two.key()) @ RoletError::LobbyMismatch,
    )]
    pub player_two: UncheckedAccount<'info>,
    #[account(
        seeds = [b"profile", authority.key().as_ref()],
        bump = launcher_profile.bump,
        constraint = launcher_profile.authority == authority.key() @ RoletError::ProfileMismatch,
    )]
    pub launcher_profile: Box<Account<'info, PlayerProfile>>,
    #[account(
        mut,
        constraint = authority.key() == lobby.host || lobby.guest == Some(authority.key())
            @ RoletError::NotAParticipant,
    )]
    pub authority: SystemAccount<'info>,
    #[account(mut)]
    pub signer: Signer<'info>,
    /// CHECK: SlotHashes sysvar — read-only, address-validated
    #[account(address = solana_sysvar::slot_hashes::ID)]
    pub slot_hashes: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[delegate]
#[derive(Accounts)]
#[instruction(match_id: u64)]
pub struct DelegateMatch<'info> {
    /// Wallet of the participant. The delegation CPI needs a real signer, so
    /// this one step cannot use a session key.
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: match PDA. Untyped because delegation changes its owner.
    #[account(
        mut,
        del,
        seeds = [b"match", match_id.to_le_bytes().as_ref()],
        bump,
    )]
    pub match_state: UncheckedAccount<'info>,
}

#[commit]
#[derive(Accounts)]
pub struct CommitMatch<'info> {
    /// Pays the commit fee. The session key when one is armed, else the wallet.
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: delegated match account. Data is the rollup copy during this ix.
    #[account(mut)]
    pub match_state: UncheckedAccount<'info>,
    #[account(
        seeds = [b"profile", authority.key().as_ref()],
        bump = launcher_profile.bump,
        constraint = launcher_profile.authority == authority.key() @ RoletError::ProfileMismatch,
    )]
    pub launcher_profile: Box<Account<'info, PlayerProfile>>,
    /// Wallet of the participant. Seeds and the participant check only.
    pub authority: SystemAccount<'info>,
}

#[derive(Accounts)]
pub struct PlayCard<'info> {
    #[account(
        mut,
        seeds = [b"match", match_state.match_id.to_le_bytes().as_ref()],
        bump = match_state.bump,
    )]
    pub match_state: Box<Account<'info, MatchState>>,

    /// Profile of whoever's turn it currently is — used to verify session
    /// keys. Anchor reads this from L1 even when the rest of the ix is
    /// executing inside the Ephemeral Rollup.
    #[account(
        seeds = [b"profile", current_profile.authority.as_ref()],
        bump = current_profile.bump,
        constraint = current_profile.authority == match_state.current_turn
            @ RoletError::ProfileMismatch,
    )]
    pub current_profile: Box<Account<'info, PlayerProfile>>,

    pub actor: Signer<'info>,
}

#[derive(Accounts)]
pub struct PullTrigger<'info> {
    #[account(
        mut,
        seeds = [b"match", match_state.match_id.to_le_bytes().as_ref()],
        bump = match_state.bump,
    )]
    pub match_state: Box<Account<'info, MatchState>>,

    #[account(
        seeds = [b"profile", current_profile.authority.as_ref()],
        bump = current_profile.bump,
        constraint = current_profile.authority == match_state.current_turn
            @ RoletError::ProfileMismatch,
    )]
    pub current_profile: Box<Account<'info, PlayerProfile>>,

    #[account(mut)]
    pub actor: Signer<'info>,
}

#[derive(Accounts)]
pub struct SettleMatch<'info> {
    #[account(
        mut,
        seeds = [b"match", match_state.match_id.to_le_bytes().as_ref()],
        bump = match_state.bump,
        close = rent_refund,
    )]
    pub match_state: Box<Account<'info, MatchState>>,

    #[account(
        mut,
        seeds = [b"profile", match_state.player_one.as_ref()],
        bump = profile_one.bump,
        constraint = profile_one.authority == match_state.player_one
            @ RoletError::ProfileMismatch,
    )]
    pub profile_one: Box<Account<'info, PlayerProfile>>,

    #[account(
        mut,
        seeds = [b"profile", match_state.player_two.as_ref()],
        bump = profile_two.bump,
        constraint = profile_two.authority == match_state.player_two
            @ RoletError::ProfileMismatch,
    )]
    pub profile_two: Box<Account<'info, PlayerProfile>>,

    #[account(
        mut,
        seeds = [b"vault"],
        bump = vault.bump,
    )]
    pub vault: Box<Account<'info, GameVault>>,

    /// CHECK: program-owned SOL treasury PDA — validated via seeds
    #[account(
        mut,
        seeds = [b"treasury-sol", vault.key().as_ref()],
        bump = vault.treasury_bump,
        constraint = treasury_sol.key() == vault.treasury_sol @ RoletError::TreasuryMismatch,
    )]
    pub treasury_sol: UncheckedAccount<'info>,

    /// CHECK: validated against match_state.winner via constraint
    #[account(
        mut,
        constraint = match_state.winner == Some(winner.key())
            @ RoletError::WinnerMismatch,
    )]
    pub winner: UncheckedAccount<'info>,

    #[account(mut)]
    pub rent_refund: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SetCharacterNft<'info> {
    #[account(
        init_if_needed,
        payer = authority,
        space = 8 + PlayerProfile::INIT_SPACE,
        seeds = [b"profile", authority.key().as_ref()],
        bump,
    )]
    pub profile: Box<Account<'info, PlayerProfile>>,

    /// CHECK: raw-bytes Core asset validation inside the instruction body
    pub character_nft: UncheckedAccount<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PurchaseCharacter<'info> {
    #[account(
        init_if_needed,
        payer = buyer,
        space = 8 + PlayerProfile::INIT_SPACE,
        seeds = [b"profile", buyer.key().as_ref()],
        bump,
    )]
    pub profile: Box<Account<'info, PlayerProfile>>,

    /// CHECK: raw-bytes Core asset validation inside the instruction body
    pub character_nft: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [b"vault"],
        bump = vault.bump,
    )]
    pub vault: Box<Account<'info, GameVault>>,

    /// CHECK: validated via seeds + vault.treasury_sol constraint
    #[account(
        mut,
        seeds = [b"treasury-sol", vault.key().as_ref()],
        bump = vault.treasury_bump,
        constraint = treasury_sol.key() == vault.treasury_sol @ RoletError::TreasuryMismatch,
    )]
    pub treasury_sol: UncheckedAccount<'info>,

    /// CHECK: must match vault.ops_wallet
    #[account(
        mut,
        constraint = ops_wallet.key() == vault.ops_wallet @ RoletError::TreasuryMismatch,
    )]
    pub ops_wallet: UncheckedAccount<'info>,

    #[account(mut)]
    pub buyer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RegisterSessionKey<'info> {
    #[account(
        mut,
        seeds = [b"profile", authority.key().as_ref()],
        bump = profile.bump,
        constraint = profile.authority == authority.key() @ RoletError::ProfileMismatch,
    )]
    pub profile: Box<Account<'info, PlayerProfile>>,

    pub authority: Signer<'info>,
}

// PLAN_B: DelegateMatchState / UndelegateMatchState moved to client.

#[derive(Accounts)]
#[instruction(match_id: u64)]
pub struct OpenLobby<'info> {
    #[account(
        init,
        payer = signer,
        space = 8 + LobbyState::INIT_SPACE,
        seeds = [b"lobby", match_id.to_le_bytes().as_ref()],
        bump,
    )]
    pub lobby: Account<'info, LobbyState>,

    #[account(
        mut,
        seeds = [b"profile", authority.key().as_ref()],
        bump = host_profile.bump,
        constraint = host_profile.authority == authority.key() @ RoletError::ProfileMismatch,
    )]
    pub host_profile: Box<Account<'info, PlayerProfile>>,

    /// Wallet. Seeds only; never signs. The session key pays the rent.
    pub authority: SystemAccount<'info>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct JoinLobby<'info> {
    #[account(
        mut,
        seeds = [b"lobby", lobby.match_id.to_le_bytes().as_ref()],
        bump = lobby.bump,
    )]
    pub lobby: Account<'info, LobbyState>,

    #[account(
        mut,
        seeds = [b"profile", authority.key().as_ref()],
        bump = guest_profile.bump,
        constraint = guest_profile.authority == authority.key() @ RoletError::ProfileMismatch,
    )]
    pub guest_profile: Box<Account<'info, PlayerProfile>>,

    /// Wallet. Seeds and rent only; the signer may be its session key.
    #[account(mut)]
    pub authority: SystemAccount<'info>,
    #[account(mut)]
    pub signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct CloseLobby<'info> {
    #[account(
        mut,
        seeds = [b"lobby", lobby.match_id.to_le_bytes().as_ref()],
        bump = lobby.bump,
        constraint = lobby.host == authority.key() @ RoletError::NotAParticipant,
        close = authority,
    )]
    pub lobby: Account<'info, LobbyState>,
    #[account(
        mut,
        seeds = [b"profile", authority.key().as_ref()],
        bump = host_profile.bump,
        constraint = host_profile.authority == authority.key() @ RoletError::ProfileMismatch,
    )]
    pub host_profile: Box<Account<'info, PlayerProfile>>,
    /// Required only when a guest joined but the match was never launched
    /// (refunds the guest's durability too). Authority checked in handler.
    #[account(
        mut,
        seeds = [b"profile", guest_profile.authority.as_ref()],
        bump = guest_profile.bump,
    )]
    pub guest_profile: Option<Box<Account<'info, PlayerProfile>>>,
    #[account(mut)]
    pub authority: SystemAccount<'info>,
    pub signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct RevealSecret<'info> {
    #[account(
        mut,
        seeds = [b"lobby", lobby.match_id.to_le_bytes().as_ref()],
        bump = lobby.bump,
    )]
    pub lobby: Box<Account<'info, LobbyState>>,
    #[account(
        seeds = [b"profile", authority.key().as_ref()],
        bump = player_profile.bump,
        constraint = player_profile.authority == authority.key() @ RoletError::ProfileMismatch,
    )]
    pub player_profile: Box<Account<'info, PlayerProfile>>,
    pub authority: SystemAccount<'info>,
    pub signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClaimTimeout<'info> {
    #[account(
        mut,
        seeds = [b"match", match_state.match_id.to_le_bytes().as_ref()],
        bump = match_state.bump,
    )]
    pub match_state: Box<Account<'info, MatchState>>,
    pub claimant: Signer<'info>,
}

#[derive(Accounts)]
pub struct InitVault<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + GameVault::INIT_SPACE,
        seeds = [b"vault"],
        bump,
    )]
    pub vault: Box<Account<'info, GameVault>>,

    /// CHECK: plain SOL treasury PDA — receives vault SOL, pays winners
    #[account(mut)]
    pub treasury_sol: UncheckedAccount<'info>,

    /// CHECK: team wallet receiving 30% of NFT revenue
    pub ops_wallet: UncheckedAccount<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateVaultParams<'info> {
    #[account(
        mut,
        seeds = [b"vault"],
        bump = vault.bump,
        constraint = vault.authority == authority.key() @ RoletError::UnauthorizedActor,
    )]
    pub vault: Box<Account<'info, GameVault>>,

    #[account(mut)]
    pub authority: Signer<'info>,
}

// ============================================================
// Events
// ============================================================
#[event]
pub struct VaultParamsUpdated {
    pub authority: Pubkey,
    pub reward_sol: u64,
    pub character_price_sol: u64,
}

#[event]
pub struct MatchInitialized {
    pub match_id: u64,
    pub seed: [u8; 32],
    pub first_turn: Pubkey,
}

#[event]
pub struct CardPlayed {
    pub actor: Pubkey,
    pub card: Card,
    pub detail: u64,
}

#[event]
pub struct TriggerPulled {
    pub actor: Pubkey,
    pub target: Pubkey,
    pub chamber: u8,
    pub damage: u8,
}

#[event]
pub struct MatchSettled {
    pub match_id: u64,
    pub winner: Pubkey,
    pub loser: Pubkey,
    pub reward: u64,
    pub p1_durability_remaining: u8,
    pub p2_durability_remaining: u8,
}

#[event]
pub struct ProfileCreated {
    pub authority: Pubkey,
    pub sns_domain: String,
    pub character_nft: Pubkey,
}

#[event]
pub struct VaultInitialized {
    pub authority: Pubkey,
    pub reward_mint: Pubkey,
    pub base_reward_per_match: u64,
}

#[event]
pub struct SessionKeyRegistered {
    pub authority: Pubkey,
    pub session_key: Pubkey,
    pub expires_at: i64,
}

#[event]
pub struct LobbyOpened {
    pub match_id: u64,
    pub host: Pubkey,
}

#[event]
pub struct SecretRevealed {
    pub match_id: u64,
    pub player: Pubkey,
    /// 0 until both secrets are revealed.
    pub seed_slot: u64,
}

#[event]
pub struct LobbyClosed {
    pub match_id: u64,
    pub host: Pubkey,
    pub refunded: bool,
}

#[event]
pub struct MatchForfeited {
    pub match_id: u64,
    pub winner: Pubkey,
    pub staller: Pubkey,
}

#[event]
pub struct LobbyReady {
    pub match_id: u64,
    pub host: Pubkey,
    pub guest: Pubkey,
}

// ============================================================
// Errors
// ============================================================
#[error_code]
pub enum RoletError {
    #[msg("Match is not in an active state")]
    MatchNotActive,
    #[msg("It is not your turn")]
    NotYourTurn,
    #[msg("Caller is not a participant in this match")]
    NotAParticipant,
    #[msg("Hand slot index is out of range")]
    InvalidSlot,
    #[msg("Selected hand slot is empty")]
    EmptySlot,
    #[msg("Card argument does not match the card held in slot")]
    CardMismatch,
    #[msg("Chamber index is out of range")]
    ChamberOutOfRange,
    #[msg("That chamber has already been fired")]
    ChamberAlreadyFired,
    #[msg("You are silenced and cannot play a card this turn")]
    SilencedThisTurn,
    #[msg("Reveal does not match the original commitment")]
    InvalidReveal,
    #[msg("Card effect not yet implemented in this build")]
    CardNotImplemented,
    #[msg("Match has not been finalized in the ER yet")]
    MatchNotCompleted,
    #[msg("Match is missing a recorded winner")]
    WinnerNotSet,
    #[msg("Provided profile does not match a participant of this match")]
    ProfileMismatch,
    #[msg("Winner pubkey does not match the recorded match winner")]
    WinnerMismatch,
    #[msg("Winner token account is owned by the wrong wallet")]
    WinnerAtaMismatch,
    #[msg("Winner token account is for the wrong reward mint")]
    RewardMintMismatch,
    #[msg("Treasury ATA does not match the vault's recorded treasury")]
    TreasuryMismatch,
    #[msg("Vault does not hold enough tokens to pay the reward")]
    InsufficientVault,
    #[msg("SNS domain string exceeds the 32-byte cap")]
    SnsDomainTooLong,
    #[msg("Durability max must be greater than zero")]
    InvalidDurability,
    #[msg("Signer is neither the wallet nor a valid (unexpired) session key")]
    UnauthorizedActor,
    #[msg("Session duration must be 1 second to 24 hours")]
    InvalidSessionDuration,
    #[msg("RestoreBullet has no spent chamber to refill")]
    NoChamberToRestore,
    #[msg("CardThief found no card to steal or no slot to receive it")]
    CardThiefNoTarget,
    #[msg("RandomInsight found no unfired chamber to reveal")]
    NoUnfiredChambers,
    #[msg("LastChance is only playable when at exactly 1 HP")]
    LastChanceRequiresOneHp,
    #[msg("Lobby already has a guest")]
    LobbyFull,
    #[msg("Host cannot join their own lobby")]
    CannotSelfMatch,
    #[msg("The provided character NFT is not a valid ROLET character asset")]
    InvalidCharacterNft,
    #[msg("This character NFT is already assigned to a profile")]
    CharacterNftInUse,
    #[msg("Character durability is exhausted — purchase a new character")]
    NoDurability,
    #[msg("Purchase amount must be exactly the configured character price")]
    InvalidPurchaseAmount,
    #[msg("Lobby already launched a match")]
    LobbyAlreadyLaunched,
    #[msg("Lobby has no guest yet")]
    LobbyNotReady,
    #[msg("Both players must reveal their secrets first")]
    SecretsNotRevealed,
    #[msg("Secret already revealed")]
    AlreadyRevealed,
    #[msg("Seed slot has not been produced yet; retry in a moment")]
    SeedSlotNotReached,
    #[msg("Seed slot fell out of the SlotHashes window; close the lobby and retry")]
    SeedSlotExpired,
    #[msg("Account does not match the lobby record")]
    LobbyMismatch,
    #[msg("Guest profile must be supplied to refund a joined lobby")]
    GuestProfileRequired,
    #[msg("The player on turn cannot claim their own timeout")]
    CannotClaimOwnTimeout,
    #[msg("Turn timeout has not elapsed yet")]
    TimeoutNotReached,
    #[msg("Both secrets revealed — the match must be launched (init_match), not closed")]
    LobbyMustLaunch,
    #[msg("Guest commit must differ from the host commit")]
    DuplicateCommit,
}
