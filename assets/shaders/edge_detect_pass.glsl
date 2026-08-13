#version 150

in vec4 in_pos;
in vec2 in_uv;
out vec4 out_color;

uniform sampler2D texture_in;
uniform vec2 texel_size;
uniform vec4 color;

void main() {
    vec4 center = texture(texture_in, in_uv);

    if (center.a != 0.0) {
        discard;
    }
    float aplha = 0;

    for (float dx = -1; dx <= 1; ++dx) {
        for (float dy = -1; dy <= 1; ++dy) {
            vec2 off = vec2(texel_size.x * dx, texel_size.y * dy);
            vec4 c = texture(texture_in, in_uv + off);
            if (c.a > 0) {
                aplha += max(0.0, (dx * dx + dy * dy) / 3);
            }
        }
    }

    out_color = vec4(color.rgb, color.a * aplha);
}