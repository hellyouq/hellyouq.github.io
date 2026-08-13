#version 150

in vec2 in_uv;
in vec4 in_color;
out vec4 out_color;

uniform vec2 center = vec2(0.5, 0.5);
uniform float radius;
uniform vec3 bands = vec3(0.33, 0.66, 1.0);
uniform float pinch = 0.8;

void main() {
    vec2  p = abs(in_uv - center);
    float pwr = pinch;
    float d = pow(pow(p.x, pwr) + pow(p.y, pwr), 1.0 / pwr);

    float r1 = radius * bands.x;
    float r2 = radius * bands.y;
    float r3 = radius * bands.z;

    float w  = fwidth(d);
    float a1 = 1.0 - smoothstep(r1, r1 + w, d);
    float a2 = smoothstep(r1, r1 + w, d) * (1.0 - smoothstep(r2, r2 + w, d));
    float a3 = smoothstep(r2, r2 + w, d) * (1.0 - smoothstep(r3, r3 + w, d));

    float alpha = a1 * 1.0 + a2 * 0.5 + a3 * 0.2;
    if (alpha <= 0.0) discard;
    out_color = vec4(in_color.rgb, in_color.a * alpha);
}