import { VFile } from 'vfile';

export type File = VFile;

export interface IndexItem extends Record<string, any> {
  uri: string,
  localValue?: string,
  value?: string,
  version?: number,
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
  process: (file: File, context: Context) => Promise<File>;
}