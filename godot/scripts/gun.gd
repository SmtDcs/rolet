extends Node3D

## Block revolver. Barrel lies on local +X. The bore is a real tube,
## open at the muzzle, capped black at the breech.

const MUZZLE := Vector3(0.26, 0.062, 0)
const PixelsScript := preload("res://scripts/pixels.gd")

var _pick: StaticBody3D
var _pixels: PixelsScript
var _hammer: MeshInstance3D
var _hammer_rest: Vector3

func _ready() -> void:
	_pixels = PixelsScript.new()
	var metal: Material = _pixels.metal()
	var dark: Material = _pixels.metal_dark()
	_box("Grip", Vector3(0.05, 0.11, 0.04), Vector3(-0.06, 0.02, 0), metal)
	_box("Frame", Vector3(0.1, 0.045, 0.04), Vector3(-0.03, 0.05, 0), metal)
	_box("Hammer", Vector3(0.018, 0.04, 0.016), Vector3(-0.045, 0.085, 0), dark)
	_hammer = get_node("Hammer") as MeshInstance3D
	_hammer_rest = _hammer.position
	_cylinder("Drum", 0.046, 0.07, Vector3(-0.01, 0.055, 0), dark)
	var barrel := MeshInstance3D.new()
	barrel.name = "Barrel"
	barrel.mesh = _bore_mesh(0.2, 0.026, 0.017, 8)
	barrel.position = Vector3(0.06, 0.062, 0)
	add_child(barrel)
	_pick = StaticBody3D.new()
	_pick.name = "Pick"
	var shape := CollisionShape3D.new()
	var box := BoxShape3D.new()
	box.size = Vector3(0.38, 0.18, 0.14)
	shape.shape = box
	shape.position = Vector3(0.08, 0.04, 0)
	_pick.add_child(shape)
	add_child(_pick)

func set_pick_enabled(on: bool) -> void:
	if _pick != null:
		_pick.collision_layer = 1 if on else 0

## step 0 rests, 1 is half, 2 is fully back. Positive Z tips the spur
## away from the barrel (+X) without moving the rest pose.
func cock(step: int) -> void:
	if _hammer == null:
		return
	var ang := 0.0
	var out := 0.0
	if step == 1:
		ang = 28.0
		out = 0.02
	elif step >= 2:
		ang = 52.0
		out = 0.045
	_hammer.rotation_degrees = Vector3(0.0, 0.0, ang)
	_hammer.position = _hammer_rest + Vector3(-out, out * 0.45, 0.0)
	_hammer.scale = Vector3(1.0, 1.8, 1.0)

func uncock() -> void:
	if _hammer == null:
		return
	_hammer.rotation_degrees = Vector3.ZERO
	_hammer.position = _hammer_rest
	_hammer.scale = Vector3.ONE

func _box(node_name: String, size: Vector3, at: Vector3, mat: Material) -> void:
	var mesh := BoxMesh.new()
	mesh.size = size
	var node := MeshInstance3D.new()
	node.name = node_name
	node.mesh = mesh
	node.position = at
	node.set_surface_override_material(0, mat)
	add_child(node)

func _cylinder(node_name: String, radius: float, length: float, at: Vector3, mat: Material) -> void:
	var mesh := CylinderMesh.new()
	mesh.top_radius = radius
	mesh.bottom_radius = radius
	mesh.height = length
	mesh.radial_segments = 8
	var node := MeshInstance3D.new()
	node.name = node_name
	node.mesh = mesh
	node.position = at
	node.rotation_degrees = Vector3(0, 0, -90)
	node.set_surface_override_material(0, mat)
	add_child(node)

func _mat(color: Color) -> StandardMaterial3D:
	var mat := StandardMaterial3D.new()
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mat.albedo_color = color
	return mat

## Tube along +X from 0 to length. Muzzle annulus is at +X. Bore tapers inward.
func _bore_mesh(length: float, r_out: float, r_in: float, sides: int) -> ArrayMesh:
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var metal := Color(1, 1, 1, 1)
	var bore := Color(0, 0, 0, 1)
	var r_breech := r_in * 0.55
	for i in sides:
		var a0 := TAU * float(i) / float(sides)
		var a1 := TAU * float(i + 1) / float(sides)
		var y0 := cos(a0)
		var z0 := sin(a0)
		var y1 := cos(a1)
		var z1 := sin(a1)
		var o00 := Vector3(0.0, y0 * r_out, z0 * r_out)
		var o01 := Vector3(0.0, y1 * r_out, z1 * r_out)
		var o10 := Vector3(length, y0 * r_out, z0 * r_out)
		var o11 := Vector3(length, y1 * r_out, z1 * r_out)
		var i00 := Vector3(0.0, y0 * r_breech, z0 * r_breech)
		var i01 := Vector3(0.0, y1 * r_breech, z1 * r_breech)
		var i10 := Vector3(length, y0 * r_in, z0 * r_in)
		var i11 := Vector3(length, y1 * r_in, z1 * r_in)
		_tri(st, o00, o10, o11, metal)
		_tri(st, o00, o11, o01, metal)
		_tri(st, i00, i11, i10, bore)
		_tri(st, i00, i01, i11, bore)
		_tri(st, o10, i10, i11, metal)
		_tri(st, o10, i11, o11, metal)
		_tri(st, o00, o01, i01, bore)
		_tri(st, o00, i01, i00, bore)
		var cap := 0.04
		var c0 := Vector3(cap, y0 * r_breech, z0 * r_breech)
		var c1 := Vector3(cap, y1 * r_breech, z1 * r_breech)
		var hub := Vector3(cap, 0.0, 0.0)
		_tri(st, hub, c1, c0, bore)
	var mat: ShaderMaterial = _pixels.metal()
	st.generate_normals()
	var mesh := st.commit()
	mesh.surface_set_material(0, mat)
	return mesh

func _tri(st: SurfaceTool, a: Vector3, b: Vector3, c: Vector3, color: Color) -> void:
	for p in [a, b, c]:
		st.set_color(color)
		st.set_uv(Vector2(clampf(p.x / 0.2, 0.0, 1.0), atan2(p.z, p.y) / TAU + 0.5))
		st.add_vertex(p)
