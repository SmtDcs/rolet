extends RefCounted

## One atlas. Every mesh samples a tile from it. Nearest, no smoothing.

const SIZE := 256.0

const BLACK := Color("141414")
const BONE := Color("e6e1d6")
const SODIUM := Color("d9963a")

var _tex: Texture2D
var _shader: Shader

func _init() -> void:
	_tex = load("res://assets/atlas.png")
	_shader = load("res://shaders/pixel.gdshader")

func tile(px: float, py: float, tw: float, th: float, reps: Vector2 = Vector2.ONE) -> ShaderMaterial:
	var mat := ShaderMaterial.new()
	mat.shader = _shader
	mat.set_shader_parameter("atlas", _tex)
	mat.set_shader_parameter("tile_pos", Vector2((px + 0.5) / SIZE, (py + 0.5) / SIZE))
	mat.set_shader_parameter("tile_size", Vector2((tw - 1.0) / SIZE, (th - 1.0) / SIZE))
	mat.set_shader_parameter("tiles", reps)
	return mat

func flat(color: Color, alpha: float = 1.0) -> StandardMaterial3D:
	var mat := StandardMaterial3D.new()
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mat.albedo_color = Color(color.r, color.g, color.b, alpha)
	if alpha < 1.0:
		mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	return mat

func wood() -> ShaderMaterial:
	return tile(0, 0, 64, 64, Vector2(4, 5))

func coat() -> ShaderMaterial:
	return tile(64, 0, 64, 64, Vector2(2, 3))

func metal() -> ShaderMaterial:
	return tile(128, 0, 32, 32, Vector2(2, 2))

func metal_dark() -> ShaderMaterial:
	return tile(160, 0, 32, 32, Vector2(2, 2))

func paper() -> ShaderMaterial:
	return tile(192, 0, 32, 32)

func eye_card() -> ShaderMaterial:
	return tile(224, 0, 32, 32)

func shield_card() -> ShaderMaterial:
	return tile(128, 32, 32, 32)

func heal_card() -> ShaderMaterial:
	return tile(160, 32, 32, 32)

func hush_card() -> ShaderMaterial:
	return tile(192, 32, 32, 32)

func lamp_sodium() -> ShaderMaterial:
	return tile(224, 32, 32, 32)

func lamp_red() -> ShaderMaterial:
	return tile(128, 64, 32, 32)

func lamp_off() -> ShaderMaterial:
	return tile(160, 64, 32, 32)

func bore() -> ShaderMaterial:
	return tile(224, 64, 32, 32)

func crowd() -> ShaderMaterial:
	return tile(0, 64, 64, 64, Vector2(1, 3))

func wall() -> ShaderMaterial:
	return tile(0, 128, 128, 64, Vector2(8, 4))

func floor() -> ShaderMaterial:
	return tile(128, 128, 64, 64, Vector2(6, 6))

func speaker() -> ShaderMaterial:
	return tile(192, 128, 32, 64, Vector2(1, 3))

func card(id: int) -> ShaderMaterial:
	match id:
		1:
			return eye_card()
		3:
			return shield_card()
		7:
			return heal_card()
		2:
			return hush_card()
		4:
			return tile(0, 192, 32, 32)
		5:
			return tile(32, 192, 32, 32)
		6:
			return tile(64, 192, 32, 32)
		0:
			return tile(96, 192, 32, 32)
		8:
			return tile(128, 192, 32, 32)
		9:
			return tile(160, 192, 32, 32)
		10:
			return tile(192, 192, 32, 32)
		_:
			return tile(224, 192, 32, 32)
