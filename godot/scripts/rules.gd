extends RefCounted

## Local mirror of the ROLET Solana match rules. Pure state updates, no chain.

const EMPTY := 0
const LIVE := 1
const BLANK := 2

const LOAD := 0
const EYE := 1
const HUSH := 2
const SHIELD := 3
const EJECT := 4
const SHUFFLE := 5
const X2 := 6
const HEAL := 7
const STEAL := 8
const PEEK := 9
const LAST := 10
const FATE := 11

const CHAMBER_COUNT := 8
const HAND_SIZE := 4
const STARTING_HP := 4
const LIVE_ROUNDS := 5
const BLANK_ROUNDS := 3

func new_state(seed: int) -> Dictionary:
	var state := {
		"chambers": [],
		"index": 0,
		"live_n": LIVE_ROUNDS,
		"blank_n": BLANK_ROUNDS,
		"you_hp": STARTING_HP,
		"rival_hp": STARTING_HP,
		"you_hand": [],
		"rival_hand": [],
		"your_turn": (seed & 1) == 0,
		"blocker": 0,
		"double": 0,
		"silence": 0,
		"skip": 0,
		"revealed": -1,
		"over": false,
		"winner": 0,
		"seed": seed,
		"last_eject": 0,
		"last_damage": 0,
		"last_keep": false,
		"last_hole": -1,
		"last_steal": -1,
		"last_steal_slot": -1,
		"last_steal_from": -1,
		"last_heal_from": STARTING_HP,
		"_nonce": 0,
	}
	_deal_gun(state)
	var rng := RandomNumberGenerator.new()
	rng.seed = seed ^ 0x5EED5EED
	for _i in HAND_SIZE:
		state["you_hand"].append(rng.randi_range(0, 11))
	for _i in HAND_SIZE:
		state["rival_hand"].append(rng.randi_range(0, 11))
	return state

func play(state: Dictionary, yours: bool, slot: int) -> String:
	if bool(state["over"]):
		return "over"
	if bool(state["your_turn"]) != yours:
		return "not_your_turn"
	var me := 1 if yours else 2
	var foe := 2 if yours else 1
	if int(state["silence"]) == me:
		return "silenced"
	if slot < 0 or slot >= HAND_SIZE:
		return "slot"
	var hand: Array = state["you_hand"] if yours else state["rival_hand"]
	var card := int(hand[slot])
	if card < 0:
		return "empty"

	match card:
		LOAD:
			if _first_empty(state) < 0:
				return "no_chamber"
		EYE:
			if not _round_at_current(state):
				return "empty"
		EJECT:
			if not _round_at_current(state):
				return "empty"
		PEEK:
			if _unfired(state).is_empty():
				return "empty"
		LAST:
			var hp := int(state["you_hp"] if yours else state["rival_hp"])
			if hp != 1:
				return "last_hp"
		STEAL:
			if not _hand_has_card(state, not yours):
				return "no_target"
		FATE:
			if not _round_at_current(state):
				return "empty"

	hand[slot] = -1

	match card:
		LOAD:
			var hole := _first_empty(state)
			state["chambers"][hole] = LIVE
			state["live_n"] = int(state["live_n"]) + 1
			state["last_hole"] = hole
		EYE:
			state["revealed"] = int(state["index"])
		HUSH:
			state["silence"] = foe
		SHIELD:
			state["blocker"] = me
		EJECT:
			var at := int(state["index"])
			var removed := int(state["chambers"][at])
			state["chambers"][at] = EMPTY
			if removed == LIVE:
				state["live_n"] = max(0, int(state["live_n"]) - 1)
			else:
				state["blank_n"] = max(0, int(state["blank_n"]) - 1)
			state["index"] = at + 1
			state["revealed"] = -1
			state["last_eject"] = removed
		SHUFFLE:
			_shuffle_unfired(state)
			state["revealed"] = -1
		X2:
			state["double"] = me
		HEAL:
			var before := int(state["you_hp"] if yours else state["rival_hp"])
			state["last_heal_from"] = before
			if yours:
				state["you_hp"] = min(STARTING_HP, before + 1)
			else:
				state["rival_hp"] = min(STARTING_HP, before + 1)
		STEAL:
			var foe_hand: Array = state["rival_hand"] if yours else state["you_hand"]
			var src := 0
			for i in HAND_SIZE:
				if int(foe_hand[i]) >= 0:
					src = i
					break
			var dst := 0
			for i in HAND_SIZE:
				if int(hand[i]) < 0:
					dst = i
					break
			var stolen := int(foe_hand[src])
			foe_hand[src] = -1
			hand[dst] = stolen
			state["last_steal"] = stolen
			state["last_steal_slot"] = dst
			state["last_steal_from"] = src
		PEEK:
			var open := _unfired(state)
			var pick_rng := _rng(state)
			state["revealed"] = open[pick_rng.randi_range(0, open.size() - 1)]
		LAST:
			state["skip"] = foe
		FATE:
			var at := int(state["index"])
			var prev := int(state["chambers"][at])
			var roll := _rng(state)
			var next := LIVE if (roll.randi() & 1) == 0 else BLANK
			if prev == LIVE and next == BLANK:
				state["live_n"] = max(0, int(state["live_n"]) - 1)
				state["blank_n"] = int(state["blank_n"]) + 1
			elif prev == BLANK and next == LIVE:
				state["blank_n"] = max(0, int(state["blank_n"]) - 1)
				state["live_n"] = int(state["live_n"]) + 1
			state["chambers"][at] = next
			state["revealed"] = -1

	return "ok"

