extends Node3D

## Gray room. Gun poses only: table, held, bore-at-lens, chest.
## Click the gun to pick it up. Mouse below the middle aims at you.
## Mouse above aims at the rival. Click again to put it back.
## ROLET_POSE=all saves four frames and quits.

const GunScript := preload("res://scripts/gun.gd")
const TableScript := preload("res://scripts/table.gd")
const RulesScript := preload("res://scripts/rules.gd")
const SfxScript := preload("res://scripts/sfx.gd")

@onready var camera: Camera3D = $Camera3D
@onready var gun: GunScript = $Gun
@onready var rival: Node3D = $Rival
@onready var table: TableScript = $Table

var phase := "boot"
var aim_self := false
var _aim_at := ""
var _aim_token := 0
var _frame_i := 0
var moving := false
var aim_dirty := false
var held_base: Transform3D
var tremble_t := 0.0
var tremble_i := 0
var chambers: Array[bool] = []
var chamber_i := 0
var you := 4
var rival_hp := 4
var your_turn := true
var over := false
var _flash: ColorRect
var _cam_home: Vector3
var _rival_home: Vector3
var _red: Material
var _hold_scale := Vector3.ONE
var _known: Array[int] = [0, 0, 0, 0, 0, 0, 0, 0]
var _shot_taken := false
var _play_kind := ""
var rules: RulesScript
var sfx: SfxScript
var state: Dictionary = {}

## 12 fps, a few pixels. Stepped, not a smooth wobble.
const SHAKE_X: Array[float] = [0.0, 0.0032, -0.0024, 0.0016, -0.0032, 0.0020]
const SHAKE_Y: Array[float] = [0.0, 0.0016, 0.0028, -0.0020, 0.0008, -0.0016]

func _ready() -> void:
	camera.look_at(Vector3(0.0, 1.0, -0.85), Vector3.UP)
	_cam_home = camera.position
	_rival_home = rival.position
	_build_flash()
	rules = RulesScript.new()
	sfx = SfxScript.new()
	add_child(sfx)
	var beat := OS.get_environment("ROLET_BEAT")
	if beat != "":
		_capture(beat)
		return
	var card_name := OS.get_environment("ROLET_CARD")
	if card_name != "":
		_capture_card(card_name)
		return
	var play_kind := OS.get_environment("ROLET_PLAY")
	if play_kind != "":
		_play_kind = play_kind
		_capture_play(play_kind)
		return
	var pose := OS.get_environment("ROLET_POSE")
	if pose == "all":
		for id in ["table", "held", "self", "rival"]:
			_snap(id)
			await get_tree().process_frame
			await RenderingServer.frame_post_draw
			var img := get_viewport().get_texture().get_image()
			img.save_png("/tmp/rolet-pose-%s.png" % id)
		get_tree().quit()
		return
	if pose != "":
		_snap(pose)
	var shot := OS.get_environment("ROLET_SHOT")
	if pose == "":
		_boot()
		return
	await get_tree().process_frame
	await RenderingServer.frame_post_draw
	var one := get_viewport().get_texture().get_image()
	one.save_png(shot)
	get_tree().quit()

func _process(delta: float) -> void:
	if phase != "held" or moving:
		return
	tremble_t += delta
	if tremble_t < 1.0 / 12.0:
		return
	tremble_t = 0.0
	tremble_i = (tremble_i + 1) % SHAKE_X.size()
	var ox: float = SHAKE_X[tremble_i]
	var oy: float = SHAKE_Y[tremble_i]
	gun.transform = held_base
	gun.position += Vector3(ox, oy, 0.0)
	gun.rotate_object_local(Vector3.RIGHT, oy * 0.35)
	gun.rotate_object_local(Vector3.UP, ox * 0.28)

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseMotion and phase == "held":
		var next := _wants_self(event.position.y)
		if next != aim_self:
			aim_self = next
			_aim()
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		if moving:
			return
		if over or phase == "boot" or phase == "act":
			return
		if phase == "table" and your_turn:
			var hit := _ray(event.position)
			if not hit.is_empty() and hit.collider.has_meta("slot"):
				_on_card(int(hit.collider.get_meta("slot")))
				return
			if _hit_gun(event.position):
				_pickup()
		elif phase == "held":
			_fire_at(_wants_self(event.position.y))

func _ray(screen: Vector2) -> Dictionary:
	var origin := camera.project_ray_origin(screen)
	var end := origin + camera.project_ray_normal(screen) * 8.0
	var query := PhysicsRayQueryParameters3D.create(origin, end)
	return camera.get_world_3d().direct_space_state.intersect_ray(query)

func _hit_gun(screen: Vector2) -> bool:
	var hit := _ray(screen)
	return not hit.is_empty() and gun.is_ancestor_of(hit.collider)

func _pickup() -> void:
	moving = true
	phase = "act"
	gun.set_pick_enabled(false)
	table.set_cards_locked(true)
	aim_self = false
	sfx.pickup()
	await _step_to(camera, _held_xf(), 5, 0.7)
	held_base = gun.transform
	phase = "held"
	moving = false
	if aim_dirty:
		aim_dirty = false
		_aim()

func _aim() -> void:
	if phase != "held":
		return
	_aim_token += 1
	var token := _aim_token
	moving = true
	gun.uncock()
	var to_self := aim_self
	var target := _self_xf() if to_self else _rival_xf()
	var done: bool = await _step_muzzle(target, 5, 0.18, token)
	if token != _aim_token:
		return
	if to_self and done:
		gun.cock(1)
		await _beat()
		if token != _aim_token:
			return
		gun.cock(2)
	if token != _aim_token:
		return
	_aim_at = "self" if to_self else "rival"
	held_base = gun.transform
	moving = false

