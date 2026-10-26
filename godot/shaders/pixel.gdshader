shader_type spatial;
render_mode unshaded;

uniform sampler2D atlas : filter_nearest, repeat_disable;
uniform vec2 tile_pos = vec2(0.0);
uniform vec2 tile_size = vec2(1.0);
uniform vec2 tiles = vec2(1.0);
uniform vec3 tint = vec3(1.0);

void fragment() {
	vec2 uv = fract(UV * tiles);
	vec2 at = tile_pos + uv * tile_size;
	ALBEDO = texture(atlas, at).rgb * COLOR.rgb * tint;
}
