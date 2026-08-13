#version 150

in vec2 in_uv;
in vec4 in_color;
out vec4 out_color;

uniform vec2 center = vec2(0.5, 0.5);
uniform float radius = 0.1;
uniform float intensity = 1.0;
uniform vec3 u_color = vec3(1.0, 1.0, 1.0);

void main() {
    float d = length(in_uv - center);

    if (d > radius * 5) {
        out_color = vec4(0.0);
        return;
    }

    float v = exp(- (d * d) / (radius * radius) * 4.0);
    float alpha = clamp(v * intensity, 0.0, 1.0);

    if (alpha <= 0.0) {
        out_color = vec4(0.0);
        return;
    }

    vec3 color = u_color * (alpha * 1.5);

    color *= in_color.rgb;
    out_color = vec4(color, alpha * in_color.a);
}