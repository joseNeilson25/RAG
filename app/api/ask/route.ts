import { NextResponse } from "next/server";
import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
import { getVectorStore } from "../../lib/rag-store";
import { buildRagPrompt } from "../../lib/prompt";

const bodySchema = z.object({
  question: z.string().min(3),
});

const llm = new ChatOpenAI({
  model: "gpt-4.1-mini",
  temperature: 0,
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { question } = bodySchema.parse(body);

    const vectorStore = getVectorStore();
    const results = await vectorStore.similaritySearch(question, 4);

    if (!results.length) {
      return NextResponse.json({
        answer: "Ainda não há documentos indexados para consultar.",
        sources: [],
      });
    }

    const context = results
      .map((doc, i) => {
        return `Trecho ${i + 1}
        Fonte: ${doc.metadata.source}
        Chunk: ${doc.metadata.chunkIndex}

        ${doc.pageContent}`;
      })
      .join("\n\n---\n\n");

    const prompt = buildRagPrompt(question, context);
    const response = await llm.invoke(prompt);

    return NextResponse.json({
      answer: String(response.content),
      sources: results.map((doc) => ({
        source: doc.metadata.source,
        chunkIndex: doc.metadata.chunkIndex,
        preview: String(doc.pageContent).slice(0, 200),
      })),
    });
  } catch (error: any) {
    console.error(error);

    const message = String(error?.message || "");

    if (
      message.includes("insufficient_quota") ||
      message.includes("You exceeded your current quota")
    ) {
      return NextResponse.json(
        {
          error:
            "Sua chave da OpenAI está sem créditos/quota disponível na API.",
        },
        { status: 429 }
      );
    }

    if (
      message.includes("Missing credentials") ||
      message.includes("OPENAI_API_KEY")
    ) {
      return NextResponse.json(
        {
          error: "A variável OPENAI_API_KEY não foi configurada.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Erro ao responder pergunta." },
      { status: 500 }
    );
  }
}