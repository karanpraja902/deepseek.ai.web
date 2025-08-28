// Context management for token limits and conversation flow

interface ContextStatus {
  status: 'ok' | 'warning' | 'danger';
  percentage: number;
  currentTokens: number;
  limit: number;
  message: string;
}

// Token limits for different models (with safety buffer)
const MODEL_TOKEN_LIMITS: Record<string, number> = {
  'google': 150000, // Gemini 2.5 Flash - buffer from 163840 max
  'deepseek-r1': 150000, // Based on error message showing ~163840 limit
  'llama-3.1': 120000, // Conservative estimate
  'gpt-oss': 8000, // Conservative estimate for smaller models
};

// Rough token estimation (words * 1.3 for average token-to-word ratio)
export const estimateTokens = (text: string): number => {
  if (!text || typeof text !== 'string') return 0;
  // Simple estimation: split by whitespace and multiply by average token ratio
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words * 1.3);
};

// Calculate total tokens in messages
export const calculateMessageTokens = (messages: any[]): number => {
  let totalTokens = 0;
  
  for (const message of messages) {
    // Handle different message formats
    if (message.parts && Array.isArray(message.parts)) {
      for (const part of message.parts) {
        if (part.type === 'text' && part.text) {
          totalTokens += estimateTokens(part.text);
        }
        // Add minimal tokens for other content types
        else if (part.type === 'image') {
          totalTokens += 100; // Rough estimate for image processing
        }
        else if (part.type === 'file') {
          totalTokens += 50; // Minimal for file references
        }
      }
    } else if (message.content) {
      if (typeof message.content === 'string') {
        totalTokens += estimateTokens(message.content);
      } else if (Array.isArray(message.content)) {
        for (const item of message.content) {
          if (item.type === 'text' && item.text) {
            totalTokens += estimateTokens(item.text);
          }
        }
      }
    }
    
    // Add overhead for message structure
    totalTokens += 10;
  }
  
  return totalTokens;
};

// Get token limit for a model
export const getTokenLimit = (modelKey: string): number => {
  return MODEL_TOKEN_LIMITS[modelKey] || 8000; // Default conservative limit
};

// Get context status for UI display
export const getContextStatus = (messages: any[], modelKey: string): ContextStatus => {
  const currentTokens = calculateMessageTokens(messages);
  const limit = getTokenLimit(modelKey);
  const percentage = Math.round((currentTokens / limit) * 100);
  
  let status: 'ok' | 'warning' | 'danger' = 'ok';
  let message = 'Context usage is within normal limits';
  
  if (percentage >= 90) {
    status = 'danger';
    message = 'Context nearly full - consider starting a new conversation';
  } else if (percentage >= 70) {
    status = 'warning';
    message = 'Context getting full - may need to truncate soon';
  }
  
  return {
    status,
    percentage,
    currentTokens,
    limit,
    message
  };
};

// Validate context before sending to model
export const validateContext = (messages: any[], modelKey: string): { valid: boolean; tokens: number; limit: number; suggestion?: string } => {
  const tokens = calculateMessageTokens(messages);
  const limit = getTokenLimit(modelKey);
  
  const valid = tokens <= limit;
  
  const result: any = {
    valid,
    tokens,
    limit
  };
  
  if (!valid) {
    result.suggestion = `Consider using a model with higher token limit or reduce conversation length. Current: ${tokens}, Limit: ${limit}`;
  }
  
  return result;
};

// Truncate messages to fit within token limit (client-side preview)
export const truncateMessages = (messages: any[], modelKey: string, systemPromptTokens: number = 500): any[] => {
  const tokenLimit = getTokenLimit(modelKey);
  const availableTokens = tokenLimit - systemPromptTokens - 1000; // Reserve tokens for response
  
  if (messages.length === 0) return messages;
  
  // Always keep the last message (current user input)
  const lastMessage = messages[messages.length - 1];
  const lastMessageTokens = calculateMessageTokens([lastMessage]);
  
  if (lastMessageTokens > availableTokens) {
    console.warn(`⚠️ Single message too long: ${lastMessageTokens} tokens`);
    // If even the last message is too long, just return it (server will handle)
    return [lastMessage];
  }
  
  // Work backwards from the last message to include as many as possible
  const truncatedMessages = [lastMessage];
  let currentTokens = lastMessageTokens;
  
  for (let i = messages.length - 2; i >= 0; i--) {
    const messageTokens = calculateMessageTokens([messages[i]]);
    
    if (currentTokens + messageTokens <= availableTokens) {
      truncatedMessages.unshift(messages[i]);
      currentTokens += messageTokens;
    } else {
      // If we can't fit the entire message, break
      break;
    }
  }
  
  const finalTokens = calculateMessageTokens(truncatedMessages);
  console.log(`Context preview: ${truncatedMessages.length} messages (${finalTokens} tokens) from original ${messages.length} messages`);
  
  return truncatedMessages;
};

// Smart context management with conversation summarization (client-side preview)
export const manageContext = (messages: any[], modelKey: string): any[] => {
  const totalTokens = calculateMessageTokens(messages);
  const tokenLimit = getTokenLimit(modelKey);
  
  console.log(`📊 Context analysis: ${totalTokens} tokens, limit: ${tokenLimit}`);
  
  // If we're within limits, return as-is
  if (totalTokens <= tokenLimit * 0.8) { // Use 80% as a safety margin
    return messages;
  }
  
  // If we exceed limits, truncate
  console.log(`🚨 Context limit exceeded, truncating messages`);
  return truncateMessages(messages, modelKey);
};
