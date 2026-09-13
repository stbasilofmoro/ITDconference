uniform sampler2D uImage;
uniform sampler2D uBloom;
uniform float uTime;
uniform float uCurvature;
uniform float uCornerRadius;
uniform float uChroma;
uniform float uBloomAmt;
uniform float uMaskStrength;
uniform float uMaskType;
uniform float uMaskPx;
uniform float uScanStrength;
uniform float uScanBeamMin;
uniform float uScanBeamMax;
uniform float uScanlines;
uniform float uRollBand;
uniform float uFlicker;
uniform float uVignette;
uniform float uGlass;
uniform float uGrain;
uniform float uWarmup;
uniform float uDegauss;
uniform float uStatic;
uniform float uRoll;
uniform float uFlash;
varying vec2 vUv;

const vec2 CONTENT = vec2(1920.0, 1080.0);
const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);

vec2 barrel(vec2 uv, float k) {
  vec2 p = uv * 2.0 - 1.0;
  float s = (1.0 + k * dot(p, p)) / (1.0 + 2.0 * k);
  return p * s * 0.5 + 0.5;
}

float tubeMask(vec2 uv, float r) {
  vec2 p = abs((uv - 0.5) * CONTENT);
  vec2 d = max(p - (CONTENT * 0.5 - r), 0.0);
  float outside = max(max(abs(uv.x - 0.5) - 0.5, abs(uv.y - 0.5) - 0.5) * CONTENT.y, length(d) - r);
  return 1.0 - smoothstep(-1.5, 1.5, outside);
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 uv = vUv;

  // Degauss wobble (boot)
  uv.x += uDegauss * 0.012 * sin(uv.y * 38.0 + uTime * 40.0);

  // Warm-up: image collapses to a horizontal line and opens vertically
  float open = max(uWarmup, 0.002);
  uv.y = (uv.y - 0.5) / open + 0.5;

  // Curvature: screen-space tube UV -> content UV
  vec2 c = barrel(uv, uCurvature);
  if (uRoll > 0.0) c.y = fract(c.y + uRoll);
  float inBounds = step(0.0, c.x) * step(c.x, 1.0) * step(0.0, c.y) * step(c.y, 1.0);

  // Convergence error: split R/B horizontally, stronger toward the edges
  vec2 cc = c - 0.5;
  vec2 off = vec2(cc.x * uChroma * 8.0 * dot(cc, cc) + uChroma * sign(cc.x), 0.0);
  vec3 col = vec3(
    texture2D(uImage, c + off).r,
    texture2D(uImage, c).g,
    texture2D(uImage, c - off).b
  );

  // Bloom
  col += texture2D(uBloom, c).rgb * uBloomAmt;

  // Scanlines: beam gets wider on bright pixels
  float lum = clamp(dot(col, LUMA), 0.0, 1.0);
  float beam = mix(uScanBeamMin, uScanBeamMax, lum);
  float lineCoord = c.y * uScanlines;
  // Band-limit: fade the scanline modulation out as lines approach the pixel Nyquist limit
  float fw = fwidth(lineCoord);
  float scanAA = 1.0 - smoothstep(0.25, 0.5, fw);
  float scanAmt = uScanStrength * scanAA;
  float d = abs(fract(lineCoord) - 0.5) * 2.0;
  float scan = exp(-2.0 * (d / beam) * (d / beam));
  col *= mix(1.0, scan, scanAmt) * (1.0 + scanAmt * 0.4);

  // Phosphor mask in device pixels
  vec2 fc = gl_FragCoord.xy;
  float stripe = max(uMaskPx / 3.0, 1.0);
  float idx = mod(floor(fc.x / stripe), 3.0);
  vec3 m = vec3(equal(vec3(idx), vec3(0.0, 1.0, 2.0)));
  if (uMaskType > 0.5) {
    float column = floor(fc.x / (stripe * 3.0));
    float rowPhase = mod(fc.y + mod(column, 2.0) * 2.0, 4.0);
    m *= mix(0.45, 1.0, step(1.0, rowPhase));
  }
  vec3 maskMul = mix(vec3(1.0), m + (1.0 - m) * 0.1, uMaskStrength);
  col *= maskMul * (1.0 + uMaskStrength * 0.9);

  // Refresh band and flicker
  float bandY = fract(vUv.y - uTime * 0.12);
  float band = smoothstep(0.0, 0.08, bandY) * (1.0 - smoothstep(0.08, 0.16, bandY));
  col *= 1.0 + uRollBand * band;
  col *= 1.0 - uFlicker * (0.5 + 0.5 * sin(uTime * 377.0));

  // Channel-change static
  float n = hash(floor(fc / 2.0) + floor(uTime * 60.0));
  col = mix(col, vec3(n), clamp(uStatic, 0.0, 1.0) * 0.85);

  col *= inBounds;

  // Warm-up line and flashes
  col += vec3(1.5 * (1.0 - uWarmup) * exp(-pow((vUv.y - 0.5) / 0.004, 2.0)));
  col += vec3(uFlash);

  // Vignette
  vec2 vv = vUv * (1.0 - vUv.yx);
  col *= pow(clamp(vv.x * vv.y * 16.0, 0.0, 1.0), uVignette * 0.6);

  // Glass reflection and grain
  float hl = exp(-pow(length((vUv - vec2(0.28, 0.82)) * vec2(1.0, 1.6)) / 0.35, 2.0));
  col += vec3(hl * uGlass);
  col += (hash(fc + fract(uTime)) - 0.5) * uGrain;

  // Physical tube shape; the glass outside the phosphor area is near-black
  col = mix(vec3(0.012), max(col, 0.0), tubeMask(vUv, uCornerRadius));

  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
