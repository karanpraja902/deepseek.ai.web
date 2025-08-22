import { google } from '@ai-sdk/google';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

export class ModelProviderService {
  /**
   * Get OpenRouter API key for specific model
   */
  static getOpenRouterKeyForModel(modelId: string): string | undefined {
    console.log("getOpenRouterKeyForModel:", modelId);
    
    if (modelId.startsWith('deepseek/deepseek-r1')) {
      console.log("getOpenRouterKeyForModelIf:", modelId);
      return process.env.OPEN_ROUTER_DEEPSEEK_R1_1;
    }
    
    if (modelId.startsWith('openai/gpt')) {
      console.log("getOpenRouterKeyForModelIf:", modelId);
      return process.env.OPEN_ROUTER_OPENAI;
    }
    
    if (modelId.startsWith('nvidia/llama')) {
      console.log("getOpenRouterKeyForModelIf:", modelId);
      return process.env.OPEN_ROUTER_Llama;
    }

    // Generic OpenRouter fallback
    return process.env.OPEN_ROUTER_API_KEY;
  }

  /**
   * Get the appropriate model based on selection
   */
  static getModel(selectedModel: string) {
    console.log("modelToUse");
    
    if (selectedModel === 'google') {
      console.log("selectedModelisGoogle");
      return google('models/gemini-2.5-flash');
    }
    
    if (typeof selectedModel === 'string' && selectedModel.startsWith('openrouter:')) {
      console.log("selectedModelisDeepSeek");
      const orModel = selectedModel.replace('openrouter:', '');
      const apiKey = this.getOpenRouterKeyForModel(orModel);
      console.log("apiKey:", apiKey);
      
      if (!apiKey) {
        console.warn('OpenRouter API key missing for model:', orModel, '— falling back to Google.');
        return google('models/gemini-2.5-flash');
      }
      
      const openrouter = createOpenRouter({ apiKey });
      return openrouter(orModel);
    }
    
    // Fallback
    return google('models/gemini-2.5-flash');
  }
}
