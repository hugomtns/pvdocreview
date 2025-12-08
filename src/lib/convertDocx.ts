import mammoth from 'mammoth';
import { jsPDF } from 'jspdf';

/**
 * Convert a .docx file to PDF for viewing
 *
 * @param file - The .docx File to convert
 * @returns Promise<Blob> - The converted PDF as a Blob
 * @throws Error if conversion fails
 */
export async function convertDocxToPdf(file: File): Promise<Blob> {
  try {
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.docx')) {
      throw new Error('File must be a .docx document');
    }

    // Read the .docx file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Extract HTML from .docx using mammoth
    const result = await mammoth.convertToHtml({ arrayBuffer });
    const html = result.value;

    // Check for conversion warnings
    if (result.messages.length > 0) {
      console.warn('Conversion warnings:', result.messages);
    }

    // Create a temporary container to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Initialize jsPDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const maxWidth = pageWidth - (margin * 2);
    let yPosition = margin;

    // Process each element in the HTML
    const elements = tempDiv.children;

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      if (!element) continue;

      const text = element.textContent?.trim() || '';

      if (!text) continue;

      // Set font size based on element type
      let fontSize = 12;
      let fontStyle: 'normal' | 'bold' = 'normal';

      if (element.tagName === 'H1') {
        fontSize = 18;
        fontStyle = 'bold';
      } else if (element.tagName === 'H2') {
        fontSize = 16;
        fontStyle = 'bold';
      } else if (element.tagName === 'H3') {
        fontSize = 14;
        fontStyle = 'bold';
      } else if (element.tagName === 'STRONG' || element.tagName === 'B') {
        fontStyle = 'bold';
      }

      pdf.setFontSize(fontSize);
      pdf.setFont('helvetica', fontStyle);

      // Split text into lines that fit the page width
      const lines = pdf.splitTextToSize(text, maxWidth);

      // Check if we need a new page
      const lineHeight = fontSize * 0.5;
      const blockHeight = lines.length * lineHeight;

      if (yPosition + blockHeight > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }

      // Add the text to the PDF
      pdf.text(lines, margin, yPosition);
      yPosition += blockHeight + 5; // Add spacing between elements
    }

    // If no content was added, add a placeholder
    if (yPosition === margin) {
      pdf.setFontSize(12);
      pdf.text('(Empty document or unsupported content)', margin, margin);
    }

    // Convert PDF to Blob
    const pdfBlob = pdf.output('blob');

    return pdfBlob;
  } catch (error) {
    const errorMessage = error instanceof Error
      ? `Failed to convert .docx to PDF: ${error.message}`
      : 'Failed to convert .docx to PDF: Unknown error';

    console.error(errorMessage, error);
    throw new Error(errorMessage);
  }
}
