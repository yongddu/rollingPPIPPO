"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  CatmullRomCurve3,
  Group,
  Matrix4,
  MeshStandardMaterial,
  TubeGeometry,
  Vector3,
} from "three";
import { PLANET_RADIUS } from "@/lib/utils/sphere";
import { hashString, seededRandom } from "@/lib/utils/random";
import { createFurTexture } from "./fur";

/**
 * Height of a cat in world units — about a twentieth of the planet's
 * diameter, so it reads as a character without upstaging the messages.
 */
const S = 0.22;

const EYE_COLORS = ["#3b8c7a", "#c9a227", "#5b7fbf", "#2f2b38"];

/** Clicks should reach the planet underneath, not stop at the cat. */
const ignoreRaycast = () => null;

/** Hip offsets: [left/right, front/back]. */
const LEGS: [number, number][] = [
  [-1, 1],
  [1, 1],
  [-1, -1],
  [1, -1],
];

export function Cat({ seed }: { seed: string }) {
  const group = useRef<Group>(null);
  const tail = useRef<Group>(null);
  const head = useRef<Group>(null);
  const legs = useRef<(Group | null)[]>([]);

  const look = useMemo(() => {
    const random = seededRandom(hashString(seed));
    const { texture, coat } = createFurTexture(random);

    return {
      texture,
      coat,
      eye: EYE_COLORS[Math.floor(random() * EYE_COLORS.length)],
      speed: 0.22 + random() * 0.22,
      phase: random() * Math.PI * 2,
      // spread cats over the whole sphere instead of clustering
      start: new Vector3(
        random() * 2 - 1,
        random() * 2 - 1,
        random() * 2 - 1,
      ).normalize(),
      startHeading: random() * Math.PI * 2,
    };
  }, [seed]);

  useEffect(() => () => look.texture.dispose(), [look]);

  const furMaterial = useMemo(
    () => new MeshStandardMaterial({ map: look.texture, roughness: 0.95 }),
    [look],
  );

  useEffect(() => () => furMaterial.dispose(), [furMaterial]);

  const tailGeometry = useMemo(() => {
    const curve = new CatmullRomCurve3([
      new Vector3(0, 0, 0),
      new Vector3(0, S * 0.22, -S * 0.22),
      new Vector3(0, S * 0.48, -S * 0.34),
      new Vector3(0, S * 0.66, -S * 0.16),
    ]);
    return new TubeGeometry(curve, 12, S * 0.055, 6, false);
  }, []);

  useEffect(() => () => tailGeometry.dispose(), [tailGeometry]);

  const state = useMemo(() => {
    const position = look.start.clone();
    // any direction perpendicular to the surface normal is a valid heading
    const heading = new Vector3(0, 1, 0).cross(position).normalize();
    heading.applyAxisAngle(position, look.startHeading);
    return { position, heading, elapsed: 0 };
  }, [look]);

  useFrame((_, delta) => {
    if (!group.current) return;

    const step = Math.min(delta, 0.1);
    state.elapsed += step;

    // curve the heading slowly so the path meanders instead of tracing
    // the same great circle forever
    const turn = Math.sin(state.elapsed * 0.6 + look.phase) * 0.7 * step;
    state.heading.applyAxisAngle(state.position, turn);

    // walk forward along the surface: rotating both vectors about the
    // axis perpendicular to them keeps the cat glued to the sphere
    const axis = new Vector3()
      .crossVectors(state.position, state.heading)
      .normalize();
    const angle = (look.speed * step) / PLANET_RADIUS;
    state.position.applyAxisAngle(axis, angle).normalize();
    state.heading.applyAxisAngle(axis, angle);

    // drift accumulates in floating point; re-square the heading against
    // the normal so the cat never sinks into or lifts off the surface
    state.heading
      .sub(
        state.position
          .clone()
          .multiplyScalar(state.heading.dot(state.position)),
      )
      .normalize();

    const up = state.position;
    const forward = state.heading;
    const right = up.clone().cross(forward);

    const stride = state.elapsed * look.speed * 26;
    const bob = Math.abs(Math.sin(stride)) * S * 0.05;

    group.current.position
      .copy(up)
      .multiplyScalar(PLANET_RADIUS + S * 0.46 + bob);
    group.current.setRotationFromMatrix(
      new Matrix4().makeBasis(right, up, forward),
    );

    // diagonal pairs swing together, the way a cat actually walks
    legs.current.forEach((leg, index) => {
      if (!leg) return;
      const diagonal = index === 0 || index === 3 ? 0 : Math.PI;
      leg.rotation.x = Math.sin(stride + diagonal) * 0.5;
    });

    if (tail.current) {
      tail.current.rotation.z = Math.sin(state.elapsed * 2.6 + look.phase) * 0.4;
      tail.current.rotation.x =
        -0.35 + Math.sin(state.elapsed * 1.7) * 0.12;
    }

    if (head.current) {
      head.current.rotation.y = Math.sin(state.elapsed * 0.9 + look.phase) * 0.3;
    }
  });

  return (
    <group ref={group}>
      {/* body */}
      <mesh
        raycast={ignoreRaycast}
        material={furMaterial}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, -S * 0.05]}
      >
        <capsuleGeometry args={[S * 0.28, S * 0.42, 4, 12]} />
      </mesh>

      <group ref={head} position={[0, S * 0.3, S * 0.42]}>
        {/* head */}
        <mesh raycast={ignoreRaycast} material={furMaterial} scale={[1, 0.92, 0.95]}>
          <sphereGeometry args={[S * 0.29, 16, 14]} />
        </mesh>

        {/* muzzle */}
        <mesh
          raycast={ignoreRaycast}
          material={furMaterial}
          position={[0, -S * 0.08, S * 0.2]}
          scale={[1.15, 0.8, 0.85]}
        >
          <sphereGeometry args={[S * 0.14, 12, 10]} />
        </mesh>

        {/* nose */}
        <mesh
          raycast={ignoreRaycast}
          position={[0, -S * 0.03, S * 0.31]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <coneGeometry args={[S * 0.045, S * 0.05, 6]} />
          <meshStandardMaterial color="#e08a9b" roughness={0.7} />
        </mesh>

        {/* ears */}
        {[-1, 1].map((side) => (
          <group
            key={side}
            position={[side * S * 0.17, S * 0.24, -S * 0.02]}
            rotation={[0, 0, side * -0.3]}
          >
            <mesh raycast={ignoreRaycast} material={furMaterial}>
              <coneGeometry args={[S * 0.12, S * 0.2, 4]} />
            </mesh>
            <mesh raycast={ignoreRaycast} position={[0, -S * 0.01, S * 0.04]}>
              <coneGeometry args={[S * 0.07, S * 0.13, 4]} />
              <meshStandardMaterial color="#f0aebc" roughness={0.85} />
            </mesh>
          </group>
        ))}

        {/* eyes */}
        {[-1, 1].map((side) => (
          <mesh
            key={side}
            raycast={ignoreRaycast}
            position={[side * S * 0.12, S * 0.03, S * 0.24]}
          >
            <sphereGeometry args={[S * 0.05, 10, 10]} />
            <meshStandardMaterial
              color={look.eye}
              roughness={0.25}
              emissive={look.eye}
              emissiveIntensity={0.25}
            />
          </mesh>
        ))}
      </group>

      {/* legs — hip at the top so the swing pivots correctly */}
      {LEGS.map(([x, z], index) => (
        <group
          key={`${x}${z}`}
          ref={(node) => {
            legs.current[index] = node;
          }}
          position={[x * S * 0.19, -S * 0.2, z * S * 0.2]}
        >
          <mesh
            raycast={ignoreRaycast}
            material={furMaterial}
            position={[0, -S * 0.13, 0]}
          >
            <capsuleGeometry args={[S * 0.065, S * 0.16, 3, 8]} />
          </mesh>
        </group>
      ))}

      {/* tail */}
      <group ref={tail} position={[0, S * 0.15, -S * 0.4]}>
        <mesh
          raycast={ignoreRaycast}
          material={furMaterial}
          geometry={tailGeometry}
        />
      </group>
    </group>
  );
}
