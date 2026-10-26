extends SceneTree

## Headless rule tests. Run:
## godot --headless --path . -s res://scripts/test_rules.gd

const Rules := preload("res://scripts/rules.gd")

var R := Rules.new()

var _checks := 0
var _fails := 0

func _initialize() -> void:
	_test_deal()
	_test_play_keeps_turn()
	_test_pull_turn()
	_test_double()
	_test_blocker()
	_test_lethal()
	_test_eye_peek()
	_test_eject()
	_test_shuffle()
	_test_heal()
	_test_shield_x2_hush()
	_test_last()
	_test_fate()
	_test_load()
	_test_steal()
	_test_silence()
	_test_skip()
	_test_reload()
	_test_empty_and_over()
	print("rules: %d checks, %d failures" % [_checks, _fails])
	quit(0 if _fails == 0 else 1)

func _ok(cond: bool, msg: String) -> void:
	_checks += 1
	if not cond:
		_fails += 1
		print("FAIL: " + msg)

func _eq(got, want, msg: String) -> void:
	_checks += 1
	if got != want:
		_fails += 1
		print("FAIL: %s (got %s, want %s)" % [msg, str(got), str(want)])

func _rig() -> Dictionary:
	var s: Dictionary = R.new_state(7)
	s["chambers"] = [Rules.LIVE, Rules.BLANK, Rules.LIVE, Rules.BLANK, Rules.LIVE, Rules.BLANK, Rules.LIVE, Rules.LIVE]
	s["index"] = 0
	s["live_n"] = 5
	s["blank_n"] = 3
	s["you_hp"] = 4
	s["rival_hp"] = 4
	s["your_turn"] = true
	s["blocker"] = 0
	s["double"] = 0
	s["silence"] = 0
	s["skip"] = 0
	s["revealed"] = -1
	s["over"] = false
	s["winner"] = 0
	s["last_eject"] = 0
	s["last_damage"] = 0
	s["last_keep"] = false
	s["you_hand"] = [Rules.LOAD, Rules.EYE, Rules.HUSH, Rules.SHIELD]
	s["rival_hand"] = [Rules.STEAL, Rules.X2, Rules.HEAL, Rules.FATE]
	return s

func _gun(s: Dictionary, chambers: Array) -> void:
	s["chambers"] = chambers.duplicate()
	s["index"] = 0
	s["revealed"] = -1
	s["live_n"] = _count(chambers, Rules.LIVE)
	s["blank_n"] = _count(chambers, Rules.BLANK)

func _count(chambers: Array, color: int) -> int:
	var n := 0
	for i in chambers.size():
		if int(chambers[i]) == color:
			n += 1
	return n

func _full(color: int) -> Array:
	var out: Array = []
	for _i in 8:
		out.append(color)
	return out

func _test_deal() -> void:
	for seed in [0, 1, 42, 123456789]:
		var a: Dictionary = R.new_state(seed)
		var ch: Array = a["chambers"]
		_eq(ch.size(), 8, "deal seed %d: 8 chambers" % seed)
		_eq(_count(ch, Rules.LIVE), 5, "deal seed %d: 5 live" % seed)
		_eq(_count(ch, Rules.BLANK), 3, "deal seed %d: 3 blank" % seed)
		_eq(a["live_n"], 5, "deal seed %d: live_n" % seed)
		_eq(a["blank_n"], 3, "deal seed %d: blank_n" % seed)
		_eq(a["index"], 0, "deal seed %d: index 0" % seed)
		_eq(a["revealed"], -1, "deal seed %d: nothing revealed" % seed)
		_eq(a["you_hp"], 4, "deal seed %d: you hp 4" % seed)
		_eq(a["rival_hp"], 4, "deal seed %d: rival hp 4" % seed)
		_eq(a["over"], false, "deal seed %d: not over" % seed)
		_eq(a["winner"], 0, "deal seed %d: no winner" % seed)
		_eq((a["you_hand"] as Array).size(), 4, "deal seed %d: hand size 4" % seed)
		_eq((a["rival_hand"] as Array).size(), 4, "deal seed %d: rival hand size 4" % seed)
		for i in 4:
			var card := int(a["you_hand"][i])
			_ok(card >= 0 and card <= 11, "deal seed %d: your card %d in range" % [seed, card])
			var foe := int(a["rival_hand"][i])
			_ok(foe >= 0 and foe <= 11, "deal seed %d: rival card %d in range" % [seed, foe])
		var b: Dictionary = R.new_state(seed)
		_eq(b["chambers"], ch, "deal seed %d: deterministic gun" % seed)
		_eq(b["you_hand"], a["you_hand"], "deal seed %d: deterministic hand" % seed)
		_eq(b["rival_hand"], a["rival_hand"], "deal seed %d: deterministic rival hand" % seed)