func _drop() -> void:
	aim_self = false
	_aim_at = ""
	gun.uncock()
	_hold_scale = Vector3.ONE
	gun.scale = Vector3.ONE
	await _step_to(self, _table_xf(), 4, 0.45)
	gun.set_pick_enabled(true)

func _snap(id: String) -> void:
	match id:
		"held":
			_reparent_keep(camera)
			gun.transform = _held_xf()
		"self":
			_reparent_keep(camera)
			gun.transform = _self_xf()
		"rival":
			_reparent_keep(camera)
			gun.transform = _rival_xf()
		"his":
			_reparent_keep(self)
			_hold_scale = Vector3(2.2, 2.2, 2.2)
			gun.transform = _rival_at_us_xf()
			gun.scale = _hold_scale
		"chin":
			_reparent_keep(self)
			_hold_scale = Vector3(1.35, 1.35, 1.35)
			gun.transform = _rival_chin_xf()
			gun.scale = _hold_scale
		"load":
			_reparent_keep(self)
			_hold_scale = Vector3(2.2, 2.2, 2.2)
			gun.transform = _load_xf()
			gun.scale = _hold_scale
		"cock":
			_reparent_keep(camera)
			gun.transform = _self_xf()
			gun.cock(2)
		_:
			_reparent_keep(self)
			gun.transform = _table_xf()

## The muzzle travels in a straight line between the two aims.
## Blending the whole rotation stands the barrel up for a frame and
## the old slide held one pose still, which read as a hitch.
func _step_muzzle(target: Transform3D, frames: int, total: float, token: int) -> bool:
	_reparent_keep(camera)
	var from_p: Vector3 = gun.position
	var from_dir: Vector3 = gun.basis.x.normalized()
	var to_p: Vector3 = target.origin
	var to_dir: Vector3 = target.basis.x.normalized()
	var reach := gun.MUZZLE.length()
	var from_m: Vector3 = from_p + from_dir * reach
	var to_m: Vector3 = to_p + to_dir * reach
	for i in frames:
		if token != _aim_token:
			return false
		var t := float(i + 1) / float(frames)
		var pos := from_p.lerp(to_p, t)
		var muzzle := from_m.lerp(to_m, t)
		var dir := muzzle - pos
		if dir.length_squared() < 0.0001:
			dir = to_dir
		else:
			dir = dir.normalized()
		gun.position = pos
		gun.basis = _basis_rolled(dir, _up_for(dir))
		gun.scale = _hold_scale
		await _maybe_frame()
		if i < frames - 1:
			await get_tree().create_timer(total / float(frames)).timeout
	if token != _aim_token:
		return false
	gun.transform = target
	gun.scale = _hold_scale
	await _maybe_frame()
	return true

## Hand roll (+Y) when the barrel points forward. Neck roll (+Z) when it
## points up. Using the wrong one turns the gun into a flat bar.
func _up_for(dir: Vector3) -> Vector3:
	var hand := Vector3.UP
	var neck := Vector3(0, 0, 1)
	var hand_room := 1.0 - absf(dir.dot(hand))
	var neck_room := 1.0 - absf(dir.dot(neck))
	var w := neck_room / maxf(hand_room + neck_room, 0.001)
	var up := hand.lerp(neck, w)
	up = up - dir * up.dot(dir)
	if up.length_squared() < 0.05:
		up = dir.cross(Vector3.RIGHT)
	return up.normalized()

func _maybe_frame() -> void:
	var folder := OS.get_environment("ROLET_DUMP")
	if folder == "":
		return
	await get_tree().process_frame
	await RenderingServer.frame_post_draw
	get_viewport().get_texture().get_image().save_png("%s/%03d.png" % [folder, _frame_i])
	_frame_i += 1

func _step_to(parent: Node3D, target: Transform3D, frames: int, total: float) -> void:
	_reparent_keep(parent)
	var from_p: Vector3 = gun.position
	var from_q: Quaternion = gun.basis.get_rotation_quaternion()
	var to_p := target.origin
	var to_q := target.basis.get_rotation_quaternion()
	for i in frames:
		var t := float(i + 1) / float(frames)
		gun.position = from_p.lerp(to_p, t)
		gun.basis = Basis(from_q.slerp(to_q, t))
		gun.scale = _hold_scale
		if i < frames - 1:
			await get_tree().create_timer(total / float(frames)).timeout

func _reparent_keep(parent: Node3D) -> void:
	if gun.get_parent() == parent:
		return
	var global: Transform3D = gun.global_transform
	gun.reparent(parent)
	gun.global_transform = global

func _table_xf() -> Transform3D:
	return Transform3D(Basis.IDENTITY, Vector3(0.0, 0.8, 0.2))

func _held_xf() -> Transform3D:
	var aim := Vector3(-0.42, 0.32, -0.85).normalized()
	return Transform3D(_basis_along_x(aim), Vector3(0.02, -0.26, -0.52))

func _self_xf() -> Transform3D:
	# Barrel rises from the bottom of the view and points up under the jaw.
	# The eye looks down onto the gun. It does not stare straight into the bore.
	var aim := Vector3(0.0, 0.9, 0.28).normalized()
	var origin := Vector3(0.0, -0.34, -0.5)
	return Transform3D(_basis_rolled(aim, Vector3(0, 0, 1)), origin)

func _basis_rolled(dir: Vector3, up_hint: Vector3) -> Basis:
	var x := dir.normalized()
	var z := x.cross(up_hint)
	if z.length_squared() < 0.0001:
		z = x.cross(Vector3.FORWARD)
	z = z.normalized()
	var y := z.cross(x).normalized()
	return Basis(x, y, z)

