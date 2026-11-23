import React, { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  Copy,
  FileDown,
  Loader2,
  Mic,
  RotateCcw,
  Send,
  Square,
  Volume2,
  X,
} from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import {
  BIRTH_PLAN_REMINDER,
  downloadBirthPlanPdf,
  extractBirthPlanOnly,
  formatBirthPlanWithFooter,
  isFinalBirthPlanDocument,
} from "../utils/generateBirthPlanPdf";

interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
}

type LoadingStage = "connecting" | "retrying" | "streaming" | null;

function readWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error("STREAM_READ_TIMEOUT"));
    }, timeoutMs);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        window.clearTimeout(timer);
        reject(err);
      }
    );
  });
}

function sanitizeOutputText(input: string): string {
  return input
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/[\uFE0E\uFE0F\u200D]/g, "")
    .replace(/[✓✔✗✘★☆♥♡❤❥☀☁☂☃]/g, "")
    .replace(/[ ]{2,}/g, " ")
    .trim();
}

function stripMarkdownForSpeech(input: string): string {
  return sanitizeOutputText(
    input
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/^[-*•]\s+/gm, "")
      .replace(/^---+$/gm, "")
  );
}

function splitSpeechChunks(text: string, maxLen = 220): string[] {
  const paragraphs = text
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const chunks: string[] = [];

  for (const para of paragraphs) {
    if (para.length <= maxLen) {
      chunks.push(para);
      continue;
    }
    const sentences = para.split(/(?<=[.!?])\s+/);
    let buffer = "";
    for (const sentence of sentences) {
      if ((buffer + " " + sentence).trim().length <= maxLen) {
        buffer = (buffer + " " + sentence).trim();
      } else {
        if (buffer) chunks.push(buffer);
        if (sentence.length <= maxLen) {
          buffer = sentence;
        } else {
          for (let i = 0; i < sentence.length; i += maxLen) {
            chunks.push(sentence.slice(i, i + maxLen));
          }
          buffer = "";
        }
      }
    }
    if (buffer) chunks.push(buffer);
  }
  return chunks;
}

const INITIAL_ASSISTANT_MESSAGE: ChatMessage = {
  id: "welcome-msg",
  role: "model",
  text: `Seja bem-vinda ao Gerador de Plano de Parto do Nascer Amparado.

Estou aqui para orientar você sobre seus direitos e ajudar a construir um documento claro, respeitoso e fundamentado na **Lei Federal nº 11.108/2005 (Lei do Acompanhante)**, nas diretrizes da **Organização Mundial da Saúde (OMS)** e nos protocolos do **Ministério da Saúde**.

Converse comigo por texto ou áudio logo abaixo. Vou fazer algumas perguntas simples sobre você, seu acompanhante (se desejar incluir) e suas escolhas para o parto e, ao final das suas respostas, gerarei seu Plano de Parto pronto para baixar em PDF.`,
};

const STARTER_QUESTIONS = [
  "Quais são os meus direitos pela Lei do Acompanhante?",
  "Quais procedimentos de rotina eu posso recusar no parto?",
  "Quero montar meu Plano de Parto passo a passo com você.",
];

