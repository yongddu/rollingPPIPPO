"use client";

import { Text } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { Vector3 } from "three";
import {
  BASE_FONT_SIZE,
  surfacePosition,
  surfaceQuaternion,
} from "@/lib/utils/sphere";
import type { PlanetMessage } from "./types";

const FONT = "/fonts/Pretendard-Regular.subset.woff";

export function MessageLabel({
  message,
  onSelect,
}: {
  message: PlanetMessage;
  onSelect?: (message: PlanetMessage) => void;
}) {
  const normal = new Vector3(
    message.pos_x,
    message.pos_y,
    message.pos_z,
  ).normalize();

  function handleClick(event: ThreeEvent<MouseEvent>) {
    if (!onSelect) return;
    // otherwise the planet underneath opens the composer as well
    event.stopPropagation();
    onSelect(message);
  }

  return (
    <group
      position={surfacePosition(normal)}
      quaternion={surfaceQuaternion(normal)}
      onClick={onSelect ? handleClick : undefined}
    >
      <Text
        font={FONT}
        fontSize={BASE_FONT_SIZE * message.scale}
        maxWidth={BASE_FONT_SIZE * message.scale * 14}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
        color="#ffffff"
        outlineWidth={0.006 * message.scale}
        outlineColor="#241a3f"
        outlineOpacity={0.85}
      >
        {message.body}
      </Text>
      <Text
        font={FONT}
        fontSize={BASE_FONT_SIZE * message.scale * 0.6}
        position={[0, -BASE_FONT_SIZE * message.scale * 1.1, 0]}
        anchorX="center"
        anchorY="middle"
        color="#f4e9ff"
        outlineWidth={0.004 * message.scale}
        outlineColor="#241a3f"
        outlineOpacity={0.7}
      >
        {`— ${message.nickname}`}
      </Text>
    </group>
  );
}
