import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Chip } from '../ui/Chip';
import { CheckCircle, Building2, Package, ArrowRight, BarChart3 } from 'lucide-react';
import { DisambiguationData, ProductOption } from '@shared/schema';
import { DisambiguationAnalytics } from './DisambiguationAnalytics';
import { EnhancedProductCard } from './EnhancedProductCard';

interface DisambiguationInterfaceProps {
  disambiguationData: DisambiguationData;
  onProductSelect: (option: ProductOption) => void;
  onRefineQuery: () => void;
  isLoading?: boolean;
}

export function DisambiguationInterface({ 
  disambiguationData, 
  onProductSelect, 
  onRefineQuery,
  isLoading = false 
}: DisambiguationInterfaceProps) {
  const [selectedOption, setSelectedOption] = useState<ProductOption | null>(null);
  const [selectionStartTime] = useState<number>(Date.now());
  const [showAnalytics, setShowAnalytics] = useState(false);

  const handleSelectOption = (option: ProductOption) => {
    setSelectedOption(option);
    
    // Phase 4: Track selection time for analytics
    const selectionTime = Date.now() - selectionStartTime;
    console.log(`Phase 4: Product selection time: ${selectionTime}ms for product: ${option.name}`);
    
    onProductSelect(option);
  };

  // Phase 4: Auto-expand analytics for complex queries
  useEffect(() => {
    if (disambiguationData.searchMetadata?.queryComplexity === 'complex') {
      setShowAnalytics(true);
    }
  }, [disambiguationData]);

  return (
    <div className="space-y-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="mt-1">
          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
            <Package className="w-4 h-4 text-orange-600" />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-orange-900 mb-1">
            Multiple Products Found
          </h3>
          <p className="text-sm text-orange-800 mb-2">
            {disambiguationData.instructions || 'Please select which product you are interested in:'}
          </p>
          <span className="inline-block px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-md">
            {disambiguationData.options.length} options available
          </span>
        </div>
      </div>

      {/* Phase 4: Analytics Toggle */}
      {(disambiguationData.searchMetadata || disambiguationData.queryRefinements) && (
        <div className="mb-4">
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="flex items-center gap-2 text-sm text-blue-700 hover:text-blue-800 transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            {showAnalytics ? 'Hide' : 'Show'} Search Analytics
          </button>
        </div>
      )}

      {/* Phase 4: Analytics Panel */}
      {showAnalytics && <DisambiguationAnalytics disambiguationData={disambiguationData} />}

      {/* Phase 4: Enhanced Product Options */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {disambiguationData.options.map((option, index) => (
          <EnhancedProductCard
            key={option.id || index}
            option={option}
            isSelected={selectedOption?.id === option.id}
            onSelect={() => handleSelectOption(option)}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2 border-t border-orange-200">
        <Button
          onClick={onRefineQuery}
          variant="outline"
          size="sm"
          className="text-orange-700 border-orange-300 hover:bg-orange-100"
        >
          Refine Search Query
        </Button>
        {selectedOption && (
          <div className="flex items-center gap-2 text-sm text-orange-700">
            <ArrowRight className="w-4 h-4" />
            <span className="font-medium">Selected: {selectedOption.name}</span>
            {isLoading && (
              <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}