const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface ImageGenerationRequest {
  prompt: string;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  size?: '1024x1024' | '1024x1408' | '1408x1024' | '1152x896' | '896x1152' | '1216x832' | '832x1216';
}

export interface ImageGenerationResponse {
  success: boolean;
  data: {
    image: string; // Base64 encoded image or URL
    prompt: string;
    aspectRatio: string;
    size: string;
    generatedAt: string;
    commentary: string; // AI commentary about the generated image
  };
}

export interface WebSearchWithAIRequest {
  query: string;
  userQuestion: string;
}

export interface WebSearchWithAIResponse {
  success: boolean;
  data: {
    answer: string;
    searchResults: Array<{
      title: string;
      snippet: string;
      url: string;
      source: string;
    }>;
    sources: string[];
  };
}

export interface DocumentAnalysisRequest {
  pdfUrl: string;
  question?: string;
  analysisType?: 'summary' | 'qa' | 'extract' | 'general';
}

export interface DocumentAnalysisResponse {
  success: boolean;
  data: {
    analysis: string;
    sourceDocuments: Array<{
      pageContent: string;
      metadata: any;
    }>;
    analysisType: string;
    question: string | null;
    pdfUrl: string;
    analyzedAt: string;
    documentInfo: {
      totalPages: number;
      totalChunks: number;
      chunkSize: number;
      chunkOverlap: number;
    };
  };
}

export class AiApiService {
  static async generateImage(params: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        const error = new Error(errorMessage);
        (error as any).status = response.status;
        (error as any).details = errorData.details;
        (error as any).timestamp = errorData.timestamp;
        throw error;
      }

      return await response.json();
    } catch (error) {
      console.error('Image generation error:', error);
      throw error;
    }
  }

  static async webSearchWithAI(params: WebSearchWithAIRequest): Promise<WebSearchWithAIResponse> {
    try {
      console.log("webSearchWithAI params:", params);
      const response = await fetch(`${API_BASE_URL}/ai/web-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        const error = new Error(errorMessage);
        (error as any).status = response.status;
        (error as any).details = errorData.details;
        (error as any).timestamp = errorData.timestamp;
        throw error;
      }

      return await response.json();
    } catch (error) {
      console.error('Web search with AI error:', error);
      throw error;
    }
  }

  static async analyzeDocument(params: DocumentAnalysisRequest): Promise<DocumentAnalysisResponse> {
    try {
      console.log("analyzeDocument params:", params);
      const response = await fetch(`${API_BASE_URL}/pdf/analyze`, {
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        const error = new Error(errorMessage);
        (error as any).status = response.status;
        (error as any).details = errorData.details;
        (error as any).timestamp = errorData.timestamp;
        throw error;
      }

      return await response.json();
    } catch (error) {
      console.error('Document analysis error:', error);
      throw error;
    }
  }
}
