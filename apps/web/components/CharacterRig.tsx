/// <reference types="@react-three/fiber" />
"use client";

import { useGLTF, useAnimations } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const MODEL_CHARACTER = "/models/character.glb";

export type CharacterState = "idle" | "hit" | "dead" | "win";

// KayKit skeleton clip names — verified from the GLB (95 clips shipped).
// Standing idle only: the sit clips fold the rig down to ~0.7m and the
// table top (0.45m) hides it completely. A standing character rising
// above the table edge reads as "the Opponent" — the intended look.
const IDLE_CLIPS = ["Idle", "Idle_B"];
const DEATH_CLIPS = ["Death_A", "Death_B", "Death_C"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pickAction(actions: Record<string, any>, names: string[]) {
  for (const n of names) {
    if (actions[n]) return actions[n] as THREE.AnimationAction;
  }
  return null;
}

/**
 * KayKit Skeleton_Minion character (CC0) — idle sway + hit reaction only.
 * No weapon grip / reload / fire animation by design: the FPS gun stays
 * independent. All motion is spring/lerp-damped — nothing snaps.
 */
export function CharacterRig({
  hue = 12,
  state = "idle",
  isTurn = false,
  hitSignal = 0,
  position = [0, 0, 0] as [number, number, number],
  rotationY = 0,
  scale = 0.62,
}: {
  /** 0-360 — deterministic hue per player, kept dark/saturated for the CRT mood */
  hue?: number;
  state?: CharacterState;
  isTurn?: boolean;
  /** timestamp — each change triggers one damped hit impulse */
  hitSignal?: number;
  position?: [number, number, number];
  rotationY?: number;
  scale?: number;
}) {
  const mixerGroup = useRef<THREE.Group>(null);
  const tiltGroup = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(MODEL_CHARACTER);
  const { actions } = useAnimations(animations, mixerGroup);

  const model = useMemo(() => {
    const cloned = scene.clone(true);
    const eyeColor = new THREE.Color().setHSL(((hue % 360) / 360) * 1.0, 0.85, 0.6);
    cloned.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      // meshopt quantization bakes a corrective scale into the inverse-bind
      // matrices but leaves stale (tiny) bounding spheres on the meshes —
      // disable frustum culling so the character is never wrongly clipped.
      mesh.frustumCulled = false;
      mesh.castShadow = true;
      // `scene.clone(true)` shares material instances across every clone — two
      // CharacterRig instances would otherwise bleed hue into each other.
      // Clone each material once per character so per-player colors stay isolated.
      const mats = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).map(
        (mat) => (mat as THREE.Material).clone(),
      );
      mesh.material = Array.isArray(mesh.material) ? mats : mats[0];
      const n = mesh.name.toLowerCase();
      mats.forEach((mat) => {
        const m = mat as THREE.MeshStandardMaterial;
        if (n.includes("eye")) {
          m.color = eyeColor.clone();
          m.emissive = eyeColor.clone();
          m.emissiveIntensity = 1.6;
        } else if (n.includes("cloak")) {
          m.color = new THREE.Color().setHSL(((hue % 360) / 360) * 1.0, 0.4, 0.1);
        } else {
          m.color = new THREE.Color().setHSL(((hue % 360) / 360) * 1.0, 0.5, 0.36);
        }
        m.roughness = Math.min(m.roughness + 0.1, 1);
      });
    });
    return cloned;
  }, [scene, hue]);

  // ── Clip management: standing idle always, death crossfade once ─────────
  useEffect(() => {
    if (!actions) return;
    const base = pickAction(actions, IDLE_CLIPS);
    if (base && !base.isRunning()) {
      base.reset().fadeIn(0.7).play();
    }
  }, [actions]);

  const prevState = useRef<CharacterState>("idle");
  useEffect(() => {
    if (!actions || prevState.current === state) return;
    const wasDead = prevState.current === "dead";
    prevState.current = state;

    if (state === "dead") {
      const death = pickAction(actions, DEATH_CLIPS);
      if (death) {
        const base = pickAction(actions, IDLE_CLIPS);
        base?.fadeOut(0.35);
        death.reset().fadeIn(0.35).setLoop(THREE.LoopOnce, 1);
        death.clampWhenFinished = true;
        death.play();
      }
    } else if (wasDead || state === "win") {
      const death = pickAction(actions, DEATH_CLIPS);
      death?.fadeOut(0.4);
      const base = pickAction(actions, IDLE_CLIPS);
      base?.reset().fadeIn(0.6).play();
    }
  }, [state, actions]);

  // ── Procedural motion: breathing, turn lean, hit impulse, slump ─────
  const hitAt = useRef<number>(-999);
  useEffect(() => {
    if (hitSignal > 0) hitAt.current = -1; // pending → stamped in useFrame
  }, [hitSignal]);

  useFrame(({ clock }, delta) => {
    const g = tiltGroup.current;
    if (!g) return;
    const t = clock.elapsedTime;
    const damp = Math.min(1, delta * 5); // smooth lerp factor for all targets

    if (hitAt.current === -1) hitAt.current = t; // stamp on next frame

    // Breathing + idle sway — always alive, never wooden
    const breathe = Math.sin(t * 1.6) * 0.008;
    const sway = Math.sin(t * 1.05) * 0.012;

    // Hit impulse: damped oscillation, fully decays to zero
    let hitPitch = 0;
    let hitRoll = 0;
    if (hitAt.current > -900) {
      const el = t - hitAt.current;
      if (el < 1.0) {
        const env = Math.exp(-el * 6);
        hitPitch = -env * Math.cos(el * 16) * 0.22; // jerk backward
        hitRoll = env * Math.sin(el * 13) * 0.05;
      } else {
        hitAt.current = -999;
      }
    }

    // Turn lean — slight forward pitch when it's this character's turn
    const leanTarget = isTurn ? 0.07 : 0;

    // Death slump / win proud-pose, layered on top of clip animation
    const statePitch = state === "dead" ? 0.55 : state === "win" ? -0.06 : 0;

    const targetPitch = statePitch + leanTarget + breathe + hitPitch;
    const targetRoll = sway + hitRoll;

    g.rotation.x += (targetPitch - g.rotation.x) * damp;
    g.rotation.z += (targetRoll - g.rotation.z) * damp;
  });

  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      <group ref={tiltGroup}>
        <group ref={mixerGroup}>
          <primitive object={model} />
        </group>
      </group>
    </group>
  );
}

useGLTF.preload(MODEL_CHARACTER);
