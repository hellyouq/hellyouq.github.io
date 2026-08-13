#version 150

in vec4 in_pos;
in vec2 in_uv;
out vec4 out_color;

uniform sampler2D texture_in;
uniform float offset;
uniform vec2 texel_size;

void main() {
    vec2 off = texel_size * offset;
    vec4 color = vec4(0.0);

    color += texture(texture_in, in_uv);
    color += texture(texture_in, in_uv - off);
    color += texture(texture_in, in_uv + off);
    color += texture(texture_in, in_uv + vec2(-off.x, off.y));
    color += texture(texture_in, in_uv + vec2(off.x, -off.y));
    color += texture(texture_in, in_uv + vec2(-off.x * 3, 0));
    color += texture(texture_in, in_uv + vec2(off.x * 3, 0));
    color += texture(texture_in, in_uv + vec2(0, off.y * 3));
    color += texture(texture_in, in_uv + vec2(0, -off.y * 3));

    out_color = color / 9;
}