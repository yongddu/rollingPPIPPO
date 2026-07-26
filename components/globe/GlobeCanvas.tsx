"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { MAX_DISTANCE, MIN_DISTANCE } from "@/lib/utils/sphere";
import { Planet } from "./Planet";
import { MessageLabel } from "./MessageLabel";
import type { PlanetMessage } from "./types";

export function GlobeCanvas({ messages }: { messages: PlanetMessage[] }) {
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

      <Planet />
      {messages.map((message) => (
        <MessageLabel key={message.id} message={message} />
      ))}

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