func _test_play_keeps_turn() -> void:
	var s := _rig()
	s["you_hp"] = 3
	s["you_hand"][0] = Rules.HEAL
	_eq(R.play(s, true, 0), "ok", "play heal ok")
	_eq(s["you_hp"], 4, "play heal raises hp")
	_eq(s["your_turn"], true, "play keeps your turn")
	_eq(s["you_hand"][0], -1, "play consumes card")
	s["your_turn"] = false
	s["rival_hp"] = 2
	s["rival_hand"][0] = Rules.HEAL
	_eq(R.play(s, false, 0), "ok", "rival play heal ok")
	_eq(s["rival_hp"], 3, "rival heal raises hp")
	_eq(s["your_turn"], false, "rival play keeps turn")
	s["you_hp"] = 4
	s["you_hand"][1] = Rules.HEAL
	_eq(R.play(s, true, 1), "not_your_turn", "play out of turn rejected")
	_eq(s["you_hand"][1], Rules.HEAL, "out of turn card retained")

func _test_pull_turn() -> void:
	var s := _rig()
	_gun(s, [Rules.BLANK] + _full(Rules.LIVE).slice(0, 7))
	s["your_turn"] = true
	_eq(R.pull(s, true), "ok", "blank self ok")
	_eq(s["last_keep"], true, "blank self keeps turn flag")
	_eq(s["your_turn"], true, "blank self keeps your turn")
	_eq(s["last_damage"], 0, "blank self damage 0")
	_eq(s["index"], 1, "blank self advances index")

	s = _rig()
	_gun(s, [Rules.BLANK] + _full(Rules.LIVE).slice(0, 7))
	s["your_turn"] = true
	_eq(R.pull(s, false), "ok", "blank rival ok")
	_eq(s["last_keep"], false, "blank rival no keep")
	_eq(s["your_turn"], false, "blank rival passes turn")
	_eq(s["rival_hp"], 4, "blank rival no damage")

	s = _rig()
	_gun(s, [Rules.LIVE] + _full(Rules.BLANK).slice(0, 7))
	s["your_turn"] = true
	_eq(R.pull(s, false), "ok", "live rival ok")
	_eq(s["rival_hp"], 3, "live deals 1")
	_eq(s["last_damage"], 1, "live last_damage 1")
	_eq(s["last_keep"], false, "live no keep")
	_eq(s["your_turn"], false, "live passes turn")

	s = _rig()
	_gun(s, [Rules.LIVE] + _full(Rules.BLANK).slice(0, 7))
	s["your_turn"] = true
	_eq(R.pull(s, true), "ok", "live self ok")
	_eq(s["you_hp"], 3, "live self hurts you")
	_eq(s["your_turn"], false, "live self passes turn")

	s = _rig()
	_gun(s, [Rules.BLANK] + _full(Rules.LIVE).slice(0, 7))
	s["your_turn"] = false
	_eq(R.pull(s, true), "ok", "rival blank self ok")
	_eq(s["your_turn"], false, "rival blank self keeps rival turn")
	_eq(s["last_keep"], true, "rival blank self last_keep")
	_eq(s["last_damage"], 0, "rival blank self damage 0")

