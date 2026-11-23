import { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Square,
  Volume2,
  X,
} from "lucide-react";
import { ResilientImage } from "./ResilientImage";
import type { AppTab } from "./HomeTab";
import { useFemaleSpeech } from "../hooks/useFemaleSpeech";
import postpartumBreastfeedingImg from "../assets/images/postpartum_breastfeeding_1794683309138.jpg";
import postpartumBabyCareImg from "../assets/images/postpartum_baby_care_1794683309063.jpg";

interface PostpartumGuideTabProps {
  onNavigate: (tab: AppTab) => void;
}

type GuideSection = "amamentacao" | "coto" | "banho" | "alerta";

const SECTION_SPEECH_TEXT: Record<GuideSection, string> = {
  amamentacao: `Seção 1. Amamentação em livre demanda.
Livre demanda significa oferecer o peito sempre que o bebê quiser, sem horários rígidos e sem limitar o tempo de cada mamada. Nos primeiros meses, o leite materno supre toda a necessidade de alimento e água do bebê. Não é necessário oferecer água, chás ou outros líquidos.
Como reconhecer a pega correta:
Barriga com barriga: o corpo do bebê fica bem alinhado e encostado no seu, com o rosto voltado de frente para o peito.
Boca bem aberta, boca de peixinho: o bebê abocanha grande parte da aréola, a parte escura, não apenas o bico.
Lábio virado para fora e queixo encostado: o queixo toca a mama e o nariz fica livre para respirar. Aparece mais aréola acima da boca do bebê do que abaixo.
Sem dor intensa nem estalos: nos primeiros dias pode haver sensibilidade leve no início da mamada, mas dor contínua ou fissuras indicam que vale ajustar a pega com apoio da UBS ou do Banco de Leite Humano.
Sinais precoces de fome: o choro já é um sinal tardio. Ofereça o peito quando o bebê começar a mexer a cabecinha procurando, abrir a boca, colocar as mãozinhas na boca ou fazer sons suaves de sucção.
Como saber se está mamando bem: após o quarto dia de vida, observe seis ou mais fraldas bem molhadas de xixi claro por dia, ganho de peso nas consultas e períodos de calma após mamar.`,

  coto: `Seção 2. Limpeza correta do coto umbilical com álcool 70%.
O coto umbilical costuma secar, escurecer e cair naturalmente entre 7 e 21 dias após o nascimento. A limpeza adequada evita infecções e acelera a cicatrização. Importante: o coto não tem terminações nervosas, portanto a limpeza não causa dor no bebê, ele pode apenas estranhar o geladinho do álcool.
Passo 1. Lave bem as mãos: antes de tocar no coto umbilical ou na fralda, higienize suas mãos e punhos com água e sabão.
Passo 2. Use álcool 70% líquido: umedeça uma haste flexível ou gaze limpa com álcool etílico 70%. Não utilize álcool em gel ou outros produtos.
Passo 3. Limpe a base com firmeza suave: segure delicadamente a pontinha do coto ou o prendedor plástico para levantar e passe o algodão ou gaze em volta de toda a base onde o coto encontra a pele da barriguinha, depois limpe a parte de cima.
Passo 4. Deixe secar e dobre a fralda: aguarde secar ao ar antes de fechar a fralda. Dobre a borda superior da fralda para baixo do umbigo, mantendo a região seca e ventilada.
Frequência e o que não colocar no umbigo: faça a limpeza após o banho e a cada troca de fralda, ou sempre que sujar de xixi ou cocô. Nunca utilize faixas umbilicais, moedas, pó de café, açúcar, ervas, talco, mercúrio ou pomadas caseiras. Após a queda do coto, continue limpando o local com álcool 70% por mais dois a três dias até cicatrizar completamente.`,

  banho: `Seção 3. Orientações para o primeiro banho do bebê.
A Organização Mundial da Saúde recomenda aguardar pelo menos 24 horas após o nascimento para o primeiro banho, preservando o vérnix, a camada protetora natural da pele, e garantindo que o bebê mantenha a temperatura corporal estável.
Passo 1. Prepare tudo antes de tirar a roupa do bebê: feche janelas e portas para evitar vento frio. Deixe separados ao alcance das mãos: toalha macia, fralda limpa, roupa confortável, sabonete líquido neutro infantil sem perfume forte, álcool 70% e gaze para o umbigo.
Passo 2. Confira a temperatura da água, entre 36 e 37 graus: coloque primeiro a água fria e depois a quente na banheira higienizada, misturando bem. Teste com a parte interna do punho ou cotovelo. A água deve estar morna e agradável, nunca quente.
Passo 3. Limpe o rosto e a cabeça primeiro: antes de colocar o bebê na água, ou já apoiado com segurança no seu antebraço, limpe os olhinhos com algodão umedecido em água morna de dentro para fora e o rostinho. Lave a cabecinha com movimentos suaves e seque logo em seguida para o bebê não sentir frio.
Passo 4. Apoio firme e higiene delicada: apoie a cabeça e o pescoço do bebê no seu antebraço, segurando firmemente pela axila do mesmo lado. Coloque-o devagar na banheira começando pelos pés. Lave pescoço, axilas, dobrinhas das pernas e região íntima. Nas meninas, sempre da frente para trás. Não tenha medo de molhar o coto umbilical, depois basta secá-lo bem e passar álcool 70%.
Passo 5. Seque sem esfregar: retire o bebê, envolva-o imediatamente na toalha macia e seque dando batidinhas leves, com atenção especial às dobras do pescoço, atrás das orelhas, axilas e virilha.`,

  alerta: `Seção 4. Sinais de alerta: quando procurar a Unidade Básica de Saúde ou a Maternidade.
Não hesite em buscar atendimento médico gratuito pelo SUS diante de qualquer sinal abaixo.
Sinais de alerta no recém-nascido:
Febre, temperatura axilar igual ou acima de 37,8 graus, ou hipotermia, abaixo de 36 graus.
Vermelhidão ao redor do umbigo, inchaço, secreção com pus ou cheiro forte.
Dificuldade para respirar, respiração muito rápida ou gemidos constantes.
Recusa persistente para mamar, muita sonolência ou dificuldade para acordar.
Pele e olhos muito amarelados, icterícia intensa, ou menos de seis fraldas com xixi por dia após o quarto dia.
Sinais de alerta na mãe durante o puerpério:
Sangramento vaginal muito intenso, encharcando um absorvente grande em menos de uma hora, ou coágulos grandes.
Febre, calafrios ou secreção vaginal com odor forte.
Dor forte na barriga, vermelhidão ou pus nos pontos do parto, ou dor e inchaço em uma das pernas.
Dor de cabeça muito forte, visão embaçada ou pressão alta.
Tristeza profunda que não passa após duas semanas ou sensação de não conseguir cuidar de si ou do bebê. Procure acolhimento na UBS.`,
};

