// pdfProcessor.ts

import fs from 'fs/promises';
import pdfParse from 'pdf-parse';
import fileType from 'file-type'; // Import the entire module

type PdfAnalysisResult = {
  metadata: Record<string, any>;
  text: string;
};

export async function analyzePdf(filePath: string): Promise<PdfAnalysisResult | string> {
  // 1. Read file
  const fileBuffer = await fs.readFile(filePath);

  // 2. Detect file type - updated for newer file-type versions
  const type = await fileType.fileTypeFromBuffer(fileBuffer); // Use fileTypeFromBuffer instead
  if (!type || type.mime !== 'application/pdf') {
    return 'Error: can only parse PDF files';
  }

  // 3. Use pdf-parse to extract metadata and text
  const pdfData = await pdfParse(fileBuffer);

  // Check if it's a scanned PDF (i.e., text is nearly empty)
  if (!pdfData.text || pdfData.text.trim().length < 50) {
    return 'Cannot parse scanned PDFs yet';
  }

  // 4. Extract metadata
  const metadata: Record<string, any> = {
    info: pdfData.info,
    metadata: pdfData.metadata ? pdfData.metadata.getAll() : {},
    numpages: pdfData.numpages,
    version: pdfData.version,
  };

  // 5. Split text into pages using form feed char (pdf-parse uses \f)
  const rawPages = pdfData.text.split('\f');

  // 6. Clean pages: remove repetitive footers/boilerplate
  const cleanedPages = removeRepetitiveLines(rawPages);

  // 7. Merge cleaned pages
  const fullText = cleanedPages.join('\n\n');

  return {
    metadata,
    text: fullText,
  };
}

/**
 * Removes repetitive lines (e.g., footers) that appear on most/all pages
 */
function removeRepetitiveLines(pages: string[]): string[] {
  const lineMap: Record<string, number> = {};

  // Count line frequency across all pages
  for (const page of pages) {
    const lines = new Set(page.split('\n').map(line => line.trim()));
    for (const line of lines) {
      if (line) lineMap[line] = (lineMap[line] || 0) + 1;
    }
  }

  // Consider lines that appear on more than 70% of pages as boilerplate
  const threshold = Math.ceil(pages.length * 0.7);
  const repetitiveLines = new Set(
    Object.entries(lineMap)
      .filter(([_, count]) => count >= threshold)
      .map(([line]) => line)
  );

  // Remove repetitive lines from each page
  return pages.map(page =>
    page
      .split('\n')
      .filter(line => !repetitiveLines.has(line.trim()))
      .join('\n')
  );
}
