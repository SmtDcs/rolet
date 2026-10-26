extends Node3D

const PixelsScript := preload("res://scripts/pixels.gd")

var _spots: Array[StandardMaterial3D] = []
var _pulse := 0
var _pulse_t := 0.0
var _crowd: Array[MeshInstance3D] = []
var _crowd_y: Array[float] = []
var _crowd_i := 0
var _crowd_t := 0.0
const LEVELS: Array[float] = [0.10, 0.16, 0.24, 0.16]
const BOUNCE: Array[float] = [0.0, 0.045, 0.0, -0.03]

func _ready() -> void:
	var pixels: PixelsScript = PixelsScript.new()
	_paint("Floor", pixels.floor())
	_paint("BackWall", pixels.wall())
	_paint("SpeakerL", pixels.speaker())
	_paint("SpeakerR", pixels.speaker())
	_paint("Booth", pixels.speaker())
	_paint("BeamA", pixels.metal_dark())
	_paint("BeamB", pixels.metal_dark())
	_paint("BeamC", pixels.metal_dark())
	for part in ["CrowdA", "CrowdB", "CrowdC", "CrowdD", "CrowdE", "CrowdF"]:
		_paint(part, pixels.crowd())
		var body := get_node(NodePath(part)) as MeshInstance3D
		_crowd.append(body)
		_crowd_y.append(body.position.y)
	for part in ["SpotL", "SpotCL", "SpotCR", "SpotR"]:
		var mat := pixels.flat(Color("d9963a"), LEVELS[0])
		_paint(part, mat)
		_spots.append(mat)

func _process(delta: float) -> void:
	_pulse_t += delta
	if _pulse_t >= 0.16:
		_pulse_t = 0.0
		_pulse = (_pulse + 1) % LEVELS.size()
		var level: float = LEVELS[_pulse]
		for mat in _spots:
			var color := mat.albedo_color
			color.a = level
			mat.albedo_color = color
	_crowd_t += delta
	if _crowd_t < 0.18:
		return
	_crowd_t = 0.0
	_crowd_i = (_crowd_i + 1) % BOUNCE.size()
	for i in _crowd.size():
		var body := _crowd[i]
		var pos := body.position
		pos.y = _crowd_y[i] + BOUNCE[(_crowd_i + i) % BOUNCE.size()]
		body.position = pos

func _paint(node_name: String, mat: Material) -> void:
	(get_node(NodePath(node_name)) as MeshInstance3D).set_surface_override_material(0, mat)
