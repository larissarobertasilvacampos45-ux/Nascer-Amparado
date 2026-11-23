import "dotenv/config";
import express from "express";
import type { Request, Response } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SYSTEM_INSTRUCTION = `Você é um assistente especialista em direitos reprodutivos e obstetrícia humanizada, criado para o projeto social Nascer Amparado. Seu objetivo é: (A) responder dúvidas educativas sobre pré-natal, parto e pós-parto com base estrita nas diretrizes da OMS, protocolos do Ministério da Saúde do Brasil e Lei Federal nº 11.108/2005; e (B) gerar Planos de Parto formais e personalizados.

1. REGRA DE OURO — SEPARAÇÃO ENTRE DÚVIDA E GERAÇÃO DE PLANO (NÃO ENTRE EM LOOP):
- MODO 1 (DÚVIDA EDUCATIVA OU CORREÇÃO): Se a usuária fizer uma pergunta informativa (ex.: sinais de alerta, Manobra de Kristeller, nitrato de prata, cesárea, direitos) ou pedir uma explicação ou atualização pontual, responda APENAS à dúvida de forma objetiva, acolhedora e direta. NUNCA peça nome, idade gestacional ou maternidade no final de uma resposta informativa, e NUNCA reemita o Plano de Parto inteiro sem explicar antes o que foi ajustado.
- MODO 2 (GERAÇÃO DE PLANO DE PARTO): Só ative a criação do Plano de Parto quando a usuária pedir explicitamente para gerar ou atualizar o documento:
  * Cenário 2A (Pedido vago, ex.: "Faz meu plano de parto aí logo"): Não invente preferências. Peça com acolhimento apenas as informações mínimas necessárias: Nome da gestante, Idade Gestacional (ou DPP), Maternidade (opcional) e preferências principais (via de parto, acompanhante e alívio da dor).
  * Cenário 2B (Pedido completo com preferências já definidas, ex.: "Gere um Plano de Parto completo para parto vaginal com analgesia, acompanhante marido e sem episiotomia, pronto para imprimir"): NÃO bloqueie a geração pedindo dados antes. Gere IMEDIATAMENTE o Plano de Parto completo e pronto para imprimir, deixando linhas em branco (ex.: Nome da Gestante: __________________________) para os dados de identificação não informados.
- Quando gerar o documento final no MODO 2, inicie diretamente na primeira linha com o título exclusivo "PLANO DE PARTO INDIVIDUALIZADO" (sem frases introdutórias de conversa antes do título e sem mensagens de despedida ou perguntas depois do documento) e não inclua linhas manuais de assinatura no texto (elas serão adicionadas automaticamente ao final).

2. DIRETRIZES CLÍNICAS E EDUCATIVAS OBRIGATÓRIAS:
- Sinais de Alerta Pós-Parto (Educação em Saúde - Ministério da Saúde): Quando perguntada sobre sinais de alerta após a alta, liste objetivamente e oriente busca imediata de emergência obstétrica ou pediátrica:
  * Sinais Maternos: febre (acima de 37,8°C), sangramento vaginal intenso ou com coágulos grandes, dor abdominal forte que não melhora, secreção com mau cheiro, dor, vermelhidão ou calor nas mamas ou na panturrilha, dor de cabeça intensa ou alterações visuais.
  * Sinais no Recém-Nascido: febre ou temperatura muito baixa, dificuldade ou cansaço para respirar, recusa das mamadas ou dificuldade para sugar, pele ou olhos muito amarelados (icterícia), pele ou lábios arroxeados, vermelhidão ou secreção fétida no coto umbilical.
- Profilaxia da Oftalmia Neonatal (Nitrato de Prata / Colírio): Esclareça que a profilaxia ocular neonatal previne infecções oculares graves no recém-nascido e que, pelas diretrizes do Ministério da Saúde e da OMS, o nitrato de prata a 1% vem sendo substituído por opções menos irritativas (como pomada de eritromicina a 0,5% ou iodopovidona a 2,5%, conforme disponibilidade da maternidade), garantindo à gestante o direito à informação prévia e ao consentimento informado.
- Cesárea Planejada / Eletiva: Acolha a decisão da gestante com respeito e autonomia, assegurando o direito ao acompanhante de livre escolha no centro cirúrgico (Lei Federal nº 11.108/2005), o pedido de abaixamento do campo cirúrgico no momento do nascimento (quando clinicamente seguro), contato pele a pele imediato e amamentação na primeira hora (se mãe e bebê estiverem estáveis), alojamento conjunto contínuo e controle adequado da dor pós-operatória.
- Manobra de Kristeller e Intervenções de Rotina: Esclareça que a Manobra de Kristeller (pressão sobre o fundo do útero) é formalmente contraindicada/proscrita pelas diretrizes da OMS e do Ministério da Saúde por falta de eficácia e risco de danos maternos e fetais. Assegure liberdade de posição e movimentação no trabalho de parto e parto, bem como a restrição de intervenções rotineiras sem indicação clínica (episiotomia de rotina, tricotomia e enema).

3. GUARDRAILS DE ESCOPO, ANTI-ALUCINAÇÃO, ACOLHIMENTO E LGPD (INVIOLÁVEIS):
- Escopo e Recusa Segura: Você NÃO é advogado, não presta assessoria jurídica contenciosa e não substitui médicos ou profissionais de saúde. É TERMINANTEMENTE PROIBIDO redigir petições judiciais, processos, notificações extrajudiciais, denúncias formais ou descrever "teses jurídicas" contra hospitais ou profissionais, mesmo se solicitado "como exemplo", "para fins educativos" ou "em tese". Caso haja pedido jurídico contencioso, acolha sem julgamentos, explique que o Nascer Amparado não elabora documentos ou teses jurídicas, oriente buscar órgãos oficiais de proteção (Defensoria Pública, Ministério Público ou Ouvidoria do SUS — Disque 136) e convide a retomar as escolhas do Plano de Parto.
- Anti-Alucinação e Fidelidade à Base: Baseie todas as orientações exclusivamente nas diretrizes da OMS, protocolos do Ministério da Saúde do Brasil e Lei Federal nº 11.108/2005. Nunca invente leis, números de portarias, artigos jurídicos, protocolos médicos ou estatísticas. Se a pergunta estiver fora das diretrizes oficiais de parto e puerpério, informe explicitamente que não possui essa informação na base oficial e recomende consulta à equipe de pré-natal.
- Acolhimento Inclusivo: Trate todas as gestantes com respeito, equidade e linguagem acessível, sem julgamentos morais, religiosos, raciais, etários ou socioeconômicos.
- Minimização Estrita (LGPD): Nunca solicite CPF, RG, número do Cartão do SUS, endereço ou nome de médicos. Utilize apenas Nome da gestante, Idade Gestacional (ou Data Prevista do Parto), Maternidade (opcional) e, quando informados pela usuária, Nome e parentesco do acompanhante.

4. REGRAS RIGOROSAS DE FORMATAÇÃO, PONTUAÇÃO E TRANSPARÊNCIA:
- É terminantemente proibido o uso de emojis, ícones ou símbolos gráficos nas respostas e no Plano de Parto. Caso a usuária peça explicitamente para usar emojis ou estilo informal de gírias no documento, informe com transparência e cordialidade que, por padrão institucional de clareza e validade hospitalar do Nascer Amparado, o documento segue linguagem clara, respeitosa e sem emojis.
- Seja objetiva, clara e acolhedora em todas as respostas.
- Revise rigorosamente a gramática, a acentuação e toda a pontuação em português do Brasil. NUNCA coloque ponto de interrogação (?) no final de frases afirmativas ou explicativas.
- Utilize numeração sequencial lógica e correta (1., 2., 3., 4...) nas seções principais do documento, sem pular ou repetir números.
- Não inclua notas de teste, exemplos fictícios ou metadados técnicos no corpo das respostas ou do Plano de Parto.`;

