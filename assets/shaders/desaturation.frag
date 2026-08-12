#version 120

uniform sampler2D textureIn;
uniform vec2 texelSize, direction;
uniform float radius;
uniform float weights[256];

#define offset texelSize * direction

void main() {
    vec3 blr = texture2D(textureIn, gl_TexCoord[0].st).rgb * weights[0];

    for (float f = 1.0; f <= radius; f++) {
        blr += texture2D(textureIn, gl_TexCoord[0].st + f * offset).rgb * weights[int(abs(f))];
        blr += texture2D(textureIn, gl_TexCoord[0].st - f * offset).rgb * weights[int(abs(f))];
    }

    float luminance = 0.2126 * blr.r + 0.7152 * blr.g + 0.0722 * blr.b;
    vec3 desaturatedColor = vec3(luminance);

    gl_FragColor = vec4(desaturatedColor, 1.0);
}