func _rival_xf() -> Transform3D:
	# In our hand. Barrel toward his chest. Top of the gun faces the camera.
	var origin := Vector3(0.04, -0.3, -0.58)
	var chest: Vector3 = camera.to_local(rival.to_global(Vector3(0, 1.15, 0.18)))
	var aim := (chest - origin).normalized()
	var xf := Transform3D(_basis_rolled(aim, Vector3(0, 0, 1)), origin)
	for _i in 4:
		var muzzle: Vector3 = origin + xf.basis * gun.MUZZLE
		aim = (chest - muzzle).normalized()
		xf = Transform3D(_basis_rolled(aim, Vector3(0, 0, 1)), origin)
	return xf

func _boot() -> void:
	phase = "boot"
	state = rules.new_state(Time.get_ticks_msec())
	state["your_turn"] = true
	_refresh()
	await _show_tray()
	await _rival_load()
	phase = "table"
	_refresh()
	var shot := OS.get_environment("ROLET_SHOT")
	if shot != "":
		await get_tree().process_frame
		await RenderingServer.frame_post_draw
		var img := get_viewport().get_texture().get_image()
		img.save_png(shot)
		get_tree().quit()

func _show_tray() -> void:
	for step in 4:
		table.set_tray(0.58 + float(step) * 0.06)
		await _beat()
	await get_tree().create_timer(3.2).timeout
	for step in 4:
		table.set_tray(0.76 - float(step) * 0.06)
		await _beat()

func _on_card(slot: int) -> void:
	if phase != "table" or moving or over or not bool(state["your_turn"]):
		return
	var hand: Array = state["you_hand"]
	if slot < 0 or slot >= hand.size() or int(hand[slot]) < 0:
		return
	var id := int(hand[slot])
	if rules.play(state, true, slot) != "ok":
		return
	moving = true
	phase = "act"
	await _card_fx(id, true, slot)
	_refresh()
	if bool(state["over"]):
		over = true
		phase = "over"
		moving = false
		return
	phase = "table"
	moving = false
	_refresh()

func _wants_self(y: float) -> bool:
	var height := get_viewport().get_visible_rect().size.y
	var mid := height * 0.5
	var band := height * 0.06
	if y > mid + band:
		return true
	if y < mid - band:
		return false
	return aim_self

func _fire_at(want_self: bool) -> void:
	if phase != "held" or moving:
		return
	var pose := "self" if want_self else "rival"
	if _aim_at != pose:
		aim_self = want_self
		await _aim()
		if phase != "held" or moving or _aim_at != pose:
			return
	_fire()

func _fire() -> void:
	if over or not bool(state["your_turn"]):
		return
	moving = true
	phase = "act"
	table.set_cards_locked(true)
	gun.transform = held_base
	var at_self := aim_self
	if at_self:
		await get_tree().create_timer(0.3).timeout
	var idx := int(state["index"])
	var chambers: Array = state["chambers"]
	var round := int(chambers[idx]) if idx < chambers.size() else 0
	var before := int(state["live_n"]) + int(state["blank_n"])
	var result := rules.pull(state, at_self)
	var reloaded := result == "ok" and int(state["index"]) == 0 and int(state["live_n"]) == 5 and before <= 1
	await _present_shot(at_self, round, result)
	await _drop()
	if result == "empty" and not rules.has_round_ahead(state):
		rules.refill(state)
		_known.fill(0)
		await _show_tray()
		await _rival_load()
	elif reloaded and not bool(state["over"]):
		_known.fill(0)
		await _show_tray()
		await _rival_load()
	_refresh()
	if result == "over" or bool(state["over"]):
		over = true
		phase = "over"
		moving = false
		_settle_bodies()
		return
	if bool(state["your_turn"]):
		phase = "table"
		moving = false
		_refresh()
		if _play_kind != "":
			await _play_report()
		return
	if _play_kind != "":
		await _play_report()
		return
	await _rival_turn()

func _present_shot(hits_you: bool, round: int, result: String) -> void:
	if result != "ok":
		return
	sfx.tick()
	if round != RulesScript.LIVE:
		sfx.dry()
	var show_reveal := bool(state["your_turn"]) and int(state["revealed"]) >= 0
	table.sync_gun(int(state["index"]), state["chambers"], int(state["revealed"]) if show_reveal else -1, _known)
	await _resolve_shot(hits_you, round, int(state["last_damage"]), bool(state["over"]))

func _resolve_shot(hits_you: bool, round: int, damage: int, ended: bool) -> void:
	var live := round == RulesScript.LIVE
	var his_gun := gun.get_parent() != camera
	if not live:
		if his_gun and not hits_you:
			return
		await _kick(0.008)
		return
	if hits_you:
		if damage > 0:
			if his_gun:
				await _muzzle_flash()
			await _blackout()
		else:
			await _muzzle_flash()
		return
	if damage <= 0:
		await _muzzle_flash()
		await _grab_shot()
		return
	if his_gun:
		await _muzzle_flash()
		await _smoke()
		await _throw_rival(ended)
		return
	await _kick(0.02 * float(maxi(damage, 1)))
	await _muzzle_flash()
	await _smoke()
	await _splatter()
	await _throw_rival(ended)

func _card_fx(id: int, yours: bool, slot: int) -> void:
	if yours and slot >= 0 and slot < table.hand_count():
		await _lift_card(slot)
	await _card_act(id, yours, slot)
	await get_tree().create_timer(0.12).timeout
	if yours and slot >= 0 and slot < table.hand_count():
		if int(state["you_hand"][slot]) < 0:
			await _tear(table.hand_node(slot))
		else:
			table.show_hand(state["you_hand"])

