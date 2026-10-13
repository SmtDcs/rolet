"use client";

// ROLET — the chamber room.
//
// A first-person table. Two barn-door reflectors rake a bare baize, the
// opponent hangs in the dark past the far rail, and the whole frame is
// pushed through a dither-and-posterise pass, so the picture reads as paint
// rather than as a render.
//
// There are no photo textures here on purpose. Every surface is flat colour;
// the banding, the grain and the plate-like grain come from the grade in the
// display pass, which is where this look actually lives. Texturing geometry
// would only fight it.

import { useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

export type DuelRoom3DProps = {
  isYourTurn: boolean;
  gunHeld: boolean;
  target: "self" | "opponent";
  firing: "live" | "blank" | null;
  opponentPubkey: string;
  opponentHp: number;
  opponentHitSignal: number;
  liveCount: number;
  blankCount: number;
  /** Bypass the display grade. Tuning aid only. */
  raw?: boolean;
  /** Forces the resting muzzle yaw, in radians. Tuning aid only. */
  restYaw?: number;
};

// ── Palette ────────────────────────────────────────────────────────────────
// Sampled from the reference frame: a warm, desaturated ramp that runs from
// pure black through olive-khaki to a bone highlight. Nothing in it is
// saturated, and there is no blue anywhere in the scene.
const C = {
  room: "#0b0708",
  beam: "#191412",
  pipe: "#211a16",
  lampBody: "#3a2f28",
  lampRing: "#544438",
  felt: "#5f5b47",
  feltLine: "#cec094",
  rail: "#2b170f",
  railTop: "#3c2419",
  wood: "#291609",
  steel: "#5a564c",
  steelLit: "#8b8172",
  brass: "#6f5a30",
  brassLit: "#8f7440",
  cartridge: "#8a2b22",
  tin: "#3a3029",
  led: "#4fbf5e",
};

// ── Placement ──────────────────────────────────────────────────────────────
// One block so the whole composition can be nudged without hunting through
// the scene. The camera sits at the near rail looking down the length of the
// table: the far rail lands just above the middle of the frame and its
// corners stop short of the sides, which is what the reference does. The two
// reflectors hang low over the far corners so they stay inside the frame.
const CAM: [number, number, number] = [0, 1.32, 0.95];
const CAM_AIM: [number, number, number] = [0, 0.7, -1.45];
const CAM_FOV = 46;
// Aspect the composition was framed against: the wide duel canvas.
const CAM_BASE_ASPECT = 2.24;

const TABLE_Z = -0.35;
const LAMP_L: [number, number, number] = [-1.4, 1.47, -1.3];
const LAMP_R: [number, number, number] = [1.38, 1.43, -1.34];
const LAMP_TILT = 0.46;

// ── Display grade ──────────────────────────────────────────────────────────
// Bayer 4x4, then posterise, then grain. The dither is what turns every
// gradient into the crosshatched plate texture the reference has.

const GRADE_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const GRADE_FRAG = /* glsl */ `
precision highp float;

uniform sampler2D tDiffuse;
uniform vec3 uWarm;
uniform vec3 uShadow;
uniform float uExposure;
uniform float uContrast;
uniform float uBlack;
uniform float uSaturation;
uniform float uLevels;
uniform float uDither;
uniform float uGrain;
uniform float uVignette;
uniform float uTime;

varying vec2 vUv;

float bayer2(vec2 a) {
  a = floor(a);
  return fract(a.x / 2.0 + a.y * a.y * 0.75);
}

float bayer4(vec2 a) {
  return bayer2(0.5 * a) * 0.25 + bayer2(a);
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec3 c = texture2D(tDiffuse, vUv).rgb;

  // The scene renders into the buffer in linear light.
  c = pow(max(c, 0.0), vec3(0.4545));

  c *= uExposure;
  c *= uWarm;

  // Two-tone: the shadows take a cold lift off the instruments, the
  // highlights stay brass.
  float lift = 1.0 - smoothstep(0.0, 0.28, dot(c, vec3(0.2126, 0.7152, 0.0722)));
  c += uShadow * lift;
  c = (c - 0.5) * uContrast + 0.5;

  // Crush the floor. In the reference 40% of the frame is pure black.
  c = max(c - uBlack, 0.0) / max(1.0 - uBlack, 0.0001);

  float luma = dot(clamp(c, 0.0, 1.0), vec3(0.2126, 0.7152, 0.0722));
  c = mix(vec3(luma), c, uSaturation);

  // Ordered dither, then quantise. Mean of the 4x4 matrix is 0.46875.
  float d = bayer4(gl_FragCoord.xy) - 0.46875;
  c = clamp(c, 0.0, 1.0);
  c = floor(c * uLevels + d * uDither + 0.5) / uLevels;

  float g = hash(gl_FragCoord.xy + vec2(uTime * 91.7, uTime * 53.1)) - 0.5;
  c += g * uGrain;

  vec2 p = vUv - 0.5;
  float v = 1.0 - uVignette * dot(p, p) * 2.0;
  c *= clamp(v, 0.0, 1.0);

  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}
`;

// Internal render scale. The buffer is smaller than the canvas so the
// upscale softens every edge, the way a low-resolution capture does.
const RES_SCALE = 0.72;

// The grain and the sway are the only motion in the room, and both are
// animation, so both stop when the visitor asks for less of it.
function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function DisplayGrade() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);

  const rt = useMemo(
    () =>
      new THREE.WebGLRenderTarget(2, 2, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        depthBuffer: true,
        stencilBuffer: false,
        samples: 2,
      }),
    [],
  );

  const quad = useMemo(() => {
    const material = new THREE.ShaderMaterial({
      vertexShader: GRADE_VERT,
      fragmentShader: GRADE_FRAG,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        tDiffuse: { value: rt.texture },
        uWarm: { value: new THREE.Vector3(1.03, 0.99, 0.93) },
        uShadow: { value: new THREE.Vector3(0.004, 0.015, 0.018) },
        uExposure: { value: 1.34 },
        uContrast: { value: 1.12 },
        uBlack: { value: 0.045 },
        uSaturation: { value: 0.72 },
        uLevels: { value: 7.0 },
        uDither: { value: 0.55 },
        uGrain: { value: 0.075 },
        uVignette: { value: 0.62 },
        uTime: { value: 0 },
      },
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    mesh.frustumCulled = false;
    const s = new THREE.Scene();
    s.add(mesh);
    return { scene: s, material };
  }, [rt]);

  const quadCamera = useMemo(
    () => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1),
    [],
  );

  const start = useRef(performance.now());
  const still = useRef(prefersReducedMotion());

  useFrame(() => {
    const w = Math.max(2, Math.round(size.width * RES_SCALE));
    const h = Math.max(2, Math.round(size.height * RES_SCALE));
    if (rt.width !== w || rt.height !== h) rt.setSize(w, h);

    quad.material.uniforms.uTime.value = still.current
      ? 0
      : (performance.now() - start.current) / 1000;

    gl.setRenderTarget(rt);
    gl.clear();
    gl.render(scene, camera);
    gl.setRenderTarget(null);
    gl.render(quad.scene, quadCamera);
  }, 1);

  return null;
}

