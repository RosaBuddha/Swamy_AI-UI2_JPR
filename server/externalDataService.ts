import fetch from 'node-fetch';
import { storage } from './storage';
import type { Product, ProductSource, ExternalProductCache } from '@shared/schema';

export interface ExternalProductData {
  name: string;
  casNumber?: string;
  chemicalName?: string;
  manufacturer?: string;
  molecularFormula?: string;
  molecularWeight?: number;
  synonyms?: string[];
  properties?: Record<string, any>;
  safetyData?: Record<string, any>;
  source: string;
  sourceId: string;
  confidence: number;
}

export interface ReplacementCriteria {
  chemicalClass?: string;
  functionalGroups?: string[];
  molecularWeightRange?: { min: number; max: number };
  boilingPointRange?: { min: number; max: number };
  solubilityRequirements?: string[];
  safetyProfile?: string;
  regulatoryStatus?: string[];
  excludedSubstances?: string[];
}

export class ExternalDataService {
  private readonly CACHE_DURATION_HOURS = 24;
  
  constructor() {}

  /**
   * Search for products across multiple external databases
   */
  async searchExternalProducts(query: string, limit: number = 10): Promise<ExternalProductData[]> {
    const results: ExternalProductData[] = [];
    
    // Check cache first
    const cachedResults = await this.getCachedResults(query);
    if (cachedResults.length > 0) {
      return cachedResults.slice(0, limit);
    }

    // Search across multiple sources in parallel
    const searchPromises = [
      this.searchPubChem(query),
      this.searchChemSpider(query),
      this.searchManufacturerDatabases(query)
    ];

    try {
      const results = await Promise.allSettled(searchPromises);
      const allProducts: ExternalProductData[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          allProducts.push(...result.value);
        } else {
          console.warn(`External search ${index} failed:`, result.reason);
        }
      });

