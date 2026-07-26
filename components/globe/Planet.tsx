"use client";

import { PLANET_RADIUS } from "@/lib/utils/sphere";

export function Planet() {
  return (
    <mesh>
      <sphereGeometry args={[PLANET_RADIUS, 64, 64]} />
      <meshStandardMaterial color="#b9a7f0" roughness={0.75} metalness={0.05} />
    </mesh>
  );
}
