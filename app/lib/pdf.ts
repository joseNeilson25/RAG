import * as pdf from "pdf-parse";

export async function extractTextFromPdf(buffer: Buffer) {
  const parser = new pdf.PDFParse({ data: buffer });
  const result = await parser.getText();

  return result.text ?? "";
}