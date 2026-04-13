import fs from "fs/promises";
import path from "path";
import { StockWithScores } from "./stocktracker";

type StockItem = {
  [key: string]: string | number | boolean;
};

// 🔧 Helper: Get today's date as DDMMYYYY
function getCurrentDateString(): string {
  const now = new Date();

  // Convert to IST
  const istString = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  const istDate = new Date(istString);

  const dd = String(istDate.getDate()).padStart(2, "0");
  const mm = String(istDate.getMonth() + 1).padStart(2, "0");
  const yyyy = istDate.getFullYear();

  return `${dd}${mm}${yyyy}`;
}

// 🔧 Helper: Generate HTML rows
function generateTableRows(data: StockItem[], headers: string[]): string {
  return data
    .map(
      (row) => `
    <tr>
      ${headers.map((h) => `<td>${row[h] ?? ""}</td>`).join("")}
    </tr>
  `
    )
    .join("");
}

export async function updateFixedStockLogHTML(
  data: StockItem[],
  captionData: StockWithScores[],
  outputDir: string = "./logs"
): Promise<void> {
  const dateStr = getCurrentDateString();
  const fileName = `optionstocklog-${dateStr}.html`;
  const filePath = path.join(outputDir, fileName);

  await fs.mkdir(outputDir, { recursive: true });

  const headers = data.length > 0 ? Object.keys(data[0]) : [];

  // Generate table rows
  const newTableBody = `
    <tbody>
      ${generateTableRows(data, headers)}
    </tbody>
  `.trim();

  // Generate caption from captionData
  const captionContent = captionData
    .map((s) => `${s.symbol}: ${s.composite.toFixed(2)}`)
    .join("\n");

  let fileExists = false;
  try {
    await fs.access(filePath);
    fileExists = true;
  } catch {}

  if (fileExists) {
    const html = await fs.readFile(filePath, "utf8");

    // Replace <tbody>
    let updatedHtml = html.replace(/<tbody>[\s\S]*?<\/tbody>/, newTableBody);

    // Replace caption
    if (/<caption>[\s\S]*?<\/caption>/.test(updatedHtml)) {
      updatedHtml = updatedHtml.replace(
        /<caption>[\s\S]*?<\/caption>/,
        `<caption>${captionContent}</caption>`
      );
    } else {
      // If caption doesn't exist, insert after <table> opening
      updatedHtml = updatedHtml.replace(
        /<table>/,
        `<table>\n<caption>${captionContent}</caption>`
      );
    }

    await fs.writeFile(filePath, updatedHtml, "utf8");
    console.log(`🔁 Updated table and caption in: ${filePath}`);
  } else {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="refresh" content="300">
        <title>Option Stock Log - ${dateStr}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .table-container { display: flex; justify-content: space-between; gap: 20px; }
          .left-table, .right-table { flex: 1; }
          table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          tr:nth-child(even) { background-color: #fafafa; }
        </style>
      </head>
      <body>
        <h1>Stock Log - ${dateStr}</h1>
        <table>
          <caption>${captionContent}</caption>
          <thead>
            <tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>
          </thead>
          ${newTableBody}
        </table>
      </body>
      </html>
    `;
    await fs.writeFile(filePath, htmlContent, "utf8");
    console.log(`✅ Created new report: ${filePath}`);
  }
}

