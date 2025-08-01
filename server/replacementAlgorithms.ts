/**
 * Phase 3: Advanced Replacement Algorithms
 * 
 * This module implements sophisticated algorithms for finding and ranking
 * chemical product replacements based on multiple criteria including:
 * - Chemical similarity (CAS numbers, molecular structure)
 * - Functional compatibility (applications, properties)
 * - Performance characteristics (specifications, quality metrics)
 * - Availability and sourcing (supply chain, cost factors)
 */

import type { Product, ReplacementRequest } from "@shared/schema";

export interface ReplacementCriteria {
  chemicalClass?: string;
  applications?: string[];
  functionalGroups?: string[];
  physicalProperties?: Record<string, any>;
  performanceRequirements?: Record<string, any>;
  excludedSubstances?: string[];
  regulatoryConstraints?: string[];
  costConstraints?: {
    maxPriceIncrease?: number; // percentage
    preferLowerCost?: boolean;
  };
  supplyChainRequirements?: {
    preferredRegions?: string[];
    minSuppliers?: number;
    sustainabilityRating?: number;
  };
}

export interface ReplacementScore {
  overall: number; // 0-100
  breakdown: {
    chemicalSimilarity: number;
    functionalCompatibility: number;
    performanceMatch: number;
    availability: number;
    costEffectiveness: number;
    sustainability: number;
  };
  confidence: number; // 0-1
  reasoning: string[];
}

export interface ReplacementCandidate {
  product: Product;
  score: ReplacementScore;
  metadata: {
    matchType: 'exact' | 'similar' | 'functional' | 'alternative';
    riskLevel: 'low' | 'medium' | 'high';
    implementationComplexity: 'simple' | 'moderate' | 'complex';
    regulatoryStatus: 'approved' | 'pending' | 'restricted';
  };
}

/**
 * Advanced Chemical Similarity Algorithm
 * Uses CAS number analysis, molecular structure comparison, and chemical classification
 */
export class ChemicalSimilarityEngine {
  
  /**
   * Calculate chemical similarity between two products
   */
  calculateSimilarity(original: Product, candidate: Product): number {
    let similarity = 0;
    let factors = 0;

    // CAS number similarity (highest weight)
    if (original.casNumber && candidate.casNumber) {
      similarity += this.compareCasNumbers(original.casNumber, candidate.casNumber) * 0.4;
      factors += 0.4;
    }

    // Chemical name similarity
    if (original.chemicalName && candidate.chemicalName) {
      similarity += this.compareChemicalNames(original.chemicalName, candidate.chemicalName) * 0.3;
      factors += 0.3;
    }

    // Category similarity
    if (original.category && candidate.category) {
      similarity += (original.category === candidate.category ? 1 : 0.5) * 0.2;
      factors += 0.2;
    }

    // Name similarity (fallback)
    similarity += this.compareProductNames(original.name, candidate.name) * 0.1;
    factors += 0.1;

    return factors > 0 ? similarity / factors * 100 : 0;
  }

  private compareCasNumbers(cas1: string, cas2: string): number {
    if (cas1 === cas2) return 1.0;
    
    // Extract base structure (first part before dash)
    const base1 = cas1.split('-')[0];
    const base2 = cas2.split('-')[0];
    
    if (base1 === base2) return 0.8;
    
    // Similar structure patterns
    if (Math.abs(base1.length - base2.length) <= 1) {
      const commonDigits = this.countCommonDigits(base1, base2);
      return commonDigits / Math.max(base1.length, base2.length) * 0.6;
    }
    
    return 0;
  }

  private compareChemicalNames(name1: string, name2: string): number {
    const normalized1 = name1.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalized2 = name2.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    if (normalized1 === normalized2) return 1.0;
    
    // Check for common chemical prefixes/suffixes
    const commonTerms = ['acid', 'alcohol', 'ether', 'ester', 'oxide', 'sulfate', 'chloride'];
    let commonCount = 0;
    
    for (const term of commonTerms) {
      if (normalized1.includes(term) && normalized2.includes(term)) {
        commonCount++;
      }
    }
    
    return commonCount > 0 ? Math.min(commonCount * 0.3, 0.9) : 0;
  }