      // Deduplicate and sort by confidence
      const uniqueProducts = this.deduplicateProducts(allProducts);
      const sortedProducts = uniqueProducts
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, limit);

      // Cache results
      await this.cacheResults(query, sortedProducts);

      return sortedProducts;
    } catch (error) {
      console.error('External product search failed:', error);
      return [];
    }
  }

  /**
   * Find product replacements based on criteria
   */
  async findReplacements(
    originalProduct: Product,
    criteria: ReplacementCriteria,
    maxResults: number = 20
  ): Promise<ExternalProductData[]> {
    // Build comprehensive search queries based on product characteristics
    const searchQueries = this.buildSearchQueries(originalProduct, criteria);
    
    const allReplacements: ExternalProductData[] = [];
    
    for (const query of searchQueries) {
      const products = await this.searchExternalProducts(query, 10);
      allReplacements.push(...products);
    }

    // Filter and score replacements based on criteria
    const scoredReplacements = this.scoreReplacements(
      originalProduct,
      allReplacements,
      criteria
    );

    return scoredReplacements
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, maxResults);
  }

  /**
   * Search PubChem database
   */
  private async searchPubChem(query: string): Promise<ExternalProductData[]> {
    try {
      // Search by name first
      const searchUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(query)}/property/MolecularFormula,MolecularWeight,IUPACName/JSON`;
      
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'ProductReplacementApp/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`PubChem API error: ${response.status}`);
      }

      const data = await response.json() as any;
      const compounds = data?.PropertyTable?.Properties || [];

      return compounds.map((compound: any) => ({
        name: compound.IUPACName || query,
        casNumber: compound.CID ? `CID-${compound.CID}` : undefined,
        chemicalName: compound.IUPACName,
        molecularFormula: compound.MolecularFormula,
        molecularWeight: compound.MolecularWeight,
        source: 'PubChem',
        sourceId: compound.CID?.toString() || '',
        confidence: 0.8,
        properties: {
          cid: compound.CID,
          molecularFormula: compound.MolecularFormula,
          molecularWeight: compound.MolecularWeight
        }
      }));
    } catch (error) {
      console.warn('PubChem search failed:', error);
      return [];
    }
  }

  /**
   * Search ChemSpider database
   */
  private async searchChemSpider(query: string): Promise<ExternalProductData[]> {
    const apiKey = process.env.CHEMSPIDER_API_KEY;
    if (!apiKey) {
      console.warn('ChemSpider API key not configured');
      return [];
    }

    try {
      const searchUrl = `https://api.rsc.org/compounds/v1/filter/name`;
      
      const response = await fetch(searchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey
        },
        body: JSON.stringify({
          name: query,
          orderBy: 'recordId',
          orderDirection: 'ascending'
        })
      });

      if (!response.ok) {
        throw new Error(`ChemSpider API error: ${response.status}`);
      }

      const data = await response.json() as any;
      const results = data?.results || [];

      return results.slice(0, 10).map((result: any) => ({
        name: result.name || query,
        casNumber: result.rn,
        chemicalName: result.name,
        molecularFormula: result.formula,
        molecularWeight: result.averageMass,
        synonyms: result.synonyms || [],
        source: 'ChemSpider',
        sourceId: result.id?.toString() || '',
        confidence: 0.85,
        properties: {
          chemSpiderId: result.id,
          formula: result.formula,
          averageMass: result.averageMass,
          monoisotopicMass: result.monoisotopicMass
        }
      }));
    } catch (error) {
      console.warn('ChemSpider search failed:', error);
      return [];
    }
  }

  /**
   * Search manufacturer databases and catalogs
   */
  private async searchManufacturerDatabases(query: string): Promise<ExternalProductData[]> {
    // This would integrate with major chemical manufacturers' databases
    // For now, we'll implement a framework for future expansion
    const manufacturers = [
      { name: 'BASF', baseUrl: 'https://www.basf.com/global/en/products' },
      { name: 'DuPont', baseUrl: 'https://www.dupont.com/products' },
      { name: 'Dow', baseUrl: 'https://www.dow.com/en-us/market-and-products' }
    ];

    // This is a placeholder for manufacturer-specific API integrations
    // Each manufacturer would require specific API endpoints and authentication
    console.log(`Manufacturer search for "${query}" - integration pending`);
    
    return [];
  }

  /**
   * Build search queries based on product characteristics and criteria
   */
  private buildSearchQueries(product: Product, criteria: ReplacementCriteria): string[] {
    const queries: string[] = [];
    
    // Primary queries based on product information
    if (product.chemicalName) {
      queries.push(product.chemicalName);
    }
    
    if (product.casNumber) {
      queries.push(product.casNumber);
    }

    // Category-based queries
    if (product.category) {
      queries.push(product.category);
    }

    // Criteria-based queries
    if (criteria.chemicalClass) {
      queries.push(criteria.chemicalClass);
    }

    if (criteria.functionalGroups) {
      queries.push(...criteria.functionalGroups);
    }

    return queries.filter(q => q && q.length > 0);
  }

  /**
   * Score replacement candidates based on similarity to original product
   */
  private scoreReplacements(
    original: Product,
    candidates: ExternalProductData[],
    criteria: ReplacementCriteria
  ): ExternalProductData[] {
    return candidates.map(candidate => {
      let score = candidate.confidence;

      // Boost score for matching criteria
      if (criteria.chemicalClass && candidate.chemicalName?.toLowerCase().includes(criteria.chemicalClass.toLowerCase())) {
        score += 0.2;
      }

      // Molecular weight similarity
      if (criteria.molecularWeightRange && candidate.molecularWeight) {
        const { min, max } = criteria.molecularWeightRange;
        if (candidate.molecularWeight >= min && candidate.molecularWeight <= max) {
          score += 0.15;
        }
      }

      // Safety profile matching
      if (criteria.safetyProfile && candidate.safetyData) {
        score += 0.1;
      }

      // Penalty for excluded substances
      if (criteria.excludedSubstances?.some(excluded => 
        candidate.name.toLowerCase().includes(excluded.toLowerCase()) ||
        candidate.chemicalName?.toLowerCase().includes(excluded.toLowerCase())
      )) {
        score -= 0.3;
      }

      return {
        ...candidate,
        confidence: Math.min(1.0, Math.max(0.0, score))
      };
    });
  }

  /**
   * Deduplicate products based on CAS number or chemical name
   */
  private deduplicateProducts(products: ExternalProductData[]): ExternalProductData[] {
    const seen = new Set<string>();
    const unique: ExternalProductData[] = [];

    for (const product of products) {
      const key = product.casNumber || product.chemicalName || product.name;
      if (!seen.has(key.toLowerCase())) {
        seen.add(key.toLowerCase());
        unique.push(product);
      }
    }

    return unique;
  }

  /**
   * Get cached search results
   */
  private async getCachedResults(query: string): Promise<ExternalProductData[]> {
    try {
      const cached = await storage.getCachedExternalData(query);
      if (cached && this.isCacheValid(cached.createdAt)) {
        return JSON.parse(cached.productData);
      }
    } catch (error) {
      console.warn('Failed to retrieve cached results:', error);
    }
    return [];
  }

  /**
   * Cache search results
   */
  private async cacheResults(query: string, results: ExternalProductData[]): Promise<void> {
    try {
      const source = await storage.getProductSourceByName('External APIs');
      if (source) {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + this.CACHE_DURATION_HOURS);

        await storage.cacheExternalData(
          query,
          source.id,
          JSON.stringify(results),
          expiresAt
        );
      }
    } catch (error) {
      console.warn('Failed to cache results:', error);
    }
  }

  /**
   * Check if cached data is still valid
   */
  private isCacheValid(createdAt: string | Date): boolean {
    const created = new Date(createdAt);
    const now = new Date();
    const hoursDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
    return hoursDiff < this.CACHE_DURATION_HOURS;
  }

  /**
   * Get detailed product information from external sources
   */
  async getProductDetails(sourceId: string, source: string): Promise<ExternalProductData | null> {
    switch (source.toLowerCase()) {
      case 'pubchem':
        return this.getPubChemDetails(sourceId);
      case 'chemspider':
        return this.getChemSpiderDetails(sourceId);
      default:
        return null;
    }
  }

  private async getPubChemDetails(cid: string): Promise<ExternalProductData | null> {
    try {
      const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/property/MolecularFormula,MolecularWeight,IUPACName,CanonicalSMILES/JSON`;
      
      const response = await fetch(url);
      if (!response.ok) return null;

      const data = await response.json() as any;
      const compound = data?.PropertyTable?.Properties?.[0];
      
      if (!compound) return null;

      return {
        name: compound.IUPACName,
        chemicalName: compound.IUPACName,
        molecularFormula: compound.MolecularFormula,
        molecularWeight: compound.MolecularWeight,
        source: 'PubChem',
        sourceId: cid,
        confidence: 0.9,
        properties: {
          cid: compound.CID,
          canonicalSMILES: compound.CanonicalSMILES,
          molecularFormula: compound.MolecularFormula,
          molecularWeight: compound.MolecularWeight
        }
      };
    } catch (error) {
      console.warn('Failed to get PubChem details:', error);
      return null;
    }
  }

  private async getChemSpiderDetails(recordId: string): Promise<ExternalProductData | null> {
    const apiKey = process.env.CHEMSPIDER_API_KEY;
    if (!apiKey) return null;

    try {
      const url = `https://api.rsc.org/compounds/v1/records/${recordId}/details`;
      
      const response = await fetch(url, {
        headers: {
          'apikey': apiKey
        }
      });

      if (!response.ok) return null;

      const data = await response.json() as any;
      
      return {
        name: data.commonName || data.systematicName,
        casNumber: data.rn,
        chemicalName: data.systematicName,
        molecularFormula: data.formula,
        molecularWeight: data.averageMass,
        synonyms: data.synonyms || [],
        source: 'ChemSpider',
        sourceId: recordId,
        confidence: 0.9,
        properties: {
          chemSpiderId: recordId,
          formula: data.formula,
          averageMass: data.averageMass,
          monoisotopicMass: data.monoisotopicMass,
          smiles: data.smiles
        }
      };
    } catch (error) {
      console.warn('Failed to get ChemSpider details:', error);
      return null;
    }
  }
}

export const externalDataService = new ExternalDataService();