#version 150

in vec4 in_pos;
in vec4 in_color;
in vec2 in_uv;
out vec4 out_color;

uniform sampler2D texture_in;
uniform sampler2D texture_jf;
uniform vec2 texelSize;
uniform float radius;
uniform float time;

void main() {
    vec4 c = texture(texture_jf, in_uv);

    out_color = vec4(vec3(1), (sin(c.z + time)) * (1 - smoothstep(radius - 2, radius + 2, c.z)) * (1 - step(0.01, texture(texture_in, in_uv).a))) * in_color;
}