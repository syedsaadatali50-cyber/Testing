declare module 'pdf-parse' {
  function pdfParse(dataBuffer: Buffer, options?: any): Promise<{
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    text: string;
    version: string;
  }>;
  export default pdfParse;
}

declare module 'mammoth' {
  export function extractRawText(options: { buffer: Buffer }): Promise<{ value: string; messages: any[] }>;
}
