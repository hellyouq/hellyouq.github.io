#version 150

in vec4 in_pos;
in vec4 in_color;
in vec2 in_uv;
out vec4 out_color;

uniform sampler2D texture_in;
uniform sampler2D depth_in;
uniform sampler2D depth_entity_in;
uniform vec2 near_far;

#define linearizeDepth(depth, near, far) (2.0 * near * far) / (far + near - depth * (far - near))

void main() {
    float d = linearizeDepth(texture(depth_in, in_uv).r, near_far.x, near_far.y) / near_far.y;
    float d1 = linearizeDepth(texture(depth_entity_in, in_uv).r, near_far.x, near_far.y) / near_far.y;
    if (d + 0.0001 >= d1){
        discard;
    }
    vec4 color = texture(texture_in, in_uv);
    out_color = vec4(in_color.rgb, in_color.a * step(0.01, color.a));
}