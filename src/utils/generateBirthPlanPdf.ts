import { jsPDF } from "jspdf";

export const BIRTH_PLAN_REMINDER =
  "Este Plano de Parto expressa as escolhas informadas da gestante para um nascimento seguro, digno e respeitoso, fundamentado nas diretrizes da Organização Mundial da Saúde (OMS), nos protocolos do Ministério da Saúde e na Lei Federal nº 11.108/2005 (Lei do Acompanhante). Em caso de intercorrência ou necessidade clínica de alteração das condutas previstas, solicita-se que a equipe de saúde comunique os motivos de forma clara à gestante e ao(à) acompanhante, assegurando o consentimento informado prévio sempre que possível.";

export function normalizeSequentialNumbering(text: string): string {
  const lines = text.split(/\r?\n/);
  let counter = 0;
  let sawUnnumberedHeading = false;

  const normalized = lines.map((line) => {
    const headingNoNum = line.match(/^\s*#{1,4}\s+(?!\d+\.\s).+/);
    if (headingNoNum) {
      sawUnnumberedHeading = true;
      return line;
    }

    const numberedMatch = line.match(
      /^(\s*(?:#{1,4}\s*)?(?:\*\*)?)(\d+)\.((?:\*\*)?\s+.+)$/
    );
    if (numberedMatch) {
      const origNum = parseInt(numberedMatch[2], 10);
      if (sawUnnumberedHeading && origNum === 1 && counter > 0) {
        counter = 0;
        sawUnnumberedHeading = false;
      }
      counter += 1;
      return `${numberedMatch[1]}${counter}.${numberedMatch[3]}`;
    }

    return line;
  });

  return normalized.join("\n");
}

const PLAN_TITLE_LINE_REGEX =
  /^\s*(?:#{1,4}\s*)?(?:\*\*)?plano de parto(?:\s+(?:individualizado|personalizado|humanizado|respeitoso))?(?:\s*(?:[-–—:]|de|da|para|\()\s*[^\n]{0,60})?(?:\*\*)?\s*$/i;

export function isFinalBirthPlanDocument(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 250) return false;

  const lines = trimmed.split(/\r?\n/);
  const hasPlanHeading = lines.some(
    (line) =>
      PLAN_TITLE_LINE_REGEX.test(line.trim()) &&
      !line.trim().endsWith(":") &&
      !line.includes("?")
  );

  const numberedSections = trimmed.match(
    /(?:^|\n)\s*(?:#{1,4}\s*)?(?:\*\*)?\d+\.(?:\*\*)?\s+[^\n]+/g
  );

  if (!hasPlanHeading || (numberedSections?.length ?? 0) < 3) {
    return false;
  }

  const questionMarks = (trimmed.match(/\?/g) ?? []).length;
  if (questionMarks > 1) return false;
  if (numberedSections?.some((sec) => sec.includes("?"))) return false;

  if (questionMarks === 1) {
    const nonEmptyLines = lines.filter((l) => l.trim().length > 0);
    const lastLine = nonEmptyLines[nonEmptyLines.length - 1] ?? "";
    if (!lastLine.includes("?")) return false;
  }

  return true;
}

const CHAT_CLOSING_PATTERN =
  /^(?:\*\*)?(?:espero que|caso queira|caso deseje|caso precise|se quiser|se desejar|se precisar|estou à disposição|fico à disposição|qualquer dúvida|me avise|fique à vontade|desejo um|desejo uma|desejamos|parabéns|boa hora|gostaria de ajustar|deseja alterar|lembre-se de que (?:você pode|estou)|lembrete:\s*caso queira)/i;

const SIGNATURE_LINE_PATTERN =
  /^(?:_{3,}|local e data\s*:|(?:\*\*)?(?:assinatura(?:s)?(?:\s+da|\s+do)?|gestante|acompanhante|médic[oa](?:\(a\))?)(?:\s*:|\s*$))/i;

export function extractBirthPlanOnly(rawText: string): string {
  const lines = rawText.split(/\r?\n/);

  // Find the start of the formal Birth Plan heading
  let startIdx = lines.findIndex((line) => PLAN_TITLE_LINE_REGEX.test(line.trim()));

  if (startIdx === -1) {
    startIdx = lines.findIndex((line) =>
      /^\s*#{1,4}\s+.*plano de parto/i.test(line.trim())
    );
  }

  let sliced = startIdx >= 0 ? lines.slice(startIdx) : [...lines];

  // Trim leading dividers or blank lines
  while (
    sliced.length > 0 &&
    (!sliced[0].trim() || /^[-*_]{3,}$/.test(sliced[0].trim()))
  ) {
    sliced.shift();
  }

  // Trim trailing chat remarks, questions, dividers, or duplicate AI signature placeholders
  while (sliced.length > 0) {
    const last = sliced[sliced.length - 1].trim();
    if (!last || /^[-*_]{3,}$/.test(last)) {
      sliced.pop();
      continue;
    }
    const plainLast = last.replace(/\*\*/g, "").trim();
    if (
      plainLast.includes("?") ||
      CHAT_CLOSING_PATTERN.test(plainLast) ||
      SIGNATURE_LINE_PATTERN.test(plainLast)
    ) {
      sliced.pop();
      continue;
    }
    break;
  }

  // Also strip a trailing "Assinaturas" heading if its placeholder lines were removed above
  while (sliced.length > 0) {
    const lastPlain = sliced[sliced.length - 1]
      .trim()
      .replace(/^#{1,4}\s*/, "")
      .replace(/\*\*/g, "")
      .trim();
    if (/^(?:\d+\.\s*)?assinaturas?$/i.test(lastPlain)) {
      sliced.pop();
      continue;
    }
    break;
  }

  return normalizeSequentialNumbering(sliced.join("\n").trim());
}

export function formatBirthPlanWithFooter(rawText: string): string {
  const planOnly = extractBirthPlanOnly(rawText);
  return `${planOnly}

LEMBRETE IMPORTANTE
${BIRTH_PLAN_REMINDER}

Local e data: ____________________________________________, ____/____/________

Assinatura da Gestante: _____________________________________________________

Assinatura do(a) Acompanhante: ______________________________________________

Assinatura e Carimbo do(a) Médico(a): _______________________________________`;
}

function normalizePdfText(text: string): string {
  return text
    .replace(/[—–]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/…/g, "...")
    .replace(/≥/g, ">=")
    .replace(/≤/g, "<=")
    .replace(/→/g, "->")
    .replace(/•/g, "-")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\u00A0/g, " ");
}

function stripInlineMarkdown(text: string): string {
  return text.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1");
}

export function downloadBirthPlanPdf(rawText: string): void {
  const planOnly = extractBirthPlanOnly(rawText);

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 18;
  const maxWidth = pageWidth - marginX * 2;
  const bottomLimit = pageHeight - 18;

  let cursorY = 18;

  const ensureSpace = (neededMm: number) => {
    if (cursorY + neededMm > bottomLimit) {
      doc.addPage();
      cursorY = 18;
    }
  };

  // Document Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(42, 31, 36);
  doc.text("Nascer Amparado - Plano de Parto Individualizado", marginX, cursorY);
  cursorY += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(142, 51, 82);
  doc.text(
    "Fundamentado na Lei Federal nº 11.108/2005 e nas Diretrizes da OMS",
    marginX,
    cursorY
  );
  cursorY += 4;

  doc.setDrawColor(216, 112, 147);
  doc.setLineWidth(0.5);
  doc.line(marginX, cursorY, pageWidth - marginX, cursorY);
  cursorY += 8;

  const lines = normalizePdfText(planOnly).split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      cursorY += 2.5;
      continue;
    }

    // Skip duplicate top document title since the PDF header already displays it
    const plainLine = stripInlineMarkdown(line).replace(/^#{1,4}\s+/, "").trim();
    if (
      i <= 2 &&
      /^plano de parto(?:\s+individualizado|\s+personalizado)?$/i.test(plainLine)
    ) {
      continue;
    }

    if (/^---+$/.test(line) || /^\*\*\*+$/.test(line)) {
      ensureSpace(6);
      doc.setDrawColor(242, 215, 223);
      doc.setLineWidth(0.3);
      doc.line(marginX, cursorY + 1, pageWidth - marginX, cursorY + 1);
      cursorY += 6;
      continue;
    }

    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const cleanHeading = stripInlineMarkdown(headingMatch[2]);

      const fontSize = level === 1 ? 13 : level === 2 ? 11.5 : 10.5;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(fontSize);

      if (level <= 2) {
        doc.setTextColor(142, 51, 82);
      } else {
        doc.setTextColor(42, 31, 36);
      }

      const wrapped = doc.splitTextToSize(cleanHeading, maxWidth) as string[];
      const blockHeight = wrapped.length * (fontSize * 0.45) + 3;
      ensureSpace(blockHeight + 2);
      cursorY += 2;
      doc.text(wrapped, marginX, cursorY);
      cursorY += wrapped.length * (fontSize * 0.45) + 2;
      continue;
    }

    const numberedHeadingMatch = stripInlineMarkdown(line).match(/^(\d+\.\s+.+)$/);
    const isUpperSectionTitle =
      Boolean(numberedHeadingMatch) ||
      (/^[A-ZÁÉÍÓÚÃÕÇ\s-]{8,}$/.test(plainLine) && plainLine.length < 80);

    if (isUpperSectionTitle) {
      const cleanTitle = stripInlineMarkdown(line);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(142, 51, 82);
      const wrapped = doc.splitTextToSize(cleanTitle, maxWidth) as string[];
      ensureSpace(wrapped.length * 5.2 + 4);
      cursorY += 2.5;
      doc.text(wrapped, marginX, cursorY);
      cursorY += wrapped.length * 5.2 + 1.5;
      continue;
    }

    const bulletMatch = line.match(/^[-*]\s+(.+)$/);
    if (bulletMatch) {
      const cleanBullet = stripInlineMarkdown(bulletMatch[1]);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(42, 31, 36);
      const wrapped = doc.splitTextToSize(cleanBullet, maxWidth - 6) as string[];
      ensureSpace(wrapped.length * 4.8 + 1.5);
      doc.text("-", marginX + 1.5, cursorY);
      doc.text(wrapped, marginX + 6, cursorY);
      cursorY += wrapped.length * 4.8 + 1.5;
      continue;
    }

    const cleanParagraph = stripInlineMarkdown(line);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(42, 31, 36);
    const wrapped = doc.splitTextToSize(cleanParagraph, maxWidth) as string[];
    ensureSpace(wrapped.length * 4.8 + 2);
    doc.text(wrapped, marginX, cursorY);
    cursorY += wrapped.length * 4.8 + 2;
  }

  // Final Reminder Box ("Lembrete")
  const reminderLines = doc.splitTextToSize(
    normalizePdfText(BIRTH_PLAN_REMINDER),
    maxWidth - 10
  ) as string[];
  const reminderBoxHeight = 12 + reminderLines.length * 4.4;

  cursorY += 4;
  ensureSpace(reminderBoxHeight + 6);

  doc.setFillColor(255, 247, 249);
  doc.setDrawColor(216, 112, 147);
  doc.setLineWidth(0.35);
  doc.roundedRect(marginX, cursorY, maxWidth, reminderBoxHeight, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(142, 51, 82);
  doc.text("Lembrete Importante", marginX + 5, cursorY + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(42, 31, 36);
  doc.text(reminderLines, marginX + 5, cursorY + 11.5);
  cursorY += reminderBoxHeight + 8;

  // Date & Signature Block (Gestante, Acompanhante, Médico)
  ensureSpace(44);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(42, 31, 36);
  doc.text(
    "Local e data: ______________________________________________, ____/____/________",
    marginX,
    cursorY
  );
  cursorY += 18;

  const colGap = 6;
  const colWidth = (maxWidth - colGap * 2) / 3;
  const signatures = [
    { title: "Gestante", subtitle: "Nome e Assinatura" },
    { title: "Acompanhante", subtitle: "Lei Federal nº 11.108/2005" },
    { title: "Médico(a)", subtitle: "Assinatura e Carimbo / CRM" },
  ];

  signatures.forEach((sig, index) => {
    const xStart = marginX + index * (colWidth + colGap);
    doc.setDrawColor(94, 77, 84);
    doc.setLineWidth(0.35);
    doc.line(xStart, cursorY, xStart + colWidth, cursorY);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(42, 31, 36);
    doc.text(sig.title, xStart + colWidth / 2, cursorY + 5, {
      align: "center",
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(94, 77, 84);
    doc.text(sig.subtitle, xStart + colWidth / 2, cursorY + 9.5, {
      align: "center",
    });
  });

  // Footer with page numbers on every page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(120, 100, 108);
    doc.text(
      "Nascer Amparado - Documento informativo de apoio à gestante",
      marginX,
      pageHeight - 9
    );
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth - marginX,
      pageHeight - 9,
      { align: "right" }
    );
  }

  doc.save("plano-de-parto-nascer-amparado.pdf");
}
