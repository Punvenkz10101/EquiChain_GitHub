
import { useState } from "react";
import { useBlockchain } from "@/context/BlockchainContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Shield, 
  Search, 
  ExternalLink, 
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";

const VerifierDashboard = () => {
  const { user } = useAuth();
  const { claims } = useBlockchain();
  const [searchToken, setSearchToken] = useState("");
  const [foundClaim, setFoundClaim] = useState<any>(null);
  const [processed, setProcessed] = useState<{[key: string]: boolean}>({});

  const handleSearch = () => {
    if (!searchToken.trim()) {
      toast.error("Please enter a token code");
      return;
    }
    
    const claim = claims.find(claim => claim.tokenCode === searchToken.trim());
    
    if (claim) {
      setFoundClaim(claim);
      toast.success("Verification record found");
    } else {
      setFoundClaim(null);
      toast.error("No verification record found with this token");
    }
  };

  const markAsProcessed = (id: string) => {
    setProcessed(prev => ({ ...prev, [id]: true }));
    toast.success("Successfully marked as processed");
  };

  return (
    <div className="container max-w-6xl mx-auto py-8">
      <div className="flex items-center mb-8">
        <Shield className="h-8 w-8 text-[#58508d] mr-3" />
        <h1 className="text-3xl font-bold">Verifier Dashboard</h1>
      </div>
      
      <div className="bg-[#f7f9fa] p-4 rounded-lg mb-8">
        <p className="text-gray-600">
          Welcome, <span className="font-semibold">{user?.name || 'Verifier'}</span>. 
          Use this dashboard to verify welfare scheme tokens and process payments.
        </p>
      </div>
      
      {/* Search Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Verification Token Search</CardTitle>
          <CardDescription>
            Enter the token code provided by the beneficiary to verify their eligibility
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Input 
              placeholder="Enter verification token code..." 
              value={searchToken}
              onChange={(e) => setSearchToken(e.target.value)}
              className="flex-grow"
            />
            <Button 
              onClick={handleSearch}
              className="bg-[#007373] hover:bg-[#006363] whitespace-nowrap"
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Verification Result */}
      {foundClaim && (
        <Card className="border-t-4 border-t-[#22c55e] mb-8">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Verification Result</CardTitle>
                <CardDescription>
                  Token: <span className="font-mono">{foundClaim.tokenCode}</span>
                </CardDescription>
              </div>
              <div className="bg-[#22c55e]/10 text-[#22c55e] px-3 py-1 rounded-full text-sm font-medium flex items-center">
                <CheckCircle className="h-4 w-4 mr-1" />
                Verified
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Beneficiary Name</h3>
                <p className="font-medium">{foundClaim.userName}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Scheme</h3>
                <p className="font-medium">{foundClaim.scheme}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Verification Date</h3>
                <p className="font-medium">
                  {new Date(foundClaim.timestamp).toLocaleDateString()}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Blockchain Hash</h3>
                <div className="flex items-center">
                  <p className="font-mono text-sm truncate mr-1 max-w-[200px]">
                    {foundClaim.blockchainHash}
                  </p>
                  <a 
                    href={`https://mumbai.polygonscan.com/tx/${foundClaim.blockchainHash}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[#007373]"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
            
            <div className="bg-[#f7f9fa] p-4 rounded-lg">
              <h3 className="text-sm font-medium mb-2">Verification Status</h3>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-[#22c55e] mr-2" />
                <div>
                  <p className="font-medium">Eligible for {foundClaim.scheme}</p>
                  <p className="text-sm text-gray-600">
                    Verified via blockchain on {new Date(foundClaim.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => markAsProcessed(foundClaim.id)}
              disabled={processed[foundClaim.id]}
              className={processed[foundClaim.id] ? 
                "bg-gray-300 hover:bg-gray-300 cursor-not-allowed" : 
                "bg-[#22c55e] hover:bg-[#1ca04d]"
              }
            >
              {processed[foundClaim.id] ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Processed
                </>
              ) : (
                "Mark as Processed"
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
      
      {/* Recent Verifications */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Verifications</CardTitle>
          <CardDescription>
            Most recent verifications processed in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {claims.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Date</th>
                    <th className="text-left py-2 px-4">Beneficiary</th>
                    <th className="text-left py-2 px-4">Scheme</th>
                    <th className="text-left py-2 px-4">Token</th>
                    <th className="text-left py-2 px-4">Status</th>
                    <th className="text-left py-2 px-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {claims.slice(0, 5).map((claim) => (
                    <tr key={claim.id} className="border-b">
                      <td className="py-3 px-4">
                        {new Date(claim.timestamp).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">{claim.userName}</td>
                      <td className="py-3 px-4">{claim.scheme}</td>
                      <td className="py-3 px-4">
                        <span className="font-mono">{claim.tokenCode}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-[#22c55e]/10 text-[#22c55e]">
                          Verified
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Button 
                          size="sm"
                          variant="outline" 
                          onClick={() => {
                            setSearchToken(claim.tokenCode);
                            setFoundClaim(claim);
                          }}
                          className="text-[#007373] border-[#007373]"
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertTriangle className="h-8 w-8 text-gray-400 mb-2" />
              <p className="text-gray-500">No verification records found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifierDashboard;
