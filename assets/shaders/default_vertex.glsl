#version 150

in vec3 pos;
in vec2 uv;
in vec4 color;

out vec4 in_pos;
out vec2 in_uv;
out vec4 in_color;

uniform mat4 u_projection;
uniform mat4 u_model;

void main() {
    in_uv = uv;
    in_pos = u_projection * u_model * vec4(pos, 1.0);
    gl_Position = in_pos;
    in_color = color.bgra;
}