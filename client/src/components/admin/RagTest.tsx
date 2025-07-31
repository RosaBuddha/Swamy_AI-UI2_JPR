import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Chip } from '@/components/ui/Chip';
import { Loader2, CheckCircle, XCircle, Search } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';

interface RagTestResult {
  success: boolean;
  configured: boolean;
  responseTime?: number;
  hasData?: boolean;
  dataPreview?: string;
  error?: string;
}

interface ProductAttribute {
  name: string;
  value: string;
  unit?: string;
  category?: string;
}

interface ProcessedProductData {
  productName?: string;
  principal?: string;
  attributes: ProductAttribute[];
  descriptiveText: string;
  technicalSpecs?: ProductAttribute[];
  applications?: string[];
  features?: string[];
}

interface RagSearchResult {
  success: boolean;
  data?: any;
  processedContent?: string;
  processedProductData?: ProcessedProductData[];
  sources?: string[];
  averageScore?: number;
  productCount?: number;
  responseTime?: number;
  source?: string;
  error?: string;
}

export function RagTest() {
  const [searchQuery, setSearchQuery] = useState('');

  // Test connection query
  const { data: testResult, isLoading: isTestLoading, refetch: testConnection } = useQuery<RagTestResult>({
    queryKey: ['/api/rag/test'],
    refetchOnWindowFocus: false,
  });

  // Cache stats query
  const { data: cacheStats, refetch: refetchCacheStats } = useQuery({
    queryKey: ['/api/rag/cache/stats'],
    queryFn: () => fetch('/api/rag/cache/stats').then(res => res.json()),
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Search mutations
  const searchMutation = useMutation<RagSearchResult, Error, { message: string }>({
    mutationFn: async ({ message }) => {
      const response = await fetch('/api/rag/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      return response.json();
    },
  });

  const enhancedSearchMutation = useMutation<RagSearchResult, Error, { message: string }>({
    mutationFn: async ({ message }) => {
      const response = await fetch('/api/rag/search-enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      return response.json();
    },
  });

  // Clear cache mutation
  const clearCacheMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/rag/cache/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      return response.json();
    },
    onSuccess: () => {
      refetchCacheStats();
    },
  });

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    searchMutation.mutate({ message: searchQuery });
  };

  const handleEnhancedSearch = () => {
    if (!searchQuery.trim()) return;
    enhancedSearchMutation.mutate({ message: searchQuery });
  };

  const handleTestConnection = () => {
    testConnection();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">RAG System Test</h2>
          <p className="text-muted-foreground">Test the Knowde API integration and search functionality</p>
        </div>
      </div>

      {/* Connection Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Connection Test
          </CardTitle>
          <CardDescription>
            Verify the RAG service is properly configured and can connect to Knowde API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={handleTestConnection}
              disabled={isTestLoading}
              className="flex items-center gap-2"
            >
              {isTestLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Test Connection
            </Button>
          </div>

          {testResult && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className={`px-2 py-1 rounded text-xs font-medium ${testResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {testResult.success ? "Success" : "Failed"}
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${testResult.configured ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                  {testResult.configured ? "Configured" : "Not Configured"}
                </div>
                {testResult.responseTime && (
                  <div className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                    {testResult.responseTime}ms
                  </div>
                )}
              </div>
              
              {testResult.error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
                  <strong>Error:</strong> {testResult.error}
                </div>
              )}
              
              {testResult.hasData && testResult.dataPreview && (
                <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm">
                  <strong>Data Preview:</strong> {testResult.dataPreview}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cache Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5" />
            Cache Management
          </CardTitle>
          <CardDescription>
            Manage RAG search cache for performance optimization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={() => clearCacheMutation.mutate()}
              disabled={clearCacheMutation.isPending}
              className="flex items-center gap-2"
            >
              {clearCacheMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Clear Cache
            </Button>
          </div>

          {cacheStats && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  {cacheStats.stats?.size || 0} cached items
                </div>
              </div>
              
              {cacheStats.stats?.keys && cacheStats.stats.keys.length > 0 && (
                <div className="bg-gray-50 p-3 rounded-md text-sm">
                  <strong>Cached Queries:</strong>
                  <div className="mt-1 space-y-1">
                    {cacheStats.stats.keys.slice(0, 5).map((key: string, index: number) => (
                      <div key={index} className="text-gray-600 text-xs">
                        {key.replace('rag_', '')}
                      </div>
                    ))}
                    {cacheStats.stats.keys.length > 5 && (
                      <div className="text-gray-500 text-xs">
                        ... and {cacheStats.stats.keys.length - 5} more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Test
          </CardTitle>
          <CardDescription>
            Test search queries against the product knowledge base
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter search query (e.g., 'adhesion promoters', 'SIPERNAT 45 S')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button 
              onClick={handleSearch}
              disabled={searchMutation.isPending || !searchQuery.trim()}
              className="flex items-center gap-2"
            >
              {searchMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Basic Search
            </Button>
            <Button 
              onClick={handleEnhancedSearch}
              disabled={enhancedSearchMutation.isPending || !searchQuery.trim()}
              className="flex items-center gap-2"
            >
              {enhancedSearchMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Enhanced Search
            </Button>
          </div>

          {searchMutation.data && (
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <div className={`px-2 py-1 rounded text-xs font-medium ${searchMutation.data.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {searchMutation.data.success ? "Success" : "Failed"}
                </div>
                {searchMutation.data.responseTime && (
                  <div className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                    {searchMutation.data.responseTime}ms
                  </div>
                )}
                {searchMutation.data.source && (
                  <div className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    {searchMutation.data.source}
                  </div>
                )}
                {(searchMutation.data as any).disambiguationDetected && (
                  <div className="px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800">
                    🔍 Disambiguation Detected
                  </div>
                )}
              </div>

              {/* Phase 2: Show parsed disambiguation data in RAG test */}
              {(searchMutation.data as any).disambiguationData && (searchMutation.data as any).disambiguationData.options.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 p-4 rounded-md">
                  <h4 className="font-semibold text-orange-800 mb-3">
                    🔍 Phase 2 Disambiguation Test - Parsed Product Options ({(searchMutation.data as any).disambiguationData.options.length})
                  </h4>
                  <div className="bg-white border rounded p-3 max-h-48 overflow-y-auto mb-3">
                    {(searchMutation.data as any).disambiguationData.options.map((option: any, idx: number) => (
                      <div key={idx} className="border-b border-gray-100 last:border-b-0 py-2">
                        <div className="font-medium text-sm text-gray-900">{option.name}</div>
                        {option.company && (
                          <div className="text-xs text-gray-600">Company: {option.company}</div>
                        )}
                        {option.description && (
                          <div className="text-xs text-gray-700 mt-1">{option.description}</div>
                        )}
                        {option.id && (
                          <div className="text-xs text-gray-500 mt-1">ID: {option.id}</div>
                        )}
                      </div>
                    ))}
                  </div>
                  {(searchMutation.data as any).disambiguationData.instructions && (
                    <div className="text-sm text-orange-700 bg-orange-100 p-2 rounded">
                      <strong>Instructions:</strong> {(searchMutation.data as any).disambiguationData.instructions}
                    </div>
                  )}
                </div>
              )}

              {searchMutation.data.error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
                  <strong>Error:</strong> {searchMutation.data.error}
                </div>
              )}

              {/* Enhanced Search Results */}
              {searchMutation.data.success && (
                <div className="space-y-4">
                  {/* Phase 3 Enhanced Metrics */}
                  <div className="bg-blue-50 p-4 rounded-md">
                    <h4 className="font-semibold mb-2">Enhanced Search Analytics:</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">Product Sources</div>
                        <div className="font-medium">{searchMutation.data.productCount || 0}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Average Score</div>
                        <div className="font-medium">{searchMutation.data.averageScore?.toFixed(2) || 'N/A'}</div>
                      </div>
                    </div>
                    
                    {searchMutation.data.sources && searchMutation.data.sources.length > 0 && (
                      <div className="mt-3">
                        <div className="text-sm text-gray-600 mb-1">Source Products:</div>
                        <div className="flex flex-wrap gap-1">
                          {searchMutation.data.sources.map((source: string, index: number) => (
                            <Chip key={index} variant="suggestion" className="text-xs">
                              {source}
                            </Chip>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Processed Content */}
                  {searchMutation.data.processedContent && (
                    <div className="bg-green-50 p-4 rounded-md">
                      <h4 className="font-semibold mb-2">Processed Content:</h4>
                      <div className="text-sm text-gray-700 max-h-48 overflow-y-auto">
                        {searchMutation.data.processedContent.split('\n\n').map((paragraph: string, index: number) => (
                          <div key={index} className="mb-2">
                            <div dangerouslySetInnerHTML={{ __html: paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Raw Data */}
                  {searchMutation.data.data && (
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h4 className="font-semibold mb-2">Raw Results:</h4>
                      <div className="space-y-2">
                        {searchMutation.data.data.result?.map((result: any, index: number) => (
                          <div key={index} className="border-l-4 border-blue-400 pl-4 py-2">
                            <div className="flex gap-2 mb-1">
                              <div className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                Score: {result.metadata?.score?.toFixed(3) || 'N/A'}
                              </div>
                              {result.metadata?.products?.[0]?.name && (
                                <div className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  {result.metadata.products[0].name}
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-3">
                              {result.content?.substring(0, 300) || 'No content'}...
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Enhanced Search Results */}
          {enhancedSearchMutation.data && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className={`px-2 py-1 rounded text-xs font-medium ${enhancedSearchMutation.data.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {enhancedSearchMutation.data.success ? "Enhanced Success" : "Enhanced Failed"}
                </div>
                {enhancedSearchMutation.data.responseTime && (
                  <div className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                    {enhancedSearchMutation.data.responseTime}ms
                  </div>
                )}
                {enhancedSearchMutation.data.source && (
                  <div className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                    {enhancedSearchMutation.data.source}
                  </div>
                )}
              </div>

              {enhancedSearchMutation.data.error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
                  <strong>Error:</strong> {enhancedSearchMutation.data.error}
                </div>
              )}

              {/* Structured Product Data */}
              {enhancedSearchMutation.data.success && enhancedSearchMutation.data.processedProductData && (
                <div className="space-y-6">
                  <h4 className="font-semibold text-lg">Structured Product Data:</h4>
                  
                  {enhancedSearchMutation.data.processedProductData.map((product: ProcessedProductData, index: number) => (
                    <div key={index} className="border rounded-lg p-4 bg-white">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h5 className="font-semibold text-lg">{product.productName}</h5>
                          <p className="text-sm text-gray-600">Principal: {product.principal}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">
                            {product.attributes.length + (product.technicalSpecs?.length || 0)} attributes
                          </div>
                        </div>
                      </div>

                      {/* Product Attributes Table */}
                      {product.attributes.length > 0 && (
                        <div className="mb-4">
                          <h6 className="font-medium mb-2">Product Attributes:</h6>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-gray-200 text-sm">
                              <thead>
                                <tr className="bg-gray-50">
                                  <th className="border border-gray-200 px-3 py-2 text-left font-medium">Attribute</th>
                                  <th className="border border-gray-200 px-3 py-2 text-left font-medium">Value</th>
                                  {product.attributes.some(attr => attr.unit) && (
                                    <th className="border border-gray-200 px-3 py-2 text-left font-medium">Unit</th>
                                  )}
                                </tr>
                              </thead>
                              <tbody>
                                {product.attributes.map((attr, attrIndex) => (
                                  <tr key={attrIndex} className="hover:bg-gray-50">
                                    <td className="border border-gray-200 px-3 py-2 font-medium">{attr.name}</td>
                                    <td className="border border-gray-200 px-3 py-2">{attr.value}</td>
                                    {product.attributes.some(a => a.unit) && (
                                      <td className="border border-gray-200 px-3 py-2 text-gray-600">{attr.unit || '-'}</td>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Technical Specifications Table */}
                      {product.technicalSpecs && product.technicalSpecs.length > 0 && (
                        <div className="mb-4">
                          <h6 className="font-medium mb-2">Technical Specifications:</h6>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-gray-200 text-sm">
                              <thead>
                                <tr className="bg-blue-50">
                                  <th className="border border-gray-200 px-3 py-2 text-left font-medium">Specification</th>
                                  <th className="border border-gray-200 px-3 py-2 text-left font-medium">Value</th>
                                </tr>
                              </thead>
                              <tbody>
                                {product.technicalSpecs.map((spec, specIndex) => (
                                  <tr key={specIndex} className="hover:bg-blue-50">
                                    <td className="border border-gray-200 px-3 py-2 font-medium">{spec.name}</td>
                                    <td className="border border-gray-200 px-3 py-2">{spec.value}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Applications and Features */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {product.applications && product.applications.length > 0 && (
                          <div>
                            <h6 className="font-medium mb-2">Applications:</h6>
                            <div className="space-y-1">
                              {product.applications.map((app, appIndex) => (
                                <div key={appIndex} className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span className="text-sm">{app}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {product.features && product.features.length > 0 && (
                          <div>
                            <h6 className="font-medium mb-2">Features:</h6>
                            <div className="space-y-1">
                              {product.features.map((feature, featureIndex) => (
                                <div key={featureIndex} className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  <span className="text-sm">{feature}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Descriptive Text */}
                      {product.descriptiveText && (
                        <div className="bg-gray-50 p-3 rounded-md">
                          <h6 className="font-medium mb-2">Description:</h6>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {product.descriptiveText}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}