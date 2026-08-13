#version 150

in vec4 in_pos;
in vec2 in_uv;
out vec4 out_color;

uniform sampler2D texture_in;
uniform float value;

void main() {
    vec4 color = texture(texture_in, in_uv);
    if (color.a < 0.01){
        discard;
    }
    out_color = vec4(mix(vec3(0), color.rgb, min(1, color.a / value)), color.a);
}