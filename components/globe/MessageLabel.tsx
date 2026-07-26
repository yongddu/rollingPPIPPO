"use client";

import { Text } from "@react-three/drei";
import { Vector3 } from "three";
import { surfacePosition, surfaceQuaternion } from "@/lib/utils/sphere";
import type { PlanetMessage } from "./types";

const FONT = "/fonts/Pretendard-Regular.subset.woff";

/** Base font size in world units, before the message's own scale is applied. */
const BASE_FONT_SIZE = 0.075;

export function MessageLabel({ message }: { message: PlanetMessage }) {
  const normal = new Vector3(
    message.pos_x,
    message.pos_y,
    message.pos_z,
  ).normalize();

  return (
    <group
      position={surfacePosition(normal)}
      quaternion={surfaceQuaternion(normal)}
    >
      <Text
        font={FONT}
        fontSize={BASE_FONT_SIZE * message.scale}
        maxWidth={1.4 * message.scale}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
        color="#2b2350"
        outlineWidth={0.004 * message.scale}
        outlineColor="#ffffff"
      >
        {message.body}
      </Text>
      <Text
        font={FONT}
        fontSize={BASE_FONT_SIZE * message.scale * 0.6}
        position={[0, -BASE_FONT_SIZE * message.scale * 1.1, 0]}
        anchorX="center"
        anchorY="middle"
        color="#5c4f8f"
      >
        {`— ${message.nickname}`}
      </Text>
    </group>
  );
}