// ── Camera ─────────────────────────────────────────────────────────────────

function LookAt({
  position,
  target,
  baseFov,
}: {
  position: [number, number, number];
  target: [number, number, number];
  baseFov: number;
}) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);

  useLayoutEffect(() => {
    // The composition was framed against the wide desktop canvas, so hold the
    // horizontal field and let the vertical one open up on narrow viewports.
    // Without this a portrait phone shows a magnified crop of the middle.
    const aspect = Math.max(size.width, 1) / Math.max(size.height, 1);
    const tanHalfH = Math.tan((baseFov * Math.PI) / 360) * CAM_BASE_ASPECT;
    const fov =
      (2 * Math.atan(tanHalfH / aspect) * 180) / Math.PI;

    camera.position.set(...position);
    camera.fov = THREE.MathUtils.clamp(fov, baseFov, 76);
    camera.near = 0.05;
    camera.far = 40;
    camera.lookAt(new THREE.Vector3(...target));
    camera.updateProjectionMatrix();
  }, [camera, position, target, baseFov, size.width, size.height]);

  return null;
}

// ── Light with a world-space aim point ─────────────────────────────────────

function AimedSpot({
  from,
  to,
  color,
  intensity,
  angle,
  penumbra,
  castShadow = false,
}: {
  from: [number, number, number];
  to: [number, number, number];
  color: string;
  intensity: number;
  angle: number;
  penumbra: number;
  castShadow?: boolean;
}) {
  const target = useMemo(() => new THREE.Object3D(), []);
  const ref = useRef<THREE.SpotLight>(null);
  useLayoutEffect(() => {
    if (ref.current) ref.current.target = target;
  }, [target]);
  return (
    <>
      <primitive object={target} position={to} />
      <spotLight
        ref={ref}
        position={from}
        color={color}
        intensity={intensity}
        angle={angle}
        penumbra={penumbra}
        distance={16}
        decay={1}
        castShadow={castShadow}
        shadow-mapSize={[512, 512]}
        shadow-bias={-0.0018}
        shadow-normalBias={0.02}
      />
    </>
  );
}

// ── The room shell ─────────────────────────────────────────────────────────

function Room() {
  return (
    <>
      <mesh position={[0, 1.75, -2.2]}>
        <boxGeometry args={[9, 3.8, 7]} />
        <meshStandardMaterial
          color={C.room}
          roughness={1}
          metalness={0}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Ceiling girder with its run of pipes */}
      <group position={[0, 0, -2.9]}>
        <mesh position={[0, 2.86, 0]} castShadow>
          <boxGeometry args={[7.6, 0.26, 0.34]} />
          <meshStandardMaterial color={C.beam} roughness={0.95} />
        </mesh>
        {[3.04, 3.12].map((y, i) => (
          <mesh key={i} position={[0, y, -0.06]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.05, 0.05, 7.6, 10]} />
            <meshStandardMaterial color={C.pipe} roughness={0.9} />
          </mesh>
        ))}
        {[-2.4, -0.8, 0.8, 2.4].map((x) => (
          <mesh key={x} position={[x, 2.78, 0.14]}>
            <boxGeometry args={[0.1, 0.42, 0.1]} />
            <meshStandardMaterial color={C.beam} roughness={0.95} />
          </mesh>
        ))}
      </group>

      {/* Shelf clutter, left — a lit stack in the dark, as in the reference */}
      <group position={[-2.05, 0, -1.35]}>
        <mesh position={[0, 1.42, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.5, 0.06, 1.6]} />
          <meshStandardMaterial color="#241a14" roughness={0.95} />
        </mesh>
        {[
          [-0.12, 1.58, -0.45, 0.26, 0.26, 0.5],
          [0.1, 1.54, 0.05, 0.3, 0.18, 0.34],
          [-0.05, 1.64, 0.58, 0.34, 0.38, 0.3],
        ].map(([x, y, z, w, h, d], i) => (
          <mesh key={i} position={[x, y, z]} castShadow>
            <boxGeometry args={[w, h, d]} />
            <meshStandardMaterial
              color={i === 2 ? "#3b2b20" : "#2a1d16"}
              roughness={0.9}
            />
          </mesh>
        ))}
      </group>

      {/* Radio on the right wall, with its green read-out */}
      <group position={[2.1, 1.32, -1.6]} rotation={[0, -0.62, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.34, 0.62, 0.26]} />
          <meshStandardMaterial color="#2e211a" roughness={0.85} />
        </mesh>
        <mesh position={[-0.19, 0.04, 0.02]}>
          <boxGeometry args={[0.02, 0.5, 0.2]} />
          <meshStandardMaterial color="#150f0b" roughness={1} />
        </mesh>
        <mesh position={[-0.2, 0.16, 0.02]}>
          <planeGeometry args={[0.012, 0.1]} />
          <meshStandardMaterial
            color="#08120a"
            emissive={C.led}
            emissiveIntensity={0.9}
            toneMapped={false}
          />
        </mesh>
        {[0.1, -0.05, -0.2].map((y) => (
          <mesh key={y} position={[-0.2, y, 0.02]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.022, 0.022, 0.014, 12]} />
            <meshStandardMaterial color="#4a3a2c" roughness={0.6} />
          </mesh>
        ))}
      </group>
    </>
  );
}

