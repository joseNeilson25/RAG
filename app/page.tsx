"use client";

import { useState } from "react";

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [question, setQuestion] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<{ 
    source: string; 
    chunkIndex: number;
    preview: string;
  }[]>([]);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [loadingAsk, setLoadingAsk] = useState(false);

  async function handleUpload() {
    if (!file) return;

    try {
      setLoadingUpload(true);
      setUploadMessage("");

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setUploadMessage(data.error || "Erro no upload.");
        return;
      }

      setUploadMessage(
        `PDF "${data.fileName}" indexado com sucesso. Chunks: ${data.chunks}`
      );
    } catch {
      setUploadMessage("Erro ao enviar arquivo.");
    } finally {
      setLoadingUpload(false);
    }
  }

  async function handleAsk() {
    if (!question.trim()) return;

    try {
      setLoadingAsk(true);
      setAnswer("");
      setSources([]);

      const res = await fetch("/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAnswer(data.error || "Erro ao perguntar.");
        return;
      }

      setAnswer(data.answer);
      setSources(data.sources || []);
    } catch {
      setAnswer("Erro ao consultar.");
    } finally {
      setLoadingAsk(false);
    }
  }

  return (
    <main className="min-h-screen p-8 max-w-3xl mx-auto space-y-8">
      <section className="space-y-4">
        <h1 className="text-3xl font-bold">RAG MVP</h1>

        <div className="space-y-3 border rounded-2xl p-4">
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />

          <button
            onClick={handleUpload}
            disabled={!file || loadingUpload}
            className="px-4 py-2 rounded-xl border ml-8"
          >
            {loadingUpload ? "Enviando..." : "Enviar PDF"}
          </button>

          {uploadMessage && <p>{uploadMessage}</p>}
        </div>
      </section>

      <section className="space-y-4 border rounded-2xl p-4">
        <h2 className="text-xl font-semibold">Perguntar ao PDF</h2>

        <textarea
          className="w-full border rounded-xl p-3 min-h-32"
          placeholder="Faça uma pergunta sobre o conteúdo do PDF..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />

        <button
          onClick={handleAsk}
          disabled={loadingAsk}
          className="px-4 py-2 rounded-xl border"
        >
          {loadingAsk ? "Consultando..." : "Perguntar"}
        </button>

        {answer && (
          <div className="space-y-3">
            <div className="border rounded-xl p-4">
              <h3 className="font-semibold mb-2">Resposta</h3>
              <p>{String(answer)}</p>
            </div>

            {!!sources.length && (
              <div className="border rounded-xl p-4">
                <h3 className="font-semibold mb-2">Fontes usadas</h3>

                {sources.map((item, index) => (
                  <div key={index} className="mb-3 p-2 border rounded">
                    <p className="text-sm font-bold">
                      {item.source} (chunk {item.chunkIndex})
                    </p>
                    <p className="text-xs text-zinc-500">
                      {item.preview}...
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}