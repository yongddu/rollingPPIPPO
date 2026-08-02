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

  // Folding the noise around its midpoint leaves sharp creases instead of
  // soft blobs — that's what reads as the filaments and wisps of a nebula,
  // and as the marbled bands on the planet.
  float fbmRidged(vec3 p) {
    float total = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 4; i++) {
      float n = 1.0 - abs(valueNoise(p) * 2.0 - 1.0);
      total += n * n * amplitude;
      p *= 2.13;
      amplitude *= 0.5;
    }
    return total;
  }

  // One jittered star per cell. Returns brightness and a per-star random,
  // used to tint some of them warm and some blue.
  vec2 starField(vec3 dir, float cells, float threshold, float radius) {
    vec3 sp = dir * cells;
    vec3 cell = floor(sp);
    vec3 f = fract(sp);

    float present = hash(cell);
    if (present < threshold) return vec2(0.0);

    vec3 jitter = vec3(
      hash(cell + 1.3),
      hash(cell + 2.7),
      hash(cell + 5.1)
    );
    float d = length(f - jitter);
    float core = 1.0 - smoothstep(0.0, radius, d);

    return vec2(pow(core, 3.0), hash(cell + 9.2));
  }
`;