// ── Reflector lamp ─────────────────────────────────────────────────────────

function ReflectorLamp({
  position,
  rotation,
  lit,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  lit: boolean;
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* Housing */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.21, 0.25, 0.36, 20, 1, true]} />
        <meshStandardMaterial
          color={C.lampBody}
          roughness={0.85}
          metalness={0.25}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, 0, -0.19]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 0.04, 20]} />
        <meshStandardMaterial color={C.lampBody} roughness={0.85} />
      </mesh>

      {/* Concentric rings inside the throat */}
      {[
        [0.185, -0.14],
        [0.165, -0.06],
        [0.14, 0.02],
      ].map(([r, z], i) => (
        <mesh
          key={i}
          position={[0, 0, z]}
          rotation={[0, 0, 0]}
          scale={[1, 1, 1]}
        >
          <torusGeometry args={[r, 0.014, 8, 24]} />
          <meshStandardMaterial color={C.lampRing} roughness={0.9} />
        </mesh>
      ))}

      {/* Bulb */}
      <mesh position={[0, 0, -0.1]}>
        <sphereGeometry args={[0.075, 12, 10]} />
        <meshStandardMaterial
          color="#2a1a12"
          emissive={lit ? "#ffcf96" : "#3a2a1a"}
          emissiveIntensity={lit ? 1.6 : 0.1}
          toneMapped={false}
        />
      </mesh>

      {/* Barn doors — four plates splayed off the rim */}
      {[0, 1, 2, 3].map((i) => (
        <group key={i} rotation={[0, 0, (i / 4) * Math.PI * 2]}>
          <group position={[0.245, 0, 0.17]} rotation={[0, -0.45, 0]}>
            <mesh position={[0.17, 0, 0]} castShadow>
              <boxGeometry args={[0.3, 0.016, 0.24]} />
              <meshStandardMaterial color="#191311" roughness={0.95} />
            </mesh>
          </group>
        </group>
      ))}

      {/* Wall bracket */}
      <mesh position={[0, 0.5, -0.16]} rotation={[0.32, 0, 0]}>
        <boxGeometry args={[0.05, 1.1, 0.05]} />
        <meshStandardMaterial color={C.lampBody} roughness={0.9} />
      </mesh>
    </group>
  );
}

function Cables() {
  const geoms = useMemo(() => {
    const mk = (pts: [number, number, number][]) => {
      const curve = new THREE.CatmullRomCurve3(
        pts.map((p) => new THREE.Vector3(...p)),
      );
      return new THREE.TubeGeometry(curve, 24, 0.0075, 6, false);
    };
    return [
      mk([
        [-0.35, 2.4, -1.6],
        [-0.8, 2.08, -1.3],
        [-1.2, 1.85, -1.12],
        [-1.5, 1.72, -1.02],
      ]),
      mk([
        [0.35, 2.4, -1.6],
        [0.8, 2.08, -1.32],
        [1.2, 1.85, -1.14],
        [1.46, 1.66, -1.06],
      ]),
    ];
  }, []);
  return (
    <>
      {geoms.map((g, i) => (
        <mesh key={i} geometry={g}>
          <meshStandardMaterial color="#1a1512" roughness={0.95} />
        </mesh>
      ))}
    </>
  );
}

// ── Table ──────────────────────────────────────────────────────────────────

