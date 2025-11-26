declare module '*?raw' {
  const content: string;
  export default content;
}
declare module '*?url' {
  const content: string;
  export default content;
}
declare module '*.html' {
  const content: string;
  export default content;
}
declare module '*.md' {
  const content: string;
  export default content;
}
declare module '*.css' {
  const content: unknown;
  export default content;
}
declare module '*.vue' {
  import { DefineComponent } from 'vue';
  const component: DefineComponent;
  export default component;
}

declare const YAML: typeof import('yaml');

declare const z: typeof import('zod');
declare namespace z {
  export type infer<T> = import('zod').infer<T>;
  export type input<T> = import('zod').input<T>;
  export type output<T> = import('zod').output<T>;
}
<<<<<<< HEAD
=======

declare module 'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js' {
  export function registerMvuSchema(schema: z.ZodType<any>): void;
}
>>>>>>> c7489af2d5430b0353826a72372d9df0e1f92b51
