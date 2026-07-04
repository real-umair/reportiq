import type { VercelRequest, VercelResponse } from "@vercel/node";
import multer from "multer";
import path from "path";
import { createRequire } from "module";
import { getAuthUser } from "./_utils/supabase.js";

const require = createRequire(import.meta.url);
// @ts-ignore
const pdfParse = require("pdf-parse");
// @ts-ignore
import mammoth from "mammoth";
import * as XLSX from "xlsx";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit
});

const runMiddleware = (req: any, res: any, fn: any) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};

export const config = {
  api: {
    bodyParser: false, // Disables body parsing, so multer can parse multipart form data
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = await getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: "Access denied. Invalid or missing session token." });
  }

  try {
    // Run the multer middleware
    await runMiddleware(req, res, upload.single("file"));

    const file = (req as any).file;
    if (!file) {
      return res.status(400).json({ error: "No file was uploaded." });
    }

    const { originalname, buffer } = file;
    const extension = path.extname(originalname).toLowerCase();
    let text = "";

    if (extension === ".pdf") {
      const data = await pdfParse(buffer);
      text = data.text || "";
    } else if (extension === ".docx") {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value || "";
    } else if (extension === ".txt" || extension === ".csv" || extension === ".json") {
      text = buffer.toString("utf8");
    } else if (extension === ".xlsx" || extension === ".xls") {
      const workbook = XLSX.read(buffer, { type: "buffer" });
      let sheetsText: string[] = [];
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(sheet);
        if (csv.trim()) {
          sheetsText.push(`--- Sheet: ${sheetName} ---\n${csv}`);
        }
      }
      text = sheetsText.join("\n\n");
    } else {
      return res.status(400).json({ error: `Unsupported file type: ${extension}. Supported formats: .pdf, .docx, .txt, .csv, .json, .xlsx, .xls` });
    }

    return res.status(200).json({ text: text.trim(), filename: originalname });
  } catch (error: any) {
    console.error("Document text extraction failed:", error);
    return res.status(500).json({ error: error.message || "Failed to extract text from document" });
  }
}
