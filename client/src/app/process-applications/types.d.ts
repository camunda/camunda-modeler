export type LinkedId = {
  elementId: string,
  linkedId: string,
  type: string
};

export type Reference = {
  source: {
    id: string,
    type: string,
    uri: string
  },
  target: {
    id: string,
    type: string,
    uri: string
  }
};

export type AutoCompletion = {
  value: string,
  uri: string
};

export type File = {
  contents: string,
  dirname: string,
  extname: string,
  lastModified?: number,
  name: string,
  path: string,
  uri: string
};

export type Metadata = {
  [key: string]: any
};

export type IndexItem = {
  file: File,
  metadata: Metadata
};