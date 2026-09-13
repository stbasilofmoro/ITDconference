uniform sampler2D uCurrent;
uniform sampler2D uPrev;
uniform float uDecay;
varying vec2 vUv;
void main() {
  vec3 c = texture2D(uCurrent, vUv).rgb;
  vec3 p = texture2D(uPrev, vUv).rgb * uDecay;
  gl_FragColor = vec4(max(c, p), 1.0);
}