  private compareProductNames(name1: string, name2: string): number {
    const words1 = name1.toLowerCase().split(/\s+/);
    const words2 = name2.toLowerCase().split(/\s+/);
    
    const commonWords = words1.filter(word => words2.includes(word));
    const totalWords = Math.max(words1.length, words2.length);
    
    return commonWords.length / totalWords;
  }

  private countCommonDigits(str1: string, str2: string): number {
    let common = 0;
    const minLength = Math.min(str1.length, str2.length);
    
    for (let i = 0; i < minLength; i++) {
      if (str1[i] === str2[i]) common++;
    }
    
    return common;
  }
}

/**
 * Functional Compatibility Engine
 * Analyzes application compatibility and functional requirements
 */
export class FunctionalCompatibilityEngine {
  
  calculateCompatibility(criteria: ReplacementCriteria, candidate: Product): number {
    let compatibility = 0;
    let factors = 0;

    // Application compatibility
    if (criteria.applications && criteria.applications.length > 0) {
      compatibility += this.assessApplicationCompatibility(criteria.applications, candidate) * 0.4;
      factors += 0.4;
    }

    // Functional group compatibility
    if (criteria.functionalGroups && criteria.functionalGroups.length > 0) {
      compatibility += this.assessFunctionalGroups(criteria.functionalGroups, candidate) * 0.3;
      factors += 0.3;
    }

    // Physical properties match
    if (criteria.physicalProperties) {
      compatibility += this.assessPhysicalProperties(criteria.physicalProperties, candidate) * 0.3;
      factors += 0.3;
    }

    return factors > 0 ? compatibility / factors * 100 : 70; // Default moderate compatibility
  }

  private assessApplicationCompatibility(requiredApps: string[], candidate: Product): number {
    // Extract applications from product description and category
    const candidateApps = this.extractApplications(candidate);
    
    let matches = 0;
    for (const reqApp of requiredApps) {
      if (candidateApps.some(candApp => 
        candApp.toLowerCase().includes(reqApp.toLowerCase()) ||
        reqApp.toLowerCase().includes(candApp.toLowerCase())
      )) {
        matches++;
      }
    }
    
    return matches / requiredApps.length;
  }

  private assessFunctionalGroups(requiredGroups: string[], candidate: Product): number {
    const candidateGroups = this.extractFunctionalGroups(candidate);
    
    let matches = 0;
    for (const reqGroup of requiredGroups) {
      if (candidateGroups.includes(reqGroup.toLowerCase())) {
        matches++;
      }
    }
    
    return requiredGroups.length > 0 ? matches / requiredGroups.length : 0.5;
  }

  private assessPhysicalProperties(requiredProps: Record<string, any>, candidate: Product): number {
    // This would integrate with external property databases in a full implementation
    // For now, return moderate compatibility based on category similarity
    return 0.6;
  }

  private extractApplications(product: Product): string[] {
    const applications: string[] = [];
    
    // Extract from description
    if (product.description) {
      const desc = product.description.toLowerCase();
      const appKeywords = ['cosmetic', 'industrial', 'pharmaceutical', 'food', 'textile', 'automotive', 'coating'];
      
      for (const keyword of appKeywords) {
        if (desc.includes(keyword)) {
          applications.push(keyword);
        }
      }
    }
    
    // Add category as application
    if (product.category) {
      applications.push(product.category.toLowerCase());
    }
    
    return applications;
  }

  private extractFunctionalGroups(product: Product): string[] {
    const groups: string[] = [];
    
    if (product.chemicalName) {
      const name = product.chemicalName.toLowerCase();
      const groupKeywords = ['acid', 'alcohol', 'ester', 'ether', 'aldehyde', 'ketone', 'amine'];
      
      for (const group of groupKeywords) {
        if (name.includes(group)) {
          groups.push(group);
        }
      }
    }
    
    return groups;
  }
}

/**
 * Performance Matching Engine
 * Evaluates technical specifications and performance characteristics
 */
export class PerformanceMatchingEngine {
  
  calculatePerformanceMatch(criteria: ReplacementCriteria, candidate: Product): number {
    let performance = 0;
    let factors = 0;

    // Performance requirements matching
    if (criteria.performanceRequirements) {
      performance += this.assessPerformanceRequirements(criteria.performanceRequirements, candidate) * 0.6;
      factors += 0.6;
    }

    // Quality indicators
    performance += this.assessQualityIndicators(candidate) * 0.4;
    factors += 0.4;

    return factors > 0 ? performance / factors * 100 : 60;
  }

