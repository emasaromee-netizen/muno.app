import jsPDF from "jspdf";

export interface IsaKPI { label: string; value: string }
export interface IsaReportData {
  title: string;
  period: string;
  searches: IsaKPI[];
  origins: IsaKPI[];
  revenue: IsaKPI[];
  conclusion: string;
}

export function buildIsaReportPDF(data: IsaReportData): Blob {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const M = 48;
  let y = M;

  // Header band
  doc.setFillColor(36, 46, 68); // isa navy
  doc.rect(0, 0, W, 90, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("ISA Business Analyst", M, 45);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Informe de auditoría · MUNO", M, 65);
  y = 120;

  doc.setTextColor(36, 46, 68);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(data.title, M, y);
  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(110, 110, 110);
  doc.text(`Período: ${data.period}`, M, y);
  y += 24;

  const section = (label: string, items: IsaKPI[]) => {
    doc.setTextColor(36, 46, 68);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(label, M, y); y += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    if (!items.length) {
      doc.setTextColor(150, 150, 150);
      doc.text("Sin datos", M, y); y += 16;
      return;
    }
    items.forEach((k) => {
      doc.setTextColor(60, 60, 60);
      doc.text(`• ${k.label}`, M, y);
      doc.setTextColor(36, 46, 68);
      doc.setFont("helvetica", "bold");
      doc.text(k.value, W - M, y, { align: "right" });
      doc.setFont("helvetica", "normal");
      y += 16;
      if (y > 760) { doc.addPage(); y = M; }
    });
    y += 10;
  };

  section("Búsquedas", data.searches);
  section("Origen geográfico", data.origins);
  section("Recaudación", data.revenue);

  doc.setTextColor(36, 46, 68);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Conclusión estratégica", M, y); y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  const lines = doc.splitTextToSize(data.conclusion || "—", W - M * 2);
  lines.forEach((l: string) => {
    if (y > 770) { doc.addPage(); y = M; }
    doc.text(l, M, y); y += 14;
  });

  // Footer
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      "Análisis generado por ISA Business Analyst — Propiedad Intelectual de MUNO",
      W / 2,
      820,
      { align: "center" }
    );
  }

  return doc.output("blob");
}
