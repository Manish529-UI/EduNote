import PDFDocument from "pdfkit"

export const pdfDownload = async (req, res) => {
  const { result } = req.body;

  if (!result) {
    return res.status(400).json({ error: "No content provided" });
  }

  const doc = new PDFDocument({ margin: 50, size: "A4" });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="EduNote.pdf"'
  );

  doc.pipe(res);

  // --- Color palette ---
  const colors = {
    primary: "#1a1a2e",
    accent: "#6366f1",
    accentLight: "#818cf8",
    heading: "#1e293b",
    subHeading: "#334155",
    body: "#374151",
    muted: "#6b7280",
    divider: "#e2e8f0",
    star: "#f59e0b",
    bullet: "#6366f1",
    bgLight: "#f8fafc",
  };

  // ==============================
  // COVER PAGE
  // ==============================

  // Top accent bar
  doc.rect(0, 0, doc.page.width, 6).fill(colors.accent);

  // Brand name
  doc.moveDown(8);
  doc.fontSize(42).fillColor(colors.primary).text("EduNote", { align: "center" });
  doc.moveDown(0.3);

  // Tagline
  doc.fontSize(14).fillColor(colors.muted).text(
    "AI-Powered Exam Notes & Revision",
    { align: "center" }
  );

  // Divider line
  doc.moveDown(2);
  const dividerY = doc.y;
  doc.moveTo(150, dividerY).lineTo(doc.page.width - 150, dividerY)
    .strokeColor(colors.accent).lineWidth(2).stroke();

  // Topic title
  doc.moveDown(2);
  doc.fontSize(22).fillColor(colors.heading).text(
    result.subTopics ? Object.values(result.subTopics).flat().join(", ").substring(0, 80) || "Exam Notes" : "Exam Notes",
    { align: "center" }
  );

  // Importance badge
  doc.moveDown(1.5);
  doc.fontSize(16).fillColor(colors.star).text(
    `Importance: ${result.importance || "N/A"}`,
    { align: "center" }
  );

  // Date
  doc.moveDown(3);
  doc.fontSize(11).fillColor(colors.muted).text(
    `Generated on ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`,
    { align: "center" }
  );

  // Bottom accent bar on cover
  doc.rect(0, doc.page.height - 6, doc.page.width, 6).fill(colors.accent);

  // --- Helper functions ---
  const addPageFooter = () => {
    const bottom = doc.page.height - 30;
    doc.fontSize(8).fillColor(colors.muted)
      .text("EduNote — AI-Powered Exam Notes", 50, bottom, { align: "left", lineBreak: false })
      .text(`Page ${doc.bufferedPageRange().start + doc.bufferedPageRange().count}`, 0, bottom, { align: "right" });
  };

  const addSectionHeading = (title) => {
    if (doc.y > doc.page.height - 120) {
      doc.addPage();
    }
    doc.moveDown(1.2);
    // Section accent bar
    doc.rect(50, doc.y, 4, 22).fill(colors.accent);
    doc.fontSize(18).fillColor(colors.heading).text(`  ${title}`, 56, doc.y + 2);
    doc.moveDown(0.3);
    // Underline
    const lineY = doc.y;
    doc.moveTo(50, lineY).lineTo(doc.page.width - 50, lineY)
      .strokeColor(colors.divider).lineWidth(1).stroke();
    doc.moveDown(0.6);
  };

  const addSubHeading = (title) => {
    if (doc.y > doc.page.height - 100) {
      doc.addPage();
    }
    doc.moveDown(0.6);
    doc.fontSize(14).fillColor(colors.subHeading).text(title, { continued: false });
    doc.moveDown(0.3);
  };

  const addBulletPoint = (text, indent = 0) => {
    if (doc.y > doc.page.height - 60) {
      doc.addPage();
    }
    const cleanText = text.replace(/[#*`]/g, "").replace(/\\n/g, " ").trim();
    if (!cleanText) return;

    const xPos = 60 + indent;
    const bulletChar = indent > 0 ? "◦" : "•";

    doc.fontSize(11).fillColor(colors.bullet).text(bulletChar, xPos, doc.y, {
      continued: true,
      lineBreak: false,
    });
    doc.fillColor(colors.body).text(`  ${cleanText}`, {
      width: doc.page.width - xPos - 70,
      lineGap: 3,
    });
    doc.moveDown(0.15);
  };

  const addBodyText = (text) => {
    if (!text) return;
    const cleanText = text.replace(/\\n/g, "\n").replace(/[#*`]/g, "").trim();
    const lines = cleanText.split("\n").filter(l => l.trim());

    lines.forEach(line => {
      if (doc.y > doc.page.height - 60) {
        doc.addPage();
      }
      const trimmed = line.trim();
      // Check if line looks like a bullet
      if (trimmed.startsWith("-") || trimmed.startsWith("•") || trimmed.startsWith("*")) {
        addBulletPoint(trimmed.replace(/^[-•*]\s*/, ""));
      } else if (trimmed.length > 0) {
        doc.fontSize(11).fillColor(colors.body).text(trimmed, 60, doc.y, {
          width: doc.page.width - 120,
          lineGap: 3,
        });
        doc.moveDown(0.3);
      }
    });
  };

  // ==============================
  // CONTENT PAGES
  // ==============================

  doc.addPage();

  // --- Sub Topics ---
  addSectionHeading("Sub Topics");

  if (result.subTopics) {
    Object.entries(result.subTopics).forEach(([star, topics]) => {
      const starLabel = star.includes("⭐⭐⭐")
        ? "⭐⭐⭐ Frequently Asked"
        : star.includes("⭐⭐")
        ? "⭐⭐ Important"
        : "⭐ Very Important";
      addSubHeading(starLabel);
      if (Array.isArray(topics)) {
        topics.forEach((t) => addBulletPoint(t));
      }
    });
  }

  // --- Notes ---
  addSectionHeading("Notes");
  addBodyText(result.notes);

  // --- Revision Points ---
  if (result.revisionPoints && result.revisionPoints.length > 0) {
    addSectionHeading("Quick Revision Points");
    result.revisionPoints.forEach((p) => addBulletPoint(p));
  }

  // --- Questions ---
  addSectionHeading("Important Questions");

  if (result.questions) {
    if (result.questions.short && result.questions.short.length > 0) {
      addSubHeading("Short Answer Questions");
      result.questions.short.forEach((q, i) => {
        addBulletPoint(`Q${i + 1}. ${q}`);
      });
    }

    if (result.questions.long && result.questions.long.length > 0) {
      addSubHeading("Long Answer Questions");
      result.questions.long.forEach((q, i) => {
        addBulletPoint(`Q${i + 1}. ${q}`);
      });
    }

    if (result.questions.diagram) {
      addSubHeading("Diagram Based Question");
      addBulletPoint(result.questions.diagram);
    }
  }

  // --- Footer on all pages ---
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    if (i === 0) continue; // skip cover page footer

    // Bottom line
    doc.moveTo(50, doc.page.height - 40)
      .lineTo(doc.page.width - 50, doc.page.height - 40)
      .strokeColor(colors.divider).lineWidth(0.5).stroke();

    doc.fontSize(8).fillColor(colors.muted)
      .text("EduNote — AI-Powered Exam Notes", 50, doc.page.height - 30, {
        lineBreak: false,
      });
    doc.fontSize(8).fillColor(colors.muted)
      .text(`Page ${i}`, doc.page.width - 100, doc.page.height - 30, {
        lineBreak: false,
      });
  }

  doc.end();
}