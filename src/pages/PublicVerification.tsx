
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useBlockchain } from "@/context/BlockchainContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AlertCircle, 
  Search, 
  CheckCircle, 
  XCircle, 
  Link as LinkIcon,
  Clock,
  UserCheck
} from "lucide-react";
import { toast } from "sonner";

const PublicVerification = () => {
  const [searchParams] = useSearchParams();
  const { claims } = useBlockchain();
  const [tokenCode, setTokenCode] = useState("");
  const [searchedToken, setSearchedToken] = useState("");
  const [verificationResult, setVerificationResult] = useState<any>(null);
  
  useEffect(() => {
    // Check if token code is provided in URL
    const codeFromUrl = searchParams.get("code");
    if (codeFromUrl) {
      setTokenCode(codeFromUrl);
      handleVerify(codeFromUrl);
    }
  }, [searchParams]);

  const handleVerify = (code: string = tokenCode) => {
    if (!code) {
      toast.error("Please enter a token code");
      return;
    }
    
    // Find claim with matching token code
    const claim = claims.find(c => c.tokenCode === code);
    setSearchedToken(code);
    
    if (claim) {
      setVerificationResult({
        found: true,
        claim
      });
    } else {
      setVerificationResult({
        found: false
      });
    }
  };

  return (
    <div className="container max-w-6xl mx-auto py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Public Verification Portal</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Verify the authenticity of welfare scheme claims using the blockchain.
          Enter the token code to check if it's a valid benefit claim.
        </p>
      </div>
      
      <div className="max-w-2xl mx-auto mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Verify a Benefit Claim</CardTitle>
            <CardDescription>
              Enter the token code provided to the beneficiary
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tokenCode">Token Code</Label>
                <div className="flex space-x-2">
                  <Input
                    id="tokenCode"
                    value={tokenCode}
                    onChange={(e) => setTokenCode(e.target.value)}
                    placeholder="Enter token code (e.g. ABC123XYZ)"
                    className="flex-1 font-mono"
                  />
                  <Button 
                    className="bg-sahyog-teal hover:bg-blue-600"
                    onClick={() => handleVerify()}
                  >
                    <Search className="mr-2 h-4 w-4" />
                    Verify
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {verificationResult && (
        <div className="max-w-3xl mx-auto">
          {verificationResult.found ? (
            <Card className="border-green-200">
              <CardHeader className="bg-green-50 rounded-t-lg">
                <div className="flex items-center">
                  <CheckCircle className="text-green-500 mr-2 h-6 w-6" />
                  <CardTitle>Valid Verification Found</CardTitle>
                </div>
                <CardDescription>
                  Token <span className="font-mono font-bold">{searchedToken}</span> is valid and verified on the blockchain
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Scheme Name</h3>
                      <p className="font-medium">{verificationResult.claim.scheme}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Beneficiary</h3>
                      <p className="font-medium">{verificationResult.claim.userName}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Verification Date</h3>
                      <p className="font-medium flex items-center">
                        <Clock className="mr-1 h-4 w-4 text-gray-400" />
                        {new Date(verificationResult.claim.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Eligibility Status</h3>
                      <p className="font-medium flex items-center text-green-600">
                        <UserCheck className="mr-1 h-4 w-4" />
                        Eligible
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Blockchain Record</h3>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center">
                        <LinkIcon className="mr-2 h-4 w-4 text-sahyog-teal" />
                        <span className="font-mono text-xs truncate">
                          {verificationResult.claim.blockchainHash}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      This verification is permanently recorded on the blockchain
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-red-200">
              <CardHeader className="bg-red-50 rounded-t-lg">
                <div className="flex items-center">
                  <XCircle className="text-red-500 mr-2 h-6 w-6" />
                  <CardTitle>No Verification Found</CardTitle>
                </div>
                <CardDescription>
                  Token <span className="font-mono font-bold">{searchedToken}</span> is not found in the blockchain records
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                  <AlertCircle className="text-red-500 mr-2 h-5 w-5" />
                  <div>
                    <p className="font-medium">This token is not valid</p>
                    <p className="text-sm text-gray-600">
                      This may indicate a fraudulent claim or an incorrect token. Please verify the token and try again.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
      
      <div className="max-w-3xl mx-auto mt-12">
        <h2 className="text-xl font-bold mb-4">Recent Verifications on Blockchain</h2>
        
        {claims.length > 0 ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scheme
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Token
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {claims.slice(0, 5).map((claim) => (
                    <tr key={claim.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(claim.timestamp).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {claim.scheme}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {claim.tokenCode}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Verified
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <Button 
                          variant="link" 
                          className="text-sahyog-teal p-0 h-auto"
                          onClick={() => {
                            setTokenCode(claim.tokenCode);
                            handleVerify(claim.tokenCode);
                          }}
                        >
                          Verify
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 p-6 text-center rounded-lg border border-gray-200">
            <p className="text-gray-500">No verifications recorded on blockchain yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicVerification;