function useBaizeTexture() {
  return useMemo(() => {
    const W = 1024;
    const H = 616;
    const cv = document.createElement("canvas");
    cv.width = W;
    cv.height = H;
    const g = cv.getContext("2d");
    if (!g) return null;

    g.fillStyle = C.felt;
    g.fillRect(0, 0, W, H);

    // Blotches so the flat fill is not dead under the grade
    let seed = 20261012;
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    for (let i = 0; i < 2200; i++) {
      const x = rnd() * W;
      const y = rnd() * H;
      const r = 6 + rnd() * 34;
      g.fillStyle = rnd() > 0.5 ? "rgba(0,0,0,0.05)" : "rgba(255,240,200,0.035)";
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }

    // Painted lines, drawn with a hand wobble
    g.strokeStyle = C.feltLine;
    g.lineCap = "round";
    g.lineJoin = "round";
    const line = (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      w = 5,
      alpha = 0.95,
    ) => {
      const ax = x1 * W;
      const ay = y1 * H;
      const bx = x2 * W;
      const by = y2 * H;
      const len = Math.hypot(bx - ax, by - ay);
      const steps = Math.max(3, Math.round(len / 34));
      const nx = -(by - ay) / (len || 1);
      const ny = (bx - ax) / (len || 1);
      g.save();
      g.globalAlpha = alpha;
      g.lineWidth = w;
      g.beginPath();
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const wob = (rnd() - 0.5) * 5;
        const px = ax + (bx - ax) * t + nx * wob;
        const py = ay + (by - ay) * t + ny * wob;
        if (i === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
      }
      g.stroke();
      g.restore();
    };

    // Circle and pixel helpers. Everything below is drawn in canvas pixels so
    // circles stay round: the table is 2.5 x 1.5 units over 1024 x 616 px.
    const circleP = (cx: number, cy: number, r: number, w = 4, alpha = 0.9) => {
      const steps = 44;
      g.save();
      g.globalAlpha = alpha;
      g.lineWidth = w;
      g.beginPath();
      for (let i = 0; i <= steps; i++) {
        const a = (i / steps) * Math.PI * 2;
        const wob = (rnd() - 0.5) * 3.5;
        const px = cx + Math.cos(a) * (r + wob);
        const py = cy + Math.sin(a) * (r + wob);
        if (i === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
      }
      g.closePath();
      g.stroke();
      g.restore();
    };
    const pline = (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      w = 5,
      alpha = 0.95,
    ) => line(x1 / W, y1 / H, x2 / W, y2 / H, w, alpha);

    // Outer border of the play area
    line(0.042, 0.05, 0.958, 0.05);
    line(0.958, 0.05, 0.958, 0.95);
    line(0.958, 0.95, 0.042, 0.95);
    line(0.042, 0.95, 0.042, 0.05);
    // Field dividers
    line(0.295, 0.05, 0.295, 0.95);
    line(0.715, 0.05, 0.715, 0.95);

    // Scale ticks along the far rail, every sixteenth of the width
    for (let i = 1; i < 16; i++) {
      if (i % 4 === 0) continue;
      const x = 0.042 + (0.916 / 16) * i;
      pline(x * W, 0.05 * H, x * W, 0.078 * H, 3, 0.7);
    }

    // Left field — the chamber schematic. A six-bore drum, one bore closed
    // and indexed, ringed by graduations the way a technical plate is.
    const drumX = 176;
    const drumY = 268;
    circleP(drumX, drumY, 88, 4);
    circleP(drumX, drumY, 112, 3, 0.7);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
      const r1 = i % 3 === 0 ? 100 : 106;
      pline(
        drumX + Math.cos(a) * r1,
        drumY + Math.sin(a) * r1,
        drumX + Math.cos(a) * 112,
        drumY + Math.sin(a) * 112,
        3,
        0.75,
      );
    }
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
      const bx = drumX + Math.cos(a) * 50;
      const by = drumY + Math.sin(a) * 50;
      circleP(bx, by, 26, 3, 0.9);
      if (i === 5) {
        // The indexed bore, filled — the one under the hammer.
        g.save();
        g.globalAlpha = 0.5;
        g.fillStyle = C.feltLine;
        g.beginPath();
        g.arc(bx, by, 20, 0, Math.PI * 2);
        g.fill();
        g.restore();
      }
    }
    circleP(drumX, drumY, 12, 3, 0.85);
    // Leader line out of the drum to the field divider
    pline(drumX + 112, drumY, 300, drumY, 3, 0.6);

    // Tally strip under the drum: five live marks, three blank
    for (let i = 0; i < 5; i++) pline(96 + i * 26, 430, 96 + i * 26, 466, 6, 0.9);
    for (let i = 0; i < 3; i++) {
      pline(96 + i * 26, 486, 96 + i * 26, 508, 6, 0.4);
    }

    // Centre field — the plate mark, and the corridor the shot travels.
    const stampX = W / 2;
    const stampY = 178;
    circleP(stampX, stampY, 54, 4);
    circleP(stampX, stampY, 38, 3, 0.8);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      pline(
        stampX + Math.cos(a) * 46,
        stampY + Math.sin(a) * 46,
        stampX + Math.cos(a) * 54,
        stampY + Math.sin(a) * 54,
        3,
        0.85,
      );
    }
    pline(stampX, stampY - 26, stampX + 22, stampY, 4, 0.9);
    pline(stampX + 22, stampY, stampX, stampY + 26, 4, 0.9);
    pline(stampX, stampY + 26, stampX - 22, stampY, 4, 0.9);
    pline(stampX - 22, stampY, stampX, stampY - 26, 4, 0.9);
    pline(stampX - 12, stampY + 66, stampX + 12, stampY + 66, 5, 0.9);

    // Line of fire: two rails running from the near rail toward the opponent
    pline(356, 616, 300, 40, 3, 0.5);
    pline(668, 616, 724, 40, 3, 0.5);
    for (const t of [0.28, 0.62]) {
      const lx = 356 + (300 - 356) * t;
      const rx = 668 + (724 - 668) * t;
      const y = 616 + (40 - 616) * t;
      pline(lx, y, rx, y, 3, 0.3);
    }

    // Right field — the proof ledger, ruled and ruled again
    line(0.742, 0.57, 0.945, 0.57, 4);
    line(0.742, 0.57, 0.742, 0.9, 4);
    line(0.945, 0.57, 0.945, 0.9, 4);
    line(0.742, 0.9, 0.945, 0.9, 4);
    for (let i = 1; i < 5; i++) {
      line(0.742, 0.57 + (0.33 / 5) * i, 0.945, 0.57 + (0.33 / 5) * i, 3, 0.8);
    }
    line(0.855, 0.57, 0.855, 0.9, 3, 0.8);
    // Two rows already struck through
    pline(0.748 * W, 0.636 * H, 0.851 * W, 0.636 * H, 7, 0.55);
    pline(0.86 * W, 0.636 * H, 0.939 * W, 0.636 * H, 7, 0.55);
    pline(0.748 * W, 0.702 * H, 0.851 * W, 0.702 * H, 7, 0.55);

    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, []);
}

