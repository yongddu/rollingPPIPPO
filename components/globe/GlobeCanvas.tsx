"use client";

import { Canvas, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { Vector3 } from "three";
import {
  MAX_DISTANCE,
  MIN_DISTANCE,
  distanceToScale,
  surfacePosition,
  surfaceQuaternion,
} from "@/lib/utils/sphere";
import { Planet } from "./Planet";
import { MessageLabel } from "./MessageLabel";
import type { PlanetMessage } from "./types";

/** Pointer travel (px) above which a click is treated as a drag, not a pick. */
const DRAG_THRESHOLD = 4;

function PendingMarker({ normal }: { normal: Vector3 }) {
  return (
    <group position={surfacePosition(normal)} quaternion={surfaceQuaternion(normal)}>
      <mesh>
        <ringGeometry args={[0.045, 0.06, 32]} />
        <meshBasicMaterial color="#fff6b0" transparent opacity={0.9} />
      </mesh>
    </group>
  );
}

export function GlobeCanvas({
  messages,
  pendingNormal,
  onPick,
}: {
  messages: PlanetMessage[];
  pendingNormal?: Vector3 | null;
  onPick?: (normal: Vector3, scale: number) => void;
}) {
  function handlePlanetClick(event: ThreeEvent<MouseEvent>) {
    if (!onPick || event.delta > DRAG_THRESHOLD) return;
    event.stopPropagation();

    // stored in the planet's own space so positions survive any future
    // idle rotation of the globe
    const local = event.object.worldToLocal(event.point.clone()).normalize();
    onPick(local, distanceToScale(event.camera.position.length()));
  }

  return (
    <Canvas
      camera={{ position: [0, 0, 6.4], fov: 45 }}
      // needed so the share card can snapshot the canvas later (Phase 5)
      gl={{ preserveDrawingBuffer: true }}
    >
      <color attach="background" args={["#100e28"]} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 3, 5]} intensity={1.4} color="#fff0f5" />
      <directionalLight position={[-5, -2, -3]} intensity={0.5} color="#7fd7ff" />

      <Planet onClick={onPick ? handlePlanetClick : undefined} />
      {messages.map((message) => (
        <MessageLabel key={message.id} message={message} />
      ))}
      {pendingNormal && <PendingMarker normal={pendingNormal} />}

      <Stars radius={60} depth={40} count={1500} factor={3} fade speed={0.6} />

      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.5}
        zoomSpeed={0.6}
        minDistance={MIN_DISTANCE}
        maxDistance={MAX_DISTANCE}
      />
    </Canvas>
  );
}
