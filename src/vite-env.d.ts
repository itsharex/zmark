/// <reference types="vite/client" />

declare module "canvas-nest.js" {
  export interface CanvasNestConfig {
    color?: string;
    opacity?: number;
    count?: number;
    zIndex?: number;
    [key: string]: unknown;
  }

  export interface CanvasNestInstance {
    destroy?: () => void;
    points?: Array<{
      xa?: number;
      ya?: number;
    }>;
  }

  const CanvasNest: new (
    el: HTMLElement,
    config?: CanvasNestConfig,
  ) => CanvasNestInstance;
  export default CanvasNest;
}
