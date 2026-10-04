"use client";

import React, { useRef, Suspense } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

type DiegeticRevolverProps = {
  isYourTurn: boolean;
  gunHeld: boolean;
  target: "self" | "opponent";
  firing: "live" | "blank" | null;
};

// Procedural Fallback Mesh
function ProceduralRevolverMesh() {
  return (
    <group scale={0.4}>
      {/* Barrel */}
      <mesh position={[0, 0.12, -0.6]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.045, 0.048, 0.7, 16]} />
        <meshStandardMaterial color="#1a1410" roughness={0.35} metalness={0.9} />
      </mesh>
      {/* 8-Chamber Cylinder */}
      <mesh position={[0, 0.12, -0.15]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.24, 8]} />
        <meshStandardMaterial color="#c6a15b" roughness={0.25} metalness={0.95} />
      </mesh>
      {/* Receiver Frame */}
      <mesh position={[0, 0.08, -0.05]}>
        <boxGeometry args={[0.16, 0.2, 0.35]} />
        <meshStandardMaterial color="#221a14" roughness={0.4} metalness={0.8} />
      </mesh>
      {/* Grip */}
      <mesh position={[0, -0.18, 0.12]} rotation={[-0.45, 0, 0]}>
        <boxGeometry args={[0.11, 0.35, 0.14]} />
        <meshStandardMaterial color="#3d1e11" roughness={0.7} />
      </mesh>
    </group>
  );
}

// GLTF Mesh Loader from Meshy Asset
function LoadedRevolverGLTF() {
  const { scene } = useGLTF("/models/revolver_occult.glb");
  const cloned = React.useMemo(() => scene.clone(), [scene]);
  return <primitive object={cloned} scale={0.35} rotation={[0, -Math.PI / 2, 0]} />;
}

export function DiegeticRevolver({
  isYourTurn,
  gunHeld,
  target,
  firing,
}: DiegeticRevolverProps) {
  const groupRef = useRef<THREE.Group>(null);
  const flashLightRef = useRef<THREE.PointLight>(null);
  const recoilRef = useRef(0);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    // Trigger recoil kick when firing
    if (firing) {
      recoilRef.current = 1.0;
    } else {
      recoilRef.current = THREE.MathUtils.lerp(recoilRef.current, 0, delta * 8);
    }

    const recoilRot = recoilRef.current * 0.45;
    const recoilZ = recoilRef.current * 0.15;

    if (!gunHeld) {
      // Resting on the table center
      const restPos = new THREE.Vector3(0, 0.04, 0);
      groupRef.current.position.lerp(restPos, delta * 6);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, delta * 6);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, Math.PI / 2, delta * 6);
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0, delta * 6);
      return;
    }

    // In-hand aiming
    if (target === "opponent") {
      // Aiming across the table
      const aimPos = new THREE.Vector3(
        0.18 + Math.sin(t * 1.5) * 0.005,
        0.18 + Math.cos(t * 2) * 0.005,
        0.75 + recoilZ
      );
      groupRef.current.position.lerp(aimPos, delta * 8);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -0.05 - recoilRot, delta * 10);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, 0, delta * 8);
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0.02, delta * 8);
    } else {
      // Aiming at SELF (turned 180 degrees pointing at player camera)
      const selfAimPos = new THREE.Vector3(
        0.05 + Math.sin(t * 1.5) * 0.004,
        0.15 + Math.cos(t * 2) * 0.004,
        0.95 + recoilZ
      );
      groupRef.current.position.lerp(selfAimPos, delta * 8);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0.2 + recoilRot, delta * 10);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, Math.PI, delta * 8);
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0, delta * 8);
    }

    // Muzzle flash visibility
    if (flashLightRef.current) {
      flashLightRef.current.intensity = firing === "live" && recoilRef.current > 0.5 ? 25 : 0;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.04, 0]}>
      <Suspense fallback={<ProceduralRevolverMesh />}>
        <LoadedRevolverGLTF />
      </Suspense>

      {/* Muzzle Flash PointLight */}
      <pointLight
        ref={flashLightRef}
        position={[0, 0.12, -0.9]}
        color="#ff7b00"
        intensity={0}
        distance={3}
        decay={2}
      />
    </group>
  );
}

useGLTF.preload("/models/revolver_occult.glb");
