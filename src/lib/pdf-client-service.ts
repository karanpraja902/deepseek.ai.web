import { PDFDocumentProxy, getDocument } from 'pdfjs-dist';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

// Worker path for pdfjs-dist
const PDF_WORKER_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

// Initialize worker only if we're in the browser and the property exists
if (typeof window !== 'undefined' && (getDocument as any).GlobalWorkerOptions) {
  (getDocument as any).GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;
}

export interface PDFAnalysisResult {
  summary: string;
  content: string;
  pageCount: number;
}

export class PDFClientService {
  /**
   * Analyze a PDF File on the client-side and return a summary and content.
   */
  static async analyzePDF(file: File): Promise<PDFAnalysisResult> {
    try {
      console.log('Starting client-side PDF analysis...');

      // Read the file as an ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      // Use pdf.js to get a PDF document proxy
      const pdf = await getDocument({
        data: arrayBuffer,
        // use.c.s: true,
      }).promise as PDFDocumentProxy;
      
      const numPages = pdf.numPages;
      let fullText = '';

      // Extract text from all pages
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map((item: any) => item.str).join(' ');
      }

      // Clean up text by replacing multiple spaces and newlines
      const cleanedText = fullText.replace(/\s+/g, ' ').trim();

      // Use LangChain to chunk the cleaned text
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });

      const chunks = await textSplitter.splitText(cleanedText);

      // Generate a summary using an LLM (from a limited number of chunks for speed)
      const llm = new ChatGoogleGenerativeAI({
        model: 'gemini-2.5-flash',
        temperature: 0.1,
        maxOutputTokens: 256,
      });

      const prompt = `Generate a concise summary (max 200 words) of the following document content: ${chunks.slice(0, 5).join('\n\n')}`;
      const summaryResult = await llm.invoke(prompt);
      const summary = summaryResult.content.toString();

      console.log('Client-side PDF analysis complete.');

      return {
        summary,
        content: cleanedText,
        pageCount: numPages,
      };
    } catch (error) {
      console.error('Error in client-side PDF analysis:', error);
      throw new Error(`Failed to analyze PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
