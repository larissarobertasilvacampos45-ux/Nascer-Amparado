import { useMemo, useState } from "react";
import {
  ArrowRight,
  Loader2,
  Search,
  Square,
  Volume2,
  X,
} from "lucide-react";
import type { AppTab } from "./HomeTab";
import { useFemaleSpeech } from "../hooks/useFemaleSpeech";

interface GlossaryTabProps {
  onNavigate: (tab: AppTab) => void;
}

type GlossaryCategory =
  | "all"
  | "labor"
  | "procedures"
  | "cesarean"
  | "newborn";

interface GlossaryEntry {
  id: string;
  term: string;
  category: Exclude<GlossaryCategory, "all">;
  categoryLabel: string;
  meaning: string;
  whatToKnow: string;
}

const CATEGORY_TABS: Array<{ id: GlossaryCategory; label: string }> = [
  { id: "all", label: "Todos os termos" },
  { id: "labor", label: "Trabalho de Parto" },
  { id: "procedures", label: "Procedimentos e Alívio da Dor" },
  { id: "cesarean", label: "Cesárea e Urgências" },
  { id: "newborn", label: "Recém-Nascido e Pós-Parto" },
];

const GLOSSARY_ENTRIES: GlossaryEntry[] = [
  {
    id: "dilatacao",
    term: "Dilatação",
    category: "labor",
    categoryLabel: "Trabalho de Parto",
    meaning:
      "Abertura gradual do colo do útero, medida em centímetros (de 0 a 10 cm), que permite a passagem do bebê pelo canal de parto.",
    whatToKnow:
      "Cada mulher tem seu próprio ritmo. A dilatação não é avaliada apenas por números isolados, mas pelo conjunto do bem-estar da mãe e do bebê, sem necessidade de toques vaginais repetidos em excesso.",
  },
  {
    id: "apagamento",
    term: "Apagamento (ou esvaecimento) do colo",
    category: "labor",
    categoryLabel: "Trabalho de Parto",
    meaning:
      "Afinamento progressivo do colo do útero, que fica mais curto, fino e macio antes e durante a dilatação (expresso em porcentagem, de 0% a 100%).",
    whatToKnow:
      "Em primeiras gestações, o colo costuma primeiro afinar (apagar) para depois dilatar mais rapidamente. Isso faz parte da preparação fisiológica normal.",
  },
  {
    id: "fases-trabalho-parto",
    term: "Fase Latente e Fase Ativa",
    category: "labor",
    categoryLabel: "Trabalho de Parto",
    meaning:
      "A fase latente é o começo mais lento, com contrações irregulares que preparam o colo. A fase ativa, segundo a OMS, inicia-se geralmente a partir de 5 cm de dilatação, com contrações ritmadas e progressão mais regular.",
    whatToKnow:
      "Na fase latente, se mãe e bebê estão saudáveis, costuma ser mais confortável permanecer em casa ou em ambiente tranquilo, hidratando-se e descansando antes da internação.",
  },
  {
    id: "tampao-mucoso",
    term: "Tampão Mucoso",
    category: "labor",
    categoryLabel: "Trabalho de Parto",
    meaning:
      "Secreção gelatinosa espessa (clara, amarelada ou com leves raios de sangue) que sela e protege o colo do útero durante a gestação.",
    whatToKnow:
      "A saída do tampão indica que o colo está se modificando, mas o parto ainda pode levar horas ou vários dias para começar. Não é sinal de emergência por si só.",
  },
  {
    id: "bolsa-rota",
    term: "Bolsa Rota (rotura da bolsa)",
    category: "labor",
    categoryLabel: "Trabalho de Parto",
    meaning:
      "Rompimento da bolsa amniótica com saída de líquido pela vagina — pode ocorrer em jato ou em gotejamento contínuo.",
    whatToKnow:
      "Observe o horário, a cor e o cheiro do líquido. O esperado é líquido claro ou levemente esbranquiçado; se estiver esverdeado, amarronzado ou com odor forte, procure a maternidade imediatamente.",
  },
  {
    id: "periodo-expulsivo",
    term: "Período Expulsivo",
    category: "labor",
    categoryLabel: "Trabalho de Parto",
    meaning:
      "Etapa final do parto normal, entre a dilatação total (10 cm) e a saída completa do bebê.",
    whatToKnow:
      "Você tem direito garantido pelas diretrizes da OMS e do Ministério da Saúde de escolher a posição mais confortável (cócoras, sentada, quatro apoios, em pé ou de lado), evitando ficar deitada de costas contra a sua vontade.",
  },
  {
    id: "dequitacao",
    term: "Dequitação (saída da placenta)",
    category: "labor",
    categoryLabel: "Trabalho de Parto",
    meaning:
      "Descolamento e saída natural da placenta logo após o nascimento do bebê, geralmente nos primeiros 30 minutos após o parto.",
    whatToKnow:
      "Enquanto a placenta se descola, o bebê já pode estar em contato pele a pele no seu colo, o que estimula hormônios naturais que ajudam o útero a contrair e reduzem sangramentos.",
  },
  {
    id: "cardiotocografia",
    term: "Cardiotocografia (CTG)",
    category: "labor",
    categoryLabel: "Trabalho de Parto",
    meaning:
      "Exame com duas faixas colocadas na barriga para registrar os batimentos cardíacos do bebê e a frequência das contrações.",
    whatToKnow:
      "Em gestações de baixo risco, a OMS recomenda preferir a ausculta intermitente com sonar/estetoscópio durante o trabalho de parto, para que você não fique presa à cama sem necessidade.",
  },
  {
    id: "analgesia-parto",
    term: "Analgesia de Parto (Peridural)",
    category: "procedures",
    categoryLabel: "Procedimentos e Alívio da Dor",
    meaning:
      "Medicação aplicada nas costas por um médico anestesista para aliviar a dor das contrações durante o parto normal, mantendo a gestante acordada e consciente.",
    whatToKnow:
      "Você pode solicitar analgesia pelo SUS e na rede privada se sentir necessidade durante o trabalho de parto, ou optar por seguir apenas com métodos naturais — a escolha é sua.",
  },
  {
    id: "metodos-nao-farmacologicos",
    term: "Métodos Não Farmacológicos",
    category: "procedures",
    categoryLabel: "Procedimentos e Alívio da Dor",
    meaning:
      "Recursos naturais que aliviam a dor e ajudam na descida do bebê: banho morno de chuveiro ou banheira, bola suíça, massagem, caminhada, respiração e presença do acompanhante.",
    whatToKnow:
      "São recomendados como primeira linha pela OMS por não apresentarem efeitos colaterais e aumentarem a sensação de bem-estar e controle da gestante.",
  },
  {
    id: "ocitocina",
    term: "Ocitocina (natural e sintética)",
    category: "procedures",
    categoryLabel: "Procedimentos e Alívio da Dor",
    meaning:
      "Hormônio produzido naturalmente pelo corpo para gerar contrações, vínculo e descida do leite. Existe também a versão sintética aplicada na veia (popularmente chamada de sorinho).",
    whatToKnow:
      "A ocitocina sintética na veia não deve ser usada de rotina apenas para apressar partos que estão evoluindo bem; ela exige indicação clínica clara, explicação e consentimento informado.",
  },
  {
    id: "amniotomia",
    term: "Amniotomia",
    category: "procedures",
    categoryLabel: "Procedimentos e Alívio da Dor",
    meaning:
      "Procedimento em que o profissional rompe artificialmente a bolsa das águas durante o exame de toque vaginal.",
    whatToKnow:
      "Segundo a OMS e o Ministério da Saúde, não deve ser realizada de rotina para acelerar o parto sem necessidade clínica, e sempre requer explicação prévia à gestante.",
  },
  {
    id: "episiotomia",
    term: "Episiotomia",
    category: "procedures",
    categoryLabel: "Procedimentos e Alívio da Dor",
    meaning:
      "Corte cirúrgico feito no períneo (região muscular entre a vagina e o ânus) na saída do bebê.",
    whatToKnow:
      "A OMS e o Ministério da Saúde contraindicam a episiotomia de rotina por não prevenir lacerações graves e aumentar dor e risco de infecção no pós-parto. Você pode registrar no Plano de Parto a recusa ao corte rotineiro.",
  },
  {
    id: "manobra-kristeller",
    term: "Manobra de Kristeller",
    category: "procedures",
    categoryLabel: "Procedimentos e Alívio da Dor",
    meaning:
      "Prática antiga de empurrar ou pressionar com força a parte de cima da barriga durante a saída do bebê.",
    whatToKnow:
      "É formalmente proscrita (contraindicada) pela OMS e pelo Ministério da Saúde por causar riscos graves à mãe e ao bebê, configurando violência obstétrica.",
  },
  {
    id: "tricotomia-enema",
    term: "Tricotomia e Enema",
    category: "procedures",
    categoryLabel: "Procedimentos e Alívio da Dor",
    meaning:
      "Tricotomia é a raspagem dos pelos pubianos; enema é a lavagem intestinal feita antes do parto.",
    whatToKnow:
      "Ambos foram abolidos das diretrizes oficiais por não reduzirem infecções e causarem desconforto desnecessário. Você tem o direito de recusá-los.",
  },
  {
    id: "cesarea-eletiva-urgencia",
    term: "Cesárea Eletiva e Cesárea de Urgência",
    category: "cesarean",
    categoryLabel: "Cesárea e Urgências",
    meaning:
      "A cesárea eletiva é planejada com antecedência; a de urgência é indicada durante o trabalho de parto quando surge risco real para a mãe ou o bebê.",
    whatToKnow:
      "A Lei nº 11.108/2005 garante o direito ao acompanhante dentro do centro cirúrgico em qualquer tipo de cesárea, sem cobrança adicional.",
  },
  {
    id: "campo-cirurgico-rebaixado",
    term: "Campo Cirúrgico Rebaixado",
    category: "cesarean",
    categoryLabel: "Cesárea e Urgências",
    meaning:
      "Abaixamento cuidadoso do tecido estéril que separa a visão da mãe na altura do abdômen no instante em que o bebê nasce na cesárea.",
    whatToKnow:
      "Quando clinicamente seguro, pode ser solicitado no Plano de Parto para que você acompanhe a chegada do bebê e realize contato pele a pele imediato.",
  },
  {
    id: "meconio",
    term: "Mecônio",
    category: "cesarean",
    categoryLabel: "Cesárea e Urgências",
    meaning:
      "Primeiras fezes do recém-nascido (escuras e esverdeadas). Em alguns casos, o bebê elimina mecônio ainda dentro do útero, tingindo o líquido amniótico.",
    whatToKnow:
      "A presença de mecônio requer vigilância mais próxima dos batimentos do bebê pela equipe, mas nem sempre impede o parto normal se o bebê estiver bem.",
  },
  {
    id: "pre-eclampsia",
    term: "Pré-eclâmpsia",
    category: "cesarean",
    categoryLabel: "Cesárea e Urgências",
    meaning:
      "Complicação da gravidez caracterizada por aumento da pressão arterial (geralmente após 20 semanas), podendo afetar rins, fígado ou placenta.",
    whatToKnow:
      "Dor de cabeça intensa que não passa, visão embaçada ou com pontinhos brilhantes, dor forte na boca do estômago e inchaço repentino exigem ida imediata à maternidade.",
  },
  {
    id: "clampeamento-oportuno",
    term: "Clampeamento Oportuno do Cordão",
    category: "newborn",
    categoryLabel: "Recém-Nascido e Pós-Parto",
    meaning:
      "Esperar entre 1 e 3 minutos (ou até o cordão umbilical parar de pulsar) antes de pinçar e cortar o cordão após o nascimento.",
    whatToKnow:
      "Recomendado pela OMS porque permite que o sangue rico em ferro da placenta chegue ao bebê, reduzindo o risco de anemia nos primeiros meses de vida.",
  },
  {
    id: "contato-pele-a-pele",
    term: "Contato Pele a Pele (Hora Dourada)",
    category: "newborn",
    categoryLabel: "Recém-Nascido e Pós-Parto",
    meaning:
      "Colocar o bebê nu, enxuto e coberto com manta diretamente sobre o peito nu da mãe imediatamente após o nascimento, por pelo menos uma hora.",
    whatToKnow:
      "Regula a temperatura, os batimentos e a respiração do recém-nascido, fortalece o vínculo e facilita a primeira mamada espontânea antes de medições rotineiras.",
  },
  {
    id: "indice-apgar",
    term: "Índice de Apgar",
    category: "newborn",
    categoryLabel: "Recém-Nascido e Pós-Parto",
    meaning:
      "Avaliação rápida feita pela equipe no 1º e no 5º minuto de vida (de 0 a 10), observando frequência cardíaca, respiração, tônus muscular, reflexos e cor do bebê.",
    whatToKnow:
      "Serve para orientar se o recém-nascido precisa de algum apoio imediato para respirar ao nascer; não define inteligência nem saúde futura.",
  },
  {
    id: "alojamento-conjunto",
    term: "Alojamento Conjunto",
    category: "newborn",
    categoryLabel: "Recém-Nascido e Pós-Parto",
    meaning:
      "Modelo hospitalar em que o recém-nascido saudável permanece ao lado da mãe 24 horas por dia no quarto até a alta, evitando separação em berçário.",
    whatToKnow:
      "Garantido pelas normas do Ministério da Saúde porque favorece a amamentação em livre demanda, o cuidado seguro e a presença contínua do acompanhante.",
  },
  {
    id: "puerperio-loquios",
    term: "Puerpério e Lóquios",
    category: "newborn",
    categoryLabel: "Recém-Nascido e Pós-Parto",
    meaning:
      "Puerpério é o período de recuperação física e hormonal da mulher após o parto (cerca de 42 dias). Lóquios são o sangramento e a secreção vaginal naturais dessa fase.",
    whatToKnow:
      "Nos primeiros dias os lóquios são vermelho-vivos, ficando rosados e depois amarelados. Sangramento súbito muito intenso, coágulos grandes, febre ou mau cheiro são sinais para buscar avaliação médica.",
  },
];

