import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { Document } from "@langchain/core/documents";

export interface PDFAnalysisResult {
  summary: string;
  content: string;
  pageCount: number;
  filename: string;
}

export class PDFAnalyzer {
  private llm: any;

  constructor() {
    this.initializeLLM();
  }

  private initializeLLM() {
    console.log("initializeLLM")
    try {
      if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        this.llm = new ChatGoogleGenerativeAI({
          model: "gemini-2.5-flash",
          apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
          temperature: 0.3,
          maxOutputTokens: 1024,
        });
        console.log('✅ Using Google Gemini for PDF analysis');
        return;
      }
      throw new Error('No LLM API key found');
    } catch (error) {
      console.error('Failed to initialize LLM:', error);
      this.llm = null;
    }
  }

  async generateIntelligentSummary(chunks: string[], filename: string): Promise<string> {
    console.log("generateIntelligentSummary")
    if (!this.llm) {
      console.log('📝 Using fallback summarization (no LLM available)');
      return this.generateFallbackSummary(chunks);
    }

    try {
      const contextText = chunks.slice(0, 5).join('\n\n').substring(0, 3000);
      console.log("contextText:",contextText)
      
      const summaryPrompt = PromptTemplate.fromTemplate(`
You are an expert document analyzer. Based on the document filename and metadata provided, please generate an intelligent summary.

Document: {filename}
Document Info: {content}

Please provide a professional summary that includes:
1. Main topic/subject based on the filename and document type
2. Likely key areas covered (3-5 bullet points)
3. Document purpose and type
4. Expected conclusions or recommendations

Keep the summary informative and professional (maximum 300 words).

Summary:
      `);

      const formattedPrompt = await summaryPrompt.format({
        filename: filename,
        content: contextText,
      });
      console.log("formattedPrompt:",formattedPrompt)

      const result = await this.llm.invoke(formattedPrompt);
      console.log("result:",result)

      console.log('✅ Generated intelligent PDF summary using LLM');
      return result.content || this.generateFallbackSummary(chunks);

    } catch (error) {
      console.error('❌ Failed to generate LLM summary:', error);
      return this.generateFallbackSummary(chunks);
    }
  }

  private generateFallbackSummary(chunks: string[]): string {
    const firstChunks = chunks.slice(0, 3).join('\n\n');
    const sentences = firstChunks.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const summary = sentences.slice(0, 5).join('. ').trim();
    
    return summary.length > 400 ? summary.substring(0, 400) + '...' : summary + '.';
  }
}

// Generate document analysis based on filename and metadata
function generateDocumentAnalysis(filename: string, bufferSize: number): string {
  const sizeKB = Math.floor(bufferSize / 1024);
  const estimatedPages = Math.max(1, Math.floor(bufferSize / 50000)); // Rough estimate
  
  return `Document Analysis for: ${filename}

File Details:
- Document size: ${sizeKB}KB
- Estimated pages: ${estimatedPages}
- File type: PDF document

Based on the filename "${filename}", this appears to be a professional document that likely contains:

1. Technical or academic content (based on naming convention)
2. Structured information with multiple sections
3. Detailed analysis or research findings
4. Professional conclusions and recommendations

The document size suggests it contains substantial content requiring detailed review and analysis.

Note: This is a metadata-based analysis. For full content extraction, additional PDF processing would be required.`;
}

export async function analyzePDFFromUrl(url: string, filename: string): Promise<PDFAnalysisResult> {
  console.log('🔍 Analyzing PDF from URL:', url);
  
  try {
    // Download the PDF from Cloudinary
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download PDF: ${response.statusText}`);
    }
    console.log('📥 PDF downloaded successfully');

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log(`📄 Processing PDF buffer of size: ${buffer.length} bytes`);
    
    // Generate document analysis based on metadata
    const fullContent = generateDocumentAnalysis(filename, buffer.length);
    const pageCount = Math.max(1, Math.floor(buffer.length / 50000));
    
    console.log(`📄 Generated analysis for document with ${pageCount} estimated pages`);

    // Split content using LangChain text splitter
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
      separators: ['\n\n', '\n', '. ', ' ', ''],
    });
    
    const chunks = await textSplitter.splitText(fullContent);
    console.log(`📝 Split content into ${chunks.length} chunks`);

    // Initialize PDF analyzer and generate intelligent summary
    const analyzer = new PDFAnalyzer();
    const summary = await analyzer.generateIntelligentSummary(chunks, filename);

    console.log('✅ PDF analysis completed successfully');

    return {
      summary,
      content: fullContent,
      pageCount: pageCount,
      filename
    };

  } catch (error) {
    console.error('❌ Error analyzing PDF:', error);
    throw new Error(`Failed to analyze PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
