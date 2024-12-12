import { Shaders } from 'gl-react';

export const FilterShaders = {
  none: Shaders.create({
    frag: "precision highp float; varying vec2 uv; uniform sampler2D t; void main() { gl_FragColor = texture2D(t, uv); }"
  }),
  
  beauty: Shaders.create({
    frag: "precision highp float; varying vec2 uv; uniform sampler2D t; void main() { vec4 color = texture2D(t, uv); color.rgb = smoothstep(0.2, 0.8, color.rgb); gl_FragColor = color; }"
  }),

  vintage: Shaders.create({
    frag: "precision highp float; varying vec2 uv; uniform sampler2D t; void main() { vec4 color = texture2D(t, uv); float grey = dot(color.rgb, vec3(0.299, 0.587, 0.114)); vec3 sepia = vec3(grey); sepia.r *= 1.2; sepia.b *= 0.8; gl_FragColor = vec4(sepia, color.a); }"
  })
};

// Add type safety
export type FilterType = keyof typeof FilterShaders; 