declare module 'gl-react' {
  export const Shaders: {
    create: (shaders: any) => any;
  };
  export const Node: React.ComponentType<any>;
  export const GLSL: (strings: TemplateStringsArray, ...values: any[]) => string;
}

declare module 'gl-react-expo' {
  import { ComponentType } from 'react';
  export const Surface: ComponentType<any>;
} 