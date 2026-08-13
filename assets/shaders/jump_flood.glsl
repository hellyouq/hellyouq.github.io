#version 150

in vec4 in_pos;
in vec2 in_uv;
out vec4 out_color;

uniform sampler2D textureIn;
uniform vec2 texelSize;

vec3 jump(vec3 minSeed, vec2 current, vec2 offset) {
    vec2 samplePos = current + offset;
    if (length(clamp(samplePos, 0, 1) - samplePos) > .0001f) {
        return minSeed;
    }
    vec4 s = texture(textureIn, samplePos);
    vec2 seed = s.rg;
    vec2 cScaled = floor(current * textureSize(textureIn, 0));
    vec2 sScaled = floor(seed * textureSize(textureIn, 0));
    float dist = distance(cScaled, sScaled);
    if (dist < minSeed.z) {
        return vec3(seed.x, seed.y, dist);
    }
    return minSeed;
}

void main() {
    vec2 jumpDist = texelSize;

    vec3 curr = vec3(-1, -1, 9999999);
    curr = jump(curr, in_uv, jumpDist * vec2(0, 0));
    curr = jump(curr, in_uv, jumpDist * vec2(0, + 1));
    curr = jump(curr, in_uv, jumpDist * vec2(+ 1, + 1));
    curr = jump(curr, in_uv, jumpDist * vec2(+ 1, 0));
    curr = jump(curr, in_uv, jumpDist * vec2(+ 1, -1));
    curr = jump(curr, in_uv, jumpDist * vec2(0, -1));
    curr = jump(curr, in_uv, jumpDist * vec2(-1, -1));
    curr = jump(curr, in_uv, jumpDist * vec2(-1, 0));
    curr = jump(curr, in_uv, jumpDist * vec2(-1, + 1));

    out_color = vec4(curr.x, curr.y, curr.z, 1);
}