func _lift_card(slot: int) -> void:
	var card := table.hand_node(slot)
	var home: Vector3 = card.position
	for i in 6:
		card.position = home.lerp(Vector3(0.0, 1.02, 0.62), float(i + 1) / 6.0)
		await get_tree().create_timer(0.1).timeout

func _card_act(id: int, yours: bool, slot: int) -> void:
	if id == RulesScript.EYE:
		await _act_eye(yours)
	elif id == RulesScript.PEEK:
		await _act_peek(yours)
	elif id == RulesScript.EJECT:
		await _act_eject()
	elif id == RulesScript.SHIELD:
		await _act_shield(yours)
	elif id == RulesScript.HEAL:
		await _act_heal(yours)
	elif id == RulesScript.HUSH:
		await _act_hush(yours)
	elif id == RulesScript.X2:
		await _act_x2()
	elif id == RulesScript.LOAD:
		await _act_load(yours)
	elif id == RulesScript.SHUFFLE:
		await _act_shuffle()
	elif id == RulesScript.STEAL:
		await _act_steal(yours, slot)
	elif id == RulesScript.LAST:
		await _act_last(yours)
	elif id == RulesScript.FATE:
		await _act_fate()
	else:
		await _beat()
		await _beat()

func _act_eye(yours: bool) -> void:
	if not yours:
		await _beat()
		await _beat()
		return
	var idx := int(state["index"])
	table.sync_gun(idx, state["chambers"], int(state["revealed"]), _known)
	await _dolly(0.85)
	await _grab_shot()
	await get_tree().create_timer(0.5).timeout
	await _dolly(0.0)

func _act_peek(yours: bool) -> void:
	if not yours:
		await _beat()
		await _beat()
		return
	var hole := int(state["revealed"])
	var idx := int(state["index"])
	if hole < 0:
		await _beat()
		return
	await _yaw_to(hole)
	table.sync_gun(idx, state["chambers"], hole, _known, true)
	await _dolly(0.85)
	await _grab_shot()
	await get_tree().create_timer(0.4).timeout
	await _dolly(0.0)
	await _yaw_to(idx)
	table.sync_gun(idx, state["chambers"], hole, _known)

func _act_eject() -> void:
	var live := int(state["last_eject"]) == RulesScript.LIVE
	table.sync_gun(int(state["index"]), state["chambers"], -1, _known)
	sfx.tick()
	var shell := table.drop_shell(live)
	var mesh := shell.mesh as CylinderMesh
	mesh.top_radius = 0.032
	mesh.bottom_radius = 0.032
	mesh.height = 0.07
	var start := Vector3(0.0, 0.95, 0.05)
	var land := Vector3(0.58, 0.8, 0.55)
	for i in 5:
		var t := float(i + 1) / 5.0
		shell.position = start.lerp(land, t)
		shell.rotation_degrees = Vector3(70.0 * t, 18.0 * float(i), 80.0 * t)
		await _beat()
	await _grab_shot()
	await get_tree().create_timer(0.4).timeout
	shell.queue_free()

func _act_shield(yours: bool) -> void:
	var hp := int(state["you_hp"] if yours else state["rival_hp"])
	table.paint_hot(yours, hp, true)
	sfx.tick()
	await _beat()
	await _grab_shot()
	await _beat()
	table.set_hp(yours, hp)

func _act_heal(yours: bool) -> void:
	var now := int(state["you_hp"] if yours else state["rival_hp"])
	var was := int(state.get("last_heal_from", now))
	table.set_hp(yours, was)
	await _beat()
	if now > was:
		table.paint_one(yours, was, true)
		await _beat()
		await _grab_shot()
		await _beat()
	else:
		table.paint_hot(yours, now, true)
		await _beat()
		await _grab_shot()
	table.set_hp(yours, now)

func _act_hush(yours: bool) -> void:
	if yours:
		await _hush_papers()
	else:
		table.set_cards_locked(true)
		await _beat()
		await _grab_shot()
		await _beat()

func _act_x2() -> void:
	var sparks: Array[MeshInstance3D] = []
	gun.cock(2)
	for n in 2:
		sfx.tick()
		var spark := MeshInstance3D.new()
		var quad := QuadMesh.new()
		quad.size = Vector2(0.08, 0.08)
		spark.mesh = quad
		spark.set_surface_override_material(0, _red)
		add_child(spark)
		var muzzle: Vector3 = gun.global_transform * gun.MUZZLE
		spark.global_position = muzzle + Vector3(-0.14 + 0.28 * float(n), 0.18, 0.02)
		sparks.append(spark)
		await _beat()
	await _grab_shot()
	await _beat()
	for spark in sparks:
		spark.queue_free()
	gun.uncock()

func _act_load(yours: bool) -> void:
	var hole := int(state.get("last_hole", -1))
	var idx := int(state["index"])
	var shell := _round_node(true)
	shell.global_position = Vector3(0.0, 1.05, 0.5)
	var start: Vector3 = shell.global_position
	if yours and hole >= 0:
		_known[hole] = 1
		await _yaw_to(hole)
		await _dolly(0.85)
		var into: Vector3 = table.hole_global(hole)
		start = shell.global_position
		for i in 4:
			shell.global_position = start.lerp(into, float(i + 1) / 4.0)
			await _beat()
		table.sync_gun(idx, state["chambers"], -1, _known, true)
		await _grab_shot()
		shell.queue_free()
		await get_tree().create_timer(0.2).timeout
		await _dolly(0.0)
		await _yaw_to(idx)
		table.sync_gun(idx, state["chambers"], -1, _known)
		return
	var dest := Vector3(0.0, 0.86, -0.2)
	for i in 4:
		shell.global_position = start.lerp(dest, float(i + 1) / 4.0)
		await _beat()
	sfx.tick()
	shell.queue_free()