func _test_double() -> void:
	var s := _rig()
	_gun(s, [Rules.LIVE] + _full(Rules.BLANK).slice(0, 7))
	s["double"] = 1
	_eq(R.pull(s, false), "ok", "double live ok")
	_eq(s["rival_hp"], 2, "double deals 2")
	_eq(s["last_damage"], 2, "double last_damage 2")
	_eq(s["double"], 0, "double clears on live")

	s = _rig()
	_gun(s, [Rules.BLANK, Rules.LIVE] + _full(Rules.BLANK).slice(0, 6))
	s["double"] = 1
	_eq(R.pull(s, false), "ok", "double blank ok")
	_eq(s["double"], 1, "blank keeps double")
	s["your_turn"] = true
	_eq(R.pull(s, false), "ok", "double then live ok")
	_eq(s["rival_hp"], 2, "held double applies to next live")
	_eq(s["double"], 0, "double clears after held live")

	s = _rig()
	_gun(s, [Rules.LIVE] + _full(Rules.BLANK).slice(0, 7))
	s["your_turn"] = false
	s["double"] = 2
	_eq(R.pull(s, false), "ok", "rival double ok")
	_eq(s["you_hp"], 2, "rival double deals 2")
	_eq(s["double"], 0, "rival double clears")

	s = _rig()
	_gun(s, [Rules.LIVE] + _full(Rules.BLANK).slice(0, 7))
	s["double"] = 2
	_eq(R.pull(s, false), "ok", "foreign double ok")
	_eq(s["rival_hp"], 3, "foreign double does not boost you")
	_eq(s["double"], 2, "foreign double untouched")

func _test_blocker() -> void:
	var s := _rig()
	_gun(s, [Rules.LIVE] + _full(Rules.BLANK).slice(0, 7))
	s["your_turn"] = false
	s["blocker"] = 1
	_eq(R.pull(s, false), "ok", "blocked live ok")
	_eq(s["you_hp"], 4, "blocker absorbs live")
	_eq(s["last_damage"], 0, "blocker last_damage 0")
	_eq(s["blocker"], 0, "blocker clears")
	_eq(s["your_turn"], true, "blocked live still passes turn")

	s = _rig()
	_gun(s, [Rules.BLANK] + _full(Rules.LIVE).slice(0, 7))
	s["your_turn"] = false
	s["blocker"] = 1
	_eq(R.pull(s, false), "ok", "blocked blank ok")
	_eq(s["blocker"], 1, "blank keeps blocker")

	s = _rig()
	_gun(s, [Rules.LIVE] + _full(Rules.BLANK).slice(0, 7))
	s["blocker"] = 2
	_eq(R.pull(s, false), "ok", "rival shield live ok")
	_eq(s["rival_hp"], 4, "rival shield absorbs live")
	_eq(s["blocker"], 0, "rival shield clears")
	_eq(s["your_turn"], false, "blocked shot passes turn")

	s = _rig()
	_gun(s, [Rules.LIVE] + _full(Rules.BLANK).slice(0, 7))
	s["blocker"] = 1
	_eq(R.pull(s, false), "ok", "own shield only ok")
	_eq(s["rival_hp"], 3, "own shield does not protect rival")
	_eq(s["blocker"], 1, "mismatched shield stays")

