extends Node3D

const PixelsScript := preload("res://scripts/pixels.gd")

signal card_pressed(slot: int)

## Eight holes on the table cylinder. One thin ring marks the current hole.

func _ready() -> void:
	var pixels: PixelsScript = PixelsScript.new()
	var wood: Material = pixels.wood()
	for part in ["Top", "LegFL", "LegFR", "LegBL", "LegBR"]:
		(_get_mesh(part) as MeshInstance3D).set_surface_override_material(0, wood)
	($Cylinder as MeshInstance3D).set_surface_override_material(0, pixels.metal())
	var cards: Array[String] = ["Card0", "Card1", "Card2", "Card3"]
	var icons: Array[Material] = [pixels.eye_card(), pixels.shield_card(), pixels.heal_card(), pixels.hush_card()]
	var fan: Array[float] = [-12.0, -4.0, 4.0, 12.0]
	for i in cards.size():
		var card := _get_mesh(cards[i]) as MeshInstance3D
		var face := QuadMesh.new()
		face.size = Vector2(0.15, 0.2)
		card.mesh = face
		card.scale = Vector3.ONE
		card.position.y = 0.86
		card.rotation_degrees = Vector3(0.0, fan[i], 0.0)
		card.set_surface_override_material(0, icons[i])
	for i in 4:
		(_get_mesh("LampNear%d" % i) as MeshInstance3D).set_surface_override_material(0, pixels.lamp_sodium())
		(_get_mesh("LampFar%d" % i) as MeshInstance3D).set_surface_override_material(0, pixels.lamp_red())
	_pixels = pixels
	_bore_mat = pixels.bore()
	_near_on = pixels.lamp_sodium()
	_far_on = pixels.lamp_red()
	_lamp_off = pixels.lamp_off()
	_x_mat = pixels.flat(Color("e6e1d6"))
	_live_mat = pixels.flat(Color("d2462b"))
	_blank_mat = pixels.flat(Color("3f7f74"))
	_drum = $Cylinder
	var front := 0
	var front_z := -999.0
	for i in 8:
		var a := i * TAU / 8.0
		var hole := MeshInstance3D.new()
		var mesh := CylinderMesh.new()
		mesh.top_radius = 0.022
		mesh.bottom_radius = 0.022
		mesh.height = 0.012
		hole.mesh = mesh
		hole.set_surface_override_material(0, _bore_mat)
		hole.position = Vector3(cos(a) * 0.075, 0.026, sin(a) * 0.075)
		_drum.add_child(hole)
		_holes.append(hole)
		if hole.position.z > front_z:
			front_z = hole.position.z
			front = i
	_front = front
	var ring := MeshInstance3D.new()
	var ring_mesh := CylinderMesh.new()
	ring_mesh.top_radius = 0.032
	ring_mesh.bottom_radius = 0.032
	ring_mesh.height = 0.008
	ring.mesh = ring_mesh
	ring.set_surface_override_material(0, pixels.flat(Color("e6e1d6")))
	ring.position = _drum.position + _holes[front].position + Vector3(0, -0.01, 0)
	add_child(ring)
	_build_tray(pixels)
	_bind_cards()

var _pixels: PixelsScript
var _drum: MeshInstance3D
var _holes: Array[MeshInstance3D] = []
var _bore_mat: Material
var _near_on: Material
var _far_on: Material
var _lamp_off: Material
var _x_mat: Material
var _front := 0
var _fired := 0
var _tray: Node3D
var _hand: Array[MeshInstance3D] = []
var _hand_home: Array[Transform3D] = []
var _locked := false
var _live_mat: Material
var _blank_mat: Material

func set_hp(yours: bool, hp: int) -> void:
	for i in 4:
		var node_name := "LampNear%d" % i if yours else "LampFar%d" % i
		var mat: Material = _lamp_off
		if i < hp:
			mat = _near_on if yours else _far_on
		(_get_mesh(node_name) as MeshInstance3D).set_surface_override_material(0, mat)

func spend_and_click() -> void:
	var hole: MeshInstance3D = _holes[(_front + _fired) % 8]
	hole.set_surface_override_material(0, _lamp_off)
	_stamp_x(hole)
	_fired += 1
	_drum.rotation_degrees.y = -float(_fired) * 45.0

func reset_cylinder() -> void:
	_fired = 0
	_drum.rotation_degrees.y = 0.0
	for hole in _holes:
		hole.set_surface_override_material(0, _bore_mat)
		for child in hole.get_children():
			child.queue_free()

func nudge_spin() -> void:
	_drum.rotation_degrees.y -= 45.0

func paint_hot(yours: bool, hp: int, hot: bool) -> void:
	for i in 4:
		var node_name := "LampNear%d" % i if yours else "LampFar%d" % i
		var mat: Material = _lamp_off
		if i < hp:
			mat = _x_mat if hot else (_near_on if yours else _far_on)
		(_get_mesh(node_name) as MeshInstance3D).set_surface_override_material(0, mat)

func paint_one(yours: bool, index: int, hot: bool) -> void:
	if index < 0 or index > 3:
		return
	var node_name := "LampNear%d" % index if yours else "LampFar%d" % index
	var mat: Material = _x_mat if hot else (_near_on if yours else _far_on)
	(_get_mesh(node_name) as MeshInstance3D).set_surface_override_material(0, mat)

func drum_yaw() -> float:
	return _drum.rotation_degrees.y

func set_drum_yaw(degrees: float) -> void:
	_drum.rotation_degrees.y = degrees

func hole_global(chamber: int) -> Vector3:
	var slot := posmod(_front - chamber, 8)
	return _holes[slot].global_position

