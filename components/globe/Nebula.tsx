"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BackSide, Color, ShaderMaterial } from "three";
import { noiseGLSL } from "./shaders/noise";

const vertexShader = /* glsl */ `
  varying vec3 vLocal;

  void main() {
    vLocal = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uVoid;
  uniform vec3 uCloudA;
  uniform vec3 uCloudB;

  varying vec3 vLocal;

  ${noiseGLSL}

  void main() {
    vec3 dir = normalize(vLocal);
    vec3 p = dir * 2.4;
    float drift = uTime * 0.006;

    float warpA = fbm(p + vec3(drift, 1.3, 0.0));
    float warpB = fbm(p + vec3(0.0, drift, 4.1));
    vec3 warp = vec3(warpA, warpB, warpA * warpB);
    float clouds = fbm(p * 1.3 + warp * 2.4);

    vec3 color = uVoid;
    color = mix(color, uCloudA, smoothstep(0.42, 0.78, clouds) * 0.85);
    color = mix(color, uCloudB, smoothstep(0.62, 0.95, clouds) * 0.7);

    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;

export function Nebula() {
  const material = useRef<ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uVoid: { value: new Color("#0a0820") },
      uCloudA: { value: new Color("#3b2a63") },
      uCloudB: { value: new Color("#a05a83") },
    }),
    [],
  );

  useFrame((_, delta) => {
    if (material.current) {
      material.current.uniforms.uTime.value += delta;
    }
  });

  return (
    <mesh raycast={() => null}>
      <sphereGeometry args={[70, 32, 32]} />
      <shaderMaterial
        ref={material}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        side={BackSide}
        depthWrite={false}
      />
    </mesh>
  );
}