func _test_lethal() -> void:
	var s := _rig()
	_gun(s, [Rules.LIVE] + _full(Rules.BLANK).slice(0, 7))
	s["you_hp"] = 1
	s["your_turn"] = false
	_eq(R.pull(s, false), "ok", "lethal on you ok")
	_eq(s["you_hp"], 0, "lethal drops hp to 0")
	_eq(s["over"], true, "lethal ends match")
	_eq(s["winner"], 2, "rival wins")
	_eq(s["your_turn"], false, "no turn swap after lethal")
	_eq(R.pull(s, false), "over", "pull after over rejected")
	_eq(R.play(s, true, 0), "over", "play after over rejected")

	s = _rig()
	_gun(s, [Rules.LIVE] + _full(Rules.BLANK).slice(0, 7))
	s["you_hp"] = 1
	s["your_turn"] = true
	_eq(R.pull(s, true), "ok", "self lethal ok")
	_eq(s["over"], true, "self lethal ends match")
	_eq(s["winner"], 2, "self lethal gives rival win")
	_eq(s["your_turn"], true, "self lethal no turn swap")

	s = _rig()
	_gun(s, [Rules.LIVE] + _full(Rules.BLANK).slice(0, 7))
	s["rival_hp"] = 1
	s["your_turn"] = true
	_eq(R.pull(s, false), "ok", "lethal on rival ok")
	_eq(s["over"], true, "rival death ends match")
	_eq(s["winner"], 1, "you win")
	_eq(s["your_turn"], true, "no turn swap after rival death")

	s = _rig()
	_gun(s, [Rules.LIVE] + _full(Rules.BLANK).slice(0, 7))
	s["you_hp"] = 1
	s["your_turn"] = false
	s["double"] = 2
	_eq(R.pull(s, false), "ok", "overkill ok")
	_eq(s["you_hp"], 0, "overkill clamps at 0")
	_eq(s["last_damage"], 2, "overkill damage still 2")

func _test_eye_peek() -> void:
	var s := _rig()
	s["index"] = 2
	s["revealed"] = -1
	_eq(R.play(s, true, 1), "ok", "eye ok")
	_eq(s["revealed"], 2, "eye reveals current")
	_eq(s["you_hand"][1], -1, "eye consumed")

	s = _rig()
	s["index"] = 5
	s["chambers"][5] = Rules.BLANK
	_eq(R.play(s, true, 1), "ok", "eye on blank ok")
	_eq(s["revealed"], 5, "eye reveals blank current")

	s = _rig()
	s["index"] = 0
	s["chambers"][0] = Rules.EMPTY
	s["live_n"] = 4
	_eq(R.play(s, true, 1), "empty", "eye on empty fails")
	_eq(s["you_hand"][1], Rules.EYE, "failed eye keeps card")
	_eq(s["revealed"], -1, "failed eye no reveal")

	s = _rig()
	s["index"] = 0
	s["chambers"] = [Rules.LIVE, Rules.EMPTY, Rules.BLANK, Rules.LIVE, Rules.EMPTY, Rules.BLANK, Rules.LIVE, Rules.LIVE]
	s["live_n"] = 4
	s["blank_n"] = 2
	s["revealed"] = -1
	_eq(R.play(s, true, 1), "ok", "peek ok")
	var seen := int(s["revealed"])
	_ok(seen >= 0, "peek reveals an index")
	_ok(int(s["chambers"][seen]) != Rules.EMPTY, "peek reveals an unfired chamber")
	_ok(seen != 1 and seen != 4, "peek skips empty chambers")
	_eq(s["you_hand"][1], -1, "peek consumed")

	s = _rig()
	s["chambers"] = _full(Rules.EMPTY)
	s["live_n"] = 0
	s["blank_n"] = 0
	_eq(R.play(s, true, 1), "empty", "peek with no rounds fails")
	_eq(s["you_hand"][1], Rules.EYE, "failed peek keeps card")

