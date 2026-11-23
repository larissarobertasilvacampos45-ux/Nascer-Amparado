import { useState } from "react";
import { HomeTab } from "./components/HomeTab";
import type { AppTab } from "./components/HomeTab";
import { BirthPlanAssistantTab } from "./components/BirthPlanAssistantTab";
import { PostpartumGuideTab } from "./components/PostpartumGuideTab";
import { GlossaryTab } from "./components/GlossaryTab";

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>("home");

  const handleNavigate = (tab: AppTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#2A1F24]">
      {/* Top Navigation Bar — 3-Zone Contract */}
      <header className="no-print sticky top-0 z-30 border-b border-[#F2D7DF] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 md:gap-8 px-4 sm:px-6 lg:px-8 h-16">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => handleNavigate("home")}
            className="font-editorial text-xl font-semibold tracking-tight text-[#2A1F24] hover:text-[#B54B6E] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Nascer Amparado
          </button>

          {/* Zone 2: Clean single-line text tab links */}
          <nav
            aria-label="Navegação principal"
            className="hidden md:flex items-center gap-7 text-sm font-medium"
          >
            {[
              { id: "home" as const, label: "Início" },
              { id: "glossary" as const, label: "Glossário" },
              { id: "assistant" as const, label: "Plano de Parto" },
              { id: "postpartum" as const, label: "Pós-Parto" },
            ].map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavigate(item.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={`relative py-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? "text-[#B54B6E] font-semibold"
                      : "text-[#5E4D54] hover:text-[#2A1F24]"
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D87093] rounded-full"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => handleNavigate("assistant")}
              className="rounded-lg bg-[#D87093] hover:bg-[#B54B6E] px-4 py-2 text-xs sm:text-sm font-semibold text-white transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B54B6E]"
            >
              Gerar Plano
            </button>
          </div>
        </div>

        {/* Mobile Compact Tab Strip (total sticky height well under 15% of viewport) */}
        <nav
          aria-label="Navegação móvel"
          className="flex md:hidden border-t border-[#F2D7DF] bg-[#FFF7F9] px-1"
        >
          {[
            { id: "home" as const, label: "Início" },
            { id: "glossary" as const, label: "Glossário" },
            { id: "assistant" as const, label: "Plano de Parto" },
            { id: "postpartum" as const, label: "Pós-Parto" },
          ].map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.id)}
                aria-current={isActive ? "page" : undefined}
                className={`flex-1 py-2.5 px-1 text-center text-[11px] sm:text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? "text-[#8E3352] border-b-2 border-[#D87093] bg-[#FFF0F3]"
                    : "text-[#5E4D54]"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        {activeTab === "home" && <HomeTab onNavigate={handleNavigate} />}
        {activeTab === "assistant" && <BirthPlanAssistantTab />}
        {activeTab === "postpartum" && (
          <PostpartumGuideTab onNavigate={handleNavigate} />
        )}
        {activeTab === "glossary" && <GlossaryTab onNavigate={handleNavigate} />}
      </main>

      {/* Quiet Institutional Footer */}
      <footer className="no-print border-t border-[#F2D7DF] bg-[#FFF7F9]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <p className="font-editorial text-lg font-semibold text-[#2A1F24]">
                Nascer Amparado
              </p>
              <p className="mt-1 text-sm text-[#B54B6E] italic font-editorial">
                Seu parto, seus direitos, sua escolha
              </p>
              <p className="mt-3 text-xs text-[#5E4D54] leading-relaxed">
                Projeto social informativo voltado à promoção do parto humanizado, autonomia da gestante e cuidados seguros no pós-parto no Brasil.
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#8E3352]">
                Navegação
              </p>
              <ul className="mt-3 space-y-2 text-sm text-[#5E4D54]">
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavigate("home")}
                    className="hover:text-[#B54B6E] transition-colors cursor-pointer"
                  >
                    Início e Direitos da Gestante
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavigate("glossary")}
                    className="hover:text-[#B54B6E] transition-colors cursor-pointer"
                  >
                    Glossário Obstétrico e Hospitalar
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavigate("assistant")}
                    className="hover:text-[#B54B6E] transition-colors cursor-pointer"
                  >
                    Assistente de Plano de Parto
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavigate("postpartum")}
                    className="hover:text-[#B54B6E] transition-colors cursor-pointer"
                  >
                    Orientações Pós-Parto
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#8E3352]">
                Canais Públicos de Apoio (SUS)
              </p>
              <ul className="mt-3 space-y-2 text-xs text-[#5E4D54] leading-relaxed">
                <li>
                  <strong className="font-semibold text-[#2A1F24]">Disque Saúde (Ouvidoria SUS):</strong>{" "}
                  <span className="tabular-nums">136</span> (ligação gratuita para dúvidas e denúncias)
                </li>
                <li>
                  <strong className="font-semibold text-[#2A1F24]">SAMU (Emergências):</strong>{" "}
                  <span className="tabular-nums">192</span>
                </li>
                <li>
                  <strong className="font-semibold text-[#2A1F24]">Central de Atendimento à Mulher:</strong>{" "}
                  <span className="tabular-nums">180</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-[#F2D7DF] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-[#5E4D54]">
            <span>
              Conteúdo educativo fundamentado na Lei nº 11.108/2005 e nas diretrizes do Ministério da Saúde e da OMS.
            </span>
            <span>Não substitui o acompanhamento pré-natal presencial.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