const FULL_GUIDE_SPEECH_TEXT = [
  "Guia Pós-Parto Nascer Amparado. Primeiros cuidados com você e com o seu bebê.",
  SECTION_SPEECH_TEXT.amamentacao,
  SECTION_SPEECH_TEXT.coto,
  SECTION_SPEECH_TEXT.banho,
  SECTION_SPEECH_TEXT.alerta,
].join("\n\n");

const SPEECH_LABELS: Record<string, string> = {
  completo: "Guia completo de pós-parto",
  amamentacao: "01. Amamentação em Livre Demanda",
  coto: "02. Limpeza do Coto Umbilical",
  banho: "03. Primeiro Banho do Bebê",
  alerta: "04. Sinais de Alerta",
};

interface SectionSpeakButtonProps {
  sectionId: GuideSection;
  speakingId: string | null;
  loadingId: string | null;
  onToggle: (id: string, text: string) => void;
}

function SectionSpeakButton({
  sectionId,
  speakingId,
  loadingId,
  onToggle,
}: SectionSpeakButtonProps) {
  const isSpeaking = speakingId === sectionId;
  const isLoading = loadingId === sectionId;
  const isActive = isSpeaking || isLoading;

  return (
    <button
      type="button"
      onClick={() => onToggle(sectionId, SECTION_SPEECH_TEXT[sectionId])}
      aria-pressed={isActive}
      className={`no-print inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 min-h-[44px] text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B54B6E] ${
        isActive
          ? "border-[#B54B6E] bg-[#B54B6E] text-white"
          : "border-[#D87093] bg-[#FFF0F3] hover:bg-[#D87093] text-[#8E3352] hover:text-white"
      }`}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span>Preparando áudio...</span>
        </>
      ) : isSpeaking ? (
        <>
          <Square className="h-4 w-4" aria-hidden="true" />
          <span>Parar leitura</span>
        </>
      ) : (
        <>
          <Volume2 className="h-4 w-4" aria-hidden="true" />
          <span>Ouvir esta seção</span>
        </>
      )}
    </button>
  );
}