func _test_eject() -> void:
	var s := _rig()
	s["you_hand"][0] = Rules.EJECT
	s["revealed"] = 0
	_eq(R.play(s, true, 0), "ok", "eject live ok")
	_eq(s["chambers"][0], Rules.EMPTY, "eject empties chamber")
	_eq(s["index"], 1, "eject advances index")
	_eq(s["live_n"], 4, "eject live decrements live_n")
	_eq(s["blank_n"], 3, "eject live keeps blank_n")
	_eq(s["revealed"], -1, "eject clears reveal")
	_eq(s["last_eject"], Rules.LIVE, "eject reports live")

	s = _rig()
	s["you_hand"][0] = Rules.EJECT
	s["chambers"][0] = Rules.BLANK
	_eq(R.play(s, true, 0), "ok", "eject blank ok")
	_eq(s["blank_n"], 2, "eject blank decrements blank_n")
	_eq(s["live_n"], 5, "eject blank keeps live_n")
	_eq(s["last_eject"], Rules.BLANK, "eject reports blank")

	s = _rig()
	s["you_hand"][0] = Rules.EJECT
	s["chambers"][0] = Rules.EMPTY
	s["live_n"] = 4
	s["index"] = 0
	s["last_eject"] = 0
	_eq(R.play(s, true, 0), "empty", "eject empty fails")
	_eq(s["index"], 0, "failed eject keeps index")
	_eq(s["last_eject"], 0, "failed eject keeps last_eject")
	_eq(s["you_hand"][0], Rules.EJECT, "failed eject keeps card")

func _test_shuffle() -> void:
	var s := _rig()
	s["you_hand"][0] = Rules.SHUFFLE
	s["chambers"] = [Rules.LIVE, Rules.BLANK, Rules.LIVE, Rules.EMPTY, Rules.BLANK, Rules.LIVE, Rules.EMPTY, Rules.LIVE]
	s["live_n"] = 4
	s["blank_n"] = 2
	s["revealed"] = 6
	_eq(R.play(s, true, 0), "ok", "shuffle ok")
	_eq(s["chambers"][3], Rules.EMPTY, "shuffle leaves fired chamber empty")
	_eq(s["chambers"][6], Rules.EMPTY, "shuffle leaves second fired chamber empty")
	_eq(s["live_n"], 4, "shuffle keeps live_n")
	_eq(s["blank_n"], 2, "shuffle keeps blank_n")
	_eq(_count(s["chambers"], Rules.LIVE), 4, "shuffle keeps live multiset")
	_eq(_count(s["chambers"], Rules.BLANK), 2, "shuffle keeps blank multiset")
	_eq(s["revealed"], -1, "shuffle clears reveal")
	_eq(s["index"], 0, "shuffle keeps index")

func _test_heal() -> void:
	var s := _rig()
	s["you_hp"] = 3
	s["you_hand"][0] = Rules.HEAL
	_eq(R.play(s, true, 0), "ok", "heal from 3 ok")
	_eq(s["you_hp"], 4, "heal from 3 hits 4")

	s = _rig()
	s["you_hp"] = 4
	s["you_hand"][0] = Rules.HEAL
	_eq(R.play(s, true, 0), "ok", "heal at cap ok")
	_eq(s["you_hp"], 4, "heal capped at 4")

	s = _rig()
	s["your_turn"] = false
	s["rival_hp"] = 2
	s["rival_hand"][0] = Rules.HEAL
	_eq(R.play(s, false, 0), "ok", "rival heal ok")
	_eq(s["rival_hp"], 3, "rival heal raises rival")

func _test_shield_x2_hush() -> void:
	var s := _rig()
	s["you_hand"][0] = Rules.SHIELD
	_eq(R.play(s, true, 0), "ok", "shield ok")
	_eq(s["blocker"], 1, "shield marks you")
	_eq(s["your_turn"], true, "shield keeps turn")

	s = _rig()
	s["you_hand"][0] = Rules.X2
	_eq(R.play(s, true, 0), "ok", "x2 ok")
	_eq(s["double"], 1, "x2 marks you")

	s = _rig()
	s["you_hand"][0] = Rules.HUSH
	_eq(R.play(s, true, 0), "ok", "hush ok")
	_eq(s["silence"], 2, "hush silences rival")

	s = _rig()
	s["your_turn"] = false
	s["rival_hand"][0] = Rules.SHIELD
	_eq(R.play(s, false, 0), "ok", "rival shield ok")
	_eq(s["blocker"], 2, "rival shield marks rival")

	s = _rig()
	s["your_turn"] = false
	s["rival_hand"][0] = Rules.X2
	_eq(R.play(s, false, 0), "ok", "rival x2 ok")
	_eq(s["double"], 2, "rival x2 marks rival")

	s = _rig()
	s["your_turn"] = false
	s["rival_hand"][0] = Rules.HUSH
	_eq(R.play(s, false, 0), "ok", "rival hush ok")
	_eq(s["silence"], 1, "rival hush silences you")

