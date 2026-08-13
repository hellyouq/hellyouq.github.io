#version 150

in vec2 in_uv;
out vec4 out_color;

uniform sampler2D texture_in;
uniform vec2 texel_size;

uniform int radius;// <= 6
uniform float weights[30];// weights[0..radius]
uniform vec2 direction;// (1,0) or (0,1)

void main() {
    vec2 offset = texel_size * direction;

    vec4 color = texture(texture_in, in_uv) * weights[0];

    for (int r = 1; r <= radius; r++) {
        float w = weights[r];
        vec2 o = offset * float(r);
        color += texture(texture_in, in_uv + o) * w;
        color += texture(texture_in, in_uv - o) * w;
    }

    out_color = color;
}