export function BirthPlanAssistantTab() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    INITIAL_ASSISTANT_MESSAGE,
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<LoadingStage>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [failedUserText, setFailedUserText] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pdfNotice, setPdfNotice] = useState<string | null>(null);
  const streamAbortRef = useRef<AbortController | null>(null);
  const transcribeAbortRef = useRef<AbortController | null>(null);
  const manualCancelRef = useRef(false);

  // Audio recording / transcription states
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioNotice, setAudioNotice] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Text-to-speech playback states
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [loadingAudioMessageId, setLoadingAudioMessageId] = useState<string | null>(
    null
  );
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const speechCancelledRef = useRef(false);

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const hasUserResponded = messages.some((m) => m.role === "user");
  const lastFinalPlanMessage = hasUserResponded
    ? [...messages]
        .reverse()
        .find(
          (m) =>
            m.role === "model" &&
            m.id !== "welcome-msg" &&
            m.id !== streamingMessageId &&
            isFinalBirthPlanDocument(m.text)
        )
    : undefined;

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const frameId = window.requestAnimationFrame(() => {
      if (streamingMessageId) {
        container.scrollTop = container.scrollHeight;
      } else {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "smooth",
        });
      }
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [messages, isLoading, error, streamingMessageId]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 150)}px`;
  }, [input]);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  const stopAudioPlayback = () => {
    speechCancelledRef.current = true;
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.currentTime = 0;
      audioPlayerRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMessageId(null);
    setLoadingAudioMessageId(null);
  };

  useEffect(() => {
    if (!isLoading) {
      setElapsedSeconds(0);
      return;
    }
    const startedAt = Date.now();
    const intervalId = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [isLoading]);

  useEffect(() => {
    return () => {
      streamAbortRef.current?.abort();
      transcribeAbortRef.current?.abort();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleCancelRequest = () => {
    if (!isLoading) return;
    manualCancelRef.current = true;
    streamAbortRef.current?.abort();
  };

  const sendMessage = async (textToSend: string, isRetry = false) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isLoading) return;

    setError(null);
    setFailedUserText(null);
    manualCancelRef.current = false;

    let nextMessages = messages;
    if (!isRetry) {
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        text: trimmed,
      };
      nextMessages = [...messages, userMsg];
      setMessages(nextMessages);
      setInput("");
    }

    setIsLoading(true);
    setLoadingStage("connecting");
    setElapsedSeconds(0);
    const controller = new AbortController();
    streamAbortRef.current = controller;
    let timedOut = false;
    const timeoutId = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 65_000);
    const modelMsgId = `model-${Date.now()}`;
    let hasCreatedStreamMsg = false;

    const apiHistory = nextMessages
      .filter((m) => m.id !== "welcome-msg")
      .map((m) => ({ role: m.role, text: m.text }));

    const requestNonStreamFallback = async (): Promise<string> => {
      const fallbackRes = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiHistory }),
        signal: controller.signal,
      });

      let fallbackData: { reply?: string; error?: string } = {};
      try {
        fallbackData = (await fallbackRes.json()) as {
          reply?: string;
          error?: string;
        };
      } catch {
        fallbackData = {};
      }

      if (fallbackRes.status === 429) {
        throw new Error(
          fallbackData.error ||
            "O atendimento atingiu o limite temporário de solicitações. Aguarde alguns segundos e tente novamente."
        );
      }

      if (!fallbackRes.ok || !fallbackData.reply) {
        throw new Error(
          fallbackData.error ||
            "Não foi possível obter resposta no momento. Aguarde alguns segundos e tente novamente."
        );
      }

      const cleanFallback = sanitizeOutputText(fallbackData.reply);
      if (!cleanFallback) {
        throw new Error(
          "A resposta recebida estava vazia. Aguarde alguns segundos e tente novamente."
        );
      }

      return cleanFallback;
    };

    try {
      let finalReply: string | null = null;
      let streamError: Error | null = null;
      let shouldTryFallback = false;

      try {
        const res = await fetch("/api/chat/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: apiHistory }),
          signal: controller.signal,
        });

        const contentType = res.headers.get("content-type") || "";

        if (!res.ok || !contentType.includes("text/event-stream") || !res.body) {
          let data: { reply?: string; error?: string } = {};
          try {
            data = (await res.json()) as { reply?: string; error?: string };
          } catch {
            data = {};
          }

          if (
            res.status === 400 ||
            res.status === 403 ||
            res.status === 429 ||
            res.status === 500
          ) {
            throw new Error(
              data.error ||
                "Não foi possível obter resposta no momento. Verifique as configurações e tente novamente."
            );
          }

          shouldTryFallback = true;
          streamError = new Error(
            data.error ||
              "Ocorreu uma instabilidade momentânea ao consultar a assistente. Aguarde alguns segundos e tente novamente."
          );
        } else {
          const reader = res.body.getReader();
          const decoder = new TextDecoder("utf-8");
          let sseBuffer = "";
          let accumulated = "";
          let receivedDone = false;

          while (true) {
            const { value, done } = await readWithTimeout(
              reader.read(),
              hasCreatedStreamMsg ? 25_000 : 30_000
            );
            if (done) break;

            sseBuffer += decoder.decode(value, { stream: true });
            const events = sseBuffer.split("\n\n");
            sseBuffer = events.pop() ?? "";

            for (const evt of events) {
              const dataLine = evt
                .split("\n")
                .find((line) => line.startsWith("data: "));
              if (!dataLine) continue;

              let parsed: {
                chunk?: string;
                done?: boolean;
                error?: string;
                code?: string;
              } = {};
              try {
                parsed = JSON.parse(dataLine.slice(6)) as {
                  chunk?: string;
                  done?: boolean;
                  error?: string;
                  code?: string;
                };
              } catch {
                continue;
              }

              if (parsed.error) {
                streamError = new Error(parsed.error);
                if (
                  !hasCreatedStreamMsg &&
                  parsed.code !== "RATE_LIMIT" &&
                  parsed.code !== "AUTH_ERROR" &&
                  parsed.code !== "MISSING_KEY" &&
                  parsed.code !== "INVALID_REQUEST"
                ) {
                  shouldTryFallback = true;
                }
                break;
              }

              if (parsed.done) {
                receivedDone = true;
              }

              if (parsed.chunk) {
                accumulated += parsed.chunk;
                if (!hasCreatedStreamMsg) {
                  hasCreatedStreamMsg = true;
                  setLoadingStage("streaming");
                  setStreamingMessageId(modelMsgId);
                  setMessages((prev) => [
                    ...prev,
                    { id: modelMsgId, role: "model", text: accumulated },
                  ]);
                } else {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === modelMsgId ? { ...m, text: accumulated } : m
                    )
                  );
                }
              }
            }

            if (streamError) break;
          }

          if (streamError) {
            if (!shouldTryFallback) {
              throw streamError;
            }
          } else {
            const cleanStream = sanitizeOutputText(accumulated);
            if (cleanStream && receivedDone) {
              finalReply = cleanStream;
            } else {
              shouldTryFallback = true;
              streamError = new Error(
                "A conexão foi interrompida antes da conclusão do documento."
              );
            }
          }
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") {
          throw err;
        }
        streamError =
          err instanceof Error
            ? err
            : new Error("Instabilidade de conexão ao consultar a assistente.");
        if (
          !hasCreatedStreamMsg ||
          streamError.message === "STREAM_READ_TIMEOUT" ||
          streamError.message.includes("Failed to fetch") ||
          streamError.message.includes("network") ||
          streamError.message.includes("Load failed")
        ) {
          shouldTryFallback = true;
        } else {
          throw streamError;
        }
      }

      if (finalReply) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === modelMsgId ? { ...m, text: finalReply! } : m
          )
        );
      } else if (shouldTryFallback) {
        setLoadingStage("retrying");
        await new Promise((resolve) => setTimeout(resolve, 900));
        if (controller.signal.aborted) {
          throw new DOMException("Aborted", "AbortError");
        }
        const fallbackReply = await requestNonStreamFallback();
        if (hasCreatedStreamMsg) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === modelMsgId ? { ...m, text: fallbackReply } : m
            )
          );
        } else {
          setMessages((prev) => [
            ...prev,
            { id: modelMsgId, role: "model", text: fallbackReply },
          ]);
        }
      } else if (streamError) {
        throw streamError;
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        if (hasCreatedStreamMsg) {
          setMessages((prev) => prev.filter((m) => m.id !== modelMsgId));
        }
        if (timedOut) {
          setError(
            "A solicitação excedeu o tempo limite de resposta do servidor. Aguarde alguns segundos e tente novamente."
          );
          setFailedUserText(trimmed);
        } else if (manualCancelRef.current) {
          setError(
            "Consulta cancelada. Você pode enviar novamente ou ajustar sua mensagem abaixo."
          );
          setFailedUserText(trimmed);
        }
        return;
      }
      if (hasCreatedStreamMsg) {
        setMessages((prev) => prev.filter((m) => m.id !== modelMsgId));
      }
      const rawMsg =
        err instanceof Error
          ? err.message
          : "Ocorreu uma instabilidade na conexão. Aguarde alguns segundos e tente novamente.";
      const friendlyMsg =
        rawMsg === "STREAM_READ_TIMEOUT"
          ? "A conexão demorou mais que o esperado para responder. Tente novamente em instantes."
          : rawMsg.includes("Failed to fetch") ||
              rawMsg.includes("NetworkError") ||
              rawMsg.includes("Load failed")
            ? "Sem conexão estável com o servidor no momento. Verifique sua internet e tente novamente."
            : rawMsg;
      setError(friendlyMsg);
      setFailedUserText(trimmed);
    } finally {
      window.clearTimeout(timeoutId);
      if (streamAbortRef.current === controller) {
        streamAbortRef.current = null;
      }
      setStreamingMessageId(null);
      setLoadingStage(null);
      setIsLoading(false);
    }
  };

  const transcribeBlob = async (blob: Blob) => {
    setIsTranscribing(true);
    setError(null);
    setAudioNotice(null);
    const controller = new AbortController();
    transcribeAbortRef.current = controller;
    const timeoutId = window.setTimeout(() => controller.abort(), 35_000);
    try {
      const base64Audio = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = typeof reader.result === "string" ? reader.result : "";
          const base64Part = result.split(",")[1] ?? "";
          if (!base64Part) {
            reject(new Error("Falha ao processar o áudio gravado."));
            return;
          }
          resolve(base64Part);
        };
        reader.onerror = () => reject(new Error("Erro ao ler o áudio gravado."));
        reader.readAsDataURL(blob);
      });

      const cleanMime =
        (blob.type || "audio/webm").split(";")[0].trim() || "audio/webm";

      const res = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioBase64: base64Audio,
          mimeType: cleanMime,
        }),
        signal: controller.signal,
      });

      let data: { text?: string; error?: string } = {};
      try {
        data = (await res.json()) as { text?: string; error?: string };
      } catch {
        data = {};
      }

      if (!res.ok || !data.text) {
        throw new Error(
          data.error ||
            "Não foi possível transcrever o áudio no momento. Aguarde alguns segundos e tente novamente ou digite sua mensagem."
        );
      }

      const cleanTranscript = sanitizeOutputText(data.text);
      if (cleanTranscript) {
        setInput((prev) =>
          prev.trim() ? `${prev.trim()} ${cleanTranscript}` : cleanTranscript
        );
        setAudioNotice("Áudio transcrito. Revise o texto abaixo e clique em Enviar.");
        setTimeout(() => setAudioNotice(null), 5000);
        textareaRef.current?.focus();
      } else {
        setError(
          "Não foi possível identificar fala no áudio gravado. Tente falar mais perto do microfone."
        );
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError(
          "A transcrição de áudio demorou mais que o esperado. Tente gravar um trecho mais curto ou digite sua mensagem."
        );
      } else {
        const msg =
          err instanceof Error
            ? err.message
            : "Não foi possível transcrever o áudio. Tente novamente ou digite sua mensagem.";
        setError(msg);
      }
    } finally {
      window.clearTimeout(timeoutId);
      if (transcribeAbortRef.current === controller) {
        transcribeAbortRef.current = null;
      }
      setIsTranscribing(false);
    }
  };

  const handleToggleRecording = async () => {
    if (isLoading || isTranscribing) return;

    if (isRecording) {
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        recorder.stop();
      }
      setIsRecording(false);
      return;
    }

    setError(null);
    setAudioNotice(null);

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setError(
        "A gravação de áudio não é suportada neste navegador. Você pode digitar sua mensagem normalmente."
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const mimeCandidates = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/ogg;codecs=opus",
      ];
      const preferredMime =
        mimeCandidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";

      const recorder = preferredMime
        ? new MediaRecorder(stream, { mimeType: preferredMime })
        : new MediaRecorder(stream);

      audioChunksRef.current = [];

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        const rawMime = recorder.mimeType || preferredMime || "audio/webm";
        const cleanMime = rawMime.split(";")[0].trim() || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, { type: cleanMime });
        audioChunksRef.current = [];
        if (audioBlob.size < 100) {
          setError(
            "A gravação foi muito curta ou não capturou som. Segure ou fale por alguns segundos antes de tocar em Parar."
          );
          return;
        }
        void transcribeBlob(audioBlob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);
      setIsRecording(true);
    } catch {
      setError(
        "Não foi possível acessar o microfone. Verifique a permissão no navegador ou digite sua mensagem."
      );
      setIsRecording(false);
    }
  };

  const loadSpeechVoices = (): Promise<SpeechSynthesisVoice[]> => {
    const synth = window.speechSynthesis;
    const current = synth.getVoices();
    if (current.length > 0) {
      return Promise.resolve(current);
    }
    return new Promise((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        synth.removeEventListener("voiceschanged", finish);
        resolve(synth.getVoices());
      };
      synth.addEventListener("voiceschanged", finish);
      window.setTimeout(finish, 600);
    });
  };

  const pickFemalePortugueseVoice = (
    voices: SpeechSynthesisVoice[]
  ): { voice: SpeechSynthesisVoice | undefined; isConfirmedMale: boolean } => {
    const ptVoices = voices.filter((v) =>
      v.lang.toLowerCase().startsWith("pt")
    );
    if (ptVoices.length === 0) {
      return { voice: undefined, isConfirmedMale: false };
    }

    const femaleNameRegex =
      /francisca|thalita|maria|luciana|vitoria|vitória|camila|raquel|joana|fernanda|catarina|heloisa|heloísa|leticia|letícia|gabriela|beatriz|sofia|clara|ana\b|laura|aline|juliana|mariana|patricia|patrícia|female|feminina|mulher|woman/i;
    const googlePtBrRegex = /google\s+portugu[eê]s/i;
    const maleNameRegex =
      /daniel|antonio|antônio|ricardo|felipe|duarte|tiago|thiago|pedro|humberto|donato|fabio|fábio|julio|júlio|nicolau|valerio|valério|carlos|lucas|gabriel|rafael|male|masculin|homem|\bman\b/i;

    let bestVoice: SpeechSynthesisVoice | undefined;
    let bestScore = -Infinity;

    for (const v of ptVoices) {
      let score = 0;
      const lang = v.lang.toLowerCase();
      if (lang === "pt-br" || lang === "pt_br") score += 30;
      else score += 10;

      if (femaleNameRegex.test(v.name)) score += 120;
      else if (googlePtBrRegex.test(v.name)) score += 90;

      if (maleNameRegex.test(v.name)) score -= 250;
      if (/natural|online|neural/i.test(v.name)) score += 20;

      if (score > bestScore) {
        bestScore = score;
        bestVoice = v;
      }
    }

    const isConfirmedMale = bestVoice ? maleNameRegex.test(bestVoice.name) : false;
    return { voice: bestVoice, isConfirmedMale };
  };

  const speakWithBrowserFallback = async (
    messageId: string,
    textToRead: string
  ) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setError("A leitura em áudio não é suportada neste navegador.");
      setSpeakingMessageId(null);
      return;
    }

    const chunks = splitSpeechChunks(textToRead, 200);
    if (chunks.length === 0) {
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    speechCancelledRef.current = false;
    setSpeakingMessageId(messageId);

    const voices = await loadSpeechVoices();
    if (speechCancelledRef.current) {
      setSpeakingMessageId(null);
      return;
    }

    const { voice: selectedVoice, isConfirmedMale } =
      pickFemalePortugueseVoice(voices);

    let index = 0;
    const speakNext = () => {
      if (speechCancelledRef.current || index >= chunks.length) {
        setSpeakingMessageId(null);
        return;
      }
      const utterance = new SpeechSynthesisUtterance(chunks[index]);
      utterance.lang = "pt-BR";
      if (selectedVoice) utterance.voice = selectedVoice;
      utterance.rate = 0.98;
      utterance.pitch = isConfirmedMale ? 1.18 : 1.03;
      utterance.onend = () => {
        index += 1;
        speakNext();
      };
      utterance.onerror = () => {
        setSpeakingMessageId(null);
      };
      window.speechSynthesis.speak(utterance);
    };

    speakNext();
  };

  const handleToggleSpeakMessage = async (msg: ChatMessage) => {
    const isCurrentlyActive =
      speakingMessageId === msg.id || loadingAudioMessageId === msg.id;

    stopAudioPlayback();
    if (isCurrentlyActive) {
      return;
    }

    setError(null);
    const plainText = stripMarkdownForSpeech(msg.text);
    if (!plainText) return;

    // Prefer instant, reliable native browser SpeechSynthesis in pt-BR when available
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      void speakWithBrowserFallback(msg.id, plainText);
      return;
    }

    setLoadingAudioMessageId(msg.id);
    speechCancelledRef.current = false;

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: msg.text }),
      });

      if (speechCancelledRef.current) return;

      let data: { audioBase64?: string; mimeType?: string } = {};
      try {
        data = (await res.json()) as { audioBase64?: string; mimeType?: string };
      } catch {
        data = {};
      }

      if (!res.ok || !data.audioBase64) {
        throw new Error("Não foi possível reproduzir o áudio no momento.");
      }

      const audio = new Audio(
        `data:${data.mimeType || "audio/wav"};base64,${data.audioBase64}`
      );
      audioPlayerRef.current = audio;

      audio.onended = () => {
        if (audioPlayerRef.current === audio) {
          audioPlayerRef.current = null;
        }
        setSpeakingMessageId(null);
      };

      audio.onerror = () => {
        if (audioPlayerRef.current === audio) {
          audioPlayerRef.current = null;
        }
        setSpeakingMessageId(null);
        setError("Não foi possível reproduzir o áudio neste navegador.");
      };

      setLoadingAudioMessageId(null);
      setSpeakingMessageId(msg.id);
      await audio.play();
    } catch {
      if (speechCancelledRef.current) return;
      setLoadingAudioMessageId(null);
      setError("A leitura em áudio não está disponível neste navegador.");
    }
  };

  const handleCopy = async (id: string, text: string, isFinalPlan: boolean) => {
    try {
      const contentToCopy = isFinalPlan
        ? formatBirthPlanWithFooter(sanitizeOutputText(text))
        : sanitizeOutputText(text);
      await navigator.clipboard.writeText(contentToCopy);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      setError("Não foi possível copiar automaticamente. Selecione o texto manualmente.");
    }
  };

  const handleDownloadPdf = (text: string) => {
    try {
      setError(null);
      downloadBirthPlanPdf(sanitizeOutputText(text));
      setPdfNotice("PDF gerado e baixado.");
      setTimeout(() => setPdfNotice(null), 3000);
    } catch (err: unknown) {
      console.error("Erro ao gerar PDF:", err);
      setError("Não foi possível gerar o arquivo PDF. Tente novamente ou use Copiar texto.");
    }
  };

  const handleReset = () => {
    manualCancelRef.current = false;
    streamAbortRef.current?.abort();
    streamAbortRef.current = null;
    transcribeAbortRef.current?.abort();
    transcribeAbortRef.current = null;
    stopAudioPlayback();
    setStreamingMessageId(null);
    setLoadingStage(null);
    setElapsedSeconds(0);
    setIsLoading(false);
    setMessages([INITIAL_ASSISTANT_MESSAGE]);
    setError(null);
    setAudioNotice(null);
    setFailedUserText(null);
    setPdfNotice(null);
    setInput("");
  };

  return (
    <div className="pt-8 pb-16">
      {/* Screen Header */}
      <div className="no-print border-b border-[#F2D7DF] pb-6 mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#B54B6E]">
            Assistente Especializada em Direitos Reprodutivos
          </p>
          <h1
            className="mt-2 font-editorial text-3xl md:text-4xl font-semibold text-[#2A1F24]"
            style={{ textWrap: "balance" }}
          >
            Gerador de Plano de Parto
          </h1>
          <p className="mt-2.5 text-sm md:text-base text-[#5E4D54] leading-relaxed">
            Converse com a assistente por texto ou áudio para responder sobre suas escolhas e gerar seu Plano de Parto em PDF conforme a Lei nº 11.108/2005 e as diretrizes da OMS.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {lastFinalPlanMessage && (
            <button
              type="button"
              onClick={() => handleDownloadPdf(lastFinalPlanMessage.text)}
              className="inline-flex items-center gap-2 rounded-lg bg-[#D87093] hover:bg-[#B54B6E] px-4 py-2.5 text-xs font-semibold text-white transition-colors cursor-pointer whitespace-nowrap"
            >
              <FileDown className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Baixar PDF</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 rounded-lg border border-[#F2D7DF] bg-white hover:bg-[#FFF0F3] px-4 py-2.5 text-xs font-semibold text-[#5E4D54] transition-colors cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Nova conversa</span>
          </button>
        </div>
      </div>

      {pdfNotice && (
        <div
          role="status"
          className="no-print mb-4 rounded-lg border border-[#F2D7DF] bg-[#FFF0F3] px-4 py-2.5 text-xs font-medium text-[#8E3352]"
        >
          {pdfNotice}
        </div>
      )}

      {/* Main Chat Container */}
      <div className="no-print">
        <div className="w-full flex flex-col rounded-xl border border-[#F2D7DF] bg-white h-[74dvh] min-h-[500px] max-h-[700px] sm:h-[76dvh] sm:min-h-[580px] sm:max-h-[780px] lg:h-[78vh] lg:min-h-[640px] lg:max-h-[840px]">
          {/* Messages Scroll Area */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-3.5 sm:p-5 md:p-6 flex flex-col gap-4 sm:gap-5"
          >
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              const isStreamingMsg = msg.id === streamingMessageId;
              const isGeneratedDoc =
                !isUser &&
                !isStreamingMsg &&
                msg.id !== "welcome-msg" &&
                hasUserResponded &&
                isFinalBirthPlanDocument(msg.text);

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                >
                  <span className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#5E4D54]">
                    {isUser ? "Você" : "Assistente Nascer Amparado"}
                  </span>

                  <div
                    className={`w-full max-w-[96%] sm:max-w-[88%] lg:max-w-[85%] rounded-xl px-4 py-3 sm:px-5 sm:py-4 ${
                      isUser
                        ? "bg-[#FFF0F3] border border-[#F2D7DF] text-[#2A1F24]"
                        : "bg-white border border-[#F2D7DF] text-[#2A1F24]"
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#2A1F24]">
                        {msg.text}
                      </p>
                    ) : (
                      <>
                        <MarkdownRenderer
                          content={
                            isGeneratedDoc
                              ? extractBirthPlanOnly(msg.text)
                              : msg.text
                          }
                          documentStyle={isGeneratedDoc}
                        />

                        {isGeneratedDoc && (
                          <div className="mt-6 space-y-5">
                            <div className="rounded-lg border border-[#D87093] bg-[#FFF7F9] px-4 py-3.5">
                              <p className="text-xs font-semibold uppercase tracking-wider text-[#8E3352]">
                                Lembrete Importante
                              </p>
                              <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-[#2A1F24]">
                                {BIRTH_PLAN_REMINDER}
                              </p>
                            </div>

                            <div className="pt-2">
                              <p className="text-xs text-[#5E4D54] mb-6">
                                Local e data: ____________________________________________, ____/____/________
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
                                <div className="text-center">
                                  <div className="border-t border-[#5E4D54] pt-2">
                                    <p className="text-xs font-semibold text-[#2A1F24]">
                                      Gestante
                                    </p>
                                    <p className="text-[11px] text-[#5E4D54]">
                                      Nome e Assinatura
                                    </p>
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="border-t border-[#5E4D54] pt-2">
                                    <p className="text-xs font-semibold text-[#2A1F24]">
                                      Acompanhante
                                    </p>
                                    <p className="text-[11px] text-[#5E4D54]">
                                      Lei Federal nº 11.108/2005
                                    </p>
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="border-t border-[#5E4D54] pt-2">
                                    <p className="text-xs font-semibold text-[#2A1F24]">
                                      Médico(a)
                                    </p>
                                    <p className="text-[11px] text-[#5E4D54]">
                                      Assinatura e Carimbo / CRM
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {!isUser && isStreamingMsg && (
                      <div className="mt-3 pt-2.5 border-t border-[#F2D7DF] flex items-center justify-between gap-3 text-xs text-[#8E3352]">
                        <span className="inline-flex items-center gap-2 font-medium">
                          <Loader2
                            className="h-3.5 w-3.5 animate-spin text-[#B54B6E]"
                            aria-hidden="true"
                          />
                          <span>Escrevendo resposta...</span>
                        </span>
                        <button
                          type="button"
                          onClick={handleCancelRequest}
                          className="rounded-md border border-[#F2D7DF] bg-[#FFF7F9] hover:bg-[#FFF0F3] px-2.5 py-1 text-[11px] font-semibold text-[#8E3352] transition-colors cursor-pointer"
                        >
                          Interromper
                        </button>
                      </div>
                    )}

                    {!isUser && !isStreamingMsg && (
                      <div className="mt-4 pt-3 border-t border-[#F2D7DF] flex flex-wrap items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => void handleToggleSpeakMessage(msg)}
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                            speakingMessageId === msg.id ||
                            loadingAudioMessageId === msg.id
                              ? "border-[#B54B6E] bg-[#B54B6E] text-white"
                              : "border-[#F2D7DF] bg-[#FFF7F9] hover:bg-[#FFF0F3] text-[#8E3352]"
                          }`}
                        >
                          {loadingAudioMessageId === msg.id ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                              <span>Preparando áudio...</span>
                            </>
                          ) : speakingMessageId === msg.id ? (
                            <>
                              <Square className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>Parar leitura</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>Ouvir resposta</span>
                            </>
                          )}
                        </button>

                        {isGeneratedDoc && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleDownloadPdf(msg.text)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-[#D87093] hover:bg-[#B54B6E] px-3.5 py-2 text-xs font-semibold text-white transition-colors cursor-pointer"
                            >
                              <FileDown className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>Baixar PDF</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => void handleCopy(msg.id, msg.text, true)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-[#F2D7DF] bg-[#FFF7F9] hover:bg-[#FFF0F3] px-3 py-2 text-xs font-semibold text-[#8E3352] transition-colors cursor-pointer"
                            >
                              {copiedId === msg.id ? (
                                <>
                                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                                  <span>Copiado</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                                  <span>Copiar texto</span>
                                </>
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && !streamingMessageId && (
              <div className="flex flex-col items-start" role="status" aria-live="polite">
                <span className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#5E4D54]">
                  Assistente Nascer Amparado
                </span>
                <div className="w-full max-w-[96%] sm:max-w-[88%] lg:max-w-[85%] rounded-xl border border-[#D87093] bg-[#FFF7F9] px-4 py-3.5 sm:px-5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Loader2
                      className="h-4 w-4 mt-0.5 animate-spin text-[#B54B6E] shrink-0"
                      aria-hidden="true"
                    />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-[#2A1F24] leading-relaxed">
                        {loadingStage === "retrying"
                          ? "Instabilidade momentânea detectada. Tentando conexão alternativa com a assistente..."
                          : elapsedSeconds >= 6
                            ? `Processando sua solicitação (${elapsedSeconds}s). O servidor está com alta demanda no momento...`
                            : "Consultando as diretrizes da OMS, do Ministério da Saúde e a Lei nº 11.108/2005..."}
                      </p>
                      <p className="text-xs text-[#5E4D54]">
                        {elapsedSeconds >= 3
                          ? `Tempo de espera: ${elapsedSeconds}s`
                          : "Aguarde alguns instantes enquanto preparamos sua resposta."}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCancelRequest}
                    className="inline-flex items-center justify-center rounded-lg border border-[#F2D7DF] bg-white hover:bg-[#FFF0F3] px-3 py-1.5 text-xs font-semibold text-[#8E3352] transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-center"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-[#D87093] bg-[#FFF0F3] px-4 py-3.5 text-sm text-[#8E3352] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-2.5">
                  <AlertCircle
                    className="h-4 w-4 mt-0.5 text-[#B54B6E] shrink-0"
                    aria-hidden="true"
                  />
                  <p className="leading-relaxed">{error}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {failedUserText && (
                    <button
                      type="button"
                      onClick={() => void sendMessage(failedUserText, true)}
                      disabled={isLoading}
                      className="inline-flex items-center justify-center rounded-lg bg-[#D87093] hover:bg-[#B54B6E] px-3.5 py-2 text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Tentar novamente
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setFailedUserText(null);
                    }}
                    aria-label="Fechar aviso de erro"
                    className="inline-flex items-center justify-center rounded-lg border border-[#F2D7DF] bg-white hover:bg-[#FFF7F9] p-2 text-[#8E3352] transition-colors cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Starter Prompts when conversation is fresh */}
          {messages.length === 1 && (
            <div className="px-3.5 sm:px-5 pb-3 flex flex-wrap gap-2">
              {STARTER_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => void sendMessage(q)}
                  disabled={isLoading}
                  className="rounded-lg border border-[#F2D7DF] bg-[#FFF7F9] hover:bg-[#FFF0F3] px-3 py-2 text-xs font-medium text-[#8E3352] transition-colors cursor-pointer text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Chat Composer (Text + Audio Input) */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void sendMessage(input);
            }}
            className="border-t border-[#F2D7DF] bg-[#FFF7F9] p-3 sm:p-4 rounded-b-xl"
          >
            {(isRecording || isTranscribing || audioNotice) && (
              <div
                role="status"
                className="mb-2.5 rounded-lg border border-[#D87093] bg-white px-3.5 py-2 text-xs font-medium text-[#8E3352] flex items-center gap-2"
              >
                {isTranscribing && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#B54B6E] shrink-0" aria-hidden="true" />
                )}
                <span>
                  {isRecording
                    ? "Gravando áudio pelo microfone. Toque no botão Parar quando terminar de falar."
                    : isTranscribing
                      ? "Transcrevendo seu áudio para texto..."
                      : audioNotice}
                </span>
              </div>
            )}

            <div className="flex items-end gap-2 sm:gap-3">
              <div className="flex-1">
                <label htmlFor="chat-input" className="sr-only">
                  Escreva sua dúvida ou preferência para o Plano de Parto
                </label>
                <textarea
                  ref={textareaRef}
                  id="chat-input"
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void sendMessage(input);
                    }
                  }}
                  placeholder="Escreva ou grave suas dúvidas e preferências para o parto..."
                  className="w-full min-h-[52px] max-h-[150px] resize-none overflow-y-auto rounded-lg border border-[#F2D7DF] bg-white px-4 py-3 text-sm leading-6 text-[#2A1F24] placeholder:text-[#9A858D] focus:border-[#D87093] focus:outline-none block"
                />
              </div>

              <button
                type="button"
                onClick={() => void handleToggleRecording()}
                disabled={isLoading || isTranscribing}
                aria-label={isRecording ? "Parar gravação de áudio" : "Gravar mensagem por áudio"}
                title={isRecording ? "Parar gravação" : "Falar pelo microfone"}
                className={`inline-flex h-[52px] items-center justify-center gap-2 rounded-lg border px-3.5 sm:px-4 text-sm font-semibold transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 ${
                  isRecording
                    ? "border-[#B54B6E] bg-[#B54B6E] text-white"
                    : "border-[#D87093] bg-white hover:bg-[#FFF0F3] text-[#8E3352]"
                }`}
              >
                {isRecording ? (
                  <>
                    <Square className="h-4 w-4" aria-hidden="true" />
                    <span className="hidden sm:inline">Parar</span>
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4" aria-hidden="true" />
                    <span className="hidden sm:inline">Áudio</span>
                  </>
                )}
              </button>

              <button
                type="submit"
                disabled={isLoading || isTranscribing || !input.trim()}
                className="inline-flex h-[52px] items-center justify-center gap-2 rounded-lg bg-[#D87093] hover:bg-[#B54B6E] disabled:opacity-50 px-4 sm:px-6 text-sm font-semibold text-white transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    <span className="hidden sm:inline">Enviando...</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Enviar</span>
                    <Send className="h-4 w-4" aria-hidden="true" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
