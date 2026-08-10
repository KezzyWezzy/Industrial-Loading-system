#!/usr/bin/env node
/**
 * Build a Word document from the CSV produced by la_candidates.py.
 *
 * Organizes candidates by parish, then by the office they're running for,
 * with a contact table for each race.
 *
 * Usage:
 *   npm install docx
 *   node make_word.js la-candidates-11-03-2026-full.csv [output.docx]
 */

const fs = require("fs");
const path = require("path");
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  WidthType,
  ShadingType,
  BorderStyle,
  PageBreak,
  PageOrientation,
  Header,
  Footer,
  PageNumber,
} = require("docx");

// US Letter, 1" margins -> 12240 - 2880 = 9360 DXA of usable width.
const CONTENT_WIDTH = 9360;
const COLUMN_WIDTHS = [2500, 3360, 1500, 2000]; // Name, Email, Phone, Party

const INK = "1A1A1A";
const MUTED = "5A5A5A";
const ACCENT = "1F3864";
const RULE = "C8C8C8";
const HEADER_FILL = "1F3864";
const ZEBRA_FILL = "F2F5FA";

// --------------------------------------------------------------------------
// CSV parsing (handles quoted fields and embedded commas/newlines)
// --------------------------------------------------------------------------

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const header = rows.shift().map((name) => name.replace(/^﻿/, "").trim());
  return rows
    .filter((cells) => cells.some((cell) => cell.trim() !== ""))
    .map((cells) => {
      const record = {};
      header.forEach((name, index) => {
        record[name] = (cells[index] || "").trim();
      });
      return record;
    });
}

// --------------------------------------------------------------------------
// Small builders
// --------------------------------------------------------------------------

function cell(text, { bold = false, color = INK, fill = null, size = 18 } = {}, width) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: fill ? { type: ShadingType.CLEAR, fill, color: "auto" } : undefined,
    margins: { top: 60, bottom: 60, left: 110, right: 110 },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: RULE },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: RULE },
      left: { style: BorderStyle.SINGLE, size: 2, color: RULE },
      right: { style: BorderStyle.SINGLE, size: 2, color: RULE },
    },
    children: [
      new Paragraph({
        spacing: { before: 0, after: 0 },
        children: [new TextRun({ text: text || "—", bold, color, size })],
      }),
    ],
  });
}

function candidateTable(rows) {
  const headers = ["Name", "Email", "Phone", "Party"];

  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((label, index) =>
      cell(label, { bold: true, color: "FFFFFF", fill: HEADER_FILL, size: 17 }, COLUMN_WIDTHS[index])
    ),
  });

  const bodyRows = rows.map((row, index) => {
    const fill = index % 2 === 1 ? ZEBRA_FILL : null;
    return new TableRow({
      children: [
        cell(row.Name, { bold: true, fill }, COLUMN_WIDTHS[0]),
        cell(row["Email Address"], { color: ACCENT, fill }, COLUMN_WIDTHS[1]),
        cell(row.Phone, { fill }, COLUMN_WIDTHS[2]),
        cell(row.Party, { fill }, COLUMN_WIDTHS[3]),
      ],
    });
  });

  return new Table({
    columnWidths: COLUMN_WIDTHS,
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    rows: [headerRow, ...bodyRows],
  });
}

function spacer(after = 120) {
  return new Paragraph({ spacing: { after }, children: [] });
}