function Table() {
  const baize = useBaizeTexture();
  return (
    <group position={[0, 0, -0.35]}>
      {/* Skirt */}
      <mesh position={[0, 0.36, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.6, 0.62, 1.6]} />
        <meshStandardMaterial color={C.wood} roughness={0.95} />
      </mesh>

      {/* Rail frame */}
      {(
        [
          [[0, 0.7, -0.79], [2.72, 0.1, 0.16]],
          [[0, 0.7, 0.79], [2.72, 0.1, 0.16]],
          [[-1.28, 0.7, 0], [0.16, 0.1, 1.74]],
          [[1.28, 0.7, 0], [0.16, 0.1, 1.74]],
        ] as const
      ).map(([p, s], i) => (
        <mesh key={i} position={p} castShadow receiveShadow>
          <boxGeometry args={s} />
          <meshStandardMaterial color={C.rail} roughness={0.8} />
        </mesh>
      ))}

      {/* Rail top edge, catching the lamps */}
      {(
        [
          [[0, 0.756, -0.79], [2.72, 0.03, 0.16]],
          [[0, 0.756, 0.79], [2.72, 0.03, 0.16]],
          [[-1.28, 0.756, 0], [0.16, 0.03, 1.74]],
          [[1.28, 0.756, 0], [0.16, 0.03, 1.74]],
        ] as const
      ).map(([p, s], i) => (
        <mesh key={i} position={p}>
          <boxGeometry args={s} />
          <meshStandardMaterial color={C.railTop} roughness={0.7} />
        </mesh>
      ))}

      {/* Baize */}
      <mesh position={[0, 0.682, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[2.5, 1.5]} />
        <meshStandardMaterial map={baize} color="#ffffff" roughness={0.97} />
      </mesh>
    </group>
  );
}

// ── Generated props ────────────────────────────────────────────────────────
// The piece above all was never going to read as anything hand-built out of
// boxes; it came out a rod. These three are Meshy meshes with no materials and
// no textures, which is exactly what this look wants: each is flattened onto a
// single colour and left faceted, so the display pass is still the only thing
// putting grain on them.

const PROPS = {
  revolver: "/models/room/revolver.glb",
  loader: "/models/room/speed-loader.glb",
  case: "/models/room/cartridge-case.glb",
};

type FlatLook = { color: string; roughness: number; metalness: number };

/** Loads a mesh, flattens it to one colour, and normalises its footprint. */
function useFlatProp(url: string, look: FlatLook, length: number) {
  const { scene } = useGLTF(url);
  return useMemo(() => {
    const root = scene.clone(true);
    const box = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    const centre = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(centre);

    const material = new THREE.MeshStandardMaterial({
      color: look.color,
      roughness: look.roughness,
      metalness: look.metalness,
      flatShading: true,
    });
    root.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.material = material;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    });

    // Re-centre across the table and drop the base onto y = 0, so a prop can
    // be placed by its position alone.
    root.position.set(-centre.x, -box.min.y, -centre.z);

    const wrap = new THREE.Group();
    wrap.add(root);
    wrap.scale.setScalar(length / Math.max(size.x, size.y, size.z));
    return wrap;
  }, [scene, url, length, look.color, look.roughness, look.metalness]);
}

function FlatProp({
  url,
  look,
  length,
  position,
  rotation = [0, 0, 0],
}: {
  url: string;
  look: FlatLook;
  length: number;
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  const model = useFlatProp(url, look, length);
  return <primitive object={model} position={position} rotation={rotation} />;
}

// ── Props ──────────────────────────────────────────────────────────────────

function Shell({
  position,
  rotation = [0, 0, Math.PI / 2],
  live,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  live: boolean;
}) {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow>
        <cylinderGeometry args={[0.0155, 0.0155, 0.058, 12]} />
        <meshStandardMaterial
          color={live ? C.cartridge : "#8a8272"}
          roughness={0.55}
          metalness={0.15}
        />
      </mesh>
      <mesh position={[0, -0.032, 0]}>
        <cylinderGeometry args={[0.0165, 0.0165, 0.012, 12]} />
        <meshStandardMaterial color={C.brass} roughness={0.35} metalness={0.7} />
      </mesh>
    </group>
  );
}

function Magnifier({
  position,
  rotation,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow>
        <torusGeometry args={[0.075, 0.009, 8, 20]} />
        <meshStandardMaterial color={C.brassLit} roughness={0.45} metalness={0.6} />
      </mesh>
      <mesh>
        <circleGeometry args={[0.073, 20]} />
        <meshStandardMaterial
          color="#5a5a48"
          roughness={0.2}
          metalness={0.1}
          transparent
          opacity={0.45}
        />
      </mesh>
      <mesh position={[0, 0.16, 0]} castShadow>
        <cylinderGeometry args={[0.016, 0.016, 0.17, 8]} />
        <meshStandardMaterial color="#3a2a1c" roughness={0.8} />
      </mesh>
    </group>
  );
}

