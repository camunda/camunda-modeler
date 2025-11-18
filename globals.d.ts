declare module "*.dmn" {
  const content: string;
  export default content;
}

declare module "*.bpmn" {
  const content: string;
  export default content;
}

declare module "*.svg" {
  const content: JSX.IntrinsicElements.svg;
  export default content;
}

declare module "*.css" {
  const content: string;
  export default content;
}

declare module "*.sass" {
  const content: string;
  export default content;
}

declare module "*.less" {
  const content: string;
  export default content;
}
