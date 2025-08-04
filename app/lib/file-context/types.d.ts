export type Logger = {
  error: (message: string, ...args: any[]) => void;
  info: (message: string, ...args: string[]) => void;
  warn: (message: string, ...args: string[]) => void;
};

export type File = {
  contents: string;
  dirname: string;
  extname: string;
  lastModified?: number;
  name: string;
  path: string;
  uri: string;
};

export type Metadata = {
  [key: string]: any;
};

export type IndexItem = {
  file: File;
  localValue?: any;
  metadata: Metadata;
  processor?: string;
  uri: string;
  value: any;
  [key: string]: any;
};

export type Processor = {
  extensions: string[];
  process: (item: IndexItem) => Promise<Metadata>;
};
