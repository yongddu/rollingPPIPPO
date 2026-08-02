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

/** How far a cat will wander from the message it belongs to, in radians. */
const LEASH = 0.3;

const EYE_COLORS = ["#3b8c7a", "#c9a227", "#5b7fbf", "#2f2b38"];

/** Clicks land on the invisible hit sphere, not the individual parts. */
const ignoreRaycast = () => null;

/** Hip offsets: [left/right, front/back]. */
const LEGS: [number, number][] = [
  [-1, 1],
  [1, 1],
  [-1, -1],
  [1, -1],
];

export function Cat({
  seed,
  anchor,
  sitting = false,
  onTap,
  children,
}: {
  seed: string;
  anchor: Vector3;
  sitting?: boolean;
  onTap?: () => void;
  children?: React.ReactNode;
}) {
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
      // slow enough that tapping one isn't whack-a-mole on a phone
      speed: 0.09 + random() * 0.09,
      phase: random() * Math.PI * 2,
      offset: random() * Math.PI * 2,
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
    const home = anchor.clone().normalize();
    // start a little off the message so the cat doesn't cover it
    const position = home.clone();
    const heading = new Vector3(0, 1, 0).cross(position).normalize();
    heading.applyAxisAngle(position, look.offset);
    position.applyAxisAngle(
      new Vector3().crossVectors(position, heading).normalize(),
      LEASH * 0.6,
    );

    return { home, position, heading, elapsed: 0, settle: 0 };
  }, [anchor, look]);

  useFrame((_, delta) => {
    if (!group.current) return;

    const step = Math.min(delta, 0.1);
    state.elapsed += step;

    // ease in and out of sitting so a tap doesn't snap the legs
    state.settle += ((sitting ? 1 : 0) - state.settle) * Math.min(1, step * 6);
    const walking = 1 - state.settle;

    if (walking > 0.01) {
      const turn = Math.sin(state.elapsed * 0.6 + look.phase) * 0.8 * step;
      state.heading.applyAxisAngle(state.position, turn);

      // a cat belongs to one message, so steer it back when it strays
      const away = Math.acos(
        Math.min(1, Math.max(-1, state.position.dot(state.home))),
      );
      if (away > LEASH) {
        const toHome = state.home
          .clone()
          .sub(state.position.clone().multiplyScalar(state.position.dot(state.home)))
          .normalize();
        state.heading.lerp(toHome, Math.min(1, step * 2.5)).normalize();
      }

      const axis = new Vector3()
        .crossVectors(state.position, state.heading)
        .normalize();
      const angle = (look.speed * walking * step) / PLANET_RADIUS;
      state.position.applyAxisAngle(axis, angle).normalize();
      state.heading.applyAxisAngle(axis, angle);
    }

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

    const stride = state.elapsed * look.speed * 34;
    const bob = Math.abs(Math.sin(stride)) * S * 0.05 * walking;
    // sitting drops the hindquarters a little
    const seat = state.settle * S * 0.12;

    group.current.position
      .copy(up)
      .multiplyScalar(PLANET_RADIUS + S * 0.46 + bob - seat);
    group.current.setRotationFromMatrix(
      new Matrix4().makeBasis(right, up, forward),
    );
    group.current.rotateX(state.settle * -0.25);

    // diagonal pairs swing together, the way a cat actually walks
    legs.current.forEach((leg, index) => {
      if (!leg) return;
      const diagonal = index === 0 || index === 3 ? 0 : Math.PI;
      leg.rotation.x = Math.sin(stride + diagonal) * 0.5 * walking;
    });

    if (tail.current) {
      // an interested cat holds its tail up and flicks it faster
      const flick = sitting ? 4.2 : 2.6;
      tail.current.rotation.z =
        Math.sin(state.elapsed * flick + look.phase) * (sitting ? 0.22 : 0.4);
      tail.current.rotation.x =
        -0.35 + state.settle * -0.5 + Math.sin(state.elapsed * 1.7) * 0.12;
    }

    if (head.current) {
      head.current.rotation.y =
        Math.sin(state.elapsed * 0.9 + look.phase) * 0.3 * walking;
    }
  });

  return (
    <group ref={group}>
      {/* one invisible hit target: cheaper and far easier to tap than the
          individual body parts, especially on a phone */}
      <mesh onClick={onTap ? (event) => {
        event.stopPropagation();
        onTap();
      } : undefined} visible={false}>
        <sphereGeometry args={[S * 1.25, 8, 8]} />
      </mesh>

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

      {children}
    </group>
  );
}