  private assessPerformanceRequirements(requirements: Record<string, any>, candidate: Product): number {
    // In a full implementation, this would compare technical specifications
    // For now, use manufacturer reputation as proxy
    const reputableManufacturers = ['BASF', 'Dow', 'DuPont', 'Evonik', 'Clariant', 'Huntsman'];
    
    if (candidate.manufacturer && reputableManufacturers.includes(candidate.manufacturer)) {
      return 0.8;
    }
    
    return 0.6;
  }

  private assessQualityIndicators(candidate: Product): number {
    let quality = 0.5; // Base quality score
    
    // Product number indicates standardized product
    if (candidate.productNumber) {
      quality += 0.2;
    }
    
    // Complete chemical information indicates quality
    if (candidate.casNumber && candidate.chemicalName) {
      quality += 0.2;
    }
    
    // Detailed description indicates quality
    if (candidate.description && candidate.description.length > 50) {
      quality += 0.1;
    }
    
    return Math.min(quality, 1.0);
  }
}

/**
 * Main Replacement Algorithm Engine
 * Orchestrates all scoring engines and provides final rankings
 */
export class ReplacementAlgorithmEngine {
  private chemicalEngine: ChemicalSimilarityEngine;
  private functionalEngine: FunctionalCompatibilityEngine;
  private performanceEngine: PerformanceMatchingEngine;

  constructor() {
    this.chemicalEngine = new ChemicalSimilarityEngine();
    this.functionalEngine = new FunctionalCompatibilityEngine();
    this.performanceEngine = new PerformanceMatchingEngine();
  }

  /**
   * Generate replacement candidates with comprehensive scoring
   */
  async generateReplacementCandidates(
    originalProduct: Product,
    candidates: Product[],
    criteria: ReplacementCriteria,
    request: ReplacementRequest
  ): Promise<ReplacementCandidate[]> {
    
    const scoredCandidates: ReplacementCandidate[] = [];

    for (const candidate of candidates) {
      // Skip if excluded
      if (this.isExcluded(candidate, criteria)) {
        continue;
      }

      const score = await this.calculateComprehensiveScore(
        originalProduct,
        candidate,
        criteria
      );

      const metadata = this.generateMetadata(originalProduct, candidate, score);

      scoredCandidates.push({
        product: candidate,
        score,
        metadata
      });
    }

    // Sort by overall score (descending)
    return scoredCandidates.sort((a, b) => b.score.overall - a.score.overall);
  }

  private async calculateComprehensiveScore(
    original: Product,
    candidate: Product,
    criteria: ReplacementCriteria
  ): Promise<ReplacementScore> {
    
    const chemicalSimilarity = this.chemicalEngine.calculateSimilarity(original, candidate);
    const functionalCompatibility = this.functionalEngine.calculateCompatibility(criteria, candidate);
    const performanceMatch = this.performanceEngine.calculatePerformanceMatch(criteria, candidate);
    
    // Additional scoring components
    const availability = this.assessAvailability(candidate);
    const costEffectiveness = this.assessCostEffectiveness(candidate, criteria);
    const sustainability = this.assessSustainability(candidate);

    // Weighted overall score
    const weights = {
      chemical: 0.25,
      functional: 0.25,
      performance: 0.20,
      availability: 0.15,
      cost: 0.10,
      sustainability: 0.05
    };

    const overall = 
      chemicalSimilarity * weights.chemical +
      functionalCompatibility * weights.functional +
      performanceMatch * weights.performance +
      availability * weights.availability +
      costEffectiveness * weights.cost +
      sustainability * weights.sustainability;

    const confidence = this.calculateConfidence(original, candidate);
    const reasoning = this.generateReasoning(original, candidate, {
      chemicalSimilarity,
      functionalCompatibility,
      performanceMatch,
      availability,
      costEffectiveness,
      sustainability
    });

    return {
      overall: Math.round(overall),
      breakdown: {
        chemicalSimilarity: Math.round(chemicalSimilarity),
        functionalCompatibility: Math.round(functionalCompatibility),
        performanceMatch: Math.round(performanceMatch),
        availability: Math.round(availability),
        costEffectiveness: Math.round(costEffectiveness),
        sustainability: Math.round(sustainability)
      },
      confidence,
      reasoning
    };
  }