function normalizeSearch(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function GlossaryTab({ onNavigate }: GlossaryTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<GlossaryCategory>("all");
  const { speakingId, loadingId, speechError, toggleSpeak, clearError } =
    useFemaleSpeech();

  const filteredEntries = useMemo(() => {
    const normalizedQuery = normalizeSearch(searchQuery);
    return GLOSSARY_ENTRIES.filter((entry) => {
      const matchesCategory =
        activeCategory === "all" || entry.category === activeCategory;
      if (!matchesCategory) return false;
      if (!normalizedQuery) return true;
      const haystack = normalizeSearch(
        `${entry.term} ${entry.categoryLabel} ${entry.meaning} ${entry.whatToKnow}`,
      );
      return haystack.includes(normalizedQuery);
    });
  }, [activeCategory, searchQuery]);

  return (
    <div className="space-y-10 pb-16 pt-8">
      {/* Header */}
      <header className="border-b border-[#F2D7DF] pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#B54B6E]">
          Educação em Saúde · Linguagem Clara e Acolhedora
        </p>
        <h1
          className="mt-3 font-editorial text-3xl md:text-4xl font-semibold text-[#2A1F24]"
          style={{ textWrap: "balance" }}
        >
          Glossário obstétrico e hospitalar
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-[#5E4D54]">
          Entenda de forma simples os termos técnicos mais falados durante o trabalho de parto, na sala de parto ou centro cirúrgico e nos primeiros cuidados com o recém-nascido — para você conversar com segurança com a equipe de saúde.
        </p>

        {/* Search & Filter Controls */}
        <div className="mt-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1 max-w-xl">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#B54B6E]"
                aria-hidden="true"
              />
              <label htmlFor="glossary-search" className="sr-only">
                Buscar termo obstétrico ou hospitalar
              </label>
              <input
                id="glossary-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar termo (ex.: dilatação, ocitocina, episiotomia, Apgar...)"
                className="w-full min-h-[44px] rounded-lg border border-[#F2D7DF] bg-white pl-10 pr-10 py-2.5 text-sm text-[#2A1F24] placeholder:text-[#9A858D] focus:border-[#D87093] focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Limpar busca"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-[#5E4D54] hover:bg-[#FFF0F3] hover:text-[#8E3352] transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>

            <p className="text-xs font-medium text-[#5E4D54] tabular-nums shrink-0">
              Exibindo {filteredEntries.length} de {GLOSSARY_ENTRIES.length} termos
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Filtrar termos do glossário por assunto"
            className="flex flex-wrap items-center gap-2"
          >
            {CATEGORY_TABS.map((tab) => {
              const isActive = activeCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveCategory(tab.id)}
                  className={`rounded-lg px-4 py-2.5 min-h-[44px] text-xs sm:text-sm font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? "bg-[#D87093] text-white"
                      : "bg-[#FFF0F3] text-[#8E3352] hover:bg-[#FCE4EA]"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {speechError && (
        <div
          role="alert"
          className="no-print rounded-xl border border-[#D87093] bg-[#FFF0F3] px-4 py-3 text-xs sm:text-sm text-[#8E3352] flex items-center justify-between gap-3"
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

      {/* Terms Grid */}
      {filteredEntries.length === 0 ? (
        <div className="rounded-xl border border-[#F2D7DF] bg-[#FFF7F9] p-8 text-center space-y-3">
          <p className="font-editorial text-xl font-semibold text-[#2A1F24]">
            Nenhum termo encontrado para essa busca
          </p>
          <p className="text-sm text-[#5E4D54] max-w-md mx-auto">
            Tente buscar por palavras mais simples ou selecione outra categoria para visualizar os termos disponíveis.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setActiveCategory("all");
            }}
            className="inline-flex items-center justify-center rounded-lg bg-[#D87093] hover:bg-[#B54B6E] px-4 py-2.5 min-h-[44px] text-xs font-semibold text-white transition-colors cursor-pointer"
          >
            Ver todos os termos
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredEntries.map((entry) => {
            const isSpeaking = speakingId === entry.id;
            const isLoadingAudio = loadingId === entry.id;
            const isAudioActive = isSpeaking || isLoadingAudio;
            const speechText = `${entry.term}. O que significa: ${entry.meaning} O que é importante saber: ${entry.whatToKnow}`;

            return (
              <article
                key={entry.id}
                className="flex flex-col justify-between rounded-xl border border-[#F2D7DF] bg-white p-6 space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#B54B6E]">
                        {entry.categoryLabel}
                      </p>
                      <h2 className="mt-1 font-editorial text-xl font-semibold text-[#2A1F24] leading-snug">
                        {entry.term}
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={() => void toggleSpeak(entry.id, speechText)}
                      aria-pressed={isAudioActive}
                      aria-label={
                        isAudioActive
                          ? `Parar leitura de ${entry.term}`
                          : `Ouvir explicação de ${entry.term}`
                      }
                      className={`no-print inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 min-h-[40px] text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        isAudioActive
                          ? "border-[#B54B6E] bg-[#B54B6E] text-white"
                          : "border-[#F2D7DF] bg-[#FFF7F9] hover:bg-[#FFF0F3] text-[#8E3352]"
                      }`}
                    >
                      {isLoadingAudio ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                          <span>Carregando</span>
                        </>
                      ) : isSpeaking ? (
                        <>
                          <Square className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Parar</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Ouvir</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-sm leading-relaxed text-[#2A1F24]">
                    {entry.meaning}
                  </p>
                </div>

                <div className="rounded-lg border border-[#F2D7DF] bg-[#FFF7F9] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#8E3352]">
                    O que é importante saber
                  </p>
                  <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-[#5E4D54]">
                    {entry.whatToKnow}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Bottom CTA */}
      <section className="border-t border-[#F2D7DF] pt-10">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#F2D7DF] bg-[#FFF7F9] p-6">
          <div>
            <p className="font-editorial text-lg font-semibold text-[#2A1F24]">
              Quer transformar esse conhecimento em escolhas registradas?
            </p>
            <p className="text-sm text-[#5E4D54]">
              Monte seu Plano de Parto personalizado com orientações claras para entregar na maternidade.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("assistant")}
            className="inline-flex items-center gap-2 rounded-lg bg-[#D87093] hover:bg-[#B54B6E] px-5 py-3 min-h-[44px] text-sm font-semibold text-white transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>Ir para o Gerador de Plano de Parto</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </section>
    </div>
  );
}
