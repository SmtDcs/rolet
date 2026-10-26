# ROLET: Gun handling and shooting animations (based on Buckshot Roulette)
Reference: Buckshot Roulette gameplay video (youtube 1c_7trc_y5Q). ROLET uses an 8-chamber revolver in place of the shotgun. Style stays Kalma pixel art: 960x540, stepped motion (12 fps feel), no tweened fades.

## General
- No player hands. When picked up, the revolver snaps from the table into the bottom-centre of the camera view (child of the camera), barrel tilted slightly up and to the left. Time: 0.6–0.8 s, in 4–5 stepped frames.
- Targets: after the pickup, the diegetic buttons SHOOT SELF (teal) and SHOOT RIVAL (red) on the table light up. Hovering one tilts the gun slightly toward that side.
- After every shot the cylinder rotates one click (stepped), and the fired chamber gets an X.

## 1. Pick up the gun (player)
Click the revolver: 0.7 s snap to the viewport, plus a "metal pickup" sound.

## 2. Shoot self (first person, most important)
1. The gun drops out the bottom of the screen (0.3 s).
2. It swings up from below so the barrel points STRAIGHT AT THE CAMERA, centred on screen, with the barrel's dark hollow fully visible (0.6–0.8 s). Total about 1.5 s.
3. Hammer cocks (2 frames), then a 300 ms hold (tension).
4. Blank: dry "CLICK", a short 2–3 px shake, the gun lowers back to the table (0.5 s). The turn stays with the player.
5. Live: 1 frame of full white, then an INSTANT CUT to pitch black (no lingering). 1.5–2 s of black and silence, then back at the table with one life fewer (a LIVES LED goes out with a stepped blink). If no lives remain, the death / round-over screen.
(This replaces the earlier side-view / roll-right spec: the gun now faces the camera head-on, the way Samet wants it.)

## 3. Shoot the rival
1. The gun pivots to aim straight at Cylinder Head's face/chest (about 1 s).
2. Blank: dry click, a small shake. The rival does not react at all (cold).
3. Live: a large 2D pixel muzzle flash plus a ring of smoke, a heavy 8–10 px shake/recoil. Red pixel splatter on the camera as a screen-space overlay (fades in 3 steps). The rival is thrown backward into the darkness, ragdoll-like, then 2–3 s later steps back to their place.
4. The gun returns to the table.

## 4. Rival's turn
- Pickup: a long, thin, gray-dithered hand reaches out of Cylinder Head's coat, grabs the revolver and pulls it back (1.5 s). Afterwards the gun floats in the air in front of the rival (no hands needed).
- Rival shoots self: the gun goes under its chin / to the cylinder head. Blank: a small shake, its head rattles. Live: big flash, it is thrown backward like in section 3.
- Rival shoots the player: the floating gun turns straight toward the camera, the barrel fills the centre of the screen, 300 ms hold. Live: barrel flash, then an instant black cut (same as 2.5). Blank: click, the camera flinches slightly.

## 5. Round start (load / reveal)
- A hatch opens in the table and a tray of 8 bullets rises: red = live, dark gray = blank (about 4 s). The LED boxes show the counts. The tray lowers back down and the cylinder shows "?".
- The rival holds the revolver sideways, loads the bullets in a hidden order (the camera can't see the order), spins the cylinder (stepped clicks) and closes it (about 5 s).

## 6. Cards (the Buckshot item logic)
- Click a card: the card slides to the bottom-centre of the screen and its effect animation plays (about 1.5–2 s), then the card tears / turns to dust.
- Eye: the camera zooms in on the cylinder, the next chamber glows (red or teal) for 1 s, and only the player sees it.
- Discard (optional, Buckshot's beer): the cylinder clicks one chamber forward without firing, and the skipped bullet drops onto the table so its colour is visible.
- Shield / cross: a short stepped glow on the LIVES LED.

## Timing summary
| Beat | Time |
|---|---|
| Pick up the gun | 0.7 s |
| Aim at self | 1.5 s + 0.3 s hold |
| Aim at rival | 1.0 s |
| Live, black screen | 1.5–2 s |
| Rival thrown back and returns | 3 s |
| Round start reveal | 4 s |
| Rival loading | 5 s |
| Card effect | 1.5–2 s |
