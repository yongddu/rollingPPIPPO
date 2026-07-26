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

    // fbm lands in a narrow band around 0.45; stretch it so the colour
    // ramp actually reaches both ends instead of sitting in the middle
    float b = clamp((bands - 0.28) / 0.30, 0.0, 1.0);
    float c = clamp((clouds - 0.34) / 0.28, 0.0, 1.0);

    vec3 base = mix(uDeep, uMid, smoothstep(0.1, 0.85, b));
    base = mix(base, uWarm, smoothstep(0.45, 1.0, c) * 0.95);

    // bright wisps where the cloud field peaks
    base += uRim * smoothstep(0.8, 1.0, c) * 0.22;

    vec3 lightDir = ${LIGHT_DIR};
    // half-lambert keeps the night side readable instead of pure black
    float diffuse = dot(normalize(vNormalW), lightDir) * 0.5 + 0.5;
    base *= 0.2 + 1.15 * diffuse * diffuse;

    float fresnel = pow(1.0 - max(dot(normalize(vNormalW), vViewDir), 0.0), 3.5);
    base += uRim * fresnel * 0.4;

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
    float rim = pow(max(dot(normalize(vNormalW), -vViewDir), 0.0), 2.6);
    float lit = smoothstep(-0.45, 0.85, dot(normalize(vNormalW), ${LIGHT_DIR}));
    gl_FragColor = vec4(uGlow, rim * (0.28 + 0.72 * lit) * 0.85);
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
      uDeep: { value: new Color("#155d78") },
      uMid: { value: new Color("#8f77c4") },
      uWarm: { value: new Color("#f0a2b4") },
      uRim: { value: new Color("#8fe4f0") },
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

      <mesh scale={1.055} raycast={() => null}>
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
