#version 150
in vec4 in_pos;
in vec2 in_uv;
in vec4 in_color;
out vec4 out_color;

uniform float width;
uniform vec4 first_color;
uniform vec4 second_color;
uniform vec2 direction;

void main() {
    vec4 color = mix(first_color, second_color, abs(dot(direction, normalize(0.5 - in_uv))));
    color.a *= in_color.a;
    color.a *= 1 - smoothstep(width - 0.1, width, abs(0.4 - length(in_uv - 0.5)));
    if (color.a < 0.001){
        discard;
    }
    out_color = vec4(color.rgb * color.a, color.a);
}