func _test_last() -> void:
	var s := _rig()
	s["you_hp"] = 4
	s["you_hand"][0] = Rules.LAST
	_eq(R.play(s, true, 0), "last_hp", "last needs 1 hp")
	_eq(s["you_hand"][0], Rules.LAST, "failed last keeps card")
	_eq(s["skip"], 0, "failed last no skip")

	s = _rig()
	s["you_hp"] = 1
	s["you_hand"][0] = Rules.LAST
	_eq(R.play(s, true, 0), "ok", "last at 1 hp ok")
	_eq(s["skip"], 2, "last skips rival")
	_eq(s["you_hand"][0], -1, "last consumed")
	_eq(s["your_turn"], true, "last keeps turn")

	s = _rig()
	s["your_turn"] = false
	s["rival_hp"] = 1
	s["rival_hand"][0] = Rules.LAST
	_eq(R.play(s, false, 0), "ok", "rival last ok")
	_eq(s["skip"], 1, "rival last skips you")

func _test_fate() -> void:
	var s := _rig()
	s["you_hand"][0] = Rules.FATE
	var before_live: int = s["live_n"]
	var before_blank: int = s["blank_n"]
	s["revealed"] = 4
	_eq(R.play(s, true, 0), "ok", "fate ok")
	_ok(int(s["chambers"][0]) == Rules.LIVE or int(s["chambers"][0]) == Rules.BLANK, "fate leaves a round")
	_eq(s["revealed"], -1, "fate clears reveal")
	_eq(s["index"], 0, "fate keeps index")
	_eq(_count(s["chambers"], Rules.LIVE), s["live_n"], "fate live_n matches gun")
	_eq(_count(s["chambers"], Rules.BLANK), s["blank_n"], "fate blank_n matches gun")
	_eq(int(s["live_n"]) + int(s["blank_n"]), before_live + before_blank, "fate keeps total rounds")

	s = _rig()
	s["you_hand"][0] = Rules.FATE
	s["chambers"][0] = Rules.BLANK
	s["live_n"] = 4
	s["blank_n"] = 4
	_eq(R.play(s, true, 0), "ok", "fate on blank ok")
	_ok(int(s["chambers"][0]) != Rules.EMPTY, "fate on blank keeps a round")
	_eq(_count(s["chambers"], Rules.LIVE), s["live_n"], "fate blank live_n matches")
	_eq(_count(s["chambers"], Rules.BLANK), s["blank_n"], "fate blank blank_n matches")

	s = _rig()
	s["you_hand"][0] = Rules.FATE
	s["chambers"][0] = Rules.EMPTY
	s["live_n"] = 4
	_eq(R.play(s, true, 0), "empty", "fate on empty fails")
	_eq(s["you_hand"][0], Rules.FATE, "failed fate keeps card")

