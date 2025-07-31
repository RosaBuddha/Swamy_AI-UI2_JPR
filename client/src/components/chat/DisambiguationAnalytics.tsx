import React from 'react';
import { DisambiguationData } from '@shared/schema';
import { BarChart3, Clock, Filter, TrendingUp } from 'lucide-react';

interface DisambiguationAnalyticsProps {
  disambiguationData: DisambiguationData;
}

/**
 * Phase 4: Advanced disambiguation analytics component
 * Displays search metadata, query complexity analysis, and refinement suggestions
 */
export function DisambiguationAnalytics({ disambiguationData }: DisambiguationAnalyticsProps) {
  const { searchMetadata, queryRefinements } = disambiguationData;

  if (!searchMetadata && !queryRefinements) {
    return null;
  }

  return (
    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h4 className="flex items-center gap-2 font-medium text-blue-900 mb-3">
        <BarChart3 className="w-4 h-4" />
        Search Analytics
      </h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Search Metadata */}
        {searchMetadata && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-700">Total Matches:</span>
              <span className="font-medium">{searchMetadata.totalMatches}</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-700">Query Complexity:</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                searchMetadata.queryComplexity === 'simple' ? 'bg-green-100 text-green-700' :
                searchMetadata.queryComplexity === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {searchMetadata.queryComplexity}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-700 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Search Time:
              </span>
              <span className="font-medium">{searchMetadata.searchTime}ms</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-700 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Confidence:
              </span>
              <span className="font-medium">{Math.round(searchMetadata.confidence * 100)}%</span>
            </div>
            
            {searchMetadata.categories.length > 0 && (
              <div className="text-sm">
                <span className="text-blue-700">Categories:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {searchMetadata.categories.map((category, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      {category}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Query Refinements */}
        {queryRefinements && (
          <div className="space-y-2">
            <h5 className="flex items-center gap-1 text-sm font-medium text-blue-900">
              <Filter className="w-3 h-3" />
              Refinement Suggestions
            </h5>
            
            {queryRefinements.suggestedFilters.length > 0 && (
              <div className="text-sm">
                <span className="text-blue-700">Suggested Filters:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {queryRefinements.suggestedFilters.map((filter, index) => (
                    <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs cursor-pointer hover:bg-purple-200">
                      {filter}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {queryRefinements.relatedTerms.length > 0 && (
              <div className="text-sm">
                <span className="text-blue-700">Related Terms:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {queryRefinements.relatedTerms.map((term, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs cursor-pointer hover:bg-gray-200">
                      {term}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {Object.keys(queryRefinements.categoryBreakdown).length > 0 && (
              <div className="text-sm">
                <span className="text-blue-700">Category Distribution:</span>
                <div className="mt-1 space-y-1">
                  {Object.entries(queryRefinements.categoryBreakdown).map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">{category}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 rounded">
                          <div 
                            className="h-full bg-blue-500 rounded" 
                            style={{ width: `${(count / Math.max(...Object.values(queryRefinements.categoryBreakdown))) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium w-6">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}