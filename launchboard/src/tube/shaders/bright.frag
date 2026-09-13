uniform sampler2D uImage;
uniform float uThreshold;
varying vec2 vUv;
void main() {
  vec3 c = texture2D(uImage, vUv).rgb;
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  gl_FragColor = vec4(c * smoothstep(uThreshold, 1.0, l), 1.0);
}
