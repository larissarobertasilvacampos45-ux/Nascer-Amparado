import { useCallback, useEffect, useRef, useState } from "react";

function sanitizeForSpeech(input: string): string {
  return input
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/[\uFE0E\uFE0F\u200D]/g, "")
    .replace(/[✓✔✗✘★☆♥♡❤❥☀☁☂☃]/g, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^[-*•]\s+/gm, "")
    .replace(/^---+$/gm, "")
    .replace(/[ ]{2,}/g, " ")
    .trim();
}

function splitSpeechChunks(text: string, maxLen = 200): string[] {
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

function loadSpeechVoices(): Promise<SpeechSynthesisVoice[]> {
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
}

function pickFemalePortugueseVoice(voices: SpeechSynthesisVoice[]): {
  voice: SpeechSynthesisVoice | undefined;
  isConfirmedMale: boolean;
} {
  const ptVoices = voices.filter((v) => v.lang.toLowerCase().startsWith("pt"));
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

  const isConfirmedMale = bestVoice
    ? maleNameRegex.test(bestVoice.name)
    : false;
  return { voice: bestVoice, isConfirmedMale };
}

export interface UseFemaleSpeechReturn {
  speakingId: string | null;
  loadingId: string | null;
  speechError: string | null;
  rate: number;
  setRate: (rate: number) => void;
  toggleSpeak: (id: string, text: string) => Promise<void>;
  stop: () => void;
  clearError: () => void;
}

export function useFemaleSpeech(): UseFemaleSpeechReturn {
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [rate, setRate] = useState<number>(0.96);

  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const cancelledRef = useRef(false);
  const rateRef = useRef(rate);

  useEffect(() => {
    rateRef.current = rate;
  }, [rate]);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  const stop = useCallback(() => {
    cancelledRef.current = true;
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.currentTime = 0;
      audioPlayerRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingId(null);
    setLoadingId(null);
  }, []);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  const clearError = useCallback(() => {
    setSpeechError(null);
  }, []);

  const speakWithServerTts = useCallback(
    async (id: string, cleanText: string) => {
      setLoadingId(id);
      cancelledRef.current = false;

      const segments = splitSpeechChunks(cleanText, 2800);
      if (segments.length === 0) {
        setLoadingId(null);
        setSpeakingId(null);
        return;
      }

      try {
        for (let i = 0; i < segments.length; i += 1) {
          if (cancelledRef.current) return;

          const res = await fetch("/api/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: segments[i] }),
          });

          if (cancelledRef.current) return;

          let data: { audioBase64?: string; mimeType?: string } = {};
          try {
            data = (await res.json()) as {
              audioBase64?: string;
              mimeType?: string;
            };
          } catch {
            data = {};
          }

          if (!res.ok || !data.audioBase64) {
            throw new Error("TTS_UNAVAILABLE");
          }

          await new Promise<void>((resolve, reject) => {
            if (cancelledRef.current) {
              resolve();
              return;
            }
            const audio = new Audio(
              `data:${data.mimeType || "audio/wav"};base64,${data.audioBase64}`,
            );
            audio.playbackRate = rateRef.current;
            audioPlayerRef.current = audio;

            audio.onended = () => {
              if (audioPlayerRef.current === audio) {
                audioPlayerRef.current = null;
              }
              resolve();
            };

            audio.onerror = () => {
              if (audioPlayerRef.current === audio) {
                audioPlayerRef.current = null;
              }
              reject(new Error("AUDIO_PLAYBACK_ERROR"));
            };

            setLoadingId(null);
            setSpeakingId(id);
            audio.play().catch(reject);
          });
        }

        if (!cancelledRef.current) {
          setSpeakingId(null);
        }
      } catch {
        if (cancelledRef.current) return;
        setLoadingId(null);
        setSpeakingId(null);
        setSpeechError(
          "A leitura em áudio não está disponível no momento neste navegador.",
        );
      }
    },
    [],
  );

  const toggleSpeak = useCallback(
    async (id: string, rawText: string) => {
      const isCurrentlyActive = speakingId === id || loadingId === id;
      stop();
      if (isCurrentlyActive) {
        return;
      }

      setSpeechError(null);
      const cleanText = sanitizeForSpeech(rawText);
      if (!cleanText) return;

      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        const chunks = splitSpeechChunks(cleanText, 200);
        if (chunks.length === 0) return;

        cancelledRef.current = false;
        setSpeakingId(id);

        const voices = await loadSpeechVoices();
        if (cancelledRef.current) {
          setSpeakingId(null);
          return;
        }

        const { voice: selectedVoice, isConfirmedMale } =
          pickFemalePortugueseVoice(voices);

        // If the browser has no Portuguese voice at all, fall back to server female TTS
        const hasAnyPtVoice = voices.some((v) =>
          v.lang.toLowerCase().startsWith("pt"),
        );
        if (voices.length > 0 && !hasAnyPtVoice) {
          setSpeakingId(null);
          await speakWithServerTts(id, cleanText);
          return;
        }

        let index = 0;
        const speakNext = () => {
          if (cancelledRef.current || index >= chunks.length) {
            setSpeakingId(null);
            return;
          }
          const utterance = new SpeechSynthesisUtterance(chunks[index]);
          utterance.lang = "pt-BR";
          if (selectedVoice) utterance.voice = selectedVoice;
          utterance.rate = rateRef.current;
          utterance.pitch = isConfirmedMale ? 1.18 : 1.03;
          utterance.onend = () => {
            index += 1;
            speakNext();
          };
          utterance.onerror = () => {
            setSpeakingId(null);
          };
          window.speechSynthesis.speak(utterance);
        };

        speakNext();
        return;
      }

      await speakWithServerTts(id, cleanText);
    },
    [loadingId, speakWithServerTts, speakingId, stop],
  );

  return {
    speakingId,
    loadingId,
    speechError,
    rate,
    setRate,
    toggleSpeak,
    stop,
    clearError,
  };
}
