/**
 * Shared GLSL: hash-based 3D value noise + fbm, used for the planet's
 * cloud bands and the nebula backdrop. Cheap enough to run per-pixel on
 * phones, which matters since most traffic here arrives from Instagram.
 */
export const noiseGLSL = /* glsl */ `
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float valueNoise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);

    return mix(
      mix(
        mix(hash(i + vec3(0.0, 0.0, 0.0)), hash(i + vec3(1.0, 0.0, 0.0)), u.x),
        mix(hash(i + vec3(0.0, 1.0, 0.0)), hash(i + vec3(1.0, 1.0, 0.0)), u.x),
        u.y
      ),
      mix(
        mix(hash(i + vec3(0.0, 0.0, 1.0)), hash(i + vec3(1.0, 0.0, 1.0)), u.x),
        mix(hash(i + vec3(0.0, 1.0, 1.0)), hash(i + vec3(1.0, 1.0, 1.0)), u.x),
        u.y
      ),
      u.z
    );
  }

  // 3 octaves: enough structure for cloud wisps, cheap enough that a
  // mid-range phone keeps its WebGL context under the domain warping below
  float fbm(vec3 p) {
    float total = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 3; i++) {
      total += valueNoise(p) * amplitude;
      p *= 2.02;
      amplitude *= 0.5;
    }
    return total;
  }
`;
