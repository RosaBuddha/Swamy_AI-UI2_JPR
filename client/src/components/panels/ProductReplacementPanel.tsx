import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Input } from '../ui/Input';

interface ProductReplacementPanelProps {
  onClose: () => void;
  onSubmit?: (productName: string) => void;
}

export const ProductReplacementPanel: React.FC<ProductReplacementPanelProps> = ({
  onClose,
  onSubmit,
}) => {
  const [productName, setProductName] = useState('');

  // Auto-focus input when panel opens
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (productName.trim() && onSubmit) {
      onSubmit(productName.trim());
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className="w-80 bg-white rounded-[24px] border border-gray-200 p-6 h-full overflow-y-auto pl-[16px] pr-[16px] pt-[16px] pb-[16px]">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 font-inter text-[16px]">
          Find a product replacement
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg p-[6px] hover:bg-gray-100 transition-colors text-gray-800"
          aria-label="Close"
          data-testid="button-close-panel"
        >
          <X className="h-[18px] w-[18px]" />
        </button>
      </div>

      {/* Content */}
      <div className="space-y-4">
        <form onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label 
              htmlFor="product-name"
              className="text-sm font-medium text-gray-700"
            >
              Product Name
            </label>
            <Input
              id="product-name"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Enter the product name you want to replace"
              onKeyDown={handleInputKeyDown}
              autoFocus
              data-testid="input-product-name"
            />
          </div>
          
          <div className="mt-4 flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
              data-testid="button-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!productName.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              data-testid="button-submit"
            >
              Find Replacement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};