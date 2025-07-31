// In-memory API request logger
interface ApiLogEntry {
  id: string;
  timestamp: number;
  userQuestion: string;
  systemPrompt: string;
  ragContent?: string;
  openaiMessages: any[];
  response: string;
  source: 'mock' | 'openai' | 'openai-rag' | 'rag-disambiguation';
  processingTime: number;
  ragResponseTime?: number;
  ragContentLength?: number;
  disambiguationDetected?: boolean;
  disambiguationContent?: string;
  disambiguationParsed?: {
    optionsCount: number;
    options: Array<{ name: string; company?: string; description?: string }>;
    instructions?: string;
  };
  // Phase 4: Enhanced analytics
  queryComplexity?: 'simple' | 'moderate' | 'complex';
  selectedProductId?: string;
  userSelectionTime?: number;
  searchCategories?: string[];
  confidenceScore?: number;
}

class ApiLogger {
  private logs: ApiLogEntry[] = [];
  private maxLogs = 100; // Keep last 100 logs

  log(entry: Omit<ApiLogEntry, 'id' | 'timestamp'>) {
    const logEntry: ApiLogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      ...entry
    };

    this.logs.unshift(logEntry); // Add to beginning
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }
  }

  getLogs(): ApiLogEntry[] {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }
}

export const apiLogger = new ApiLogger();