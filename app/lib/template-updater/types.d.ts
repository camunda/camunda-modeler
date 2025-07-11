export type Endpoint = {
  executionPlatform: string;
  fileName: string;
  url: string;
};

export type TemplateUpdateResult = {
  hasNew: boolean;
  warnings: string[];
};

export type Template = {
  engines: { [key: string]: string };
  id: string;
  metadata?: {
    upstreamRef?: string;
    [key: string]: any;
  };
  version?: number;
  [key: string]: any;
};

export type TemplateMetadata = {
  engine?: { [key: string]: string };
  ref: string;
  version: number;
};

export type TemplatesMetadata = TemplateMetadata[];

export type TemplatesByIdMetadata = {
  [id: string]: TemplatesMetadata;
};