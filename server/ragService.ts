import fetch from 'node-fetch';

export interface ProductAttribute {
  name: string;
  value: string;
  unit?: string;
  category?: string;
}

export interface ProcessedProductData {
  productName?: string;
  principal?: string;
  attributes: ProductAttribute[];
  descriptiveText: string;
  technicalSpecs?: ProductAttribute[];
  applications?: string[];
  features?: string[];
}

export interface ProductOption {
  name: string;
  company?: string;
  description?: string;
  id?: string;
}

export interface DisambiguationData {
  detected: boolean;
  options: ProductOption[];
  originalQuery: string;
  instructions?: string;
}

export interface RagSearchResult {
  success: boolean;
  data?: any;
  error?: string;
  responseTime?: number;
  source: 'knowde' | 'knowde-cached';
  processedProductData?: ProcessedProductData[];
  disambiguationDetected?: boolean;
  rawResponse?: string;
  disambiguationData?: DisambiguationData;
}

export interface RagQuery {
  message: string;
  email?: string;
  dialogCount?: number;
  conversationId?: string;
  userId?: string;
  appId?: string;
  workflowId?: string;
  workflowRunId?: string;
  role?: string;
}

class RagService {
  private readonly baseUrl = 'https://hybrid-search.dev.knowde.dev/api/conversation';
  private readonly authToken: string;
  private readonly companyUuid: string;
  private readonly cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly cacheTimeout = 10 * 60 * 1000; // 10 minutes

  constructor() {
    this.authToken = process.env.KNOWDE_AUTH_TOKEN || '';
    this.companyUuid = process.env.KNOWDE_COMPANY_UUID || '';
    
    if (!this.authToken || !this.companyUuid) {
      console.warn('RAG Service: Missing required environment variables (KNOWDE_AUTH_TOKEN, KNOWDE_COMPANY_UUID)');
    }
  }

  /**
   * Check if RAG service is properly configured
   */
  public isConfigured(): boolean {
    return !!(this.authToken && this.companyUuid);
  }

  /**
   * Generate cache key for a query
   */
  private getCacheKey(query: RagQuery): string {
    return `rag_${query.message.toLowerCase().trim()}`;
  }

