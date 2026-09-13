uniform sampler2D uImage;
uniform vec2 uDirection; // one texel along the blur axis
varying vec2 vUv;
void main() {
  vec3 s = texture2D(uImage, vUv).rgb * 0.2270270270;
  s += texture2D(uImage, vUv + uDirection * 1.3846153846).rgb * 0.3162162162;
  s += texture2D(uImage, vUv - uDirection * 1.3846153846).rgb * 0.3162162162;
  s += texture2D(uImage, vUv + uDirection * 3.2307692308).rgb * 0.0702702703;
  s += texture2D(uImage, vUv - uDirection * 3.2307692308).rgb * 0.0702702703;
  gl_FragColor = vec4(s, 1.0);
}
