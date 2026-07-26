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
import { Nebula } from "./Nebula";
import { Cat } from "./Cat";
import { MessageLabel } from "./MessageLabel";
import type { PlanetMessage } from "./types";

/** Pointer travel (px) above which a click is treated as a drag, not a pick. */
const DRAG_THRESHOLD = 4;

function PendingMarker({ normal }: { normal: Vector3 }) {
  return (
    <group position={surfacePosition(normal)} quaternion={surfaceQuaternion(normal)}>
      <mesh raycast={() => null}>
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
  onSelectMessage,
  onContextLost,
}: {
  messages: PlanetMessage[];
  pendingNormal?: Vector3 | null;
  onPick?: (normal: Vector3, scale: number) => void;
  onSelectMessage?: (message: PlanetMessage) => void;
  onContextLost?: () => void;
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
      dpr={[1, 1.5]}
      onCreated={({ gl }) => {
        // phones under memory pressure drop the GL context and leave a
        // black rectangle behind; surface it so the page can offer a retry
        gl.domElement.addEventListener("webglcontextlost", (event) => {
          event.preventDefault();
          onContextLost?.();
        });
      }}
    >
      <Nebula />
      <Stars radius={60} depth={30} count={1200} factor={2.4} fade speed={0.4} />

      {/* the planet paints its own light in-shader; these are here for the
          cat, which uses a standard material */}
      <ambientLight intensity={1.1} />
      <directionalLight position={[4, 3, 6]} intensity={1.6} color="#fff2f6" />

      <Planet onClick={onPick ? handlePlanetClick : undefined} />
      <Cat />
      {messages.map((message) => (
        <MessageLabel
          key={message.id}
          message={message}
          onSelect={onSelectMessage}
        />
      ))}
      {pendingNormal && <PendingMarker normal={pendingNormal} />}

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
