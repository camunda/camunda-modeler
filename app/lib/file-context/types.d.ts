export type File = {
  contents: string;
  dirname: string;
  path: string;
};

export interface IndexItem extends Record<string, any> {
  uri: string,
  localValue?: string,
  value?: string,
  file: File,
  parsed: any,
  meta: Record<string, any>,
}

export interface Logger {
  error: (message: string) => void;
  info: (message: string) => void;
  log: (message: string) => void;
  warn: (message: string) => void;
}

export interface Processor {
  extensions: string[];
  process: (item: IndexItem) => Promise<IndexItem>;
}