func _test_load() -> void:
	var s := _rig()
	s["chambers"][4] = Rules.EMPTY
	s["live_n"] = 4
	s["index"] = 2
	_eq(R.play(s, true, 0), "ok", "load ok")
	_eq(s["chambers"][4], Rules.LIVE, "load fills first empty")
	_eq(s["live_n"], 5, "load increments live_n")
	_eq(s["blank_n"], 3, "load keeps blank_n")
	_eq(s["index"], 2, "load keeps index")
	_eq(s["you_hand"][0], -1, "load consumed")

	s = _rig()
	s["chambers"][0] = Rules.EMPTY
	s["live_n"] = 4
	s["index"] = 5
	_eq(R.play(s, true, 0), "ok", "load behind index ok")
	_eq(s["chambers"][0], Rules.LIVE, "load refills earliest hole")

	s = _rig()
	s["chambers"] = [Rules.LIVE, Rules.BLANK, Rules.LIVE, Rules.BLANK, Rules.LIVE, Rules.BLANK, Rules.LIVE, Rules.LIVE]
	s["live_n"] = 5
	s["blank_n"] = 3
	_eq(R.play(s, true, 0), "no_chamber", "load without holes fails")
	_eq(s["you_hand"][0], Rules.LOAD, "failed load keeps card")

func _test_steal() -> void:
	var s := _rig()
	s["you_hand"] = [Rules.STEAL, -1, 9, -1]
	s["rival_hand"] = [5, -1, 7, -1]
	_eq(R.play(s, true, 0), "ok", "steal ok")
	_eq(s["you_hand"][0], 5, "steal takes first rival card")
	_eq(s["you_hand"][2], 9, "steal leaves other cards")
	_eq(s["rival_hand"][0], -1, "steal empties rival slot")
	_eq(s["rival_hand"][2], 7, "steal leaves rival other cards")
	_eq(s["your_turn"], true, "steal keeps turn")

	s = _rig()
	s["you_hand"] = [Rules.STEAL, 1, 2, 3]
	s["rival_hand"] = [5, 6, 7, 8]
	_eq(R.play(s, true, 0), "ok", "steal with full hand ok")
	_eq(s["you_hand"][0], 5, "steal refills played slot")
	_eq(s["rival_hand"][0], -1, "steal clears rival slot")

	s = _rig()
	s["you_hand"] = [Rules.STEAL, -1, -1, -1]
	s["rival_hand"] = [-1, -1, -1, -1]
	_eq(R.play(s, true, 0), "no_target", "steal without target fails")
	_eq(s["you_hand"][0], Rules.STEAL, "failed steal keeps card")

	s = _rig()
	s["your_turn"] = false
	s["rival_hand"] = [Rules.STEAL, -1, -1, -1]
	s["you_hand"] = [4, 6, -1, -1]
	_eq(R.play(s, false, 0), "ok", "rival steal ok")
	_eq(s["rival_hand"][0], 4, "rival steals your card")
	_eq(s["you_hand"][0], -1, "rival steal empties your slot")

func _test_silence() -> void:
	var s := _rig()
	s["silence"] = 1
	s["you_hp"] = 3
	s["you_hand"][0] = Rules.HEAL
	_eq(R.play(s, true, 0), "silenced", "silenced play rejected")
	_eq(s["you_hand"][0], Rules.HEAL, "silenced keeps card")
	_eq(s["you_hp"], 3, "silenced no effect")
	_eq(s["your_turn"], true, "silenced keeps turn")

	s = _rig()
	_gun(s, [Rules.BLANK] + _full(Rules.LIVE).slice(0, 7))
	s["silence"] = 1
	_eq(R.pull(s, true), "ok", "silenced can pull")
	_eq(s["silence"], 0, "silence clears after pull")
	_eq(s["last_keep"], true, "silenced blank self keeps turn")
	_eq(s["your_turn"], true, "silenced pull turn kept")

	s = _rig()
	s["silence"] = 2
	s["you_hand"][0] = Rules.HEAL
	_eq(R.play(s, true, 0), "ok", "opponent silence does not block you")

	s = _rig()
	_gun(s, [Rules.LIVE] + _full(Rules.BLANK).slice(0, 7))
	s["your_turn"] = false
	s["silence"] = 2
	_eq(R.pull(s, true), "ok", "rival silenced pull ok")
	_eq(s["silence"], 0, "rival silence clears after pull")
	_eq(s["rival_hp"], 3, "rival self damage applies")

