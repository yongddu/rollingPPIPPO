"use client";

import { useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { BackSide, Color, ShaderMaterial } from "three";
import { PLANET_RADIUS } from "@/lib/utils/sphere";
import { noiseGLSL } from "./shaders/noise";

/** Direction the "sun" comes from, matching the scene's key light. */
const LIGHT_DIR = "normalize(vec3(0.55, 0.35, 0.75))";

const surfaceVertex = /* glsl */ `
  varying vec3 vLocal;
  varying vec3 vNormalW;
  varying vec3 vViewDir;

  void main() {
    vLocal = position;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vViewDir = normalize(cameraPosition - worldPos.xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const surfaceFragment = /* glsl */ `
  uniform float uTime;
  uniform vec3 uDeep;
  uniform vec3 uMid;
  uniform vec3 uWarm;
  uniform vec3 uVein;
  uniform vec3 uRim;

  varying vec3 vLocal;
  varying vec3 vNormalW;
  varying vec3 vViewDir;

  ${noiseGLSL}

  void main() {
    vec3 p = normalize(vLocal) * 1.9;
    float drift = uTime * 0.012;

    // domain warping turns plain fbm into the swirled, wind-blown look
    // of the reference photo rather than uniform static
    float warpA = fbm(p + vec3(drift, 0.0, 0.0));
    float warpB = fbm(p + vec3(0.0, drift, 3.7));
    vec3 warp = vec3(warpA, warpB, warpA * warpB);
    float clouds = fbm(p * 1.6 + warp * 2.1);
    // the low-frequency warp doubles as the banding, saving an fbm call
    float bands = warpA;
    // the ridged pass creases the noise into marbled veins rather than
    // the soft blobs plain fbm gives
    float veins = fbmRidged(p * 1.45 + warp * 2.4);

    // fbm lands in a narrow band around 0.45; stretch it so the colour
    // ramp actually reaches both ends instead of sitting in the middle
    float b = clamp((bands - 0.28) / 0.30, 0.0, 1.0);
    float c = clamp((clouds - 0.34) / 0.28, 0.0, 1.0);
    float v = clamp((veins - 0.30) / 0.38, 0.0, 1.0);

    vec3 base = mix(uDeep, uMid, smoothstep(0.1, 0.85, b));
    base = mix(base, uWarm, smoothstep(0.45, 1.0, c) * 0.95);
    base = mix(base, uVein, smoothstep(0.68, 1.0, v) * 0.45);

    // molten highlights along the sharpest veins
    base += uRim * pow(smoothstep(0.85, 1.0, v), 2.0) * 0.3;
    base += uRim * smoothstep(0.86, 1.0, c) * 0.15;

    vec3 lightDir = ${LIGHT_DIR};
    // half-lambert keeps the night side readable instead of pure black
    float diffuse = dot(normalize(vNormalW), lightDir) * 0.5 + 0.5;
    base *= 0.16 + 0.95 * diffuse * diffuse;

    // tight and bright — the limb is the single feature that sells
    // "this thing has an atmosphere"
    float fresnel = pow(1.0 - max(dot(normalize(vNormalW), vViewDir), 0.0), 4.0);
    base += uRim * fresnel * 0.65;

    gl_FragColor = vec4(base, 1.0);
    #include <colorspace_fragment>
  }
`;

const atmosphereVertex = /* glsl */ `
  varying vec3 vNormalW;
  varying vec3 vViewDir;

  void main() {
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vViewDir = normalize(cameraPosition - worldPos.xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const atmosphereFragment = /* glsl */ `
  uniform vec3 uGlow;

  varying vec3 vNormalW;
  varying vec3 vViewDir;

  void main() {
    // rendered on the back faces, so the normal points away from us and
    // the glow piles up exactly at the silhouette
    float rim = pow(max(dot(normalize(vNormalW), -vViewDir), 0.0), 2.2);
    float lit = smoothstep(-0.45, 0.85, dot(normalize(vNormalW), ${LIGHT_DIR}));
    gl_FragColor = vec4(uGlow, rim * (0.3 + 0.7 * lit) * 1.05);
    #include <colorspace_fragment>
  }
`;

export function Planet({
  onClick,
}: {
  onClick?: (event: ThreeEvent<MouseEvent>) => void;
}) {
  const surface = useRef<ShaderMaterial>(null);

  const surfaceUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDeep: { value: new Color("#0b2247") },
      uMid: { value: new Color("#1a6b8c") },
      uWarm: { value: new Color("#cf8068") },
      uVein: { value: new Color("#8f4fa3") },
      uRim: { value: new Color("#9fe8ff") },
    }),
    [],
  );

  const atmosphereUniforms = useMemo(
    () => ({ uGlow: { value: new Color("#7fdcf0") } }),
    [],
  );

  useFrame((_, delta) => {
    if (surface.current) {
      surface.current.uniforms.uTime.value += delta;
    }
  });

  return (
    <group>
      <mesh onClick={onClick}>
        <sphereGeometry args={[PLANET_RADIUS, 64, 64]} />
        <shaderMaterial
          ref={surface}
          vertexShader={surfaceVertex}
          fragmentShader={surfaceFragment}
          uniforms={surfaceUniforms}
        />
      </mesh>

      <mesh scale={1.07} raycast={() => null}>
        <sphereGeometry args={[PLANET_RADIUS, 64, 64]} />
        <shaderMaterial
          vertexShader={atmosphereVertex}
          fragmentShader={atmosphereFragment}
          uniforms={atmosphereUniforms}
          transparent
          side={BackSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
