import { NextResponse } from "next/server";
import { Document } from "@langchain/core/documents";
import { getVectorStore } from "../../lib/rag-store";
import { extractTextFromPdf } from "../../lib/pdf";
import { pdfSplitter } from "../../lib/splitter";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Arquivo PDF não enviado." },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Apenas PDF é permitido." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const text = await extractTextFromPdf(buffer);

    if (!text.trim()) {
      return NextResponse.json(
        { error: "Não foi possível extrair texto do PDF." },
        { status: 400 }
      );
    }

    const chunks = await pdfSplitter.splitText(text);

    const docs = chunks.map((chunk: string, index: number) => {
      return new Document({
        pageContent: chunk,
        metadata: {
          source: file.name,
          chunkIndex: index,
          uploadedAt: new Date().toISOString(),
        },
      });
    });

    const vectorStore = getVectorStore();
    await vectorStore.addDocuments(docs);

    return NextResponse.json({
      success: true,
      fileName: file.name,
      chunks: docs.length,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Erro ao processar PDF." },
      { status: 500 }
    );
  }
}