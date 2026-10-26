extends Node

## Short one-shots. No music, no words. Built in memory so the web export
## stays free of audio files. Playback is a pool of players, main thread only.

const RATE := 22050

var _players: Array[AudioStreamPlayer] = []
var _next := 0

func _ready() -> void:
	for _i in 4:
		var player := AudioStreamPlayer.new()
		player.volume_db = -6.0
		add_child(player)
		_players.append(player)

func pickup() -> void:
	_play(_tone(196.0, 0.07, 0.45), -4.0)

func dry() -> void:
	_play(_noise(0.04, 0.85), -2.0)

func tick() -> void:
	_play(_tone(1480.0, 0.025, 0.35), -10.0)

func tear() -> void:
	_play(_noise(0.16, 0.45), -8.0)

func _play(data: PackedByteArray, db: float) -> void:
	if _players.is_empty() or data.is_empty():
		return
	var wav := AudioStreamWAV.new()
	wav.format = AudioStreamWAV.FORMAT_16_BITS
	wav.mix_rate = RATE
	wav.stereo = false
	wav.data = data
	var player := _players[_next]
	_next = (_next + 1) % _players.size()
	player.volume_db = db
	player.stream = wav
	player.play()

func _tone(freq: float, seconds: float, volume: float) -> PackedByteArray:
	var n := int(float(RATE) * seconds)
	var samples := PackedFloat32Array()
	samples.resize(n)
	for i in n:
		var env := 1.0 - float(i) / float(n)
		samples[i] = sin(TAU * freq * float(i) / float(RATE)) * env * env * volume
	return _pcm(samples)

func _noise(seconds: float, volume: float) -> PackedByteArray:
	var n := int(float(RATE) * seconds)
	var samples := PackedFloat32Array()
	samples.resize(n)
	var rng := RandomNumberGenerator.new()
	rng.seed = 11
	for i in n:
		var env := 1.0 - float(i) / float(n)
		samples[i] = (rng.randf() * 2.0 - 1.0) * env * volume
	return _pcm(samples)

func _pcm(samples: PackedFloat32Array) -> PackedByteArray:
	var data := PackedByteArray()
	data.resize(samples.size() * 2)
	for i in samples.size():
		var v := int(clampf(samples[i], -1.0, 1.0) * 32767.0)
		data[i * 2] = v & 255
		data[i * 2 + 1] = (v >> 8) & 255
	return data
