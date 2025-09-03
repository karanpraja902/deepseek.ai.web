const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://deepseek-ai-server.vercel.app/api';

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

export interface WeatherRequest {
  location: string;
  userQuestion?: string;
}

export interface WeatherResponse {
  success: boolean;
  data: {
    weather: string;
    temperature: number;
    location: string;
    humidity?: number;
    windSpeed?: number;
    description?: string;
    aiResponse: string;
    retrievedAt: string;
  };
}

export interface ModelInfo {
  key: string;
  displayName: string;
  provider: string;
  isDefault: boolean;
  isAvailable: boolean;
}

export interface AvailableModelsResponse {
  success: boolean;
  data: {
    models: ModelInfo[];
    defaultModel: string;
  };
}

export class AiApiService {
  static async getAvailableModels(): Promise<AvailableModelsResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/models`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
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
      console.error('Get available models error:', error);
      throw error;
    }
  }

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

  static async getWeather(params: WeatherRequest): Promise<WeatherResponse> {
    try {
      console.log("getWeather params:", params);
      const response = await fetch(`${API_BASE_URL}/weather/with-ai`, {
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
      console.error('Weather error:', error);
      throw error;
    }
  }
}
