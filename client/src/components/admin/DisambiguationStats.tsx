import React from 'react';
import { TrendingUp, Clock, Users, BarChart3 } from 'lucide-react';

interface DisambiguationStatsProps {
  stats: {
    totalDisambiguations: number;
    averageSelectionTime: number;
    topCategories: Array<{ name: string; count: number }>;
    queryComplexityDistribution: {
      simple: number;
      moderate: number;
      complex: number;
    };
  };
}

/**
 * Phase 4: Disambiguation statistics component for admin interface
 */
export function DisambiguationStats({ stats }: DisambiguationStatsProps) {
  const totalQueries = Object.values(stats.queryComplexityDistribution).reduce((a, b) => a + b, 0);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <BarChart3 className="w-5 h-5" />
        Disambiguation Analytics
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Disambiguations */}
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-700">Total Disambiguations</span>
          </div>
          <div className="text-2xl font-bold text-orange-900">{stats.totalDisambiguations}</div>
        </div>
        
        {/* Average Selection Time */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">Avg Selection Time</span>
          </div>
          <div className="text-2xl font-bold text-blue-900">{stats.averageSelectionTime}s</div>
        </div>
        
        {/* Top Category */}
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">Top Category</span>
          </div>
          <div className="text-lg font-bold text-green-900">
            {stats.topCategories[0]?.name || 'N/A'}
          </div>
          <div className="text-sm text-green-600">
            {stats.topCategories[0]?.count || 0} queries
          </div>
        </div>
        
        {/* Complex Queries */}
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-700">Complex Queries</span>
          </div>
          <div className="text-2xl font-bold text-purple-900">
            {Math.round((stats.queryComplexityDistribution.complex / totalQueries) * 100)}%
          </div>
        </div>
      </div>
      
      {/* Query Complexity Distribution */}
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-800 mb-3">Query Complexity Distribution</h4>
        <div className="space-y-2">
          {Object.entries(stats.queryComplexityDistribution).map(([complexity, count]) => (
            <div key={complexity} className="flex items-center gap-3">
              <span className="w-20 text-sm text-gray-600 capitalize">{complexity}:</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-full rounded-full ${
                    complexity === 'simple' ? 'bg-green-500' :
                    complexity === 'moderate' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${totalQueries > 0 ? (count / totalQueries) * 100 : 0}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-900 w-8">{count}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Top Categories */}
      <div>
        <h4 className="text-md font-medium text-gray-800 mb-3">Top Categories</h4>
        <div className="space-y-2">
          {stats.topCategories.slice(0, 5).map((category, index) => (
            <div key={category.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center justify-center">
                  {index + 1}
                </span>
                <span className="text-sm text-gray-700">{category.name}</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{category.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}