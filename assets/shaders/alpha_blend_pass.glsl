#version 150

in vec4 in_pos;
in vec2 in_uv;
out vec4 out_color;

uniform sampler2D texture_in;
uniform sampler2D u_texture_in;
uniform float alpha_threshold;

void main() {
    vec4 mainColor = texture(texture_in, vec2(in_uv.x, 1 - in_uv.y));

    if (mainColor.a <= alpha_threshold) {
        discard;
    }

    vec4 blurColor = texture(u_texture_in, in_uv);
    out_color = vec4(blurColor.rgb, clamp(mainColor.a * 2, 0, 1));
}