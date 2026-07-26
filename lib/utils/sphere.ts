import { Quaternion, Vector3 } from "three";

/** Radius of the planet mesh in world units. */
export const PLANET_RADIUS = 2;

/** How far above the surface message text floats, to avoid z-fighting. */
const TEXT_OFFSET = 0.015;

/** Camera distance range OrbitControls is clamped to. */
export const MIN_DISTANCE = 2.6;
export const MAX_DISTANCE = 8;

/** Text scale range, mapped from camera distance at write time. */
const MIN_SCALE = 0.3;
const MAX_SCALE = 3;

/**
 * Zoomed in (close camera) writes small text, zoomed out writes big text —
 * so a message covers roughly the same portion of screen as it did while
 * being placed.
 */
export function distanceToScale(distance: number) {
  const t = (distance - MIN_DISTANCE) / (MAX_DISTANCE - MIN_DISTANCE);
  const clamped = Math.min(1, Math.max(0, t));
  return MIN_SCALE + clamped * (MAX_SCALE - MIN_SCALE);
}

/** Where a message's text mesh sits, given its stored unit vector. */
export function surfacePosition(normal: Vector3) {
  return normal.clone().multiplyScalar(PLANET_RADIUS + TEXT_OFFSET);
}

/** Rotation that lays text flat against the surface at `normal`. */
export function surfaceQuaternion(normal: Vector3) {
  return new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), normal);
}
