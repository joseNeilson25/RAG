const pdf = require("pdf-parse");

export async function extractTextFromPdf(buffer: Buffer) {
  const data = await pdf(buffer);
  return data.text || "";
}