/**
 * Client-side report exporters. Excel and PDF engines load on demand
 * so they never weigh down the main bundle.
 */

export interface ReportRow {
  date: string;
  type: string;
  description: string;
  category: string;
  paymentMethod: string;
  status: string;
  originalAmount: string;
  amountInDisplay: number;
}

export interface ReportMeta {
  title: string;
  period: string;
  currency: string;
  generated: string;
  columns: {
    date: string;
    type: string;
    description: string;
    category: string;
    paymentMethod: string;
    status: string;
    originalAmount: string;
    amount: string;
  };
  summary: { income: string; expense: string; net: string };
  totals: { income: number; expense: number; net: number };
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

const csvEscape = (value: string | number): string => {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

export function exportCsv(rows: ReportRow[], meta: ReportMeta): void {
  const c = meta.columns;
  const header = [
    c.date,
    c.type,
    c.description,
    c.category,
    c.paymentMethod,
    c.status,
    c.originalAmount,
    `${c.amount} (${meta.currency})`,
  ];
  const lines = [
    header.map(csvEscape).join(","),
    ...rows.map((row) =>
      [
        row.date,
        row.type,
        row.description,
        row.category,
        row.paymentMethod,
        row.status,
        row.originalAmount,
        row.amountInDisplay,
      ]
        .map(csvEscape)
        .join(",")
    ),
  ];
  // BOM so Excel opens UTF-8 (Urdu text) correctly.
  downloadBlob(
    new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" }),
    `report-${meta.period}.csv`
  );
}

export async function exportExcel(rows: ReportRow[], meta: ReportMeta): Promise<void> {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(meta.title.slice(0, 30) || "Report");

  const c = meta.columns;
  sheet.columns = [
    { header: c.date, key: "date", width: 12 },
    { header: c.type, key: "type", width: 10 },
    { header: c.description, key: "description", width: 34 },
    { header: c.category, key: "category", width: 16 },
    { header: c.paymentMethod, key: "paymentMethod", width: 16 },
    { header: c.status, key: "status", width: 12 },
    { header: c.originalAmount, key: "originalAmount", width: 16 },
    { header: `${c.amount} (${meta.currency})`, key: "amountInDisplay", width: 16 },
  ];
  sheet.getRow(1).font = { bold: true };
  sheet.addRows(rows);
  sheet.getColumn("amountInDisplay").numFmt = "#,##0.00";

  sheet.addRow([]);
  sheet.addRow(["", "", "", "", "", "", meta.summary.income, meta.totals.income]);
  sheet.addRow(["", "", "", "", "", "", meta.summary.expense, meta.totals.expense]);
  const netRow = sheet.addRow([
    "", "", "", "", "", "", meta.summary.net, meta.totals.net,
  ]);
  netRow.font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `report-${meta.period}.xlsx`
  );
}

export async function exportPdf(rows: ReportRow[], meta: ReportMeta): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(16);
  doc.text(meta.title, 14, 16);
  doc.setFontSize(10);
  doc.setTextColor(110);
  doc.text(`${meta.period} · ${meta.generated}`, 14, 23);

  const c = meta.columns;
  autoTable(doc, {
    startY: 28,
    head: [
      [
        c.date,
        c.type,
        c.description,
        c.category,
        c.paymentMethod,
        c.status,
        c.originalAmount,
        `${c.amount} (${meta.currency})`,
      ],
    ],
    body: rows.map((row) => [
      row.date,
      row.type,
      row.description,
      row.category,
      row.paymentMethod,
      row.status,
      row.originalAmount,
      row.amountInDisplay.toLocaleString("en-US", { minimumFractionDigits: 2 }),
    ]),
    foot: [
      ["", "", "", "", "", "", meta.summary.income, meta.totals.income.toLocaleString("en-US", { minimumFractionDigits: 2 })],
      ["", "", "", "", "", "", meta.summary.expense, meta.totals.expense.toLocaleString("en-US", { minimumFractionDigits: 2 })],
      ["", "", "", "", "", "", meta.summary.net, meta.totals.net.toLocaleString("en-US", { minimumFractionDigits: 2 })],
    ],
    styles: { fontSize: 8 },
    headStyles: { fillColor: [13, 31, 26] },
    footStyles: { fillColor: [238, 241, 238], textColor: [13, 31, 26], fontStyle: "bold" },
  });

  doc.save(`report-${meta.period}.pdf`);
}
