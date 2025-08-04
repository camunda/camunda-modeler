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

declare module "*.less";
