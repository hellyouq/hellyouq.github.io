#version 150

in vec4 in_pos;
in vec2 in_uv;
out vec4 out_color;

uniform sampler2D texture_in;

void main() {
    out_color = texture(texture_in, in_uv);
}