// --------------------------------------------------------------------------
// Main
// --------------------------------------------------------------------------

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error("Usage: node make_word.js <full.csv> [output.docx]");
    process.exit(1);
  }

  const rows = parseCsv(fs.readFileSync(inputPath, "utf8"));
  if (rows.length === 0) {
    console.error("No rows found in " + inputPath);
    process.exit(1);
  }

  const electionDate = rows[0].Election || "";
  const outputPath =
    process.argv[3] ||
    path.join(
      path.dirname(inputPath),
      `la-candidates-${electionDate.replace(/\//g, "-")}.docx`
    );

  // Group: parish -> office -> candidates
  const byParish = new Map();
  for (const row of rows) {
    const parish = row.Parish || "(unknown parish)";
    const office =
      row.Office ||
      [row.OfficeTitle, row.OfficeTitleDescription].filter(Boolean).join(" - ") ||
      "(unspecified office)";

    if (!byParish.has(parish)) byParish.set(parish, new Map());
    const offices = byParish.get(parish);
    if (!offices.has(office)) offices.set(office, []);
    offices.get(office).push(row);
  }

  const parishNames = [...byParish.keys()].sort();
  const withEmail = rows.filter((row) => (row["Email Address"] || "").trim()).length;
  const uniquePeople = new Set(
    rows.map((row) => `${(row.Name || "").toUpperCase()}|${(row["Email Address"] || "").toLowerCase()}`)
  ).size;

  const children = [];

  // ---- Cover -----------------------------------------------------------
  children.push(
    new Paragraph({
      spacing: { before: 2200, after: 0 },
      children: [
        new TextRun({ text: "LOUISIANA CANDIDATE FILINGS", bold: true, size: 44, color: ACCENT }),
      ],
    }),
    new Paragraph({
      spacing: { before: 160, after: 0 },
      border: { top: { style: BorderStyle.SINGLE, size: 12, color: ACCENT, space: 12 } },
      children: [],
    }),
    new Paragraph({
      spacing: { before: 220, after: 0 },
      children: [new TextRun({ text: `Election of ${electionDate}`, size: 28, color: INK })],
    }),
    new Paragraph({
      spacing: { before: 90, after: 0 },
      children: [
        new TextRun({
          text: `${parishNames.length} parishes  ·  ${rows.length.toLocaleString()} ballot listings  ·  ${uniquePeople.toLocaleString()} distinct candidates`,
          size: 21,
          color: MUTED,
        }),
      ],
    }),
    new Paragraph({
      spacing: { before: 60, after: 0 },
      children: [
        new TextRun({
          text: `${withEmail.toLocaleString()} listings include an email address`,
          size: 21,
          color: MUTED,
        }),
      ],
    }),
    new Paragraph({
      spacing: { before: 900, after: 0 },
      children: [
        new TextRun({
          text: "Source: Louisiana Secretary of State, Candidate Inquiry portal",
          size: 18,
          color: MUTED,
        }),
      ],
    }),
    new Paragraph({
      spacing: { before: 40, after: 0 },
      children: [
        new TextRun({ text: "voterportal.sos.la.gov/candidateinquiry", size: 18, color: MUTED, italics: true }),
      ],
    }),
    new Paragraph({
      spacing: { before: 40, after: 0 },
      children: [
        new TextRun({
          text: "Contact details are reproduced as filed by each candidate and are not independently verified.",
          size: 18,
          color: MUTED,
          italics: true,
        }),
      ],
    })
  );

  // ---- Parish summary --------------------------------------------------
  children.push(
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 0, after: 200 },
      children: [new TextRun({ text: "Candidates by Parish", bold: true, size: 32, color: ACCENT })],
    })
  );

  const summaryWidths = [3400, 1500, 1500, 2960];
  const summaryHeader = new TableRow({
    tableHeader: true,
    children: ["Parish", "Races", "Candidates", "With Email"].map((label, index) =>
      cell(label, { bold: true, color: "FFFFFF", fill: HEADER_FILL, size: 17 }, summaryWidths[index])
    ),
  });

  const summaryRows = parishNames.map((parish, index) => {
    const offices = byParish.get(parish);
    const candidates = [...offices.values()].flat();
    const emails = candidates.filter((row) => (row["Email Address"] || "").trim()).length;
    const fill = index % 2 === 1 ? ZEBRA_FILL : null;
    return new TableRow({
      children: [
        cell(parish, { bold: true, fill }, summaryWidths[0]),
        cell(String(offices.size), { fill }, summaryWidths[1]),
        cell(String(candidates.length), { fill }, summaryWidths[2]),
        cell(String(emails), { fill }, summaryWidths[3]),
      ],
    });
  });

  children.push(
    new Table({
      columnWidths: summaryWidths,
      width: { size: CONTENT_WIDTH, type: WidthType.DXA },
      rows: [summaryHeader, ...summaryRows],
    })
  );

  // ---- One section per parish -----------------------------------------
  for (const parish of parishNames) {
    const offices = byParish.get(parish);
    const candidateCount = [...offices.values()].flat().length;

    children.push(
      new Paragraph({ children: [new PageBreak()] }),
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 0, after: 40 },
        children: [new TextRun({ text: `${parish} PARISH`, bold: true, size: 32, color: ACCENT })],
      }),
      new Paragraph({
        spacing: { before: 0, after: 40 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: ACCENT, space: 6 } },
        children: [],
      }),
      new Paragraph({
        spacing: { before: 80, after: 240 },
        children: [
          new TextRun({
            text: `${offices.size} race${offices.size === 1 ? "" : "s"}  ·  ${candidateCount} candidate${candidateCount === 1 ? "" : "s"}`,
            size: 19,
            color: MUTED,
          }),
        ],
      })
    );

    for (const office of [...offices.keys()].sort()) {
      const candidates = offices
        .get(office)
        .slice()
        .sort((a, b) => (a.Name || "").localeCompare(b.Name || ""));

      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 240, after: 100 },
          keepNext: true,
          children: [new TextRun({ text: office, bold: true, size: 24, color: INK })],
        }),
        candidateTable(candidates),
        spacer(160)
      );
    }
  }

  // ---- Assemble --------------------------------------------------------
  const document = new Document({
    creator: "la_candidates.py",
    title: `Louisiana Candidate Filings — ${electionDate}`,
    description: "Candidate filings by parish, exported from the Louisiana Secretary of State.",
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 20, color: INK } },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840, orientation: PageOrientation.PORTRAIT },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { after: 0 },
                children: [
                  new TextRun({
                    text: `Louisiana Candidate Filings — ${electionDate}`,
                    size: 16,
                    color: MUTED,
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: "Page ", size: 16, color: MUTED }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 16, color: MUTED }),
                  new TextRun({ text: " of ", size: 16, color: MUTED }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: MUTED }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(document);
  fs.writeFileSync(outputPath, buffer);

  console.log(`Wrote ${outputPath}`);
  console.log(
    `${rows.length.toLocaleString()} listings, ${parishNames.length} parishes, ${uniquePeople.toLocaleString()} distinct candidates`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