export function PostpartumGuideTab({ onNavigate }: PostpartumGuideTabProps) {
  const [activeSection, setActiveSection] = useState<GuideSection>("amamentacao");
  const {
    speakingId,
    loadingId,
    speechError,
    rate,
    setRate,
    toggleSpeak,
    stop,
    clearError,
  } = useFemaleSpeech();

  const jumpTo = (id: GuideSection) => {
    setActiveSection(id);
    const el = document.getElementById(`guia-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const activeAudioId = speakingId ?? loadingId;
  const isReadingFull =
    speakingId === "completo" || loadingId === "completo";

  return (
    <div className="space-y-12 pb-16 pt-8">
      {/* Header */}
      <header className="border-b border-[#F2D7DF] pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#B54B6E]">
          Orientações Pós-Parto · Guia para Mães de Primeira Viagem
        </p>
        <h1
          className="mt-3 font-editorial text-3xl md:text-4xl font-semibold text-[#2A1F24]"
          style={{ textWrap: "balance" }}
        >
          Primeiros cuidados com você e com o seu bebê
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#5E4D54]">
          Orientações práticas, seguras e baseadas nas recomendações do Ministério da Saúde e da Sociedade Brasileira de Pediatria para os primeiros dias em casa.
        </p>

        {/* Hands-free Female Audio Player Bar */}
        <div className="no-print mt-6 rounded-xl border border-[#F2D7DF] bg-[#FFF7F9] p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[#2A1F24]">
              Está com o bebê no colo? Ouça as orientações em áudio
            </p>
            <p className="text-xs text-[#5E4D54] leading-relaxed">
              {activeAudioId
                ? `Reproduzindo agora (voz feminina): ${SPEECH_LABELS[activeAudioId] ?? "Orientações pós-parto"}.`
                : "Toque em ouvir guia completo ou escolha o botão de áudio em cada seção abaixo."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div
              role="group"
              aria-label="Velocidade da leitura em áudio"
              className="inline-flex rounded-lg border border-[#F2D7DF] bg-white p-0.5"
            >
              {[
                { label: "Mais calma", value: 0.85 },
                { label: "Normal", value: 0.96 },
              ].map((opt) => {
                const selected = Math.abs(rate - opt.value) < 0.01;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setRate(opt.value)}
                    aria-pressed={selected}
                    className={`rounded-md px-3 py-2 min-h-[40px] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      selected
                        ? "bg-[#FFF0F3] text-[#8E3352]"
                        : "text-[#5E4D54] hover:text-[#2A1F24]"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => void toggleSpeak("completo", FULL_GUIDE_SPEECH_TEXT)}
              aria-pressed={isReadingFull}
              className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 min-h-[44px] text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B54B6E] ${
                isReadingFull
                  ? "bg-[#B54B6E] text-white"
                  : "bg-[#D87093] hover:bg-[#B54B6E] text-white"
              }`}
            >
              {loadingId === "completo" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Preparando áudio...</span>
                </>
              ) : speakingId === "completo" ? (
                <>
                  <Square className="h-4 w-4" aria-hidden="true" />
                  <span>Parar guia completo</span>
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4" aria-hidden="true" />
                  <span>Ouvir guia completo</span>
                </>
              )}
            </button>

            {activeAudioId && !isReadingFull && (
              <button
                type="button"
                onClick={stop}
                className="inline-flex items-center gap-2 rounded-lg border border-[#B54B6E] bg-white hover:bg-[#FFF0F3] px-4 py-2.5 min-h-[44px] text-xs sm:text-sm font-semibold text-[#8E3352] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Square className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Parar leitura</span>
              </button>
            )}
          </div>
        </div>

        {speechError && (
          <div
            role="alert"
            className="no-print mt-4 rounded-xl border border-[#D87093] bg-[#FFF0F3] px-4 py-3 text-xs sm:text-sm text-[#8E3352] flex items-center justify-between gap-3"
          >
            <span>{speechError}</span>
            <button
              type="button"
              onClick={clearError}
              aria-label="Fechar aviso de áudio"
              className="rounded-lg p-1.5 hover:bg-white/70 transition-colors cursor-pointer shrink-0"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Interactive Section Filter Tabs */}
        <div
          role="tablist"
          aria-label="Seções do guia pós-parto"
          className="mt-6 flex flex-wrap items-center gap-2"
        >
          {[
            { id: "amamentacao" as const, label: "01. Amamentação em Livre Demanda" },
            { id: "coto" as const, label: "02. Limpeza do Coto Umbilical" },
            { id: "banho" as const, label: "03. Primeiro Banho do Bebê" },
            { id: "alerta" as const, label: "04. Sinais de Alerta" },
          ].map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => jumpTo(item.id)}
                className={`rounded-lg px-4 py-2.5 min-h-[44px] text-sm font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? "bg-[#D87093] text-white"
                    : "bg-[#FFF0F3] text-[#8E3352] hover:bg-[#FCE4EA]"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Section 01: Amamentação em Livre Demanda */}
      <section
        id="guia-amamentacao"
        className="scroll-mt-24 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch"
      >
        <div className="lg:col-span-7 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <span className="text-xs font-semibold tracking-wider text-[#B54B6E] tabular-nums">
                01. ALEITAMENTO MATERNO
              </span>
              <h2 className="mt-1.5 font-editorial text-2xl md:text-3xl font-semibold text-[#2A1F24]">
                Amamentação em Livre Demanda
              </h2>
            </div>
            <SectionSpeakButton
              sectionId="amamentacao"
              speakingId={speakingId}
              loadingId={loadingId}
              onToggle={(id, text) => void toggleSpeak(id, text)}
            />
          </div>

          <p className="text-base leading-relaxed text-[#5E4D54]">
            Livre demanda significa oferecer o peito sempre que o bebê quiser, sem horários rígidos e sem limitar o tempo de cada mamada. Nos primeiros meses, o leite materno supre toda a necessidade de alimento e água do bebê — não é necessário oferecer água, chás ou outros líquidos.
          </p>

          <div className="rounded-xl border border-[#F2D7DF] bg-[#FFF7F9] p-6 space-y-4">
            <h3 className="font-editorial text-lg font-semibold text-[#2A1F24]">
              Como reconhecer a pega correta
            </h3>
            <ul className="space-y-2.5 text-sm text-[#2A1F24] leading-relaxed">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#B54B6E] mt-0.5 shrink-0" aria-hidden="true" />
                <span>
                  <strong className="font-semibold">Barriga com barriga:</strong> o corpo do bebê fica bem alinhado e encostado no seu, com o rosto voltado de frente para o peito.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#B54B6E] mt-0.5 shrink-0" aria-hidden="true" />
                <span>
                  <strong className="font-semibold">Boca bem aberta ("boca de peixinho"):</strong> o bebê abocanha grande parte da aréola (a parte escura), não apenas o bico.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#B54B6E] mt-0.5 shrink-0" aria-hidden="true" />
                <span>
                  <strong className="font-semibold">Lábio virado para fora e queixo encostado:</strong> o queixo toca a mama e o nariz fica livre para respirar. Aparece mais aréola acima da boca do bebê do que abaixo.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#B54B6E] mt-0.5 shrink-0" aria-hidden="true" />
                <span>
                  <strong className="font-semibold">Sem dor intensa nem estalos:</strong> nos primeiros dias pode haver sensibilidade leve no início da mamada, mas dor contínua ou fissuras indicam que vale ajustar a pega com apoio da UBS ou Banco de Leite Humano.
                </span>
              </li>
            </ul>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-[#F2D7DF] bg-white p-5">
              <h4 className="font-semibold text-sm text-[#8E3352]">
                Sinais precoces de fome
              </h4>
              <p className="mt-2 text-sm text-[#5E4D54] leading-relaxed">
                O choro já é um sinal tardio. Ofereça o peito quando o bebê começar a mexer a cabecinha procurando, abrir a boca, colocar as mãozinhas na boca ou fazer sons suaves de sucção.
              </p>
            </div>
            <div className="rounded-xl border border-[#F2D7DF] bg-white p-5">
              <h4 className="font-semibold text-sm text-[#8E3352]">
                Como saber se está mamando bem
              </h4>
              <p className="mt-2 text-sm text-[#5E4D54] leading-relaxed">
                Após o quarto dia de vida, observe 6 ou mais fraldas bem molhadas de xixi claro por dia, ganho de peso nas consultas e períodos de calma após mamar.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col">
          <div className="relative overflow-hidden rounded-xl border border-[#F2D7DF] bg-[#FFF0F3] flex-1 min-h-[260px]">
            <ResilientImage
              src={postpartumBreastfeedingImg}
              alt="Mãe brasileira acolhendo seu recém-nascido no colo em quarto iluminado com luz natural"
              fallbackLabel="Vínculo Materno e Amamentação em Livre Demanda"
              className="h-full w-full object-cover"
            />
          </div>
          <p className="mt-2.5 text-xs text-[#5E4D54]">
            Apoio gratuito à amamentação: procure a UBS mais próxima ou o Banco de Leite Humano (Disque Saúde 136).
          </p>
        </div>
      </section>

      {/* Section 02: Limpeza do Coto Umbilical */}
      <section
        id="guia-coto"
        className="scroll-mt-24 border-t border-[#F2D7DF] pt-12 space-y-6"
      >
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="max-w-3xl">
            <span className="text-xs font-semibold tracking-wider text-[#B54B6E] tabular-nums">
              02. HIGIENE DO RECÉM-NASCIDO
            </span>
            <h2 className="mt-1.5 font-editorial text-2xl md:text-3xl font-semibold text-[#2A1F24]">
              Limpeza correta do coto umbilical com álcool 70%
            </h2>
            <p className="mt-3 text-base leading-relaxed text-[#5E4D54]">
              O coto umbilical costuma secar, escurecer e cair naturalmente entre 7 e 21 dias após o nascimento. A limpeza adequada evita infecções e acelera a cicatrização. Importante: o coto não tem terminações nervosas, portanto a limpeza não causa dor no bebê (ele pode apenas estranhar o geladinho do álcool).
            </p>
          </div>
          <SectionSpeakButton
            sectionId="coto"
            speakingId={speakingId}
            loadingId={loadingId}
            onToggle={(id, text) => void toggleSpeak(id, text)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              step: "Passo 01",
              title: "Lave bem as mãos",
              desc: "Antes de tocar no coto umbilical ou na fralda, higienize suas mãos e punhos com água e sabão.",
            },
            {
              step: "Passo 02",
              title: "Use álcool 70% líquido",
              desc: "Umedeça uma haste flexível (cotonete) ou gaze limpa com álcool etílico 70%. Não utilize álcool em gel ou outros produtos.",
            },
            {
              step: "Passo 03",
              title: "Limpe a base com firmeza suave",
              desc: "Segure delicadamente a pontinha do coto (ou o prendedor plástico) para levantar e passe o algodão/gaze em volta de toda a base onde o coto encontra a pele da barriguinha, depois limpe a parte de cima.",
            },
            {
              step: "Passo 04",
              title: "Deixe secar e dobre a fralda",
              desc: "Aguarde secar ao ar antes de fechar a fralda. Dobre a borda superior da fralda para baixo do umbigo, mantendo a região seca e ventilada.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="rounded-xl border border-[#F2D7DF] bg-white p-6"
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-[#B54B6E] tabular-nums">
                {item.step}
              </span>
              <h3 className="mt-2 font-editorial text-lg font-semibold text-[#2A1F24]">
                {item.title}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-[#5E4D54]">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-[#FFF0F3] border border-[#F2D7DF] p-6">
          <h3 className="font-semibold text-sm text-[#8E3352]">
            Frequência e o que NÃO colocar no umbigo
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-[#2A1F24]">
            Faça a limpeza após o banho e a cada troca de fralda (ou sempre que sujar de xixi ou cocô). <strong className="font-semibold">Nunca utilize</strong> faixas umbilicais, moedas, pó de café, açúcar, ervas, talco, mercúrio ou pomadas caseiras, pois essas práticas aumentam o risco de infecção grave e tétano neonatal. Após a queda do coto, continue limpando o local com álcool 70% por mais 2 a 3 dias até cicatrizar completamente.
          </p>
        </div>
      </section>

      {/* Section 03: Primeiro Banho do Bebê */}
      <section
        id="guia-banho"
        className="scroll-mt-24 border-t border-[#F2D7DF] pt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch"
      >
        <div className="lg:col-span-5 flex flex-col order-2 lg:order-1">
          <div className="relative overflow-hidden rounded-xl border border-[#F2D7DF] bg-[#FFF0F3] flex-1 min-h-[260px]">
            <ResilientImage
              src={postpartumBabyCareImg}
              alt="Banheira infantil limpa com água morna, toalha branca macia dobrada e sabonete neutro para o primeiro banho do bebê"
              fallbackLabel="Preparação Segura para o Primeiro Banho"
              className="h-full w-full object-cover"
            />
          </div>
          <p className="mt-2.5 text-xs text-[#5E4D54]">
            Temperatura ideal da água: entre 36°C e 37°C, ambiente fechado sem correntes de vento.
          </p>
        </div>

        <div className="lg:col-span-7 space-y-6 order-1 lg:order-2">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <span className="text-xs font-semibold tracking-wider text-[#B54B6E] tabular-nums">
                03. BANHO SEGURO E ACOLHEDOR
              </span>
              <h2 className="mt-1.5 font-editorial text-2xl md:text-3xl font-semibold text-[#2A1F24]">
                Orientações para o primeiro banho do bebê
              </h2>
            </div>
            <SectionSpeakButton
              sectionId="banho"
              speakingId={speakingId}
              loadingId={loadingId}
              onToggle={(id, text) => void toggleSpeak(id, text)}
            />
          </div>

          <p className="text-base leading-relaxed text-[#5E4D54]">
            A Organização Mundial da Saúde recomenda aguardar pelo menos 24 horas após o nascimento para o primeiro banho, preservando o vérnix (a camada protetora natural da pele) e garantindo que o bebê mantenha a temperatura corporal estável.
          </p>

          <div className="space-y-4">
            {[
              {
                title: "1. Prepare tudo antes de tirar a roupa do bebê",
                body: "Feche janelas e portas para evitar vento frio. Deixe separados ao alcance das mãos: toalha macia ou toalha-fralda, fralda limpa, roupa confortável, sabonete líquido neutro infantil (glicerinado e sem perfume forte), álcool 70% e gaze para o umbigo.",
              },
              {
                title: "2. Confira a temperatura da água (36°C a 37°C)",
                body: "Coloque primeiro a água fria e depois a quente na banheira higienizada, misturando bem. Teste com a parte interna do punho ou cotovelo: a água deve estar morna e agradável, nunca quente.",
              },
              {
                title: "3. Limpe o rosto e a cabeça primeiro",
                body: "Antes de colocar o bebê na água (ou já apoiado com segurança no seu antebraço), limpe os olhinhos com algodão umedecido em água morna (de dentro para fora) e o rostinho. Lave a cabecinha com movimentos suaves e seque logo em seguida para o bebê não sentir frio.",
              },
              {
                title: "4. Apoio firme e higiene delicada",
                body: "Apoie a cabeça e o pescoço do bebê no seu antebraço, segurando firmemente pela axila do mesmo lado. Coloque-o devagar na banheira começando pelos pés. Lave pescoço, axilas, dobrinhas das pernas e região íntima (nas meninas, sempre da frente para trás). Não tenha medo de molhar o coto umbilical — depois basta secá-lo bem e passar álcool 70%.",
              },
              {
                title: "5. Seque sem esfregar",
                body: "Retire o bebê, envolva-o imediatamente na toalha macia e seque dando batidinhas leves, com atenção especial às dobras do pescoço, atrás das orelhas, axilas e virilha.",
              },
            ].map((step) => (
              <div
                key={step.title}
                className="rounded-xl border border-[#F2D7DF] bg-white p-5"
              >
                <h3 className="font-semibold text-sm text-[#2A1F24]">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-sm text-[#5E4D54] leading-relaxed">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 04: Sinais de Alerta */}
      <section
        id="guia-alerta"
        className="scroll-mt-24 border-t border-[#F2D7DF] pt-12 space-y-6"
      >
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-[#B54B6E] mt-1 shrink-0" aria-hidden="true" />
            <div>
              <h2 className="font-editorial text-2xl font-semibold text-[#2A1F24]">
                Quando procurar a Unidade Básica de Saúde ou a Maternidade
              </h2>
              <p className="mt-1 text-sm text-[#5E4D54]">
                Não hesite em buscar atendimento médico gratuito pelo SUS (UBS, UPA ou maternidade de referência) diante de qualquer sinal abaixo.
              </p>
            </div>
          </div>
          <SectionSpeakButton
            sectionId="alerta"
            speakingId={speakingId}
            loadingId={loadingId}
            onToggle={(id, text) => void toggleSpeak(id, text)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-[#F2D7DF] bg-[#FFF7F9] p-6">
            <h3 className="font-editorial text-lg font-semibold text-[#8E3352]">
              Sinais de alerta no recém-nascido
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-[#2A1F24] leading-relaxed">
              <li>• Febre (temperatura axilar igual ou acima de 37,8°C) ou hipotermia (abaixo de 36°C).</li>
              <li>• Vermelhidão ao redor do umbigo, inchaço, secreção com pus ou cheiro forte.</li>
              <li>• Dificuldade para respirar, respiração muito rápida ou gemidos constantes.</li>
              <li>• Recusa persistente para mamar, muita sonolência ou dificuldade para acordar.</li>
              <li>• Pele e olhos muito amarelados (icterícia intensa) ou menos de 6 fraldas com xixi por dia após o 4º dia.</li>
            </ul>
          </div>

          <div className="rounded-xl border border-[#F2D7DF] bg-[#FFF7F9] p-6">
            <h3 className="font-editorial text-lg font-semibold text-[#8E3352]">
              Sinais de alerta na mãe (puerpério)
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-[#2A1F24] leading-relaxed">
              <li>• Sangramento vaginal muito intenso (encharcando um absorvente grande em menos de 1 hora) ou coágulos grandes.</li>
              <li>• Febre, calafrios ou secreção vaginal com odor forte.</li>
              <li>• Dor forte na barriga, vermelhidão/pus nos pontos do parto ou dor/inchaço em uma das pernas.</li>
              <li>• Dor de cabeça muito forte, visão embaçada ou pressão alta.</li>
              <li>• Tristeza profunda que não passa após duas semanas ou sensação de não conseguir cuidar de si ou do bebê — procure acolhimento na UBS.</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#F2D7DF] bg-white p-6">
          <div>
            <p className="font-editorial text-lg font-semibold text-[#2A1F24]">
              Ainda está se preparando para o parto?
            </p>
            <p className="text-sm text-[#5E4D54]">
              Monte agora seu Plano de Parto personalizado com a nossa assistente especializada.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("assistant")}
            className="inline-flex items-center gap-2 rounded-lg bg-[#D87093] hover:bg-[#B54B6E] px-5 py-3 text-sm font-semibold text-white transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>Ir para o Gerador de Plano de Parto</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </section>
    </div>
  );
}
