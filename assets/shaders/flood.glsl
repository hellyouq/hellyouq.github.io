#version 150

in vec4 in_pos;
in vec2 in_uv;
in vec4 in_color;
out vec4 out_color;

uniform sampler2D texture_in;
uniform vec2 texel_size;

void main() {
    vec4 center = texture(texture_in, in_uv);
    const float THRESHOLD = 0.1;
    if (center.a > THRESHOLD) {
        out_color = vec4(center.rgb, 1);
        return;
    }

    vec2 ts = texel_size;
    vec4 s;


    s = texture(texture_in, in_uv + vec2(0.0, 1.0) * ts);
    if (s.a > THRESHOLD) { out_color = vec4(s.rgb, 1); return; }

    s = texture(texture_in, in_uv + vec2(1.0, 1.0) * ts);
    if (s.a > THRESHOLD) { out_color = vec4(s.rgb, 1); return; }

    s = texture(texture_in, in_uv + vec2(1.0, 0.0) * ts);
    if (s.a > THRESHOLD) { out_color = vec4(s.rgb, 1); return; }

    s = texture(texture_in, in_uv + vec2(1.0, -1.0) * ts);
    if (s.a > THRESHOLD) { out_color = vec4(s.rgb, 1); return; }

    s = texture(texture_in, in_uv + vec2(0.0, -1.0) * ts);
    if (s.a > THRESHOLD) { out_color = vec4(s.rgb, 1); return; }

    s = texture(texture_in, in_uv + vec2(-1.0, -1.0) * ts);
    if (s.a > THRESHOLD) { out_color = vec4(s.rgb, 1); return; }

    s = texture(texture_in, in_uv + vec2(-1.0, 0.0) * ts);
    if (s.a > THRESHOLD) { out_color = vec4(s.rgb, 1); return; }

    s = texture(texture_in, in_uv + vec2(-1.0, 1.0) * ts);
    if (s.a > THRESHOLD) { out_color = vec4(s.rgb, 1); return; }

    out_color = vec4(s.rgb, 1);
}