function ChamberBlock({
  position,
  rotation,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
}) {
  const bores = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return { x: Math.cos(a) * 0.041, y: Math.sin(a) * 0.041 };
      }),
    [],
  );
  return (
    <group position={position} rotation={rotation}>
      {/* A spare cylinder, lying on its side with the face toward the seat */}
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.072, 0.072, 0.11, 20]} />
        <meshStandardMaterial color={C.steel} roughness={0.5} metalness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.058]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.026, 0.026, 0.014, 12]} />
        <meshStandardMaterial color={C.steelLit} roughness={0.4} metalness={0.7} />
      </mesh>
      {bores.map((b, i) => (
        <mesh
          key={i}
          position={[b.x, b.y, 0.056]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[0.016, 0.016, 0.098, 10]} />
          <meshStandardMaterial color="#141210" roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

function TelemetryBox({
  position,
  rotation,
  liveCount,
  blankCount,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  liveCount: number;
  blankCount: number;
}) {
  const bars = useMemo(() => {
    const out: { x: number; live: boolean }[] = [];
    for (let i = 0; i < 5; i++) {
      out.push({ x: -0.092 + i * 0.026, live: i < liveCount });
    }
    const blanks = Math.min(Math.max(blankCount, 0), 3);
    for (let i = 0; i < blanks; i++) {
      out.push({ x: 0.048 + i * 0.026, live: false });
    }
    return out;
  }, [liveCount, blankCount]);
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow>
        <boxGeometry args={[0.3, 0.15, 0.14]} />
        <meshStandardMaterial color="#2e2620" roughness={0.6} metalness={0.35} />
      </mesh>
      {/* Slanted read-out panel */}
      <group position={[0, 0.075, -0.02]} rotation={[-0.62, 0, 0]}>
        <mesh>
          <boxGeometry args={[0.27, 0.105, 0.022]} />
          <meshStandardMaterial color="#0d100c" roughness={0.5} />
        </mesh>
        {bars.map((b, i) => (
          <mesh key={i} position={[b.x, 0, 0.013]}>
            <planeGeometry args={[0.013, 0.07]} />
            <meshStandardMaterial
              color="#0a0d08"
              emissive="#7fae5c"
              emissiveIntensity={b.live ? 0.6 : 0.04}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>
      {/* Two brass knobs on the front face */}
      {[-0.08, 0.08].map((x) => (
        <mesh key={x} position={[x, -0.02, 0.075]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.016, 0.016, 0.02, 10]} />
          <meshStandardMaterial color={C.brass} roughness={0.45} metalness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

function Tin({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.165, 16]} />
        <meshStandardMaterial color={C.tin} roughness={0.5} metalness={0.45} />
      </mesh>
      <mesh position={[0, 0.083, 0]}>
        <cylinderGeometry args={[0.051, 0.051, 0.008, 16]} />
        <meshStandardMaterial color="#b9b2a0" roughness={0.3} metalness={0.7} />
      </mesh>
      <mesh position={[0, 0.028, 0.05]}>
        <planeGeometry args={[0.07, 0.07]} />
        <meshStandardMaterial color="#1a1512" roughness={0.8} />
      </mesh>
    </group>
  );
}

function Revolver({
  held,
  target,
  firing,
  restYaw,
}: {
  held: boolean;
  target: "self" | "opponent";
  firing: "live" | "blank" | null;
  restYaw?: number;
}) {
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (!g.current) return;
    const k = 1 - Math.pow(0.0015, Math.min(dt, 0.1));
    // Resting: on the baize, muzzle away and left. Held: up off the table and
    // swung onto the target, the seat's side of the near rail.
    const wantY = held ? (target === "self" ? 0.88 : 0.9) : 0.73;
    const wantZ = TABLE_Z + (held ? (target === "self" ? 0.34 : 0.36) : 0.22);
    const wantX = held ? (target === "self" ? 0.02 : 0.04) : 0.2;
    // Yaws measured off the mesh, not guessed: the muzzle sits at -X and the
    // grip at +X, so 0 lies the piece in clean profile on the baize pointing
    // left, +1.35 turns it muzzle-on onto the seat, and -1.15 sends it away.
    const wantSpin = held ? (target === "self" ? 1.35 : -1.15) : (restYaw ?? 0.25);
    const wantPitch = held ? (target === "self" ? -0.1 : 0.12) : 0;
    g.current.position.x += (wantX - g.current.position.x) * k;
    g.current.position.y += (wantY - g.current.position.y) * k;
    g.current.position.z += (wantZ - g.current.position.z) * k;
    g.current.rotation.y += (wantSpin - g.current.rotation.y) * k;
    g.current.rotation.x += (wantPitch - g.current.rotation.x) * k;
  });

  const model = useFlatProp(
    PROPS.revolver,
    { color: "#6d675b", roughness: 0.42, metalness: 0.62 },
    0.5,
  );

  return (
    <group
      ref={g}
      position={[0.2, 0.73, TABLE_Z + 0.22]}
      rotation={[0, restYaw ?? 0.25, 0]}
    >
      {/* The mesh is exported standing on its feet with the muzzle at +X.
          Tip it over so it lies on the baize, top toward the seat. */}
      <group rotation={[Math.PI / 2, 0, 0]}>
        <primitive object={model} />
      </group>
      {firing === "live" && (
        // A pop at the muzzle, not a floodlight: the page adds its own
        // full-screen flash on top of this.
        <pointLight
          position={[0, 0.05, -0.42]}
          color="#ffddae"
          intensity={2.2}
          distance={1.5}
          decay={1.7}
        />
      )}
    </group>
  );
}

// ── The other seat ────────────────────────────────────────────────────────

// ── The operator across the table ──────────────────────────────────────────
// Not a face. A survey instrument the other seat left running: a hex shell,
// a brass objective, an aperture that dims as their lives come off.

function Operator({ hp, hitSignal }: { hp: number; hitSignal: number }) {
  const g = useRef<THREE.Group>(null);
  const iris = useRef<THREE.MeshStandardMaterial>(null);
  const lens = useRef<THREE.PointLight>(null);
  const hit = useRef(hitSignal);
  const struck = useRef(0);

  useFrame((state) => {
    const t = prefersReducedMotion() ? 0 : state.clock.getElapsedTime();
    if (hit.current !== hitSignal) {
      hit.current = hitSignal;
      struck.current = t;
    }
    const since = t - struck.current;
    if (g.current) {
      const k = since < 0.4 ? Math.sin(since * 60) * 0.014 * (1 - since / 0.4) : 0;
      g.current.position.x = k;
      g.current.position.y = 1.04 + Math.sin(t * 0.9) * 0.005;
      g.current.rotation.y = Math.sin(t * 0.37) * 0.022;
    }
    const alive = hp > 0 ? 1 : 0.1;
    const flicker = 0.9 + Math.sin(t * 2.7) * 0.08 + Math.sin(t * 9.1) * 0.04;
    if (iris.current) iris.current.emissiveIntensity = alive * flicker;
    if (lens.current) lens.current.intensity = alive * 0.9 * flicker;
  });

  // Six aperture blades, closed around the iris
  const blades = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return { a, x: Math.cos(a) * 0.088, y: Math.sin(a) * 0.088 };
      }),
    [],
  );

  return (
    <group
      ref={g}
      position={[0, 1.04, -2.0]}
      rotation={[0.16, 0, 0]}
      scale={1.15}
    >
      {/* Shell: a hex drum with the axis down the sight line */}
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.34, 0.3, 0.34, 6]} />
        <meshStandardMaterial color="#3b3730" roughness={0.6} metalness={0.45} />
      </mesh>
      <mesh position={[0, 0, -0.19]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.3, 0.25, 0.07, 6]} />
        <meshStandardMaterial color="#2c2822" roughness={0.7} metalness={0.4} />
      </mesh>

      {/* Straps banding the shell, and bolts around the front collar */}
      {(
        [
          [-0.1, 0.316],
          [0.02, 0.33],
          [0.13, 0.343],
        ] as const
      ).map(([z, r]) => (
        <mesh key={z} position={[0, 0, z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[r, r, 0.026, 6]} />
          <meshStandardMaterial color="#232019" roughness={0.7} metalness={0.55} />
        </mesh>
      ))}
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 0.275, Math.sin(a) * 0.275, 0.175]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.016, 0.016, 0.02, 6]} />
            <meshStandardMaterial
              color="#6a6152"
              roughness={0.45}
              metalness={0.7}
            />
          </mesh>
        );
      })}
      {/* Nameplate on the crown */}
      <mesh position={[0, 0.3, 0.06]} rotation={[0.1, 0, 0]}>
        <boxGeometry args={[0.13, 0.012, 0.055]} />
        <meshStandardMaterial color={C.brass} roughness={0.45} metalness={0.7} />
      </mesh>

      {/* Brass collar and the objective barrel */}
      <mesh position={[0, 0, 0.16]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.245, 0.05, 6]} />
        <meshStandardMaterial color={C.brassLit} roughness={0.4} metalness={0.75} />
      </mesh>
      <mesh position={[0, 0, 0.28]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.175, 0.175, 0.24, 20]} />
        <meshStandardMaterial color="#4a4640" roughness={0.5} metalness={0.6} />
      </mesh>
      {[0.2, 0.3, 0.38].map((z, i) => (
        <mesh key={z} position={[0, 0, z]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.178, i === 1 ? 0.014 : 0.009, 8, 20]} />
          <meshStandardMaterial
            color={C.brassLit}
            roughness={0.35}
            metalness={0.8}
          />
        </mesh>
      ))}

      {/* Aperture: dark glass, blades, iris */}
      <mesh position={[0, 0, 0.4]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.168, 0.168, 0.012, 20]} />
        <meshStandardMaterial
          color="#08080a"
          roughness={0.3}
          metalness={0.4}
          transparent
          opacity={0.72}
        />
      </mesh>
      {blades.map((b, i) => (
        <mesh key={i} position={[b.x, b.y, 0.388]} rotation={[0, 0, b.a]}>
          <boxGeometry args={[0.095, 0.022, 0.008]} />
          <meshStandardMaterial color="#16181c" roughness={0.5} metalness={0.5} />
        </mesh>
      ))}
      <mesh position={[0, 0, 0.368]}>
        <sphereGeometry args={[0.042, 14, 10]} />
        <meshStandardMaterial
          ref={iris}
          color="#2a0f04"
          emissive="#f07828"
          emissiveIntensity={0.75}
          toneMapped={false}
        />
      </mesh>
      <pointLight
        ref={lens}
        position={[0, 0, 0.62]}
        color="#ff9a52"
        intensity={0.6}
        distance={1.6}
        decay={1.7}
      />

      {/* Vent grille where a mouth would be */}
      <mesh position={[0, -0.16, 0.26]}>
        <boxGeometry args={[0.3, 0.13, 0.04]} />
        <meshStandardMaterial color="#14120f" roughness={0.9} />
      </mesh>
      {[-0.04, -0.013, 0.014, 0.041].map((y) => (
        <mesh key={y} position={[0, -0.16 + y, 0.283]}>
          <boxGeometry args={[0.27, 0.013, 0.012]} />
          <meshStandardMaterial color="#5c564c" roughness={0.6} metalness={0.6} />
        </mesh>
      ))}

      {/* Life gauge on the cheek: one lit segment per remaining chamber */}
      <mesh position={[-0.245, -0.03, 0.17]} rotation={[0, -0.42, 0]}>
        <boxGeometry args={[0.15, 0.085, 0.025]} />
        <meshStandardMaterial color="#26221c" roughness={0.75} metalness={0.35} />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh
          key={i}
          position={[-0.302 + i * 0.031, -0.03, 0.178]}
          rotation={[0, -0.42, 0]}
        >
          <boxGeometry args={[0.021, 0.055, 0.01]} />
          <meshStandardMaterial
            color="#191510"
            emissive="#ffa24c"
            emissiveIntensity={i < Math.max(hp, 0) ? 0.85 : 0.03}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* Side pods and a stub antenna */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.3, 0.1, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.058, 0.17, 10]} />
          <meshStandardMaterial color="#33302a" roughness={0.65} metalness={0.5} />
        </mesh>
      ))}
      <mesh position={[0.1, 0.36, -0.05]} rotation={[0, 0, 0.24]}>
        <cylinderGeometry args={[0.007, 0.007, 0.32, 6]} />
        <meshStandardMaterial color="#4a453c" roughness={0.6} metalness={0.5} />
      </mesh>
    </group>
  );
}

