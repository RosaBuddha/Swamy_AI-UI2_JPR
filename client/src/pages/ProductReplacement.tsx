import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Search, Package, ChevronRight, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import type { Product, ReplacementReason, ReplacementRequest } from "@shared/schema";

interface ProductReplacementProps {
  onBackToChat?: () => void;
}

export default function ProductReplacement({ onBackToChat }: ProductReplacementProps = {}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [currentStep, setCurrentStep] = useState<'search' | 'reasons' | 'submitted'>('search');
  const [submittedRequest, setSubmittedRequest] = useState<ReplacementRequest | null>(null);

  const queryClient = useQueryClient();

  // Fetch replacement reasons
  const { data: reasons = [] } = useQuery<ReplacementReason[]>({
    queryKey: ['/api/replacement-reasons'],
    enabled: currentStep === 'reasons'
  });

  // Search products
  const { data: searchResults = [], isLoading: isSearching } = useQuery<Product[]>({
    queryKey: ['/api/products/search', searchQuery],
    enabled: searchQuery.length > 2,
    queryFn: () => apiRequest(`/api/products/search?q=${encodeURIComponent(searchQuery)}`)
  });

  // Create replacement request mutation
  const createRequestMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/replacement-requests', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: (data) => {
      setSubmittedRequest(data);
      setCurrentStep('submitted');
      queryClient.invalidateQueries({ queryKey: ['/api/replacement-requests'] });
    }
  });

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setCurrentStep('reasons');
  };

  const handleReasonToggle = (reasonCode: string) => {
    setSelectedReasons(prev => 
      prev.includes(reasonCode) 
        ? prev.filter(code => code !== reasonCode)
        : [...prev, reasonCode]
    );
  };

  const handleSubmitRequest = () => {
    if (!selectedProduct || selectedReasons.length === 0) return;

    createRequestMutation.mutate({
      originalProductName: selectedProduct.name,
      originalProductId: selectedProduct.id,
      reasonCodes: selectedReasons,
      additionalNotes: additionalNotes.trim() || null,
      userEmail: userEmail.trim() || null
    });
  };

  const resetForm = () => {
    setSearchQuery("");
    setSelectedProduct(null);
    setSelectedReasons([]);
    setAdditionalNotes("");
    setUserEmail("");
    setCurrentStep('search');
    setSubmittedRequest(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <Button variant="ghost" size="sm" onClick={onBackToChat}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Product Replacement</h1>
          <p className="text-muted-foreground">
            Find alternative chemical products when your current product needs to be replaced
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center space-x-2 text-sm">
        <Badge variant={currentStep === 'search' ? 'default' : 'secondary'}>
          1. Search Product
        </Badge>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <Badge variant={currentStep === 'reasons' ? 'default' : 'secondary'}>
          2. Select Reasons
        </Badge>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <Badge variant={currentStep === 'submitted' ? 'default' : 'secondary'}>
          3. Request Submitted
        </Badge>
      </div>

      {currentStep === 'search' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search for Product to Replace
            </CardTitle>
            <CardDescription>
              Enter the name or details of the product you need to replace
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search">Product Name or Details</Label>
              <Input
                id="search"
                placeholder="e.g., Stearic Acid, AF27, Titanium Dioxide..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>

            {searchQuery.length > 2 && (
              <div className="space-y-2">
                <Label>Search Results</Label>
                {isSearching ? (
                  <div className="text-center py-4 text-muted-foreground">
                    Searching products...
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {searchResults.map((product) => (
                      <Card 
                        key={product.id} 
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleProductSelect(product)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <h4 className="font-medium">{product.name}</h4>
                              {product.manufacturer && (
                                <p className="text-sm text-muted-foreground">
                                  by {product.manufacturer}
                                </p>
                              )}
                              {product.casNumber && (
                                <p className="text-xs text-muted-foreground">
                                  CAS: {product.casNumber}
                                </p>
                              )}
                            </div>
                            <Package className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No products found. Try a different search term or continue with manual entry.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {searchQuery.length > 2 && (
              <div className="pt-4 border-t">
                <Button 
                  onClick={() => {
                    setSelectedProduct({
                      id: 0,
                      name: searchQuery,
                      manufacturer: null,
                      casNumber: null,
                      chemicalName: null,
                      productNumber: null,
                      category: null,
                      description: null,
                      isActive: true,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString()
                    });
                    setCurrentStep('reasons');
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Continue with "{searchQuery}" (Manual Entry)
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {currentStep === 'reasons' && selectedProduct && (
        <Card>
          <CardHeader>
            <CardTitle>Selected Product</CardTitle>
            <CardDescription>
              {selectedProduct.name}
              {selectedProduct.manufacturer && ` by ${selectedProduct.manufacturer}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label>Why do you need a replacement? (Select all that apply)</Label>
              {reasons.map((reason) => (
                <div key={reason.code} className="flex items-start space-x-3">
                  <Checkbox
                    id={reason.code}
                    checked={selectedReasons.includes(reason.code)}
                    onCheckedChange={() => handleReasonToggle(reason.code)}
                  />
                  <div className="space-y-1">
                    <Label htmlFor={reason.code} className="font-medium cursor-pointer">
                      {reason.label}
                    </Label>
                    {reason.description && (
                      <p className="text-sm text-muted-foreground">
                        {reason.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any specific requirements, constraints, or additional information..."
                value={additionalNotes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAdditionalNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@company.com"
                value={userEmail}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                We'll notify you when we find replacement options
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setCurrentStep('search')}
                variant="outline"
              >
                Back
              </Button>
              <Button
                onClick={handleSubmitRequest}
                disabled={selectedReasons.length === 0 || createRequestMutation.isPending}
                className="flex-1"
              >
                {createRequestMutation.isPending ? 'Submitting...' : 'Submit Replacement Request'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 'submitted' && submittedRequest && (
        <Card>
          <CardHeader>
            <CardTitle className="text-green-700">Request Submitted Successfully</CardTitle>
            <CardDescription>
              Your product replacement request has been received
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg space-y-2">
              <p><strong>Request ID:</strong> #{submittedRequest.id}</p>
              <p><strong>Product:</strong> {submittedRequest.originalProductName}</p>
              <p><strong>Status:</strong> <Badge variant="secondary">{submittedRequest.status}</Badge></p>
              <p><strong>Submitted:</strong> {new Date(submittedRequest.createdAt).toLocaleDateString()}</p>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Our system will search multiple databases and sources to find suitable replacement products. 
                This process may take a few minutes to complete.
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button onClick={resetForm} variant="outline">
                Submit Another Request
              </Button>
              <Button onClick={() => window.location.href = `/replacement-requests/${submittedRequest.id}`}>
                View Request Details
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}