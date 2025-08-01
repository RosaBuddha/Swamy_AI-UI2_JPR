import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Package, CheckCircle, Clock, ExternalLink } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { ReplacementRequest, ProductReplacement, Product } from "@shared/schema";

export default function ReplacementRequestDetails() {
  const { id } = useParams();
  const requestId = Number(id);

  const { data: request, isLoading: isLoadingRequest } = useQuery<ReplacementRequest>({
    queryKey: ['/api/replacement-requests', requestId],
    enabled: !isNaN(requestId)
  });

  const { data: replacements = [], isLoading: isLoadingReplacements } = useQuery<ProductReplacement[]>({
    queryKey: ['/api/replacement-requests', requestId, 'replacements'],
    enabled: !isNaN(requestId)
  });

  if (isNaN(requestId)) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Invalid request ID</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoadingRequest) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-8">
          <Clock className="h-8 w-8 mx-auto animate-pulse text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">Loading request details...</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Replacement request not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Replacement Request #{request.id}</h1>
        <p className="text-muted-foreground">
          Submitted on {new Date(request.createdAt || '').toLocaleDateString()}
        </p>
      </div>

      {/* Request Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Request Details</span>
            <Badge className={getStatusColor(request.status || 'pending')}>
              {(request.status || 'pending').toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Original Product</h4>
              <p className="font-medium">{request.originalProductName}</p>
            </div>
            
            {request.userEmail && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Contact Email</h4>
                <p className="font-medium">{request.userEmail}</p>
              </div>
            )}

            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Last Updated</h4>
              <p className="font-medium">{new Date(request.updatedAt || '').toLocaleString()}</p>
            </div>

            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Discovery Status</h4>
              <p className="font-medium flex items-center gap-2">
                {request.discoveryAttempted ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Completed
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4 text-yellow-600" />
                    Pending
                  </>
                )}
              </p>
            </div>
          </div>

          {request.reasonCodes && request.reasonCodes.length > 0 && (
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Replacement Reasons</h4>
              <div className="flex flex-wrap gap-2">
                {request.reasonCodes.map((code) => (
                  <Badge key={code} variant="outline">
                    {code.replace(/_/g, ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {request.additionalNotes && (
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Additional Notes</h4>
              <p className="text-sm bg-muted p-3 rounded-md">{request.additionalNotes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Messages */}
      {request.status === 'pending' && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            Your request is queued for processing. We'll search multiple databases to find suitable replacements.
          </AlertDescription>
        </Alert>
      )}

      {request.status === 'processing' && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            Currently searching external databases and analyzing potential replacements...
          </AlertDescription>
        </Alert>
      )}

      {request.status === 'failed' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Unable to process this request. Please try again or contact support for assistance.
          </AlertDescription>
        </Alert>
      )}

      {/* Replacement Results */}
      {request.status === 'completed' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Replacement Products Found ({replacements.length})
            </CardTitle>
            <CardDescription>
              Products that may serve as suitable replacements, ranked by compatibility score
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingReplacements ? (
              <div className="text-center py-8">
                <Clock className="h-6 w-6 mx-auto animate-pulse text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">Loading replacement options...</p>
              </div>
            ) : replacements.length > 0 ? (
              <div className="space-y-4">
                {replacements.map((replacement) => (
                  <Card key={replacement.id} className="relative">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-3">
                            <h4 className="font-medium">Product #{replacement.replacementProductId}</h4>
                            <Badge 
                              variant="outline" 
                              className={getMatchScoreColor(replacement.matchScore || 0)}
                            >
                              {replacement.matchScore || 0}% Match
                            </Badge>
                          </div>
                          
                          {replacement.notes && (
                            <p className="text-sm text-muted-foreground">
                              {replacement.notes}
                            </p>
                          )}

                          {replacement.reasonAlignment && (
                            <div className="text-xs text-muted-foreground">
                              <strong>Reason Alignment:</strong> {replacement.reasonAlignment}
                            </div>
                          )}
                        </div>

                        <Button size="sm" variant="outline">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No replacement products were found in our databases. You may want to consult with a chemical specialist.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => window.history.back()}>
              Back
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/product-replacement'}>
              New Request
            </Button>
            {request.userEmail && (
              <Button variant="outline">
                Update Email Preferences
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}