func _act_shuffle() -> void:
	_known.fill(0)
	var idx := int(state["index"])
	table.sync_gun(idx, state["chambers"], -1, _known)
	await _dolly(0.7)
	var base := -float(idx) * 45.0
	for i in 8:
		table.set_drum_yaw(base - float(i + 1) * 45.0)
		sfx.tick()
		if i == 3:
			await _grab_shot()
		await _beat()
	await _dolly(0.0)
	table.sync_gun(idx, state["chambers"], -1, _known)

func _act_steal(yours: bool, slot: int) -> void:
	var stolen := int(state.get("last_steal", -1))
	var dst := int(state.get("last_steal_slot", slot))
	var src := int(state.get("last_steal_from", 0))
	if stolen < 0:
		await _beat()
		return
	if not yours:
		if src >= 0 and src < table.hand_count():
			var card := table.hand_node(src)
			var start: Vector3 = card.global_position
			var end := _rival_home + Vector3(0.0, 1.15, 0.36)
			for i in 6:
				card.global_position = start.lerp(end, float(i + 1) / 6.0)
				await _beat()
			await _grab_shot()
		return
	var ghost := _icon_quad(stolen)
	var face := ghost.mesh as QuadMesh
	face.size = Vector2(0.15, 0.2)
	var start := _rival_home + Vector3(0.0, 1.15, 0.36)
	var end := table.hand_home_global(dst)
	ghost.global_position = start
	for i in 6:
		ghost.global_position = start.lerp(end, float(i + 1) / 6.0)
		await _beat()
	await _grab_shot()
	ghost.queue_free()

func _act_last(yours: bool) -> void:
	await _stutter_lamps(not yours)
	await _grab_shot()

func _act_fate() -> void:
	var idx := int(state["index"])
	if idx >= 0 and idx < _known.size():
		_known[idx] = 0
	table.sync_gun(idx, state["chambers"], -1, _known)
	var coin := MeshInstance3D.new()
	var face := QuadMesh.new()
	face.size = Vector2(0.14, 0.14)
	coin.mesh = face
	add_child(coin)
	coin.global_position = Vector3(0.0, 1.08, 0.2)
	for i in 4:
		coin.set_surface_override_material(0, table.round_material(i % 2 == 0))
		coin.rotation_degrees.z = 18.0 * float(i)
		if i == 0:
			await _grab_shot()
		await _beat()
	coin.queue_free()

func _stutter_lamps(yours: bool) -> void:
	var hp := int(state["you_hp"] if yours else state["rival_hp"])
	for i in 2:
		table.set_hp(yours, 0)
		if i == 0:
			await _grab_shot()
		await _beat()
		table.set_hp(yours, hp)
		await _beat()

func _hush_papers() -> void:
	var papers: Array[MeshInstance3D] = []
	var paper := _flat_mat(Color("c8bfa8"))
	var dark := _flat_mat(Color("2e333a"))
	for i in 4:
		var quad := MeshInstance3D.new()
		var face := QuadMesh.new()
		face.size = Vector2(0.14, 0.18)
		quad.mesh = face
		quad.set_surface_override_material(0, paper)
		add_child(quad)
		quad.global_position = _rival_home + Vector3(-0.24 + float(i) * 0.16, 1.12, 0.46)
		papers.append(quad)
	await _beat()
	for quad in papers:
		quad.set_surface_override_material(0, dark)
	await _grab_shot()
	await _beat()
	await _beat()
	for quad in papers:
		quad.queue_free()

func _dolly(distance: float) -> void:
	var forward := -camera.global_transform.basis.z
	var goal := _cam_home + forward * distance
	var start := camera.position
	for i in 4:
		camera.position = start.lerp(goal, float(i + 1) / 4.0)
		await _beat()

func _yaw_to(chamber: int) -> void:
	var target := -float(chamber) * 45.0
	var start := table.drum_yaw()
	for i in 3:
		table.set_drum_yaw(lerpf(start, target, float(i + 1) / 3.0))
		sfx.tick()
		await _beat()

func _round_node(live: bool) -> MeshInstance3D:
	var shell := MeshInstance3D.new()
	var mesh := CylinderMesh.new()
	mesh.top_radius = 0.018
	mesh.bottom_radius = 0.018
	mesh.height = 0.042
	shell.mesh = mesh
	shell.set_surface_override_material(0, table.round_material(live))
	add_child(shell)
	return shell

func _icon_quad(id: int) -> MeshInstance3D:
	var ghost := MeshInstance3D.new()
	var face := QuadMesh.new()
	face.size = Vector2(0.12, 0.16)
	ghost.mesh = face
	ghost.set_surface_override_material(0, table.card_material(id))
	add_child(ghost)
	return ghost

func _flat_mat(color: Color) -> StandardMaterial3D:
	var mat := StandardMaterial3D.new()
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mat.cull_mode = BaseMaterial3D.CULL_DISABLED
	mat.albedo_color = color
	return mat

func _grab_shot() -> void:
	if _shot_taken:
		return
	var path := OS.get_environment("ROLET_SHOT")
	if path == "":
		return
	_shot_taken = true
	await get_tree().process_frame
	await RenderingServer.frame_post_draw
	get_viewport().get_texture().get_image().save_png(path)

