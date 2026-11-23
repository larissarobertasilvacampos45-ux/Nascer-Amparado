import { ArrowRight, ExternalLink, FileText, Scale, ShieldCheck } from "lucide-react";
import { ResilientImage } from "./ResilientImage";
import heroMaternalCareImg from "../assets/images/hero_maternal_care_1794683308131.jpg";

export type AppTab = "home" | "glossary" | "assistant" | "postpartum";

interface HomeTabProps {
  onNavigate: (tab: AppTab) => void;
}

interface OfficialResource {
  title: string;
  institution: string;
  description: string;
  url: string;
  actionLabel: string;
}

const OFFICIAL_RESOURCES: OfficialResource[] = [
  {
    title: "Lei Federal nº 11.108/2005 (Lei do Acompanhante)",
    institution: "Presidência da República · Legislação Oficial",
    description:
      "Texto integral da lei que garante às parturientes o direito à presença de acompanhante durante todo o trabalho de parto, parto e pós-parto imediato no SUS.",
    url: "https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2005/lei/l11108.htm",
    actionLabel: "Acessar texto da Lei",
  },
  {
    title: "Caderneta da Gestante — Edição Atualizada",
    institution: "Ministério da Saúde · Brasil",
    description:
      "Documento oficial para acompanhamento do pré-natal, registro de exames, vacinas e orientações sobre direitos da gestante e parto humanizado.",
    url: "https://bvsms.saude.gov.br/bvs/publicacoes/caderneta_gestante_8ed.pdf",
    actionLabel: "Abrir Caderneta (PDF)",
  },
  {
    title: "Diretrizes Nacionais de Assistência ao Parto Normal",
    institution: "Ministério da Saúde · CONITEC",
    description:
      "Protocolo clínico oficial do SUS com recomendações baseadas em evidências para respeito à autonomia da mulher e redução de intervenções desnecessárias.",
    url: "https://bvsms.saude.gov.br/bvs/publicacoes/diretrizes_nacionais_assistencia_parto_normal.pdf",
    actionLabel: "Ler Diretrizes (PDF)",
  },
  {
    title: "Recomendações da OMS para Cuidados Intraparto",
    institution: "Organização Mundial da Saúde (OMS / OPAS)",
    description:
      "Guia internacional para uma experiência positiva de parto, enfatizando cuidado respeitoso, acompanhante contínuo, liberdade de posição e alívio da dor.",
    url: "https://www.who.int/publications/i/item/9789241550215",
    actionLabel: "Consultar Guia da OMS",
  },
  {
    title: "Guia Alimentar para Crianças Brasileiras Menores de 2 Anos",
    institution: "Ministério da Saúde · Saúde da Criança",
    description:
      "Cartilha oficial com orientações completas sobre aleitamento materno em livre demanda, pega correta e cuidados nos primeiros meses de vida.",
    url: "https://bvsms.saude.gov.br/bvs/publicacoes/guia_alimentar_crianca_brasileira_versao_resumida.pdf",
    actionLabel: "Acessar Cartilha (PDF)",
  },
];