func hand_home_global(slot: int) -> Vector3:
	if slot < 0 or slot >= _hand_home.size():
		return global_position
	return to_global(_hand_home[slot].origin)

func card_material(id: int) -> Material:
	return _pixels.card(id)

func round_material(live: bool) -> Material:
	if live:
		return _live_mat
	return _pixels.flat(Color("2e333a"))

func set_tray(height: float) -> void:
	if _tray != null:
		_tray.position.y = height

func _stamp_x(hole: MeshInstance3D) -> void:
	for ang in [40.0, -40.0]:
		var bar := MeshInstance3D.new()
		var mesh := BoxMesh.new()
		mesh.size = Vector3(0.028, 0.004, 0.006)
		bar.mesh = mesh
		bar.position = Vector3(0, 0.012, 0)
		bar.rotation_degrees = Vector3(0, ang, 0)
		bar.set_surface_override_material(0, _x_mat)
		hole.add_child(bar)

func _build_tray(pixels: PixelsScript) -> void:
	_tray = Node3D.new()
	_tray.name = "Tray"
	_tray.position = Vector3(0.0, 0.55, -0.02)
	add_child(_tray)
	var plate := MeshInstance3D.new()
	var plate_mesh := BoxMesh.new()
	plate_mesh.size = Vector3(0.46, 0.015, 0.1)
	plate.mesh = plate_mesh
	plate.position = Vector3(0, 0.01, 0)
	plate.set_surface_override_material(0, pixels.metal_dark())
	_tray.add_child(plate)
	for i in 8:
		var round := MeshInstance3D.new()
		var mesh := CylinderMesh.new()
		mesh.top_radius = 0.016
		mesh.bottom_radius = 0.016
		mesh.height = 0.045
		round.mesh = mesh
		round.position = Vector3(-0.175 + float(i) * 0.05, 0.04, 0)
		var color := Color("d2462b") if i < 5 else Color("2e333a")
		round.set_surface_override_material(0, pixels.flat(color))
		_tray.add_child(round)

func show_hand(ids: Array) -> void:
	for i in mini(4, _hand.size()):
		var card := _hand[i]
		if i < _hand_home.size():
			card.transform = _hand_home[i]
		var id := int(ids[i]) if i < ids.size() else -1
		if id < 0:
			card.visible = false
			_card_body(card, false)
			continue
		card.visible = true
		_card_body(card, true)
		card.set_surface_override_material(0, _pixels.card(id))
		_tint(card, _locked)

func set_cards_locked(locked: bool) -> void:
	_locked = locked
	for card in _hand:
		_tint(card, locked)

func sync_gun(index: int, chambers: Array, revealed: int, known: Array = [], lock_yaw: bool = false) -> void:
	if not lock_yaw:
		_drum.rotation_degrees.y = -float(index) * 45.0
	for i in _holes.size():
		var slot := posmod(_front - i, 8)
		var hole := _holes[slot]
		var marks: Array[Node] = []
		for child in hole.get_children():
			if child is MeshInstance3D:
				marks.append(child)
		for child in marks:
			hole.remove_child(child)
			child.free()
		var round := int(chambers[i]) if i < chambers.size() else 0
		var marked := int(known[i]) if i < known.size() else 0
		if round == 0:
			hole.set_surface_override_material(0, _lamp_off)
			_stamp_x(hole)
		elif i == revealed or (marked != 0 and marked == round):
			hole.set_surface_override_material(0, _live_mat if round == 1 else _blank_mat)
		else:
			hole.set_surface_override_material(0, _bore_mat)

func drop_shell(live: bool) -> MeshInstance3D:
	var shell := MeshInstance3D.new()
	var mesh := CylinderMesh.new()
	mesh.top_radius = 0.02
	mesh.bottom_radius = 0.02
	mesh.height = 0.05
	shell.mesh = mesh
	shell.position = Vector3(0.22, 0.8, 0.22)
	shell.rotation_degrees = Vector3(0, 0, 80)
	shell.set_surface_override_material(0, _live_mat if live else _pixels.flat(Color("2e333a")))
	add_child(shell)
	return shell

func _card_body(card: MeshInstance3D, on: bool) -> void:
	for child in card.get_children():
		if child is StaticBody3D:
			(child as StaticBody3D).collision_layer = 1 if on else 0

func hand_count() -> int:
	return _hand.size()

func hand_node(slot: int) -> MeshInstance3D:
	return _hand[slot]

func _bind_cards() -> void:
	for i in 4:
		var card := _get_mesh("Card%d" % i) as MeshInstance3D
		_hand.append(card)
		_hand_home.append(card.transform)
		var body := StaticBody3D.new()
		var shape := CollisionShape3D.new()
		var box := BoxShape3D.new()
		box.size = Vector3(0.15, 0.2, 0.04)
		shape.shape = box
		body.add_child(shape)
		body.set_meta("slot", i)
		card.add_child(body)

func _on_card_input(_camera: Node, event: InputEvent, _pos: Vector3, _normal: Vector3, _shape_idx: int, slot: int) -> void:
	if _locked:
		return
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		card_pressed.emit(slot)

func _tint(card: MeshInstance3D, locked: bool) -> void:
	var mat := card.get_surface_override_material(0)
	if mat is ShaderMaterial:
		mat.set_shader_parameter("tint", Vector3(0.35, 0.35, 0.35) if locked else Vector3.ONE)

func _get_mesh(node_name: String) -> Node:
	return get_node(NodePath(node_name))

func _mat(color: Color) -> StandardMaterial3D:
	var mat := StandardMaterial3D.new()
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mat.albedo_color = color
	return mat
