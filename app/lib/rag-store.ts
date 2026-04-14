import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";

const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-small",
  apiKey: process.env.OPENAI_API_KEY,
});

declare global {
  var __vectorStore__: MemoryVectorStore | undefined;
}

export function getVectorStore() {
  if (!global.__vectorStore__) {
    global.__vectorStore__ = new MemoryVectorStore(embeddings);
  }

  return global.__vectorStore__;
}