func pull(state: Dictionary, at_self: bool) -> String:
	if bool(state["over"]):
		return "over"
	var yours := bool(state["your_turn"])
	var me := 1 if yours else 2
	var foe := 2 if yours else 1
	if int(state["skip"]) == me:
		state["skip"] = 0
		state["your_turn"] = not yours
		return "skipped"
	var idx := int(state["index"])
	if idx < 0 or idx >= CHAMBER_COUNT:
		return "empty"
	var chamber := int(state["chambers"][idx])
	if chamber == EMPTY:
		return "empty"

	state["chambers"][idx] = EMPTY
	state["index"] = idx + 1
	state["revealed"] = -1
	var keep := false

	if chamber == LIVE:
		state["live_n"] = max(0, int(state["live_n"]) - 1)
		var damage := 1
		if int(state["double"]) == me:
			damage = 2
			state["double"] = 0
		var target := me if at_self else foe
		if int(state["blocker"]) == target:
			damage = 0
			state["blocker"] = 0
		if target == 1:
			state["you_hp"] = max(0, int(state["you_hp"]) - damage)
		else:
			state["rival_hp"] = max(0, int(state["rival_hp"]) - damage)
		state["last_damage"] = damage
		state["last_keep"] = false
		if int(state["you_hp"]) == 0 or int(state["rival_hp"]) == 0:
			state["over"] = true
			state["winner"] = 2 if int(state["you_hp"]) == 0 else 1
			return "ok"
	else:
		state["blank_n"] = max(0, int(state["blank_n"]) - 1)
		state["last_damage"] = 0
		keep = at_self
		state["last_keep"] = at_self

	if int(state["silence"]) == me:
		state["silence"] = 0
	if not keep:
		state["your_turn"] = not yours
	if int(state["live_n"]) == 0 and int(state["blank_n"]) == 0:
		_deal_gun(state)
	return "ok"

func has_round_ahead(state: Dictionary) -> bool:
	var chambers: Array = state["chambers"]
	var idx := int(state["index"])
	for i in range(idx, chambers.size()):
		if int(chambers[i]) != EMPTY:
			return true
	return false

func refill(state: Dictionary) -> void:
	_deal_gun(state)
	state["revealed"] = -1

func _deal_gun(state: Dictionary) -> void:
	var rng := _rng(state)
	var chambers: Array = []
	for i in CHAMBER_COUNT:
		chambers.append(LIVE if i < LIVE_ROUNDS else BLANK)
	for i in range(CHAMBER_COUNT - 1, 0, -1):
		var j := rng.randi_range(0, i)
		var tmp = chambers[i]
		chambers[i] = chambers[j]
		chambers[j] = tmp
	state["chambers"] = chambers
	state["index"] = 0
	state["live_n"] = LIVE_ROUNDS
	state["blank_n"] = BLANK_ROUNDS
	state["revealed"] = -1

func _rng(state: Dictionary) -> RandomNumberGenerator:
	var rng := RandomNumberGenerator.new()
	var n := int(state.get("_nonce", 0))
	state["_nonce"] = n + 1
	rng.seed = int(state["seed"]) ^ (n * 0x27D4EB2F)
	return rng

func _first_empty(state: Dictionary) -> int:
	var chambers: Array = state["chambers"]
	for i in CHAMBER_COUNT:
		if int(chambers[i]) == EMPTY:
			return i
	return -1

func _unfired(state: Dictionary) -> Array:
	var open: Array = []
	var chambers: Array = state["chambers"]
	for i in CHAMBER_COUNT:
		if int(chambers[i]) != EMPTY:
			open.append(i)
	return open

func _round_at_current(state: Dictionary) -> bool:
	var idx := int(state["index"])
	if idx < 0 or idx >= CHAMBER_COUNT:
		return false
	return int(state["chambers"][idx]) != EMPTY

func _hand_has_card(state: Dictionary, yours: bool) -> bool:
	var hand: Array = state["you_hand"] if yours else state["rival_hand"]
	for i in HAND_SIZE:
		if int(hand[i]) >= 0:
			return true
	return false

func _shuffle_unfired(state: Dictionary) -> void:
	var chambers: Array = state["chambers"]
	var idxs: Array = []
	var vals: Array = []
	for i in CHAMBER_COUNT:
		if int(chambers[i]) != EMPTY:
			idxs.append(i)
			vals.append(int(chambers[i]))
	var rng := _rng(state)
	for i in range(vals.size() - 1, 0, -1):
		var j := rng.randi_range(0, i)
		var tmp = vals[i]
		vals[i] = vals[j]
		vals[j] = tmp
	for k in idxs.size():
		chambers[idxs[k]] = vals[k]
