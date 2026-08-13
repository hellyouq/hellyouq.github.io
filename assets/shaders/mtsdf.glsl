#version 150

in vec4 in_pos;
in vec4 in_color;
in vec2 in_uv;
out vec4 out_color;

uniform sampler2D texture_in;
uniform float pixel_range;
uniform float line_thickness;
uniform float anti_alias_smoothness;

float calculateMTSDF(vec3 sample3D) {
    float dR = sample3D.r - 0.5;
    float dG = sample3D.g - 0.5;
    float dB = sample3D.b - 0.5;

    float median = max(min(sample3D.r, sample3D.g), min(max(sample3D.r, sample3D.g), sample3D.b)) - 0.5;

    float mean = (dR + dG + dB) / 3.0;
    float variance = ((dR - mean) * (dR - mean) + (dG - mean) * (dG - mean) + (dB - mean) * (dB - mean)) / 3.0;
    float correction = variance * 0.5;
    return median + (median < 0.0 ? -correction : correction);
}

void main() {
    float dist = calculateMTSDF(texture(texture_in, in_uv).rgb) + line_thickness;
    vec2 deriv = vec2(dFdx(in_uv.x), dFdy(in_uv.y)) * textureSize(texture_in, 0);
    float pixelScale = pixel_range * inversesqrt(dot(deriv, deriv));
    float alpha = smoothstep(-anti_alias_smoothness, anti_alias_smoothness, dist * pixelScale);
    vec4 outputColor = vec4(in_color.rgb, in_color.a * alpha);

    out_color = outputColor;
}