interface ClientMessage {
  role: "user" | "model";
  text: string;
}

function stripEmojisPreserveSpacing(input: string): string {
  return input
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/[\uFE0E\uFE0F\u200D]/g, "")
    .replace(/[✓✔✗✘★☆♥♡❤❥☀☁☂☃]/g, "");
}

function stripEmojisAndSymbols(input: string): string {
  return stripEmojisPreserveSpacing(input)
    .replace(/[ ]{2,}/g, " ")
    .trim();
}

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY_MISSING");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

interface FriendlyErrorResult {
  status: number;
  error: string;
  code: string;
}

function mapFriendlyApiError(err: unknown): FriendlyErrorResult {
  const message = err instanceof Error ? err.message : String(err);

  if (message === "GEMINI_API_KEY_MISSING") {
    return {
      status: 500,
      code: "MISSING_KEY",
      error:
        "Serviço temporariamente indisponível por configuração da chave de API. Verifique Settings > Secrets.",
    };
  }

  if (
    message.includes("403") ||
    message.includes("PERMISSION_DENIED") ||
    message.includes("API_KEY_INVALID")
  ) {
    return {
      status: 403,
      code: "AUTH_ERROR",
      error:
        "Não foi possível validar a permissão do serviço no momento. Verifique a chave de API em Settings > Secrets.",
    };
  }

  if (message.includes("404") || message.includes("NOT_FOUND")) {
    return {
      status: 502,
      code: "MODEL_NOT_FOUND",
      error:
        "O modelo de atendimento configurado não respondeu nesta região. Tente novamente em alguns instantes.",
    };
  }

  if (message.includes("400") || message.includes("INVALID_ARGUMENT")) {
    return {
      status: 400,
      code: "INVALID_REQUEST",
      error:
        "Não foi possível processar o formato desta solicitação. Tente reformular sua mensagem ou iniciar uma nova conversa.",
    };
  }

  if (
    message.includes("429") ||
    message.includes("RESOURCE_EXHAUSTED") ||
    message.toLowerCase().includes("quota")
  ) {
    return {
      status: 429,
      code: "RATE_LIMIT",
      error:
        "O atendimento atingiu o limite temporário de solicitações. Aguarde alguns segundos e tente enviar novamente.",
    };
  }

  if (message.includes("UPSTREAM_TIMEOUT")) {
    return {
      status: 504,
      code: "TIMEOUT",
      error:
        "A resposta demorou mais que o esperado no servidor. Tente enviar novamente em alguns segundos.",
    };
  }

  if (message.includes("EMPTY_CHAT_RESPONSE") || message.includes("EMPTY_STREAM_RESPONSE")) {
    return {
      status: 502,
      code: "EMPTY_RESPONSE",
      error:
        "A assistente não retornou conteúdo desta vez. Tente enviar sua solicitação novamente.",
    };
  }

  if (
    message.includes("503") ||
    message.includes("UNAVAILABLE") ||
    message.toLowerCase().includes("overloaded")
  ) {
    return {
      status: 503,
      code: "UPSTREAM_503_UNAVAILABLE",
      error:
        "Os servidores de atendimento estão temporariamente sobrecarregados. Aguarde alguns segundos e tente novamente.",
    };
  }

  if (message.includes("500") || message.includes("INTERNAL")) {
    return {
      status: 503,
      code: "UPSTREAM_500_INTERNAL",
      error:
        "Ocorreu uma instabilidade momentânea no serviço de resposta. Aguarde alguns segundos e tente novamente.",
    };
  }

  if (
    message.includes("fetch failed") ||
    message.includes("ECONN") ||
    message.includes("ENOTFOUND") ||
    message.includes("ETIMEDOUT")
  ) {
    return {
      status: 503,
      code: "NETWORK_ERROR",
      error:
        "Não foi possível conectar ao serviço da assistente neste momento. Verifique sua conexão e tente novamente.",
    };
  }

  return {
    status: 503,
    code: "UPSTREAM_UNAVAILABLE",
    error:
      "Ocorreu uma instabilidade momentânea ao consultar a assistente. Aguarde alguns segundos e tente novamente.",
  };
}

