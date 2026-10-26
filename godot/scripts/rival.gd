extends Node3D

const PixelsScript := preload("res://scripts/pixels.gd")

## Cylinder head. Same atlas as the table and the gun.

func _ready() -> void:
	var pixels: PixelsScript = PixelsScript.new()
	($Coat as MeshInstance3D).set_surface_override_material(0, pixels.coat())
	var head := $Head as MeshInstance3D
	head.rotation_degrees = Vector3(90, 0, 0)
	head.set_surface_override_material(0, pixels.metal())
	var hole_mat: Material = pixels.bore()
	var ring_mat: Material = pixels.flat(Color("e6e1d6"))
	for i in 8:
		var a := i * TAU / 8.0
		var hole := MeshInstance3D.new()
		var mesh := CylinderMesh.new()
		mesh.top_radius = 0.035
		mesh.bottom_radius = 0.035
		mesh.height = 0.02
		hole.mesh = mesh
		hole.set_surface_override_material(0, hole_mat)
		hole.position = Vector3(cos(a) * 0.13, 0.07, sin(a) * 0.13)
		head.add_child(hole)
		if i == 0:
			var ring := MeshInstance3D.new()
			var ring_mesh := CylinderMesh.new()
			ring_mesh.top_radius = 0.05
			ring_mesh.bottom_radius = 0.05
			ring_mesh.height = 0.012
			ring.mesh = ring_mesh
			ring.set_surface_override_material(0, ring_mat)
			ring.position = hole.position + Vector3(0, -0.012, 0)
			head.add_child(ring)
	var eye := MeshInstance3D.new()
	var eye_mesh := SphereMesh.new()
	eye_mesh.radius = 0.045
	eye_mesh.height = 0.09
	eye.mesh = eye_mesh
	eye.set_surface_override_material(0, pixels.flat(Color("e6e1d6")))
	eye.position = Vector3(0, 0.09, 0)
	head.add_child(eye)

func _mat(color: Color) -> StandardMaterial3D:
	var mat := StandardMaterial3D.new()
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mat.albedo_color = color
	return mat