  private isExcluded(candidate: Product, criteria: ReplacementCriteria): boolean {
    if (!criteria.excludedSubstances) return false;
    
    const candidateText = `${candidate.name} ${candidate.chemicalName} ${candidate.description}`.toLowerCase();
    
    return criteria.excludedSubstances.some(excluded => 
      candidateText.includes(excluded.toLowerCase())
    );
  }

  private assessAvailability(candidate: Product): number {
    let availability = 60; // Base availability score
    
    // Active products are more available
    if (candidate.isActive) {
      availability += 20;
    }
    
    // Products with product numbers typically have better availability
    if (candidate.productNumber) {
      availability += 15;
    }
    
    // Well-known manufacturers typically have better availability
    if (candidate.manufacturer) {
      availability += 5;
    }
    
    return Math.min(availability, 100);
  }

  private assessCostEffectiveness(candidate: Product, criteria: ReplacementCriteria): number {
    // In a full implementation, this would integrate with pricing APIs
    // For now, use heuristics based on manufacturer and product type
    
    let cost = 70; // Base cost score
    
    if (criteria.costConstraints?.preferLowerCost) {
      // Favor industrial-grade over specialty chemicals
      if (candidate.category?.toLowerCase().includes('industrial')) {
        cost += 15;
      }
    }
    
    return cost;
  }

  private assessSustainability(candidate: Product): number {
    // Basic sustainability assessment based on available data
    let sustainability = 50; // Base score
    
    // Bio-based or green chemistry indicators
    const sustainableKeywords = ['bio', 'renewable', 'green', 'sustainable', 'eco'];
    const productText = `${candidate.name} ${candidate.description}`.toLowerCase();
    
    for (const keyword of sustainableKeywords) {
      if (productText.includes(keyword)) {
        sustainability += 15;
        break;
      }
    }
    
    return Math.min(sustainability, 100);
  }

  private calculateConfidence(original: Product, candidate: Product): number {
    let confidence = 0.5; // Base confidence
    
    // Higher confidence with more complete data
    if (original.casNumber && candidate.casNumber) confidence += 0.2;
    if (original.chemicalName && candidate.chemicalName) confidence += 0.1;
    if (candidate.description && candidate.description.length > 30) confidence += 0.1;
    if (candidate.manufacturer) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  private generateReasoning(
    original: Product, 
    candidate: Product, 
    scores: Record<string, number>
  ): string[] {
    const reasoning: string[] = [];
    
    if (scores.chemicalSimilarity > 80) {
      reasoning.push(`High chemical similarity (${Math.round(scores.chemicalSimilarity)}%) - excellent structural match`);
    } else if (scores.chemicalSimilarity > 60) {
      reasoning.push(`Good chemical similarity (${Math.round(scores.chemicalSimilarity)}%) - compatible structure`);
    }
    
    if (scores.functionalCompatibility > 80) {
      reasoning.push(`Excellent functional compatibility - same application areas`);
    }
    
    if (scores.performanceMatch > 80) {
      reasoning.push(`High performance match - meets technical requirements`);
    }
    
    if (scores.availability > 80) {
      reasoning.push(`Good availability from established supplier`);
    }
    
    if (reasoning.length === 0) {
      reasoning.push(`Moderate compatibility - requires evaluation for specific use case`);
    }
    
    return reasoning;
  }

  private generateMetadata(
    original: Product,
    candidate: Product,
    score: ReplacementScore
  ): ReplacementCandidate['metadata'] {
    
    let matchType: 'exact' | 'similar' | 'functional' | 'alternative' = 'alternative';
    
    if (score.breakdown.chemicalSimilarity > 90) {
      matchType = 'exact';
    } else if (score.breakdown.chemicalSimilarity > 70) {
      matchType = 'similar';
    } else if (score.breakdown.functionalCompatibility > 80) {
      matchType = 'functional';
    }
    
    const riskLevel = score.overall > 80 ? 'low' : score.overall > 60 ? 'medium' : 'high';
    const implementationComplexity = matchType === 'exact' ? 'simple' : 
                                   matchType === 'similar' ? 'moderate' : 'complex';
    
    return {
      matchType,
      riskLevel,
      implementationComplexity,
      regulatoryStatus: 'approved' // Default - would integrate with regulatory databases
    };
  }
}