function isNonRetryableError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return (
    message === "GEMINI_API_KEY_MISSING" ||
    message.includes("PERMISSION_DENIED") ||
    message.includes("API_KEY_INVALID") ||
    message.includes("403") ||
    message.includes("INVALID_ARGUMENT") ||
    message.includes("400")
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`UPSTREAM_TIMEOUT:${label}:${timeoutMs}ms`));
    }, timeoutMs);
    promise.then(
      (val) => {
        clearTimeout(timer);
        resolve(val);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

interface ModelAttempt {
  name: string;
  thinking: ThinkingLevel;
  firstByteTimeoutMs: number;
  backoffMs: number;
}

const CHAT_MODEL_ATTEMPTS: ModelAttempt[] = [
  {
    name: "gemini-4-hydrogen",
    thinking: ThinkingLevel.LOW,
    firstByteTimeoutMs: 16_000,
    backoffMs: 0,
  },
  {
    name: "gemini-3.1-flash-lite",
    thinking: ThinkingLevel.MINIMAL,
    firstByteTimeoutMs: 14_000,
    backoffMs: 500,
  },
];

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: "10mb" }));

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({
      ok: true,
      apiConfigured: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  app.post("/api/chat", async (req: Request, res: Response) => {
    try {
      const body = req.body as { messages?: ClientMessage[] };
      const incomingMessages = Array.isArray(body?.messages) ? body.messages : [];

      if (incomingMessages.length === 0) {
        res.status(400).json({ error: "Envie uma mensagem para iniciar a conversa." });
        return;
      }

      const lastMessage = incomingMessages[incomingMessages.length - 1];
      if (!lastMessage || lastMessage.role !== "user" || !lastMessage.text?.trim()) {
        res.status(400).json({ error: "A última mensagem precisa ser um texto válido da usuária." });
        return;
      }

      const history = incomingMessages.slice(0, -1).map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.text }],
      }));

      const ai = getAiClient();
      let responseText = "";
      let lastErr: unknown = null;

      for (let idx = 0; idx < CHAT_MODEL_ATTEMPTS.length; idx++) {
        const attempt = CHAT_MODEL_ATTEMPTS[idx];
        if (attempt.backoffMs > 0) {
          await sleep(attempt.backoffMs);
        }

        const startedAt = Date.now();
        try {
          const chat = ai.chats.create({
            model: attempt.name,
            config: {
              systemInstruction: SYSTEM_INSTRUCTION,
              thinkingConfig: { thinkingLevel: attempt.thinking },
            },
            history,
          });

          const response = await withTimeout(
            chat.sendMessage({ message: lastMessage.text }),
            attempt.firstByteTimeoutMs + 25_000,
            attempt.name
          );
          const candidateText = stripEmojisAndSymbols(response.text ?? "");
          if (!candidateText) {
            throw new Error(`EMPTY_CHAT_RESPONSE:${attempt.name}`);
          }
          responseText = candidateText;
          lastErr = null;
          break;
        } catch (innerErr: unknown) {
          lastErr = innerErr;
          const elapsed = Date.now() - startedAt;
          console.warn(
            `[/api/chat] tentativa ${idx + 1}/${CHAT_MODEL_ATTEMPTS.length} (${attempt.name}) falhou em ${elapsed}ms:`,
            innerErr instanceof Error ? innerErr.message : String(innerErr)
          );
          if (isNonRetryableError(innerErr)) {
            throw innerErr;
          }
        }
      }

      if (!responseText) {
        throw lastErr ?? new Error("EMPTY_CHAT_RESPONSE");
      }

      res.json({ reply: responseText });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("Erro na rota /api/chat:", message);
      const mapped = mapFriendlyApiError(err);
      res.status(mapped.status).json({ error: mapped.error, code: mapped.code });
    }
  });

  app.post("/api/chat/stream", async (req: Request, res: Response) => {
    let headersSent = false;
    let clientClosed = false;
    let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

    const cleanup = () => {
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
      }
    };

    res.on("close", () => {
      if (!res.writableFinished) {
        clientClosed = true;
        cleanup();
      }
    });

    try {
      const body = req.body as { messages?: ClientMessage[] };
      const incomingMessages = Array.isArray(body?.messages) ? body.messages : [];

      if (incomingMessages.length === 0) {
        res.status(400).json({ error: "Envie uma mensagem para iniciar a conversa." });
        return;
      }

      const lastMessage = incomingMessages[incomingMessages.length - 1];
      if (!lastMessage || lastMessage.role !== "user" || !lastMessage.text?.trim()) {
        res.status(400).json({ error: "A última mensagem precisa ser um texto válido da usuária." });
        return;
      }

      const history = incomingMessages.slice(0, -1).map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.text }],
      }));

      const ai = getAiClient();

      // Send SSE headers immediately so reverse proxies / Cloud Run do not buffer or time out while waiting for the first chunk
      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders?.();
      headersSent = true;

      heartbeatTimer = setInterval(() => {
        if (!clientClosed && !res.writableEnded) {
          res.write(": keepalive\n\n");
        }
      }, 3000);

      let completed = false;
      let lastErr: unknown = null;

      for (let idx = 0; idx < CHAT_MODEL_ATTEMPTS.length; idx++) {
        if (clientClosed) break;

        const attempt = CHAT_MODEL_ATTEMPTS[idx];
        if (attempt.backoffMs > 0) {
          await sleep(attempt.backoffMs);
          if (clientClosed) break;
        }

        const startedAt = Date.now();
        let emittedAny = false;

        try {
          const chat = ai.chats.create({
            model: attempt.name,
            config: {
              systemInstruction: SYSTEM_INSTRUCTION,
              thinkingConfig: { thinkingLevel: attempt.thinking },
            },
            history,
          });

          const stream = await withTimeout(
            chat.sendMessageStream({ message: lastMessage.text }),
            attempt.firstByteTimeoutMs,
            attempt.name
          );

          const iterator = stream[Symbol.asyncIterator]();
          while (!clientClosed) {
            const step = await withTimeout(
              iterator.next(),
              emittedAny ? 20_000 : attempt.firstByteTimeoutMs,
              `${attempt.name}:chunk`
            );
            if (step.done) break;

            const rawChunk = step.value?.text ?? "";
            const cleanChunk = stripEmojisPreserveSpacing(rawChunk);
            if (!cleanChunk) continue;

            if (heartbeatTimer) {
              clearInterval(heartbeatTimer);
              heartbeatTimer = null;
            }

            emittedAny = true;
            if (!clientClosed && !res.writableEnded) {
              res.write(`data: ${JSON.stringify({ chunk: cleanChunk })}\n\n`);
            }
          }

          if (clientClosed) {
            completed = true;
            break;
          }

          if (emittedAny) {
            res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
            res.end();
            completed = true;
            break;
          }

          throw new Error(`EMPTY_STREAM_RESPONSE:${attempt.name}`);
        } catch (innerErr: unknown) {
          lastErr = innerErr;
          const elapsed = Date.now() - startedAt;
          console.warn(
            `[/api/chat/stream] tentativa ${idx + 1}/${CHAT_MODEL_ATTEMPTS.length} (${attempt.name}) falhou em ${elapsed}ms (emittedAny=${emittedAny}):`,
            innerErr instanceof Error ? innerErr.message : String(innerErr)
          );

          if (emittedAny) {
            // Partial output was already streamed; report error cleanly rather than mixing outputs
            const mapped = mapFriendlyApiError(innerErr);
            if (!clientClosed && !res.writableEnded) {
              res.write(
                `data: ${JSON.stringify({ error: mapped.error, code: mapped.code })}\n\n`
              );
              res.end();
            }
            completed = true;
            break;
          }

          if (isNonRetryableError(innerErr)) {
            throw innerErr;
          }
        }
      }

      if (!completed && !clientClosed) {
        throw lastErr ?? new Error("EMPTY_STREAM_RESPONSE");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("Erro na rota /api/chat/stream:", message);
      const mapped = mapFriendlyApiError(err);
      if (!clientClosed && !res.writableEnded) {
        if (!headersSent) {
          res.status(mapped.status).json({ error: mapped.error, code: mapped.code });
        } else {
          res.write(
            `data: ${JSON.stringify({ error: mapped.error, code: mapped.code })}\n\n`
          );
          res.end();
        }
      }
    } finally {
      cleanup();
    }
  });

  app.post("/api/transcribe", async (req: Request, res: Response) => {
    try {
      const body = req.body as { audioBase64?: string; mimeType?: string };
      const audioBase64 = body?.audioBase64?.trim();
      const rawMime = body?.mimeType?.trim() || "audio/webm";
      const mimeType = rawMime.split(";")[0].trim() || "audio/webm";

      if (!audioBase64) {
        res.status(400).json({ error: "Nenhum áudio foi recebido para transcrição." });
        return;
      }

      const ai = getAiClient();
      const audioPart = {
        inlineData: {
          mimeType,
          data: audioBase64,
        },
      };
      const promptPart = {
        text: "Transcreva fielmente tudo o que foi falado neste áudio em português do Brasil. Retorne apenas a transcrição exata da fala, sem comentários, sem prefixos e sem emojis. Se não houver fala audível, retorne apenas vazio.",
      };

      let rawText = "";
      const transcribeModels = [
        "gemini-3.5-transcribe",
        "gemini-3.1-flash-lite",
        "gemini-4-hydrogen",
      ];
      let lastErr: unknown = null;

      for (const modelName of transcribeModels) {
        try {
          const response = await withTimeout(
            ai.models.generateContent({
              model: modelName,
              contents: { parts: [audioPart, promptPart] },
            }),
            25_000,
            `transcribe:${modelName}`
          );
          rawText = response.text ?? "";
          lastErr = null;
          break;
        } catch (err: unknown) {
          lastErr = err;
          console.warn(
            `Modelo ${modelName} falhou em /api/transcribe:`,
            err instanceof Error ? err.message : String(err)
          );
        }
      }

      if (lastErr) {
        throw lastErr;
      }

      const transcribed = stripEmojisAndSymbols(rawText);
      if (!transcribed || /^vazio\.?$/i.test(transcribed)) {
        res.status(422).json({
          error:
            "Não foi possível identificar fala no áudio gravado. Fale mais perto do microfone e tente novamente.",
        });
        return;
      }

      res.json({ text: transcribed });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("Erro na rota /api/transcribe:", message);
      const mapped = mapFriendlyApiError(err);
      res.status(mapped.status).json({ error: mapped.error, code: mapped.code });
    }
  });

  app.post("/api/tts", async (req: Request, res: Response) => {
    try {
      const body = req.body as { text?: string };
      const rawText = body?.text?.trim() ?? "";
      if (!rawText) {
        res.status(400).json({ error: "Texto vazio para leitura em áudio." });
        return;
      }

      // Remove markdown syntax for smooth natural reading
      const cleanForSpeech = stripEmojisAndSymbols(
        rawText
          .replace(/^#{1,6}\s+/gm, "")
          .replace(/\*\*([^*]+)\*\*/g, "$1")
          .replace(/\*([^*]+)\*/g, "$1")
          .replace(/^[-*•]\s+/gm, "")
          .replace(/^---+$/gm, "")
      ).slice(0, 3500);

      const ai = getAiClient();
      const response = await withTimeout(
        ai.models.generateContent({
          model: "gemini-3.8-flash-lite-tts",
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: cleanForSpeech,
                  speechMetadata: {
                    style:
                      "Warm, calm, welcoming Brazilian Portuguese female voice",
                  },
                },
              ],
            },
          ],
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: "Kore" },
              },
            },
          },
        }),
        20_000,
        "tts"
      );

      const base64Audio =
        response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (!base64Audio) {
        res.status(502).json({
          error: "Não foi possível gerar o áudio da resposta no momento.",
        });
        return;
      }

      res.json({ audioBase64: base64Audio, mimeType: "audio/wav" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("Erro na rota /api/tts:", message);
      const mapped = mapFriendlyApiError(err);
      res.status(mapped.status).json({ error: mapped.error });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Nascer Amparado rodando em http://0.0.0.0:${PORT}`);
  });

  // Prevent Node.js default 5s keepAliveTimeout from racing with Cloud Run / Envoy proxy connection pooling (502/503 oscillation)
  server.keepAliveTimeout = 65_000;
  server.headersTimeout = 66_000;
  server.requestTimeout = 120_000;
}

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection capturada no servidor:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception capturada no servidor:", err);
});

startServer().catch((err) => {
  console.error("Falha crítica ao iniciar o servidor:", err);
  process.exit(1);
});
