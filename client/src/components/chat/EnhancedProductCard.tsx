import React, { useState } from 'react';
import { ProductOption } from '@shared/schema';
import { Building2, Package, Star, ChevronDown, ChevronUp, Tag, Zap } from 'lucide-react';

interface EnhancedProductCardProps {
  option: ProductOption;
  isSelected: boolean;
  onSelect: () => void;
}

/**
 * Phase 4: Enhanced product card with expanded metadata display
 */
export function EnhancedProductCard({ option, isSelected, onSelect }: EnhancedProductCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div 
      className={`cursor-pointer transition-all border rounded-lg p-4 ${
        isSelected 
          ? 'border-orange-300 bg-orange-50 shadow-md' 
          : 'border-gray-200 bg-white hover:border-orange-200 hover:shadow-sm'
      }`}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-gray-900">{option.name}</h4>
            {option.relevanceScore && (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-500" />
                <span className="text-xs text-gray-600">{Math.round(option.relevanceScore * 100)}%</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {option.company && (
              <div className="flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                <span>{option.company}</span>
              </div>
            )}
            
            {option.category && (
              <div className="flex items-center gap-1">
                <Tag className="w-3 h-3" />
                <span className="px-2 py-1 bg-gray-100 rounded text-xs">{option.category}</span>
              </div>
            )}
          </div>
        </div>
        
        {(option.attributes || option.applications || option.technicalSpecs) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>
      
      {/* Description */}
      {option.description && (
        <p className="text-sm text-gray-700 mb-3 leading-relaxed">
          {option.description}
        </p>
      )}
      
      {/* Applications */}
      {option.applications && option.applications.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-1 mb-1">
            <Zap className="w-3 h-3 text-blue-600" />
            <span className="text-xs font-medium text-blue-700">Applications</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {option.applications.slice(0, isExpanded ? undefined : 3).map((app, index) => (
              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                {app}
              </span>
            ))}
            {!isExpanded && option.applications.length > 3 && (
              <span className="text-xs text-gray-500">+{option.applications.length - 3} more</span>
            )}
          </div>
        </div>
      )}
      
      {/* Expanded Details */}
      {isExpanded && (
        <div className="space-y-3 pt-3 border-t border-gray-200">
          {/* Technical Specifications */}
          {option.technicalSpecs && Object.keys(option.technicalSpecs).length > 0 && (
            <div>
              <h5 className="text-xs font-medium text-gray-700 mb-2">Technical Specifications</h5>
              <div className="grid grid-cols-1 gap-1">
                {Object.entries(option.technicalSpecs).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-xs">
                    <span className="text-gray-600">{key}:</span>
                    <span className="font-medium text-gray-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Additional Attributes */}
          {option.attributes && Object.keys(option.attributes).length > 0 && (
            <div>
              <h5 className="text-xs font-medium text-gray-700 mb-2">Additional Properties</h5>
              <div className="flex flex-wrap gap-1">
                {Object.entries(option.attributes).map(([key, value]) => (
                  <span key={key} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                    {key}: {value}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Selection Indicator */}
      {isSelected && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-orange-200">
          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
          <span className="text-sm font-medium text-orange-700">Selected</span>
        </div>
      )}
    </div>
  );
}