import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export const pdfSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1200,
  chunkOverlap: 200,
});