"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BackSide, Color, ShaderMaterial, Vector3 } from "three";
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
  uniform vec3 uTeal;
  uniform vec3 uMagenta;
  uniform vec3 uWarm;
  uniform vec3 uBandAxis;

  varying vec3 vLocal;

  ${noiseGLSL}

  void main() {
    vec3 dir = normalize(vLocal);
    vec3 p = dir * 2.2;
    float drift = uTime * 0.005;

    // warping the sample point before the ridged pass is what turns
    // even noise into clouds that look blown by something
    float warpA = fbm(p + vec3(drift, 1.3, 0.0));
    float warpB = fbm(p * 1.7 + vec3(0.0, drift, 4.1));
    vec3 warp = vec3(warpA, warpB, warpA * warpB);

    float filaments = fbmRidged(p * 1.15 + warp * 2.6);
    float haze = fbm(p * 0.55 + warp * 1.1);

    // a galaxy band sweeping across the sky, so the clouds have a
    // direction instead of sitting evenly in every direction
    float band = 1.0 - smoothstep(0.0, 0.38, abs(dot(dir, uBandAxis)));

    // space is mostly empty: the band gates almost all of the cloud, so
    // the sky stays black except where the galaxy actually runs
    float density = filaments * (0.05 + 0.95 * band) + haze * 0.08 * band;

    vec3 color = uVoid;
    color = mix(color, uTeal, smoothstep(0.22, 0.62, density) * 0.9);
    color = mix(color, uMagenta, smoothstep(0.45, 0.88, density) * 0.75);
    color += uWarm * pow(smoothstep(0.7, 1.0, density), 2.0) * 0.5;

    // two star layers: a dense faint one for depth, a sparse bright one
    // for the few stars that carry a visible glow
    vec2 faint = starField(dir, 260.0, 0.955, 0.16);
    vec2 bright = starField(dir, 85.0, 0.982, 0.34);

    vec3 cool = vec3(0.72, 0.85, 1.0);
    vec3 warmStar = vec3(1.0, 0.86, 0.74);

    color += vec3(0.9) * faint.x * 0.85;
    color += mix(cool, warmStar, bright.y) * bright.x * 1.7;
    // halo around the bright ones, standing in for a bloom pass we can't
    // afford on phones
    color += mix(cool, warmStar, bright.y) * pow(bright.x, 0.35) * 0.12;

    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;

export function Nebula() {
  const material = useRef<ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uVoid: { value: new Color("#05040f") },
      uTeal: { value: new Color("#1c6f96") },
      uMagenta: { value: new Color("#8c3f86") },
      uWarm: { value: new Color("#f0a184") },
      uBandAxis: { value: new Vector3(-0.45, 0.76, 0.28).normalize() },
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
