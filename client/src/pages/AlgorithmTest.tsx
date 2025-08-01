import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Zap, Target, TrendingUp, Beaker, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface AlgorithmResult {
  requestId: number;
  originalProduct: string;
  analysisResults: {
    totalCandidates: number;
    topCandidates: Array<{
      productName: string;
      manufacturer: string;
      overallScore: number;
      matchType: 'exact' | 'similar' | 'functional' | 'alternative';
      riskLevel: 'low' | 'medium' | 'high';
      confidence: number;
      reasoning: string[];
      breakdown: {
        chemicalSimilarity: number;
        functionalCompatibility: number;
        performanceMatch: number;
        availability: number;
        costEffectiveness: number;
        sustainability: number;
      };
    }>;
    algorithmDetails: {
      version: string;
      criteriaUsed: any;
      scoringFactors: string[];
    };
  };
}

export default function AlgorithmTest() {
  const [results, setResults] = useState<AlgorithmResult | null>(null);

  const analysisMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const response = await apiRequest(`/api/replacement-requests/${requestId}/analyze`, {
        method: 'POST'
      });
      return response as AlgorithmResult;
    },
    onSuccess: (data) => {
      setResults(data);
    }
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-red-100 text-red-800';
    }
  };

  const getMatchTypeIcon = (type: string) => {
    switch (type) {
      case 'exact': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'similar': return <Target className="h-4 w-4 text-blue-600" />;
      case 'functional': return <Beaker className="h-4 w-4 text-purple-600" />;
      default: return <TrendingUp className="h-4 w-4 text-orange-600" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Brain className="h-8 w-8 text-blue-600" />
          Phase 3 Algorithm Testing
        </h1>
        <p className="text-muted-foreground">
          Advanced replacement algorithms with multi-criteria scoring and intelligent ranking
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-600" />
            Run Algorithm Analysis
          </CardTitle>
          <CardDescription>
            Test the Phase 3 advanced replacement algorithms on existing requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => analysisMutation.mutate(1)}
            disabled={analysisMutation.isPending}
            className="w-full sm:w-auto"
          >
            {analysisMutation.isPending ? (
              <>
                <Brain className="h-4 w-4 mr-2 animate-pulse" />
                Running Algorithm Analysis...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Analyze Request #1
              </>
            )}
          </Button>
          
          {analysisMutation.error && (
            <Alert className="mt-4">
              <AlertDescription>
                Analysis failed: {(analysisMutation.error as any)?.message || 'Unknown error'}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {results && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="candidates">Top Candidates</TabsTrigger>
            <TabsTrigger value="algorithm">Algorithm Details</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Analysis Results</CardTitle>
                <CardDescription>
                  Algorithm analysis for: {results.originalProduct}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {results.analysisResults.totalCandidates}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total Candidates Analyzed
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {results.analysisResults.topCandidates.length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Top Recommendations
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      v{results.analysisResults.algorithmDetails.version}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Algorithm Version
                    </div>
                  </div>
                </div>
                
                {results.analysisResults.topCandidates.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Best Match Preview</h4>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">
                          {results.analysisResults.topCandidates[0].productName}
                        </span>
                        <Badge className={getScoreColor(results.analysisResults.topCandidates[0].overallScore)}>
                          {results.analysisResults.topCandidates[0].overallScore}% Match
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {getMatchTypeIcon(results.analysisResults.topCandidates[0].matchType)}
                        <span className="capitalize">{results.analysisResults.topCandidates[0].matchType} Match</span>
                        <Badge variant="outline" className={getRiskColor(results.analysisResults.topCandidates[0].riskLevel)}>
                          {results.analysisResults.topCandidates[0].riskLevel} risk
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="candidates" className="space-y-4">
            {results.analysisResults.topCandidates.map((candidate, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getMatchTypeIcon(candidate.matchType)}
                      <span>#{index + 1} {candidate.productName}</span>
                    </div>
                    <Badge className={getScoreColor(candidate.overallScore)}>
                      {candidate.overallScore}% Overall
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {candidate.manufacturer} • {candidate.matchType} match • {candidate.riskLevel} risk
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium mb-2">Score Breakdown</h5>
                      <div className="space-y-2">
                        {Object.entries(candidate.breakdown).map(([factor, score]) => (
                          <div key={factor} className="flex items-center justify-between">
                            <span className="text-sm capitalize">
                              {factor.replace(/([A-Z])/g, ' $1').toLowerCase()}
                            </span>
                            <div className="flex items-center gap-2">
                              <Progress value={score} className="w-20 h-2" />
                              <span className="text-sm font-medium w-10">{score}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-medium mb-2">Algorithm Reasoning</h5>
                      <ul className="text-sm space-y-1">
                        {candidate.reasoning.map((reason, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="algorithm" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Algorithm Configuration</CardTitle>
                <CardDescription>
                  Details about the Phase 3 advanced replacement algorithms
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h5 className="font-medium mb-2">Scoring Factors</h5>
                  <div className="grid md:grid-cols-2 gap-2">
                    {results.analysisResults.algorithmDetails.scoringFactors.map((factor, index) => (
                      <Badge key={index} variant="outline" className="justify-start">
                        {factor}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h5 className="font-medium mb-2">Analysis Criteria</h5>
                  <pre className="text-sm bg-muted p-3 rounded-md overflow-auto">
                    {JSON.stringify(results.analysisResults.algorithmDetails.criteriaUsed, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}