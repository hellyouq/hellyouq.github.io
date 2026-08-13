#version 150

in vec4 in_pos;
in vec2 in_uv;
in vec4 in_color;
out vec4 out_color;

uniform sampler2D texture_in;
uniform vec2 direction;

void main() {
    float mult = 0.5 + (dot(direction, normalize(in_pos.xy / 10)) / 2 + 0.5) * 0.5;
    out_color = vec4(in_color.rgb * mult, in_color.a) * texture(texture_in, in_uv);
}