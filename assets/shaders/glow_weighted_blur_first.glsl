#version 150

in vec4 in_pos;
in vec2 in_uv;
out vec4 out_color;

uniform sampler2D texture_in;
uniform vec2 texel_size;
uniform vec4 color;
uniform float radius;
uniform float weights[7];

#define OFFSET (vec2(1, 0) * texel_size)

float alphaStep(float alpha) {
    return 1 - step(alpha, 0.01);
}

void main() {
    float innerAlpha = alphaStep(texture(texture_in, in_uv).a) * weights[0];
    for (float r = 1.0; r <= radius; r++) {
        float w = weights[int(r)];
        innerAlpha += alphaStep(texture(texture_in, in_uv + OFFSET * r).a) * w;
        innerAlpha += alphaStep(texture(texture_in, in_uv - OFFSET * r).a) * w;
    }
    out_color = vec4(color.rgb, color.a * innerAlpha);
}