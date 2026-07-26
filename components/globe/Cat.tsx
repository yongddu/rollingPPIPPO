"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, Matrix4, Mesh, Vector3 } from "three";
import { PLANET_RADIUS } from "@/lib/utils/sphere";

/**
 * Height of the cat in world units — about a twentieth of the planet's
 * diameter, so it reads as a character without upstaging the messages.
 */
const CAT_SIZE = 0.22;

/** Surface travel speed, in world units per second. */
const SPEED = 0.32;

const FUR = "#fff3e2";
const FUR_SHADE = "#f2d9c0";
const PINK = "#f3a6b8";
const DARK = "#3b2f4a";

/** Clicks should reach the planet underneath, not stop at the cat. */
const ignoreRaycast = () => null;

export function Cat() {
  const group = useRef<Group>(null);
  const tail = useRef<Mesh>(null);

  const state = useMemo(() => {
    // start somewhere random so every planet's cat is doing its own thing
    const position = new Vector3(
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
    ).normalize();

    // any direction perpendicular to the surface normal is a valid heading
    const heading = new Vector3(0, 1, 0)
      .cross(position)
      .normalize();

    return {
      position,
      heading,
      wanderPhase: Math.random() * Math.PI * 2,
      elapsed: 0,
    };
  }, []);

  useFrame((_, delta) => {
    if (!group.current) return;

    const step = Math.min(delta, 0.1);
    state.elapsed += step;

    // curve the heading slowly so the path meanders instead of tracing
    // the same great circle forever
    const turn =
      Math.sin(state.elapsed * 0.6 + state.wanderPhase) * 0.7 * step;
    state.heading.applyAxisAngle(state.position, turn);

    // walk forward along the surface: rotating both vectors about the
    // axis perpendicular to them keeps the cat glued to the sphere
    const axis = new Vector3()
      .crossVectors(state.position, state.heading)
      .normalize();
    const angle = (SPEED * step) / PLANET_RADIUS;
    state.position.applyAxisAngle(axis, angle).normalize();
    state.heading.applyAxisAngle(axis, angle);

    // drift accumulates in floating point; re-square the heading against
    // the normal so the cat never sinks into or lifts off the surface
    state.heading
      .sub(state.position.clone().multiplyScalar(state.heading.dot(state.position)))
      .normalize();

    const up = state.position;
    const forward = state.heading;
    const right = up.clone().cross(forward);

    const bob = Math.abs(Math.sin(state.elapsed * 7)) * CAT_SIZE * 0.12;
    group.current.position
      .copy(up)
      .multiplyScalar(PLANET_RADIUS + CAT_SIZE * 0.42 + bob);
    group.current.setRotationFromMatrix(
      new Matrix4().makeBasis(right, up, forward),
    );

    if (tail.current) {
      tail.current.rotation.z = Math.sin(state.elapsed * 3.4) * 0.35;
    }
  });

  return (
    <group ref={group}>
      {/* body */}
      <mesh raycast={ignoreRaycast} position={[0, 0, -CAT_SIZE * 0.1]}>
        <sphereGeometry args={[CAT_SIZE * 0.42, 16, 16]} />
        <meshStandardMaterial color={FUR} roughness={0.9} />
      </mesh>

      {/* head */}
      <mesh raycast={ignoreRaycast} position={[0, CAT_SIZE * 0.22, CAT_SIZE * 0.4]}>
        <sphereGeometry args={[CAT_SIZE * 0.32, 16, 16]} />
        <meshStandardMaterial color={FUR} roughness={0.9} />
      </mesh>

      {/* ears */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          raycast={ignoreRaycast}
          position={[
            side * CAT_SIZE * 0.17,
            CAT_SIZE * 0.45,
            CAT_SIZE * 0.36,
          ]}
          rotation={[0, 0, side * -0.25]}
        >
          <coneGeometry args={[CAT_SIZE * 0.12, CAT_SIZE * 0.2, 4]} />
          <meshStandardMaterial color={PINK} roughness={0.9} />
        </mesh>
      ))}

      {/* eyes */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          raycast={ignoreRaycast}
          position={[
            side * CAT_SIZE * 0.13,
            CAT_SIZE * 0.24,
            CAT_SIZE * 0.66,
          ]}
        >
          <sphereGeometry args={[CAT_SIZE * 0.05, 8, 8]} />
          <meshStandardMaterial color={DARK} roughness={0.6} />
        </mesh>
      ))}

      {/* legs */}
      {[
        [-1, 1],
        [1, 1],
        [-1, -1],
        [1, -1],
      ].map(([x, z]) => (
        <mesh
          key={`${x}${z}`}
          raycast={ignoreRaycast}
          position={[
            x * CAT_SIZE * 0.22,
            -CAT_SIZE * 0.34,
            z * CAT_SIZE * 0.22,
          ]}
        >
          <cylinderGeometry
            args={[CAT_SIZE * 0.07, CAT_SIZE * 0.07, CAT_SIZE * 0.22, 8]}
          />
          <meshStandardMaterial color={FUR_SHADE} roughness={0.9} />
        </mesh>
      ))}

      {/* tail */}
      <mesh
        ref={tail}
        raycast={ignoreRaycast}
        position={[0, CAT_SIZE * 0.2, -CAT_SIZE * 0.45]}
        rotation={[0.9, 0, 0]}
      >
        <cylinderGeometry
          args={[CAT_SIZE * 0.04, CAT_SIZE * 0.06, CAT_SIZE * 0.5, 8]}
        />
        <meshStandardMaterial color={FUR_SHADE} roughness={0.9} />
      </mesh>
    </group>
  );
}