func _capture_play(kind: String) -> void:
	state = rules.new_state(3)
	state["your_turn"] = true
	_set_chamber0(RulesScript.BLANK if kind == "blank" else RulesScript.LIVE)
	if kind == "block":
		state["blocker"] = 2
	elif kind == "guard":
		state["blocker"] = 1
	_refresh()
	if kind == "his":
		state["your_turn"] = false
		_hold_scale = Vector3(1.35, 1.35, 1.35)
		gun.transform = _rival_chin_xf()
		gun.scale = _hold_scale
		var shot := rules.pull(state, true)
		await _present_shot(false, RulesScript.LIVE, shot)
		await _play_report()
		return
	_reparent_keep(camera)
	_hold_scale = Vector3.ONE
	if kind == "block":
		gun.transform = _rival_xf()
		aim_self = false
		_aim_at = "rival"
	else:
		gun.transform = _self_xf()
		aim_self = true
		_aim_at = "self"
	gun.scale = Vector3.ONE
	held_base = gun.transform
	phase = "held"
	await _fire()

func _set_chamber0(round: int) -> void:
	state["chambers"][0] = round
	state["index"] = 0
	var live := 0
	var blank := 0
	for c in state["chambers"]:
		if int(c) == RulesScript.LIVE:
			live += 1
		elif int(c) == RulesScript.BLANK:
			blank += 1
	state["live_n"] = live
	state["blank_n"] = blank

func _play_report() -> void:
	print("PLAY %s turn=%s you=%s rival=%s blocker=%s" % [
		_play_kind,
		str(bool(state["your_turn"])),
		str(int(state["you_hp"])),
		str(int(state["rival_hp"])),
		str(int(state["blocker"])),
	])
	if not _shot_taken:
		await _grab_shot()
	get_tree().quit()

func _capture_card(card_name: String) -> void:
	state = rules.new_state(7)
	state["your_turn"] = true
	var id := _card_name_id(card_name)
	state["you_hand"] = [id, RulesScript.EYE, RulesScript.HUSH, RulesScript.SHIELD]
	state["rival_hand"] = [RulesScript.SHUFFLE, RulesScript.X2, RulesScript.HEAL, RulesScript.STEAL]
	if card_name == "heal":
		state["you_hp"] = 2
	elif card_name == "last":
		state["you_hp"] = 1
	elif card_name == "load":
		state["chambers"][3] = RulesScript.EMPTY
		state["live_n"] = 4
	_known.fill(0)
	_refresh()
	if rules.play(state, true, 0) != "ok":
		push_error("card capture failed %s" % card_name)
		get_tree().quit(1)
		return
	await _card_fx(id, true, 0)
	if not _shot_taken:
		await _grab_shot()
	get_tree().quit()

func _card_name_id(card_name: String) -> int:
	match card_name:
		"load":
			return RulesScript.LOAD
		"eye":
			return RulesScript.EYE
		"hush":
			return RulesScript.HUSH
		"shield":
			return RulesScript.SHIELD
		"eject":
			return RulesScript.EJECT
		"shuffle":
			return RulesScript.SHUFFLE
		"x2":
			return RulesScript.X2
		"heal":
			return RulesScript.HEAL
		"steal":
			return RulesScript.STEAL
		"peek":
			return RulesScript.PEEK
		"last":
			return RulesScript.LAST
		_:
			return RulesScript.FATE

func _rival_load() -> void:
	phase = "act"
	table.set_cards_locked(true)
	_hold_scale = Vector3(2.2, 2.2, 2.2)
	await _step_to(self, _load_xf(), 6, 1.2)
	for _i in 8:
		table.nudge_spin()
		sfx.tick()
		await get_tree().create_timer(0.4).timeout
	await _drop()

func _load_xf() -> Transform3D:
	# Sideways in his hand, across the cylinder. The order stays hidden.
	var origin := _rival_home + Vector3(-0.22, 0.92, 0.32)
	var dir := Vector3(1.0, -0.2, 0.35).normalized()
	return Transform3D(_basis_rolled(dir, Vector3(0.0, 0.2, 1.0)), origin)

func _refresh() -> void:
	if state.is_empty():
		return
	your_turn = bool(state["your_turn"])
	you = int(state["you_hp"])
	rival_hp = int(state["rival_hp"])
	over = bool(state["over"])
	table.set_hp(true, you)
	table.set_hp(false, rival_hp)
	var show_reveal := your_turn and int(state["revealed"]) >= 0
	table.sync_gun(int(state["index"]), state["chambers"], int(state["revealed"]) if show_reveal else -1, _known)
	table.show_hand(state["you_hand"])
	var locked := phase != "table" or not your_turn or int(state["silence"]) == 1
	table.set_cards_locked(locked)

func _settle_bodies() -> void:
	if int(state["rival_hp"]) <= 0:
		rival.position = _rival_home + Vector3(0.0, -0.55, -0.15)
		rival.rotation_degrees.x = -75.0