// ── Scene ──────────────────────────────────────────────────────────────────

function Scene({
  isYourTurn,
  gunHeld,
  target,
  firing,
  opponentHp,
  opponentHitSignal,
  liveCount,
  blankCount,
  restYaw,
}: Omit<DuelRoom3DProps, "opponentPubkey">) {
  const shells = useMemo(() => {
    const live = Math.min(liveCount, 6);
    const blank = Math.min(blankCount, 6);
    const out: { p: [number, number, number]; r: [number, number, number]; live: boolean }[] = [];
    let i = 0;
    for (let n = 0; n < live; n++) {
      out.push({
        p: [-0.1 + (i % 8) * 0.058, 0.6975, TABLE_Z - 0.48],
        r: [0, 0.12 * n, Math.PI / 2],
        live: true,
      });
      i++;
    }
    for (let n = 0; n < blank; n++) {
      out.push({
        p: [-0.76 + (i % 8) * 0.058, 0.6975, TABLE_Z + 0.42],
        r: [0, 0.09 * n, Math.PI / 2],
        live: false,
      });
      i++;
    }
    return out;
  }, [liveCount, blankCount]);

  return (
    <>
      <color attach="background" args={["#050404"]} />

      {/* Almost no ambient. The room is meant to fall away to nothing. */}
      <ambientLight intensity={0.45} color="#584a40" />
      <hemisphereLight args={["#2a221c", "#0a0706", 0.3]} />

      <Room />
      <Cables />

      <ReflectorLamp position={LAMP_L} rotation={[LAMP_TILT, -0.42, 0]} lit />
      <ReflectorLamp position={LAMP_R} rotation={[LAMP_TILT, 0.42, 0]} lit />

      <AimedSpot
        from={[LAMP_L[0] + 0.06, LAMP_L[1] - 0.14, LAMP_L[2] + 0.1]}
        to={[-0.5, 0.7, TABLE_Z - 0.15]}
        color="#f0c69c"
        intensity={2.6}
        angle={1.12}
        penumbra={1}
      />
      <AimedSpot
        from={[LAMP_R[0] - 0.06, LAMP_R[1] - 0.14, LAMP_R[2] + 0.1]}
        to={[0.5, 0.7, TABLE_Z - 0.05]}
        color="#edbd90"
        intensity={3.4}
        angle={1.12}
        penumbra={1}
        castShadow
      />

      {/* Maroon rim behind the opponent, plus a thin warm bounce in front of
          it so the skull's form reads instead of going to a silhouette. */}
      <pointLight
        position={[0.2, 1.4, -2.7]}
        color="#7a2418"
        intensity={2.4}
        distance={5}
        decay={1.7}
      />
      <pointLight
        position={[-0.15, 1.0, -1.15]}
        color="#c79a68"
        intensity={1.2}
        distance={3.4}
        decay={1.8}
      />

      <Table />

      {/* Table dressing. Back row sits against the far rail, the flanks
          carry their own kit, and the near centre is left to the piece. */}
      {/* Back row, against the far rail: tin, spare cylinder, read-out, and
          the round's chambers laid out in front of the other seat. */}
      <Tin position={[-0.8, 0.765, TABLE_Z - 0.51]} />
      <ChamberBlock
        position={[-0.4, 0.754, TABLE_Z - 0.39]}
        rotation={[0, 0.16, 0]}
      />
      <TelemetryBox
        position={[0.56, 0.757, TABLE_Z - 0.43]}
        rotation={[0, -0.38, 0]}
        liveCount={liveCount}
        blankCount={blankCount}
      />

      {/* Left flank */}
      <Magnifier
        position={[-0.66, 0.692, TABLE_Z + 0.19]}
        rotation={[-Math.PI / 2, 0.2, 0.1]}
      />
      <FlatProp
        url={PROPS.case}
        look={{ color: "#4a3222", roughness: 0.85, metalness: 0.05 }}
        length={0.17}
        position={[-0.56, 0.682, TABLE_Z + 0.21]}
        rotation={[0, 0.2, 0]}
      />

      {/* Right flank */}
      <FlatProp
        url={PROPS.loader}
        look={{ color: "#8a7040", roughness: 0.45, metalness: 0.6 }}
        length={0.2}
        position={[0.72, 0.682, TABLE_Z - 0.27]}
        rotation={[0, 0.24, 0]}
      />
      <Magnifier
        position={[0.62, 0.692, TABLE_Z - 0.06]}
        rotation={[-Math.PI / 2, 0, -0.2]}
      />
      <FlatProp
        url={PROPS.case}
        look={{ color: "#4a3222", roughness: 0.85, metalness: 0.05 }}
        length={0.17}
        position={[0.6, 0.682, TABLE_Z + 0.19]}
        rotation={[0, -0.3, 0]}
      />

      {shells.map((s, i) => (
        <Shell key={i} position={s.p} rotation={s.r} live={s.live} />
      ))}

      {/* A low warm catch along the piece lying on the baize */}
      <pointLight
        position={[0.26, 0.9, TABLE_Z + 0.24]}
        color="#ffd2a2"
        intensity={0.26}
        distance={1.05}
        decay={1.6}
      />
      <Revolver held={gunHeld} target={target} firing={firing} restYaw={restYaw} />
      <Operator hp={opponentHp} hitSignal={opponentHitSignal} />

      {/* Turn cue: the room warms a little when it is your move. */}
      <pointLight
        position={[0, 1.05, TABLE_Z]}
        color="#ffb46a"
        intensity={isYourTurn ? 1.4 : 0.15}
        distance={2.6}
        decay={1.8}
      />
    </>
  );
}

export default function DuelRoom3D(props: DuelRoom3DProps) {
  const { opponentPubkey: _opponentPubkey, raw = false, ...scene } = props;
  return (
    <div className="pointer-events-none absolute inset-0 z-[5] select-none overflow-hidden bg-[#050404]">
      <Canvas
        shadows
        dpr={1}
        // No powerPreference here on purpose: asking for the discrete GPU gets
        // the context dropped outright on a machine that only exposes a shared
        // one, and the whole screen then falls to the error boundary.
        gl={{ antialias: false, alpha: false }}
        camera={{ position: CAM }}
        fallback={
          // Without WebGL the table cannot be drawn. The match still has to be
          // playable, so the room is replaced by its own dark ground and the
          // interface carries on above it.
          <div className="absolute inset-0 bg-[#050404]" />
        }
      >
        <LookAt position={CAM} target={CAM_AIM} baseFov={CAM_FOV} />
        <Scene {...scene} />
        {!raw && <DisplayGrade />}
      </Canvas>
    </div>
  );
}

useGLTF.preload(PROPS.revolver);
useGLTF.preload(PROPS.loader);
useGLTF.preload(PROPS.case);