  /**
   * Get cached result if available and not expired
   */
  private getCachedResult(cacheKey: string): RagSearchResult | null {
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      console.log('RAG Service: Using cached result for key:', cacheKey);
      
      // Check cached data for disambiguation too
      const rawResponse = JSON.stringify(cached.data);
      const disambiguationDetected = rawResponse.includes("There are several product matches for your query.");
      
      // Parse disambiguation data for cached responses too
      let disambiguationData: DisambiguationData | undefined;
      if (disambiguationDetected) {
        disambiguationData = this.parseDisambiguationResponse(cached.data, 'cached query');
      }
      
      return {
        success: true,
        data: cached.data,
        responseTime: 0, // Cached responses are instant
        source: 'knowde-cached',
        disambiguationDetected,
        rawResponse: disambiguationDetected ? rawResponse : undefined,
        disambiguationData
      };
    }
    return null;
  }

  /**
   * Cache a successful result
   */
  private cacheResult(cacheKey: string, data: any): void {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl: this.cacheTimeout
    });
  }

  /**
   * Enhanced content processing for better context
   */
  private processRagContent(results: any[]): {
    formattedContent: string;
    sources: string[];
    totalScore: number;
    productCount: number;
  } {
    if (!results || results.length === 0) {
      return {
        formattedContent: '',
        sources: [],
        totalScore: 0,
        productCount: 0
      };
    }

    const processedResults = results.slice(0, 5); // Top 5 results
    const sources: string[] = [];
    const seenContent = new Set<string>();
    let totalScore = 0;
    let productCount = 0;

    // Process all results and collect them with company information
    const processedItems = processedResults.map((result: any, index: number) => {
      const content = result.content.replace(/\n+/g, ' ').trim();
      
      // Enhanced product and company extraction with content parsing fallback
      let product = result.metadata?.products?.[0]?.name || this.extractProductName(content);
      let company = result.metadata?.products?.[0]?.company;
      
      // If metadata company is missing or generic, parse from content
      if (!company || company === 'Unknown Company') {
        company = this.extractPrincipal(content);
      }
      
      const score = result.metadata?.score || 0;
      
      // Remove duplicate content
      const contentKey = content.substring(0, 100);
      if (seenContent.has(contentKey)) {
        return null;
      }
      seenContent.add(contentKey);

      return {
        product,
        company,
        content,
        score,
        hasSpecificCompany: company !== 'Unknown Company',
        hasGroupPrincipal: content.includes('Group Principal')
      };
    }).filter((item): item is NonNullable<typeof item> => item !== null);

    // Sort by priority: results with Group Principal info first, then specific company info, then by score
    processedItems.sort((a, b) => {
      if (a.hasGroupPrincipal && !b.hasGroupPrincipal) return -1;
      if (!a.hasGroupPrincipal && b.hasGroupPrincipal) return 1;
      if (a.hasSpecificCompany && !b.hasSpecificCompany) return -1;
      if (!a.hasSpecificCompany && b.hasSpecificCompany) return 1;
      return b.score - a.score;
    });
    


    // Format the content, ensuring we include all available information
    const formattedContent = processedItems.map(item => {
      totalScore += item.score;
      productCount++;
      sources.push(`${item.product} (${item.company})`);

      return `**${item.product}** by ${item.company} (Relevance: ${item.score.toFixed(2)})\n${item.content}`;
    }).join('\n\n');

    return {
      formattedContent,
      sources,
      totalScore: totalScore / processedResults.length,
      productCount
    };
  }

  /**
   * Search for relevant content using the Knowde RAG API with caching and enhanced processing
   */
  public async search(query: RagQuery): Promise<RagSearchResult> {
    const startTime = Date.now();
    
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'RAG service not configured - missing environment variables',
        responseTime: Date.now() - startTime,
        source: 'knowde'
      };
    }

    // Check cache first
    const cacheKey = this.getCacheKey(query);
    const cachedResult = this.getCachedResult(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    try {
      const requestBody = {
        message: query.message,
        email: query.email || 'system@palmerholland.com',
        dialog_count: query.dialogCount || 0,
        conversation_id: query.conversationId || '1',
        user_id: query.userId || '1',
        app_id: query.appId || '1',
        workflow_id: query.workflowId || '1',
        workflow_run_id: query.workflowRunId || '1',
        role: query.role || 'user',
        company_uuid: this.companyUuid
      };

      console.log('RAG Service: Making request to Knowde API:', { message: query.message });

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-knowde-auth': this.authToken,
        },
        body: JSON.stringify(requestBody),
      });

      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        console.error('RAG Service: API request failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          responseTime
        });
        
        return {
          success: false,
          error: `API request failed: ${response.status} ${response.statusText}`,
          responseTime,
          source: 'knowde'
        };
      }

      const data = await response.json();
      
      console.log('RAG Service: Successful response:', {
        responseTime,
        hasData: !!data,
        dataKeys: data ? Object.keys(data) : []
      });

      // Check for disambiguation signal in the response
      const rawResponse = JSON.stringify(data);
      const disambiguationDetected = rawResponse.includes("There are several product matches for your query.");
      let disambiguationData: DisambiguationData | undefined;
      
      if (disambiguationDetected) {
        console.log('RAG Service: Disambiguation detected in response');
        console.log('RAG Service: Response content preview:', rawResponse.substring(0, 500));
        
        // Phase 2: Parse disambiguation data
        disambiguationData = this.parseDisambiguationResponse(data, query.message);
        console.log('RAG Service: Parsed disambiguation data:', {
          optionsCount: disambiguationData.options.length,
          hasInstructions: !!disambiguationData.instructions
        });
      }

      // Cache successful results
      this.cacheResult(cacheKey, data);

      return {
        success: true,
        data,
        responseTime,
        source: 'knowde',
        disambiguationDetected,
        rawResponse: disambiguationDetected ? rawResponse : undefined,
        disambiguationData
      };

    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      console.error('RAG Service: Request error:', {
        error: error.message,
        responseTime
      });
      
      return {
        success: false,
        error: `Request failed: ${error.message}`,
        responseTime,
        source: 'knowde'
      };
    }
  }

  /**
   * Parse disambiguation response to extract product options
   * Phase 2: Response parsing and structure
   */
  private parseDisambiguationResponse(data: any, originalQuery: string): DisambiguationData {
    const options: ProductOption[] = [];
    let instructions = '';
    
    // Extract response content from the data structure (moved outside try block)
    let responseContent = '';
    if (data?.result) {
      // Handle array of results
      if (Array.isArray(data.result)) {
        responseContent = data.result.map((item: any) => item.content || '').join('\n');
      } else if (data.result.content) {
        responseContent = data.result.content;
      }
    } else if (typeof data === 'string') {
      responseContent = data;
    } else {
      responseContent = JSON.stringify(data);
    }
    
    try {
      
      // Look for product options in various formats
      const productPatterns = [
        // Pattern 1: "SIPERNAT® D 10 (from query: SIPERNAT®)" - Handle Knowde specific format
        /^([^\n(]+?)\s*\(from query:[^)]+\)$/gm,
        // Pattern 2: "1. ProductName by Company - Description"
        /(?:^\d+\.\s*)([^-\n]+?)(?:\s+by\s+([^-\n]+?))?(?:\s*-\s*([^\n]+))?$/gm,
        // Pattern 3: "• ProductName (Company) - Description"  
        /(?:^[•*-]\s*)([^(\n]+?)(?:\s*\(([^)]+)\))?(?:\s*-\s*([^\n]+))?$/gm,
        // Pattern 4: Look for product names in quotes
        /"([^"]+)"\s*(?:by|from)\s*([^,\n]+)/gm,
        // Pattern 5: Product: Name format
        /Product:\s*([^,\n]+?)(?:,?\s*Company:\s*([^,\n]+))?/gm
      ];
      
      // Extract products using patterns
      productPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(responseContent)) !== null) {
          const name = match[1]?.trim();
          const company = match[2]?.trim();
          const description = match[3]?.trim();
          
          if (name && name.length > 2 && !name.includes('Pick the products') && !name.includes('several product matches')) {
            // Clean up the name and skip instruction text
            const cleanName = name.trim().replace(/\n.*$/, ''); // Remove anything after newline
            
            // Avoid duplicates
            const exists = options.some(opt => 
              opt.name.toLowerCase() === cleanName.toLowerCase() && 
              opt.company?.toLowerCase() === company?.toLowerCase()
            );
            
            if (!exists && cleanName.length > 2) {
              options.push({
                name: cleanName,
                company: company || undefined,
                description: description || undefined,
                id: `${cleanName.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '-')}-${options.length}`
              });
            }
          }
        }
      });
      
      // Extract instructions text
      const instructionPatterns = [
        /please\s+(?:specify|clarify|choose|select)[^.]*\./gi,
        /which\s+(?:product|one)[^?]*\?/gi,
        /there\s+are\s+several[^.]*\./gi
      ];
      
      instructionPatterns.forEach(pattern => {
        const match = responseContent.match(pattern);
        if (match && match[0]) {
          instructions += match[0] + ' ';
        }
      });
      
      console.log('RAG Service: Disambiguation parsing results:', {
        foundOptions: options.length,
        sampleOption: options[0],
        instructions: instructions.substring(0, 100)
      });
      
    } catch (error) {
      console.error('RAG Service: Error parsing disambiguation response:', error);
    }
    
    // Phase 4: Simplified analytics for now to avoid scope issues
    const queryComplexity = this.analyzeQueryComplexity(originalQuery);
    const categories: string[] = []; // Simplified for debugging
    const confidence = Math.min(0.95, Math.max(0.3, options.length > 0 ? 0.8 : 0.3));
    
    // Phase 4: Generate query refinements
    const queryRefinements = {
      suggestedFilters: [],
      relatedTerms: [],
      categoryBreakdown: {}
    };
    
    console.log('RAG Service: Final disambiguation parsing result:', {
      optionsFound: options.length,
      hasInstructions: !!instructions,
      queryComplexity,
      categoriesFound: categories.length,
      confidence
    });
    
    return {
      detected: true,
      options: options.map((option, index) => ({
        ...option,
        // Phase 4: Add enhanced metadata
        relevanceScore: Math.max(0.6, Math.random() * 0.4 + 0.6), // Simulate relevance scoring
        category: categories[index % Math.max(1, categories.length)] || 'Chemical Products'
      })),
      originalQuery,
      instructions: instructions.trim() || 'Please select which product you are interested in:'
    };
  }

  /**
   * Phase 4: Analyze query complexity for enhanced analytics
   */
  private analyzeQueryComplexity(query: string): 'simple' | 'moderate' | 'complex' {
    const words = query.toLowerCase().split(/\s+/);
    const complexTerms = ['specification', 'properties', 'application', 'compatible', 'alternative', 'similar', 'compare', 'versus'];
    const hasComplexTerms = complexTerms.some(term => query.toLowerCase().includes(term));
    const hasMultipleFilters = (query.match(/\band\b|\bor\b|\bwith\b/g) || []).length > 1;
    
    if (words.length <= 3 && !hasComplexTerms) return 'simple';
    if (words.length <= 6 || hasComplexTerms || hasMultipleFilters) return 'moderate';
    return 'complex';
  }

  /**
   * Phase 4: Extract categories from response content
   */
  private extractCategories(text: string): string[] {
    const categoryPatterns = [
      /category[:\s]+([^.\n]+)/gi,
      /type[:\s]+([^.\n]+)/gi,
      /application[:\s]+([^.\n]+)/gi,
      /industry[:\s]+([^.\n]+)/gi,
      /use[:\s]+([^.\n]+)/gi
    ];
    
    const categories = new Set<string>();
    categoryPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        if (match[1]) {
          const category = match[1].trim().toLowerCase().replace(/[^\w\s]/g, '');
          if (category.length > 2 && category.length < 30) {
            categories.add(category);
          }
        }
      }
    });
    
    // Add default categories based on common chemical industry terms
    const defaultCategories = ['adhesives', 'coatings', 'polymers', 'solvents', 'additives', 'surfactants'];
    const queryLower = text.toLowerCase();
    defaultCategories.forEach(cat => {
      if (queryLower.includes(cat)) {
        categories.add(cat);
      }
    });
    
    return Array.from(categories).slice(0, 5); // Limit to 5 categories
  }

  /**
   * Phase 4: Generate query refinement suggestions
   */
  private generateQueryRefinements(originalQuery: string, options: ProductOption[], categories: string[]): any {
    const suggestedFilters: string[] = [];
    const relatedTerms: string[] = [];
    const categoryBreakdown: Record<string, number> = {};
    
    // Generate suggested filters based on options
    const companies = new Set(options.map(opt => opt.company).filter(Boolean));
    if (companies.size > 1) {
      suggestedFilters.push(...Array.from(companies).slice(0, 3).map(c => `by ${c}`));
    }
    
    // Add category-based filters
    categories.forEach(cat => {
      suggestedFilters.push(`${cat} products`);
      categoryBreakdown[cat] = Math.floor(Math.random() * 5) + 1;
    });
    
    // Generate related terms
    const commonRelatedTerms = [
      'specifications', 'applications', 'alternatives', 'similar products',
      'technical data', 'safety data', 'pricing', 'availability'
    ];
    relatedTerms.push(...commonRelatedTerms.slice(0, 4));
    
    return {
      suggestedFilters: suggestedFilters.slice(0, 5),
      relatedTerms,
      categoryBreakdown
    };
  }

  /**
   * Extract product attributes from text using structured parsing
   */
  private extractStructuredAttributes(text: string): ProductAttribute[] {
    const attributes: ProductAttribute[] = [];
    
    // Common patterns for attribute extraction
    const patterns = [
      // "Property: Value" format
      /([A-Za-z\s]+?):\s*([^\n\r]+)/g,
      // "Property = Value" format  
      /([A-Za-z\s]+?)\s*=\s*([^\n\r]+)/g,
      // "Property - Value" format
      /([A-Za-z\s]+?)\s*-\s*([^\n\r]+)/g,
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const name = match[1].trim();
        const value = match[2].trim();
        
        // Skip if already exists or if it's too generic
        if (name.length > 2 && value.length > 0 && 
            !attributes.some(attr => attr.name.toLowerCase() === name.toLowerCase())) {
          attributes.push({ name, value });
        }
      }
    });

    return attributes;
  }

  /**
   * Extract technical specifications from content
   */
  private extractTechnicalSpecs(text: string): ProductAttribute[] {
    const specs: ProductAttribute[] = [];
    
    // Look for common technical specification patterns
    const specPatterns = [
      /(?:melting point|boiling point|density|viscosity|ph|molecular weight|flash point):\s*([^\n\r]+)/gi,
      /(?:cas number|formula|purity|concentration):\s*([^\n\r]+)/gi,
    ];

    specPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const fullMatch = match[0];
        const colonIndex = fullMatch.indexOf(':');
        if (colonIndex > -1) {
          const name = fullMatch.substring(0, colonIndex).trim();
          const value = match[1].trim();
          specs.push({ name, value, category: 'technical' });
        }
      }
    });

    return specs;
  }

  /**
   * Extract applications and features from text
   */
  private extractApplicationsAndFeatures(text: string): { applications: string[]; features: string[] } {
    const applications: string[] = [];
    const features: string[] = [];
    
    // Look for application sections
    const appMatch = text.match(/(?:applications?|uses?):\s*([^.]+(?:\.[^.]*)*)/i);
    if (appMatch) {
      const appText = appMatch[1];
      applications.push(...appText.split(/[,;]/).map(app => app.trim()).filter(app => app.length > 0));
    }
    
    // Look for features sections
    const featureMatch = text.match(/(?:features?|benefits?):\s*([^.]+(?:\.[^.]*)*)/i);
    if (featureMatch) {
      const featureText = featureMatch[1];
      features.push(...featureText.split(/[,;]/).map(feat => feat.trim()).filter(feat => feat.length > 0));
    }
    
    return { applications, features };
  }

  /**
   * Process raw RAG data into structured product information
   */
  private processProductData(rawData: any): ProcessedProductData[] {
    if (!rawData || !rawData.result || !Array.isArray(rawData.result)) {
      return [];
    }

    return rawData.result.map((item: any) => {
      const content = item.content || item.text || '';
      const metadata = item.metadata || {};
      
      // Extract basic product info
      const productName = metadata.product_name || this.extractProductName(content);
      const principal = metadata.principal || metadata.manufacturer || this.extractPrincipal(content);
      
      // Extract structured attributes
      const attributes = this.extractStructuredAttributes(content);
      const technicalSpecs = this.extractTechnicalSpecs(content);
      
      // Extract applications and features
      const { applications, features } = this.extractApplicationsAndFeatures(content);
      
      // Clean descriptive text by removing structured data patterns
      let descriptiveText = content
        .replace(/([A-Za-z\s]+?):\s*([^\n\r]+)/g, '')
        .replace(/([A-Za-z\s]+?)\s*=\s*([^\n\r]+)/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      return {
        productName,
        principal,
        attributes,
        technicalSpecs,
        applications,
        features,
        descriptiveText: descriptiveText || content.substring(0, 500) + '...'
      };
    });
  }

  /**
   * Extract product name from content
   */
  private extractProductName(content: string): string {
    const patterns = [
      /product name:\s*([^\n\r]+)/i,
      /product:\s*([^\n\r]+)/i,
      /(?:^|\n)([A-Z][A-Z0-9\s-]+?)(?:\n|$)/
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return 'Unknown Product';
  }

  /**
   * Extract principal/manufacturer from content
   */
  private extractPrincipal(content: string): string {
    const patterns = [
      /(?:principal|manufacturer|company):\s*([^\n\r]+)/i,
      /(?:made by|produced by|from):\s*([^\n\r]+)/i,
      // Extract from document names that contain company information
      /Document:\s*[^-]*-\s*([A-Za-z]+)\s+[^\n]*/i,
      // Extract Evonik from various contexts
      /\bEvonik\b/i,
      // Extract from safety data sheet patterns
      /Document:\s*[^(]*\(([^)]+)\)/i,
      // Extract from confidential document patterns
      /Confidential\s*-\s*([A-Za-z]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        const extracted = match[1].trim();
        // Filter out generic terms and prefer specific company names
        if (extracted && extracted.length > 2 && 
            !['Product', 'Safety', 'Data', 'Sheet', 'Information', 'Guide'].includes(extracted)) {
          return extracted;
        }
      }
    }
    
    // Special case: look for Evonik specifically as it's a major chemical company
    if (content.includes('Evonik')) {
      return 'Evonik Corporation';
    }
    
    return 'Unknown Company';
  }

  /**
   * Enhanced search with content processing and product data extraction
   */
  public async searchWithProcessing(query: RagQuery): Promise<RagSearchResult & {
    processedContent?: string;
    sources?: string[];
    averageScore?: number;
    productCount?: number;
  }> {
    const result = await this.search(query);
    
    if (!result.success || !result.data?.result) {
      return result;
    }

    // Process product data using hybrid approach
    const processedProductData = this.processProductData(result.data);
    
    // Add processed product data to result
    const enhancedResult = {
      ...result,
      processedProductData
    };

    const processed = this.processRagContent(result.data.result);
    
    return {
      ...enhancedResult,
      processedContent: processed.formattedContent,
      sources: processed.sources,
      averageScore: processed.totalScore,
      productCount: processed.productCount
    };
  }

  /**
   * Test the RAG API connection
   */
  public async testConnection(): Promise<RagSearchResult> {
    return this.search({
      message: 'What adhesion promoters are available?'
    });
  }

  /**
   * Clear cache (for testing or maintenance)
   */
  public clearCache(): void {
    this.cache.clear();
    console.log('RAG Service: Cache cleared');
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const ragService = new RagService();