func _rival_turn() -> void:
	while not bool(state["your_turn"]) and not bool(state["over"]):
		moving = true
		phase = "act"
		table.set_cards_locked(true)
		if int(state["skip"]) == 2:
			await _stutter_lamps(false)
			rules.pull(state, false)
			_refresh()
			break
		if int(state["silence"]) == 2:
			await _hush_papers()
		if int(state["silence"]) != 2:
			for s in 4:
				var hand: Array = state["rival_hand"]
				if int(hand[s]) < 0:
					continue
				var id := int(hand[s])
				if rules.play(state, false, s) == "ok":
					await _card_fx(id, false, -1)
					break
		if bool(state["over"]):
			break
		var idx := int(state["index"])
		var chambers: Array = state["chambers"]
		if not rules.has_round_ahead(state):
			rules.refill(state)
			_known.fill(0)
			await _show_tray()
			await _rival_load()
			_refresh()
			continue
		var round := int(chambers[idx])
		var shoots_self := randf() < 0.4
		var before := int(state["live_n"]) + int(state["blank_n"])
		gun.uncock()
		_hold_scale = Vector3(2.2, 2.2, 2.2)
		await _step_to(self, _rival_hold_xf(), 5, 0.8)
		if shoots_self:
			_hold_scale = Vector3(1.35, 1.35, 1.35)
			await _step_to(self, _rival_chin_xf(), 4, 0.6)
			gun.cock(1)
			await _beat()
			gun.cock(2)
			await _beat()
		else:
			await _step_to(self, _rival_at_us_xf(), 5, 0.7)
			await _cock_hammer()
		var shot := rules.pull(state, shoots_self)
		var reloaded := shot == "ok" and int(state["index"]) == 0 and int(state["live_n"]) == 5 and before <= 1
		await _present_shot(not shoots_self, round, shot)
		if shot == "ok" and shoots_self and round != RulesScript.LIVE:
			await _rattle()
		if reloaded and not bool(state["over"]):
			_known.fill(0)
			await _show_tray()
			await _rival_load()
		_refresh()
		if bool(state["your_turn"]) or bool(state["over"]):
			break
	await _drop()
	_refresh()
	if bool(state["over"]):
		over = true
		phase = "over"
		moving = false
		_settle_bodies()
		return
	phase = "table"
	moving = false
	_refresh()

func _blackout() -> void:
	_flash.color = Color(1, 1, 1, 1)
	await _beat()
	_flash.color = Color(0, 0, 0, 1)
	await _grab_shot()
	await get_tree().create_timer(1.7).timeout
	_flash.color = Color(0, 0, 0, 0)

func _kick(amount: float) -> void:
	camera.position = _cam_home + Vector3(amount, -amount * 0.35, 0)
	await _beat()
	camera.position = _cam_home + Vector3(-amount * 0.5, amount * 0.2, 0)
	await _beat()
	camera.position = _cam_home

func _cock_hammer() -> void:
	gun.cock(1)
	await _beat()
	gun.cock(2)
	await _beat()
	await get_tree().create_timer(0.3).timeout

func _tear(card: MeshInstance3D) -> void:
	var origin: Vector3 = card.global_position
	var mat: Material = card.get_surface_override_material(0)
	card.visible = false
	var scraps: Array[MeshInstance3D] = []
	for half in [-1, 1]:
		var scrap := MeshInstance3D.new()
		var face := QuadMesh.new()
		face.size = Vector2(0.07, 0.18)
		scrap.mesh = face
		if mat != null:
			scrap.set_surface_override_material(0, mat)
		add_child(scrap)
		scrap.global_position = origin + Vector3(0.03 * float(half), 0.0, 0.0)
		scraps.append(scrap)
	sfx.tear()
	for i in 4:
		for s in 2:
			var dir := -1 if s == 0 else 1
			scraps[s].global_position = origin + Vector3(0.045 * float(dir) * float(i + 1), -0.035 * float(i + 1), 0.02)
			scraps[s].rotation_degrees.z = 14.0 * float(dir) * float(i + 1)
		await _beat()
		if i == 1 and OS.get_environment("ROLET_BEAT") == "tear":
			await _shot_now()
	for scrap in scraps:
		scrap.queue_free()

func _smoke() -> void:
	var bits: Array[MeshInstance3D] = []
	var mat := _bone_mat()
	var muzzle: Vector3 = gun.global_transform * gun.MUZZLE
	var along := gun.global_transform.basis.x
	var up := gun.global_transform.basis.y
	var side := gun.global_transform.basis.z
	for i in 3:
		for bit in bits:
			bit.queue_free()
		bits.clear()
		var span := 0.022 + float(i) * 0.008
		var reach := 0.018 + float(i) * 0.01
		var ring: Array[Vector3] = [up, -up, side, -side]
		for dir in ring:
			var puff := MeshInstance3D.new()
			var mesh := QuadMesh.new()
			mesh.size = Vector2(span, span)
			puff.mesh = mesh
			puff.set_surface_override_material(0, mat)
			add_child(puff)
			puff.global_position = muzzle + along * 0.035 + dir * reach
			if puff.global_position.distance_squared_to(camera.global_position) > 0.01:
				puff.look_at(camera.global_position, Vector3.UP)
			bits.append(puff)
		await _beat()
		if i == 1 and OS.get_environment("ROLET_BEAT") == "smoke":
			await _shot_now()
	await _beat()
	for bit in bits:
		bit.queue_free()

func _muzzle_flash() -> void:
	var flash := MeshInstance3D.new()
	var mesh := QuadMesh.new()
	mesh.size = Vector2(0.16, 0.16)
	flash.mesh = mesh
	flash.set_surface_override_material(0, _sodium_mat())
	add_child(flash)
	var muzzle: Vector3 = gun.global_transform * gun.MUZZLE
	flash.global_position = muzzle
	flash.look_at(camera.global_position, Vector3.UP)
	await _beat()
	await _beat()
	flash.queue_free()

func _splatter() -> void:
	var bits: Array[MeshInstance3D] = []
	for i in 3:
		var bit := MeshInstance3D.new()
		var mesh := QuadMesh.new()
		mesh.size = Vector2(0.07, 0.05)
		bit.mesh = mesh
		bit.position = Vector3(randf_range(-0.18, 0.18), randf_range(-0.04, 0.14), -0.42)
		bit.set_surface_override_material(0, _red_mat())
		camera.add_child(bit)
		bits.append(bit)
		await _beat()
	await _beat()
	for bit in bits:
		bit.queue_free()

