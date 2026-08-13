#version 150

in vec4 in_pos;
in vec2 in_uv;
out vec4 out_color;

uniform sampler2D texture_in;
uniform float alpha;

void main() {
    out_color = texture(texture_in, in_uv);
    float gray = dot(out_color.rgb, vec3(0.299, 0.587, 0.114));
    out_color = vec4(mix(out_color.rgb, vec3(gray), alpha), out_color.a);
}