export function HomeTab({ onNavigate }: HomeTabProps) {
  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="pt-8 md:pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-between py-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#B54B6E]">
                Apoio gratuito à gestante · SUS e Rede Privada
              </p>
              <h1
                className="mt-4 font-editorial font-semibold tracking-tight text-[#2A1F24] leading-[1.12]"
                style={{
                  fontSize: "clamp(2.25rem, 4vw, 3.6rem)",
                  textWrap: "balance",
                }}
              >
                Nascer Amparado
              </h1>
              <p className="mt-3 font-editorial italic text-xl md:text-2xl text-[#B54B6E]">
                Seu parto, seus direitos, sua escolha
              </p>
              <p className="mt-6 max-w-2xl text-base md:text-[17px] leading-relaxed text-[#5E4D54]">
                Informação clara, acolhedora e fundamentada nas leis brasileiras e
                nas diretrizes da Organização Mundial da Saúde. Aqui você conhece
                seus direitos desde o pré-natal, monta seu Plano de Parto
                personalizado e recebe orientações práticas para os primeiros
                cuidados com o bebê.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => onNavigate("assistant")}
                className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-[#D87093] hover:bg-[#B54B6E] px-6 py-3.5 text-sm font-semibold text-white transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B54B6E] whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Criar meu Plano de Parto</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col">
            <div className="relative overflow-hidden rounded-xl border border-[#F2D7DF] bg-[#FFF0F3] flex-1 min-h-[280px] lg:min-h-[380px]">
              <ResilientImage
                src={heroMaternalCareImg}
                alt="Gestante em ambiente claro e sereno com luz natural suave, segurando a barriga com tranquilidade"
                fallbackLabel="Nascer Amparado — Cuidado e Dignidade na Gestação"
                className="h-full w-full object-cover"
              />
            </div>
            <p className="mt-2.5 text-xs text-[#5E4D54]">
              Acolhimento, autonomia e respeito em todas as etapas da gestação e do parto.
            </p>
          </div>
        </div>

        {/* Operational / Legal Guarantee Strip */}
        <div className="mt-10 rounded-xl bg-[#FFF0F3] border border-[#F2D7DF] px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-sm text-[#2A1F24]">
            <div className="flex items-center gap-2.5 font-medium">
              <Scale className="h-4 w-4 text-[#B54B6E] shrink-0" aria-hidden="true" />
              <span>
                Direito garantido pela <strong className="font-semibold text-[#8E3352]">Lei Federal nº 11.108/2005</strong>: acompanhante de sua livre escolha em todo o parto.
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#5E4D54] shrink-0">
              <span>Diretrizes da OMS</span>
              <span aria-hidden="true">·</span>
              <span>Protocolos do Ministério da Saúde</span>
            </div>
          </div>
        </div>
      </section>

      {/* Informative Blocks: Pré-natal, Parto e Pós-parto */}
      <section aria-labelledby="direitos-heading" className="border-t border-[#F2D7DF] pt-12">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#B54B6E]">
            Seus Direitos em Cada Etapa
          </p>
          <h2
            id="direitos-heading"
            className="mt-2 font-editorial text-2xl md:text-3xl font-semibold text-[#2A1F24]"
            style={{ textWrap: "balance" }}
          >
            O que a lei e a ciência garantem a você e ao seu bebê
          </h2>
          <p className="mt-3 text-base text-[#5E4D54] leading-relaxed">
            Conhecer seus direitos fortalece o diálogo com a equipe de saúde na Unidade Básica de Saúde (UBS) e na maternidade.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bloco 01: Pré-natal */}
          <article className="flex flex-col justify-between rounded-xl border border-[#F2D7DF] bg-white p-7">
            <div>
              <span className="text-xs font-semibold tracking-wider text-[#B54B6E] tabular-nums">
                01. PRÉ-NATAL
              </span>
              <h3 className="mt-2 font-editorial text-xl font-semibold text-[#2A1F24]">
                Direitos no Pré-natal
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[#5E4D54]">
                Todo acompanhamento pré-natal pelo SUS é gratuito, contínuo e deve começar assim que a gestação for descoberta.
              </p>
              <ul className="mt-5 space-y-3 text-sm text-[#2A1F24] leading-relaxed">
                <li className="flex gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#D87093] shrink-0" aria-hidden="true" />
                  <span>
                    <strong className="font-semibold">Consultas e exames gratuitos:</strong> mínimo de 6 consultas médicas e de enfermagem, exames laboratoriais, testes rápidos e ultrassonografias pelo SUS.
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#D87093] shrink-0" aria-hidden="true" />
                  <span>
                    <strong className="font-semibold">Vinculação à maternidade (Lei nº 11.634/2007):</strong> direito de saber com antecedência em qual hospital ou maternidade você realizará o parto e de visitá-la antes.
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#D87093] shrink-0" aria-hidden="true" />
                  <span>
                    <strong className="font-semibold">Caderneta da Gestante:</strong> documento seu que deve ser atualizado em toda consulta para garantir continuidade segura do cuidado.
                  </span>
                </li>
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-[#F2D7DF] text-xs text-[#5E4D54]">
              Procure a Unidade Básica de Saúde (UBS) mais próxima da sua residência para iniciar o pré-natal gratuitamente.
            </div>
          </article>

          {/* Bloco 02: Parto — Destaque Especial para Lei 11.108/2005 */}
          <article className="flex flex-col justify-between rounded-xl border border-[#D87093] bg-[#FFF0F3] p-7">
            <div>
              <span className="text-xs font-semibold tracking-wider text-[#8E3352] tabular-nums">
                02. PARTO E NASCIMENTO
              </span>
              <h3 className="mt-2 font-editorial text-xl font-semibold text-[#2A1F24]">
                Direitos no Parto
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[#2A1F24]">
                A <strong className="font-semibold text-[#8E3352]">Lei Federal nº 11.108/2005 (Lei do Acompanhante)</strong> obriga os serviços de saúde do SUS e da rede privada a permitirem a presença de um acompanhante indicado por você.
              </p>
              <ul className="mt-5 space-y-3 text-sm text-[#2A1F24] leading-relaxed">
                <li className="flex gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#B54B6E] shrink-0" aria-hidden="true" />
                  <span>
                    <strong className="font-semibold">Acompanhante em tempo integral:</strong> durante o pré-parto, parto e pós-parto imediato (inclusive em caso de cesárea), sem custo adicional.
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#B54B6E] shrink-0" aria-hidden="true" />
                  <span>
                    <strong className="font-semibold">Consentimento informado e autonomia:</strong> nenhum procedimento pode ser feito sem explicação clara e sua autorização. Você pode recusar práticas sem respaldo científico, como manobra de Kristeller, raspagem de pelos (tricotomia) ou lavagem intestinal (enema) de rotina.
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#B54B6E] shrink-0" aria-hidden="true" />
                  <span>
                    <strong className="font-semibold">Diretrizes da OMS:</strong> liberdade para caminhar e escolher a posição do parto, hidratação e métodos não farmacológicos de alívio da dor (banho morno, massagem, bola).
                  </span>
                </li>
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-[#F2D7DF]">
              <button
                type="button"
                onClick={() => onNavigate("assistant")}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#8E3352] hover:text-[#2A1F24] transition-colors cursor-pointer"
              >
                <span>Registrar minhas escolhas no Plano de Parto</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </article>

          {/* Bloco 03: Manobra de Kristeller */}
          <article className="flex flex-col justify-between rounded-xl border border-[#F2D7DF] bg-white p-7">
            <div>
              <span className="text-xs font-semibold tracking-wider text-[#B54B6E] tabular-nums">
                03. PROTEÇÃO NO PARTO
              </span>
              <h3 className="mt-2 font-editorial text-xl font-semibold text-[#2A1F24]">
                Manobra de Kristeller
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[#5E4D54]">
                A <strong className="font-semibold text-[#2A1F24]">Manobra de Kristeller</strong> consiste em empurrar ou pressionar a parte superior da barriga (fundo do útero) com as mãos ou antebraço durante o parto para tentar acelerar a saída do bebê.
              </p>
              <ul className="mt-5 space-y-3 text-sm text-[#2A1F24] leading-relaxed">
                <li className="flex gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#D87093] shrink-0" aria-hidden="true" />
                  <span>
                    <strong className="font-semibold">Proscrita pela OMS e pelo Ministério da Saúde:</strong> não há comprovação científica de benefícios e a prática aumenta riscos graves para a mãe (lacerações, hemorragia, ruptura uterina) e para o bebê (fraturas e sofrimento fetal).
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#D87093] shrink-0" aria-hidden="true" />
                  <span>
                    <strong className="font-semibold">Violência obstétrica:</strong> é considerada uma intervenção desnecessária e violenta, não devendo ser realizada na assistência ao parto normal.
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#D87093] shrink-0" aria-hidden="true" />
                  <span>
                    <strong className="font-semibold">Como se proteger:</strong> registre expressamente a recusa dessa prática no seu Plano de Parto, mantenha seu acompanhante atento e, em caso de violação, denuncie gratuitamente pelo Disque Saúde 136.
                  </span>
                </li>
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-[#F2D7DF]">
              <button
                type="button"
                onClick={() => onNavigate("assistant")}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#B54B6E] hover:text-[#8E3352] transition-colors cursor-pointer"
              >
                <span>Incluir recusa no meu Plano de Parto</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </article>
        </div>
      </section>

      {/* Official Documents & Booklets Section */}
      <section aria-labelledby="documentos-heading" className="border-t border-[#F2D7DF] pt-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#B54B6E]">
              Fontes Oficiais e Legislação
            </p>
            <h2
              id="documentos-heading"
              className="mt-2 font-editorial text-2xl md:text-3xl font-semibold text-[#2A1F24]"
              style={{ textWrap: "balance" }}
            >
              Documentos oficiais e cartilhas do Ministério da Saúde e da OMS
            </h2>
            <p className="mt-3 text-base text-[#5E4D54] leading-relaxed">
              Consulte diretamente as publicações oficiais que embasam seus direitos e as orientações deste portal.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#5E4D54]">
            <ShieldCheck className="h-4 w-4 text-[#B54B6E]" aria-hidden="true" />
            <span>Links externos oficiais (abrem em nova aba)</span>
          </div>
        </div>

        <div className="mt-8 divide-y divide-[#F2D7DF] rounded-xl border border-[#F2D7DF] bg-white">
          {OFFICIAL_RESOURCES.map((doc) => (
            <div
              key={doc.url}
              className="flex flex-col md:flex-row md:items-center justify-between gap-5 p-6 hover:bg-[#FFF7F9] transition-colors duration-150"
            >
              <div className="max-w-3xl space-y-1.5">
                <p className="text-xs font-medium text-[#B54B6E]">
                  {doc.institution}
                </p>
                <h3 className="font-editorial text-lg font-semibold text-[#2A1F24] flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#D87093] shrink-0" aria-hidden="true" />
                  <span>{doc.title}</span>
                </h3>
                <p className="text-sm text-[#5E4D54] leading-relaxed">
                  {doc.description}
                </p>
              </div>
              <div className="shrink-0">
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#D87093] bg-[#FFF0F3] hover:bg-[#D87093] text-[#8E3352] hover:text-white px-4 py-2.5 text-sm font-semibold transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B54B6E]"
                >
                  <span>{doc.actionLabel}</span>
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
