import { TavilySearch } from "@langchain/tavily";

export class WebSearchService {
  /**
   * Perform web search using Tavily directly
   */
  static async performWebSearch(query: string): Promise<string> {
    console.log("performWebSearch", query);
    try {
      // Initialize the search tool - API key is set via TAVILY_API_KEY environment variable
      const searchTool = new TavilySearch({
        maxResults: 5,
      });
      console.log("searchTool", searchTool);

      // Perform direct search
      const result = await searchTool.invoke({ query });
      console.log("result", result);
      
      // Format the result for better readability
      if (typeof result === 'string') {
        return result;
      } else if (result && typeof result === 'object') {
        // If result is an object, try to extract meaningful content
        return JSON.stringify(result, null, 2);
      }
      
      return 'No search results found.';
    } catch (error) {
      console.error('Error in web search:', error);
      return 'Unable to perform web search at this time. Please ensure TAVILY_API_KEY is set in your environment variables.';
    }
  }

  /**
   * Extract user query from message
   */
  static extractUserQuery(message: any): string {
    return message.content || 
           (Array.isArray(message.parts) ? 
            message.parts.find((p: any) => p?.type === 'text')?.text : '');
  }

  /**
   * Process web search if enabled
   */
  static async processWebSearch(enableWebSearch: boolean, messages: any[]): Promise<string> {
    if (!enableWebSearch) {
      return '';
    }

    try {
      const lastUserMessage = messages[messages.length - 1];
      const userQuery = this.extractUserQuery(lastUserMessage);
      
      if (userQuery) {
        console.log('🔍 Web search enabled, searching for:', userQuery);
        const searchResults = await this.performWebSearch(userQuery);
        console.log('✅ Web search completed');
        return `🔍 **Web Search Results for: "${userQuery}"**\n\n${searchResults}`;
      }
    } catch (error) {
      console.error('❌ Web search failed:', error);
      return '❌ **Web Search Error:** Unable to perform web search at this time. Please check your TAVILY_API_KEY configuration.';
    }

    return '';
  }
}
