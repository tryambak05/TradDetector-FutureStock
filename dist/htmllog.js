"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateFixedStockLogHTML = updateFixedStockLogHTML;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
// 🔧 Helper: Get today's date as DDMMYYYY
function getCurrentDateString() {
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
function generateTableRows(data, headers) {
    return data
        .map((row) => `
    <tr>
      ${headers.map((h) => { var _a; return `<td>${(_a = row[h]) !== null && _a !== void 0 ? _a : ""}</td>`; }).join("")}
    </tr>
  `)
        .join("");
}
function updateFixedStockLogHTML(data_1, captionData_1) {
    return __awaiter(this, arguments, void 0, function* (data, captionData, outputDir = "./logs") {
        const dateStr = getCurrentDateString();
        const fileName = `optionstocklog-${dateStr}.html`;
        const filePath = path_1.default.join(outputDir, fileName);
        yield promises_1.default.mkdir(outputDir, { recursive: true });
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
            yield promises_1.default.access(filePath);
            fileExists = true;
        }
        catch (_a) { }
        if (fileExists) {
            const html = yield promises_1.default.readFile(filePath, "utf8");
            // Replace <tbody>
            let updatedHtml = html.replace(/<tbody>[\s\S]*?<\/tbody>/, newTableBody);
            // Replace caption
            if (/<caption>[\s\S]*?<\/caption>/.test(updatedHtml)) {
                updatedHtml = updatedHtml.replace(/<caption>[\s\S]*?<\/caption>/, `<caption>${captionContent}</caption>`);
            }
            else {
                // If caption doesn't exist, insert after <table> opening
                updatedHtml = updatedHtml.replace(/<table>/, `<table>\n<caption>${captionContent}</caption>`);
            }
            yield promises_1.default.writeFile(filePath, updatedHtml, "utf8");
            console.log(`🔁 Updated table and caption in: ${filePath}`);
        }
        else {
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
            yield promises_1.default.writeFile(filePath, htmlContent, "utf8");
            console.log(`✅ Created new report: ${filePath}`);
        }
    });
}