func _test_skip() -> void:
	var s := _rig()
	_gun(s, [Rules.LIVE] + _full(Rules.BLANK).slice(0, 7))
	s["skip"] = 1
	_eq(R.pull(s, false), "skipped", "skip returns skipped")
	_eq(s["skip"], 0, "skip consumed")
	_eq(s["your_turn"], false, "skip passes turn")
	_eq(s["index"], 0, "skip does not fire")
	_eq(s["chambers"][0], Rules.LIVE, "skip keeps chamber")
	_eq(s["rival_hp"], 4, "skip deals no damage")
	_eq(s["last_damage"], 0, "skip no damage marker")

	s = _rig()
	s["skip"] = 1
	s["silence"] = 1
	_eq(R.pull(s, false), "skipped", "skip while silenced")
	_eq(s["silence"], 1, "skip does not clear silence")

	s = _rig()
	_gun(s, [Rules.BLANK] + _full(Rules.LIVE).slice(0, 7))
	s["skip"] = 2
	_eq(R.pull(s, true), "ok", "opponent skip does not apply")
	_eq(s["skip"], 2, "opponent skip untouched")

func _test_reload() -> void:
	var s := _rig()
	_gun(s, [Rules.LIVE] + _full(Rules.EMPTY).slice(0, 7))
	_eq(s["live_n"], 1, "one live setup")
	_eq(R.pull(s, false), "ok", "last live pull ok")
	_eq(s["rival_hp"], 3, "last live deals damage")
	_eq((s["chambers"] as Array).size(), 8, "reload keeps 8 chambers")
	_eq(_count(s["chambers"], Rules.LIVE), 5, "reload deals 5 live")
	_eq(_count(s["chambers"], Rules.BLANK), 3, "reload deals 3 blank")
	_eq(s["live_n"], 5, "reload live_n")
	_eq(s["blank_n"], 3, "reload blank_n")
	_eq(s["index"], 0, "reload resets index")
	_eq(s["revealed"], -1, "reload clears reveal")

	s = _rig()
	_gun(s, [Rules.BLANK] + _full(Rules.EMPTY).slice(0, 7))
	_eq(R.pull(s, true), "ok", "last blank pull ok")
	_eq(s["your_turn"], true, "last blank self keeps turn")
	_eq(s["last_keep"], true, "last blank self last_keep")
	_eq(_count(s["chambers"], Rules.LIVE), 5, "reload after last blank deals live")
	_eq(_count(s["chambers"], Rules.BLANK), 3, "reload after last blank deals blank")
	_eq(s["index"], 0, "reload after last blank index 0")

	s = _rig()
	_gun(s, [Rules.LIVE, Rules.BLANK] + _full(Rules.EMPTY).slice(0, 6))
	_eq(R.pull(s, false), "ok", "mixed pull ok")
	_eq(s["index"], 1, "mixed pull advances")
	_eq(s["chambers"][1], Rules.BLANK, "mixed pull no reload while rounds remain")
	_eq(s["live_n"], 0, "mixed live_n 0")
	_eq(s["blank_n"], 1, "mixed blank_n 1")

func _test_empty_and_over() -> void:
	var s := _rig()
	s["chambers"][0] = Rules.EMPTY
	_eq(R.pull(s, false), "empty", "pull on fired chamber fails")
	_eq(s["index"], 0, "failed pull keeps index")
	_eq(s["rival_hp"], 4, "failed pull no damage")

	s = _rig()
	s["you_hand"][2] = -1
	_eq(R.play(s, true, 2), "empty", "play empty slot fails")

	s = _rig()
	s["over"] = true
	s["winner"] = 1
	_eq(R.pull(s, true), "over", "over pull token")
	_eq(R.play(s, true, 0), "over", "over play token")
	_eq(s["index"], 0, "over pull no fire")
	_eq(s["you_hand"][0], Rules.LOAD, "over play no consume")
