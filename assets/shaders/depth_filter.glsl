#version 150

in vec4 in_pos;
in vec2 in_uv;
in vec4 in_color;
out vec4 out_color;

uniform sampler2D texture_in;
uniform sampler2D depth_texture_in;
uniform mat4 invProjection;
uniform mat4 invView;
uniform float dist;

vec3 reconstructWorldPosition(vec2 uv, float depth) {
    float z = depth * 2.0 - 1.0;

    vec4 clipPos = vec4(in_pos.xy, z, 1.0);

    vec4 viewPos = invProjection * clipPos;
    viewPos /= viewPos.w;

    vec4 worldPos = invView * viewPos;
    return worldPos.xyz;
}

void main() {
    vec3 d = reconstructWorldPosition(in_uv, texture(depth_texture_in, in_uv).r);
    float factor = smoothstep(dist, dist + 25, length(d));
    vec4 color = texture(texture_in, in_uv);
    out_color = vec4(mix(in_color.rgb, color.rgb, (1 - in_color.a)), factor * color.a);
}