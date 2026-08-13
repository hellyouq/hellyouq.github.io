#version 150

in vec4 in_pos;
in vec2 in_uv;
out vec4 out_color;

uniform sampler2D textureIn;

void main() {
    vec4 color = texture(textureIn, in_uv);
    out_color = mix(vec4(-1), vec4(in_uv, 0.0, 1.0), step(0.01, color.a));
}