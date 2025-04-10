import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useBlockchain } from "@/context/BlockchainContext";
import { getSchemeById } from "@/data/schemes";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  AlertTriangle,
  Check,
  X,
  Upload,
  ArrowRight,
  Clipboard,
  QrCode,
  CheckCircle,
  FileText,
  CreditCard,
  FileSpreadsheet,
  File,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { extractDataFromDocuments, checkEligibility, generateTokenCode } from "@/data/mockAiService";

const VerificationProcess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, updateUserProfile } = useAuth();
  const { isConnected, addClaim } = useBlockchain();
  
  const { schemeId, schemeTitle } = location.state || {};
  const scheme = getSchemeById(schemeId);
  
  const [activeTab, setActiveTab] = useState("requirements");
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [documentData, setDocumentData] = useState<any>(null);
  const [eligibilityResult, setEligibilityResult] = useState<any>(null);
  const [tokenCode, setTokenCode] = useState<string | null>(null);
  const [isRecordingOnBlockchain, setIsRecordingOnBlockchain] = useState(false);
  const [blockchainRecorded, setBlockchainRecorded] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState<{
    txHash: string;
    blockNumber: number;
    costEth: string;
    originalMessage: string;
  } | null>(null);

  if (!scheme) {
    return (
      <div className="container max-w-6xl mx-auto py-8 text-center">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Invalid Scheme</AlertTitle>
          <AlertDescription>
            The scheme you are trying to access does not exist.
          </AlertDescription>
        </Alert>
        <Button 
          className="mt-4 bg-[#007373] hover:bg-[#006363]" 
          onClick={() => navigate("/dashboard")}
        >
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleProcessDocuments = async () => {
    if (files.length === 0) {
      toast.error("Please upload at least one document");
      return;
    }

    setIsProcessing(true);
    setDocumentData(null);
    setEligibilityResult(null);
    
    try {
      // Extract data from documents using OCR (mock)
      const extractedData = await extractDataFromDocuments(files);
      setDocumentData(extractedData);
      toast.success("Documents processed successfully");
      
      // Update user profile with extracted Aadhaar if available
      if (extractedData.aadhaarNumber && user) {
        updateUserProfile({ aadhaarNumber: extractedData.aadhaarNumber });
      }
      
      // Check eligibility based on scheme criteria and extracted data
      const result = await checkEligibility(schemeId, extractedData);
      setEligibilityResult(result);
      
      // Generate token code if eligible
      if (result.eligible) {
        const code = generateTokenCode();
        setTokenCode(code);
      }
      
      // Move to next tab
      setActiveTab("verification");
    } catch (error) {
      console.error("Error processing documents:", error);
      toast.error("Failed to process documents. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRecordOnBlockchain = async () => {
    if (!eligibilityResult?.eligible || !tokenCode) {
      toast.error("Unable to record on blockchain. Invalid eligibility or token.");
      return;
    }

    setIsRecordingOnBlockchain(true);
    
    try {
      // Prepare verification message
      const verificationMessage = JSON.stringify({
        userHash: user?.id || "unknown",
        userName: user?.name || "Unknown User",
        scheme: scheme.title,
        tokenCode,
        isEligible: true,
        documentData: {
          aadhaarNumber: documentData.aadhaarNumber,
          name: documentData.name,
          age: documentData.age,
          income: documentData.income
        }
      });

      // Send transaction to blockchain
      const response = await fetch('http://localhost:3000/api/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: verificationMessage })
      });

      if (!response.ok) {
        throw new Error('Failed to send transaction to blockchain');
      }

      const result = await response.json();
      
      // Store transaction details
      setTransactionDetails({
        txHash: result.txHash,
        blockNumber: result.blockNumber,
        costEth: result.costEth,
        originalMessage: result.originalMessage
      });
      
      // Record the claim locally
      await addClaim({
        userHash: user?.id || "unknown",
        userName: user?.name || "Unknown User",
        scheme: scheme.title,
        tokenCode,
        isEligible: true
      });
      
      setBlockchainRecorded(true);
      toast.success("Successfully recorded on blockchain");
      
      // Move to final tab
      setActiveTab("complete");
    } catch (error) {
      console.error("Error recording on blockchain:", error);
      toast.error("Failed to record on blockchain. Please try again.");
    } finally {
      setIsRecordingOnBlockchain(false);
    }
  };

  const copyTokenToClipboard = () => {
    if (tokenCode) {
      navigator.clipboard.writeText(tokenCode);
      toast.success("Token copied to clipboard");
    }
  };

  return (
    <div className="container max-w-6xl mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">{scheme.title}</h1>
        <p className="text-gray-600 mt-1">{scheme.description}</p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="requirements" disabled={isProcessing}>Requirements</TabsTrigger>
          <TabsTrigger value="verification" disabled={!documentData}>Verification</TabsTrigger>
          <TabsTrigger value="complete" disabled={!blockchainRecorded}>Completion</TabsTrigger>
        </TabsList>
        
        {/* Tab 1: Requirements */}
        <TabsContent value="requirements">
          <Card>
            <CardHeader>
              <CardTitle>Eligibility & Document Requirements</CardTitle>
              <CardDescription>
                Review the eligibility criteria and required documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Required Documents</h3>
                  <p className="text-sm text-gray-500">
                    Please upload all the required documents for verification. Supported formats: PDF, JPG, PNG
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid w-full items-center gap-4">
                    <div className="flex flex-col space-y-1.5">
                      <div className="border-2 border-dashed border-gray-200 rounded-lg p-6">
                        <div className="flex flex-col items-center">
                          <Upload className="h-8 w-8 text-gray-400 mb-2" />
                          <p className="text-sm font-medium mb-1">Upload Documents</p>
                          <p className="text-xs text-gray-500 mb-4 text-center">
                            Drag and drop your files here or click to browse
                          </p>
                          <input
                            type="file"
                            multiple
                            onChange={handleFileChange}
                            className="hidden"
                            id="file-upload"
                            accept=".pdf,.jpg,.jpeg,.png"
                          />
                          <Button
                            variant="outline"
                            onClick={() => document.getElementById('file-upload')?.click()}
                          >
                            Select Files
                          </Button>
                        </div>
                      </div>
                      {files.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium mb-2">Selected Files:</h4>
                          <ul className="space-y-2">
                            {files.map((file, index) => (
                              <li key={index} className="flex items-center text-sm">
                                <File className="h-4 w-4 mr-2 text-gray-400" />
                                {file.name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => navigate("/dashboard")}
              >
                Cancel
              </Button>
              <Button 
                className="bg-[#007373] hover:bg-[#006363]"
                onClick={handleProcessDocuments}
                disabled={files.length === 0 || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <div className="loading-spinner mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    Process Documents <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Tab 2: Verification */}
        <TabsContent value="verification">
          <Card>
            <CardHeader>
              <CardTitle>Eligibility Verification Results</CardTitle>
              <CardDescription>
                Review the AI verification of your eligibility
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {documentData && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Extracted Information</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Name</p>
                        <p className="font-medium">{documentData.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Aadhaar Number</p>
                        <p className="font-medium">{documentData.aadhaarNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Age</p>
                        <p className="font-medium">{documentData.age} years</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Annual Income</p>
                        <p className="font-medium">₹{documentData.income.toLocaleString()}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-500">Address</p>
                        <p className="font-medium">{documentData.address}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {eligibilityResult && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Eligibility Result</h3>
                  
                  {eligibilityResult.eligible ? (
                    <Alert className="border-[#22c55e] bg-[#22c55e]/10">
                      <Check className="h-4 w-4 text-[#22c55e]" />
                      <AlertTitle className="text-[#22c55e]">Eligible for {scheme.title}</AlertTitle>
                      <AlertDescription className="text-[#22c55e]/80">
                        {eligibilityResult.reason}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert className="border-red-500 bg-red-50">
                      <X className="h-4 w-4 text-red-500" />
                      <AlertTitle className="text-red-700">Not Eligible for {scheme.title}</AlertTitle>
                      <AlertDescription className="text-red-600">
                        {eligibilityResult.reason}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Fraud Risk Score:</span>
                      <span className={`text-sm font-medium ${
                        eligibilityResult.fraud_score < 30 
                          ? 'text-[#22c55e]' 
                          : eligibilityResult.fraud_score < 70 
                            ? 'text-yellow-500' 
                            : 'text-red-500'
                      }`}>
                        {eligibilityResult.fraud_score}/100
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                      <div 
                        className={`h-2.5 rounded-full ${
                          eligibilityResult.fraud_score < 30 
                            ? 'bg-[#22c55e]' 
                            : eligibilityResult.fraud_score < 70 
                              ? 'bg-yellow-500' 
                              : 'bg-red-500'
                        }`}
                        style={{ width: `${eligibilityResult.fraud_score}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
              
              {eligibilityResult?.eligible && tokenCode && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Verification Token</h3>
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-500 mb-2">Your Unique Token Code</p>
                    <div className="flex items-center justify-center space-x-2">
                      <span className="font-mono text-xl font-bold">{tokenCode}</span>
                      <button 
                        onClick={copyTokenToClipboard}
                        className="text-[#007373] hover:text-[#006363]"
                      >
                        <Clipboard className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      This token will be recorded on the blockchain for verification.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => setActiveTab("requirements")}
              >
                Back
              </Button>
              {eligibilityResult?.eligible && tokenCode ? (
                <Button 
                  className="bg-[#007373] hover:bg-[#006363]"
                  onClick={handleRecordOnBlockchain}
                  disabled={isRecordingOnBlockchain}
                >
                  {isRecordingOnBlockchain ? (
                    <>
                      <div className="loading-spinner mr-2"></div>
                      Recording on Blockchain...
                    </>
                  ) : (
                    <>
                      Record on Blockchain <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              ) : (
                <Button 
                  onClick={() => navigate("/dashboard")}
                  variant="secondary"
                >
                  Return to Dashboard
                </Button>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Tab 3: Completion */}
        <TabsContent value="complete">
          <Card>
            <CardHeader>
              <CardTitle>Verification Complete</CardTitle>
              <CardDescription>
                Your eligibility verification has been recorded on the blockchain
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-center">
              <div className="flex flex-col items-center py-6">
                <div className="h-16 w-16 bg-[#22c55e]/10 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-[#22c55e]" />
                </div>
                <h2 className="text-xl font-bold">Successfully Verified!</h2>
                <p className="text-gray-600 mt-2 max-w-md">
                  Your eligibility for <span className="font-medium">{scheme.title}</span> has been verified 
                  and securely recorded on the blockchain.
                </p>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="flex flex-col items-center">
                  <QrCode className="h-12 w-12 text-[#007373] mb-4" />
                  <p className="text-sm text-gray-500 mb-2">Your Verification Token</p>
                  <p className="font-mono text-xl font-bold mb-2">{tokenCode}</p>
                  <Button 
                    variant="outline" 
                    className="text-[#007373] border-[#007373] hover:bg-[#007373]/5"
                    onClick={copyTokenToClipboard}
                  >
                    <Clipboard className="h-4 w-4 mr-2" />
                    Copy Token
                  </Button>
                </div>
                
                {transactionDetails && (
                  <div className="mt-6 text-left">
                    <h3 className="text-sm font-medium mb-3">Transaction Details</h3>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-gray-500">Transaction Hash</p>
                        <div className="flex items-center">
                          <p className="font-mono text-sm truncate mr-2">{transactionDetails.txHash}</p>
                          <a 
                            href={`https://sepolia.etherscan.io/tx/${transactionDetails.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#007373] hover:text-[#006363]"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Block Number</p>
                        <p className="font-mono text-sm">{transactionDetails.blockNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Transaction Cost</p>
                        <p className="font-mono text-sm">{transactionDetails.costEth} ETH</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="mt-4 text-sm text-gray-500">
                  <p>Keep this token safe. You may need to present it when claiming your benefits.</p>
                  <p className="mt-1">You can verify this token anytime using the public verification page.</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button 
                className="bg-[#007373] hover:bg-[#006363]"
                onClick={() => navigate("/dashboard")}
              >
                Return to Dashboard
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VerificationProcess;
