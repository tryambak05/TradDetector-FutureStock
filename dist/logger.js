"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logDataToDailyFile = logDataToDailyFile;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * Logs a JS object to a daily JSON file using IST timezone.
 */
function logDataToDailyFile(data) {
    const logsDir = path_1.default.join(__dirname, "../logs");
    if (!fs_1.default.existsSync(logsDir)) {
        fs_1.default.mkdirSync(logsDir);
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
    const filePath = path_1.default.join(logsDir, fileName);
    // Format IST timestamp
    const timestampIST = istDate
        .toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: false })
        .replace(",", "");
    const logEntry = {
        timestamp: timestampIST, // e.g. "2025-10-15 21:15:32"
        data: data,
    };
    // Read existing file
    let existingLogs = [];
    if (fs_1.default.existsSync(filePath)) {
        const fileContent = fs_1.default.readFileSync(filePath, "utf8");
        try {
            existingLogs = JSON.parse(fileContent);
            if (!Array.isArray(existingLogs))
                existingLogs = [existingLogs];
        }
        catch (_a) {
            existingLogs = [];
        }
    }
    // Append and save
    existingLogs.push(logEntry);
    fs_1.default.writeFileSync(filePath, JSON.stringify(existingLogs, null, 2), "utf8");
    console.log(`✅ Log saved to ${fileName} [${timestampIST}]`);
}
