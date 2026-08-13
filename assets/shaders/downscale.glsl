#version 150

in vec2 in_uv;
out vec4 out_color;

uniform sampler2D texture_in;
uniform vec2 texel_size;// 1 / source_resolution

void main() {
    vec2 o = texel_size;

    vec4 color =
    texture(texture_in, in_uv + vec2(-o.x, -o.y)) +
    texture(texture_in, in_uv + vec2(o.x, -o.y)) +
    texture(texture_in, in_uv + vec2(-o.x, o.y)) +
    texture(texture_in, in_uv + vec2(o.x, o.y));

    out_color = color * 0.25;
}
