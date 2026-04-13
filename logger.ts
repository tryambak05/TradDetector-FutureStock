import fs from "fs";
import path from "path";

/**
 * Logs a JS object to a daily JSON file using IST timezone.
 */
export function logDataToDailyFile(data: any) {
  const logsDir = path.join(__dirname, "../logs");
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
  }

  // Create date in IST
  const now = new Date();
  const istDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));

  // Format date parts for filename
  const yyyy = istDate.getFullYear();
  const mm = String(istDate.getMonth() + 1).padStart(2, "0");
  const dd = String(istDate.getDate()).padStart(2, "0");
  const dateStr = `${yyyy}-${mm}-${dd}`;

  const fileName = `log-${dateStr}.json`;
  const filePath = path.join(logsDir, fileName);

  // Format IST timestamp
  const timestampIST = istDate
    .toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: false })
    .replace(",", "");

  const logEntry = {
    timestamp: timestampIST, // e.g. "2025-10-15 21:15:32"
    data: data,
  };

  // Read existing file
  let existingLogs: any[] = [];
  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath, "utf8");
    try {
      existingLogs = JSON.parse(fileContent);
      if (!Array.isArray(existingLogs)) existingLogs = [existingLogs];
    } catch {
      existingLogs = [];
    }
  }

  // Append and save
  existingLogs.push(logEntry);
  fs.writeFileSync(filePath, JSON.stringify(existingLogs, null, 2), "utf8");

  console.log(`✅ Log saved to ${fileName} [${timestampIST}]`);
}
