"use client";

import { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
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
import { Cats, WaitingCat } from "./Cats";
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

/**
 * Hands a snapshot function out of the canvas. The drawing buffer isn't
 * preserved (it cost us the GL context on phones), so the frame has to be
 * re-rendered immediately before reading it back.
 */
function SnapshotBridge({
  onReady,
}: {
  onReady: (takeSnapshot: () => string) => void;
}) {
  const { gl, scene, camera } = useThree();

  useEffect(() => {
    onReady(() => {
      gl.render(scene, camera);
      return gl.domElement.toDataURL("image/png");
    });
  }, [gl, scene, camera, onReady]);

  return null;
}

/**
 * Swings the camera around to face a spot on the planet. Used after
 * writing so you actually watch your own cat arrive, instead of the
 * message appearing somewhere off screen.
 */
function CameraFocus({ target }: { target: Vector3 | null }) {
  const camera = useThree((state) => state.camera);
  const controls = useThree((state) => state.controls) as unknown as
    | { update: () => void }
    | null;
  const goal = useRef<Vector3 | null>(null);

  useEffect(() => {
    if (!target) return;
    goal.current = target.clone().normalize().multiplyScalar(
      camera.position.length(),
    );
  }, [target, camera]);

  useFrame(() => {
    if (!goal.current) return;
    camera.position.lerp(goal.current, 0.09);
    controls?.update();
    if (camera.position.distanceTo(goal.current) < 0.02) goal.current = null;
  });

  return null;
}

export function GlobeCanvas({
  messages,
  pendingNormal,
  focusNormal,
  selectedId,
  onPick,
  onSelectMessage,
  onCloseMessage,
  canDelete,
  deleting,
  deleteError,
  onDeleteMessage,
  onContextLost,
  onSnapshotReady,
}: {
  messages: PlanetMessage[];
  pendingNormal?: Vector3 | null;
  focusNormal?: Vector3 | null;
  selectedId: string | null;
  onPick?: (normal: Vector3, scale: number) => void;
  onSelectMessage: (message: PlanetMessage) => void;
  onCloseMessage: () => void;
  canDelete: boolean;
  deleting: boolean;
  deleteError: string | null;
  onDeleteMessage: () => void;
  onContextLost?: () => void;
  onSnapshotReady?: (takeSnapshot: () => string) => void;
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
      {onSnapshotReady && <SnapshotBridge onReady={onSnapshotReady} />}

      <Nebula />
      <Stars radius={60} depth={30} count={1200} factor={2.4} fade speed={0.4} />

      {/* the planet paints its own light in-shader; these are here for the
          cats, which use standard materials */}
      <ambientLight intensity={1.1} />
      <directionalLight position={[4, 3, 6]} intensity={1.6} color="#fff2f6" />

      <Planet onClick={onPick ? handlePlanetClick : undefined} />

      {messages.length === 0 ? (
        <WaitingCat />
      ) : (
        <Cats
          messages={messages}
          selectedId={selectedId}
          onSelect={onSelectMessage}
          canDelete={canDelete}
          deleting={deleting}
          deleteError={deleteError}
          onDelete={onDeleteMessage}
          onClose={onCloseMessage}
        />
      )}

      {messages.map((message) => (
        <MessageLabel
          key={message.id}
          message={message}
          onSelect={onSelectMessage}
        />
      ))}
      {pendingNormal && <PendingMarker normal={pendingNormal} />}

      <CameraFocus target={focusNormal ?? null} />

      <OrbitControls
        makeDefault
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