func _throw_rival(stay_down: bool) -> void:
	for i in 4:
		rival.position = _rival_home + Vector3(0.0, -0.05 * float(i), -0.12 * float(i + 1))
		rival.rotation_degrees.x = -7.0 * float(i + 1)
		await _beat()
	await _grab_shot()
	if stay_down:
		rival.position = _rival_home + Vector3(0.0, -0.55, -0.15)
		rival.rotation_degrees.x = -75.0
		return
	await get_tree().create_timer(2.0).timeout
	for i in 4:
		var t := float(4 - i) / 4.0
		rival.position = _rival_home + Vector3(0.0, -0.15 * t, -0.36 * t)
		rival.rotation_degrees.x = -21.0 * t
		await _beat()
	rival.position = _rival_home
	rival.rotation_degrees = Vector3.ZERO

func _rattle() -> void:
	var home := rival.rotation_degrees
	rival.rotation_degrees.z = 4.0
	await _beat()
	rival.rotation_degrees.z = -4.0
	await _beat()
	rival.rotation_degrees = home

func _beat() -> void:
	await get_tree().create_timer(1.0 / 12.0).timeout

func _shot_now() -> void:
	await get_tree().process_frame
	await RenderingServer.frame_post_draw
	var path := OS.get_environment("ROLET_SHOT")
	if path != "":
		get_viewport().get_texture().get_image().save_png(path)

func _capture(beat: String) -> void:
	state = rules.new_state(1)
	state["your_turn"] = true
	_refresh()
	if beat == "tear":
		var card := table.hand_node(0)
		card.position = Vector3(0.0, 1.02, 0.62)
		await _tear(card)
	elif beat == "smoke":
		_reparent_keep(camera)
		_hold_scale = Vector3.ONE
		gun.transform = _rival_xf()
		gun.scale = Vector3.ONE
		await _smoke()
	get_tree().quit()

func _bone_mat() -> StandardMaterial3D:
	var mat := StandardMaterial3D.new()
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mat.cull_mode = BaseMaterial3D.CULL_DISABLED
	mat.albedo_color = Color("e6e1d6")
	return mat

func _build_flash() -> void:
	var layer := CanvasLayer.new()
	_flash = ColorRect.new()
	_flash.color = Color(0, 0, 0, 0)
	_flash.set_anchors_preset(Control.PRESET_FULL_RECT)
	_flash.mouse_filter = Control.MOUSE_FILTER_IGNORE
	layer.add_child(_flash)
	add_child(layer)
	_red = _red_mat()

func _red_mat() -> StandardMaterial3D:
	var mat := StandardMaterial3D.new()
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mat.cull_mode = BaseMaterial3D.CULL_DISABLED
	mat.albedo_color = Color("d2462b")
	return mat

func _sodium_mat() -> StandardMaterial3D:
	var mat := StandardMaterial3D.new()
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mat.cull_mode = BaseMaterial3D.CULL_DISABLED
	mat.albedo_color = Color("d9963a")
	return mat

func _rival_hold_xf() -> Transform3D:
	# Right hand, in front of the chest, barrel still low.
	return Transform3D(_basis_along_x(Vector3(0.15, 0.05, 1.0).normalized()), _rival_home + Vector3(0.16, 0.96, 0.24))

func _rival_chin_xf() -> Transform3D:
	# Muzzle sits under the head. Barrel comes up from the chest. Grip hangs down.
	var muzzle_at := _rival_home + Vector3(0.0, 1.33, 0.22)
	var dir := Vector3(0.05, 1.0, 0.42).normalized()
	var up := Vector3(0.0, 0.15, 1.0).normalized()
	return _place_muzzle(muzzle_at, dir, up)

func _rival_at_us_xf() -> Transform3D:
	# On the chest, three-quarter view, barrel toward the camera.
	var origin := _rival_home + Vector3(0.16, 0.98, 0.26)
	var to_cam := camera.global_position - origin
	var barrel := (to_cam + Vector3(-0.55, 0.0, 0.0)).normalized()
	return Transform3D(_basis_rolled(barrel, Vector3(0, 0.25, 1).normalized()), origin)

func _place_muzzle(muzzle_at: Vector3, dir: Vector3, up: Vector3) -> Transform3D:
	var reach := gun.MUZZLE.length() * _hold_scale.x
	var d := dir.normalized()
	var origin := muzzle_at - d * reach
	return Transform3D(_basis_rolled(d, up), origin)

func _aim_rolled(origin: Vector3, target: Vector3, up: Vector3) -> Transform3D:
	var reach := gun.MUZZLE * _hold_scale.x
	var aim := (target - origin).normalized()
	var xf := Transform3D(_basis_rolled(aim, up), origin)
	for _i in 4:
		var muzzle: Vector3 = origin + xf.basis * reach
		aim = (target - muzzle).normalized()
		xf = Transform3D(_basis_rolled(aim, up), origin)
	return xf

func _aim_from(origin: Vector3, target: Vector3) -> Transform3D:
	var xf := Transform3D(_basis_along_x(Vector3(0, 0, 1)), origin)
	for _i in 4:
		var muzzle: Vector3 = xf.origin + xf.basis * gun.MUZZLE
		var dir: Vector3 = (target - muzzle).normalized()
		xf = Transform3D(_basis_along_x(dir), origin)
	return xf

func _basis_along_x(dir: Vector3) -> Basis:
	var x := dir.normalized()
	var z := x.cross(Vector3.UP)
	if z.length_squared() < 0.0001:
		z = x.cross(Vector3.RIGHT)
	z = z.normalized()
	var y := z.cross(x).normalized()
	return Basis(x, y, z)
