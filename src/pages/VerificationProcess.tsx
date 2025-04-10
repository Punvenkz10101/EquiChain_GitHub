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
  File
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
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);
  const [panFile, setPanFile] = useState<File | null>(null);
  const [incomeFile, setIncomeFile] = useState<File | null>(null);
  const [otherFiles, setOtherFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [documentData, setDocumentData] = useState<any>(null);
  const [eligibilityResult, setEligibilityResult] = useState<any>(null);
  const [tokenCode, setTokenCode] = useState<string | null>(null);
  const [isRecordingOnBlockchain, setIsRecordingOnBlockchain] = useState(false);
  const [blockchainRecorded, setBlockchainRecorded] = useState(false);

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

  const handleAadhaarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAadhaarFile(e.target.files[0]);
    }
  };

  const handlePanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPanFile(e.target.files[0]);
    }
  };

  const handleIncomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIncomeFile(e.target.files[0]);
    }
  };

  const handleOtherFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setOtherFiles(Array.from(e.target.files));
    }
  };

  const handleProcessDocuments = async () => {
    if (!aadhaarFile || !panFile || !incomeFile) {
      toast.error("Please upload all required documents");
      return;
    }

    setIsProcessing(true);
    setDocumentData(null);
    setEligibilityResult(null);
    
    try {
      // Combine all files
      const allFiles = [aadhaarFile, panFile, incomeFile, ...otherFiles].filter(Boolean);
      
      // 1. Extract data from documents using OCR (mock)
      const extractedData = await extractDataFromDocuments(allFiles);
      setDocumentData(extractedData);
      toast.success("Documents processed successfully");
      
      // Update user profile with extracted Aadhaar if available
      if (extractedData.aadhaarNumber && user) {
        updateUserProfile({ aadhaarNumber: extractedData.aadhaarNumber });
      }
      
      // 2. Check eligibility based on scheme criteria and extracted data
      const result = await checkEligibility(schemeId, extractedData);
      setEligibilityResult(result);
      
      // 3. Generate token code if eligible
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
      // Record the claim on the blockchain
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
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Eligibility Criteria</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {scheme.eligibility.map((item, index) => (
                    <li key={index} className="text-gray-700">{item}</li>
                  ))}
                </ul>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Required Documents</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {scheme.requiredDocuments.map((item, index) => (
                    <li key={index} className="text-gray-700">{item}</li>
                  ))}
                </ul>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Upload Documents</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Please upload clear photos or scans of all required documents.
                  For the hackathon demo, any image files will work.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Aadhaar Card Upload */}
                  <div className="border-2 border-dashed rounded-lg p-4 hover:bg-gray-50">
                    <label htmlFor="aadhaar-file" className="cursor-pointer">
                      <div className="flex flex-col items-center justify-center">
                        <FileText className="w-10 h-10 mb-3 text-[#007373]" />
                        <p className="mb-2 text-sm font-medium">Aadhaar Card</p>
                        <p className="text-xs text-gray-500">
                          Upload your Aadhaar card (front & back)
                        </p>
                        {aadhaarFile && (
                          <div className="mt-2 flex items-center text-green-500">
                            <Check className="h-4 w-4 mr-1" />
                            <span className="text-xs">{aadhaarFile.name}</span>
                          </div>
                        )}
                      </div>
                      <input
                        id="aadhaar-file"
                        type="file"
                        className="hidden"
                        onChange={handleAadhaarChange}
                        accept="image/*,.pdf"
                      />
                    </label>
                  </div>
                  
                  {/* PAN Card Upload */}
                  <div className="border-2 border-dashed rounded-lg p-4 hover:bg-gray-50">
                    <label htmlFor="pan-file" className="cursor-pointer">
                      <div className="flex flex-col items-center justify-center">
                        <CreditCard className="w-10 h-10 mb-3 text-[#007373]" />
                        <p className="mb-2 text-sm font-medium">PAN Card</p>
                        <p className="text-xs text-gray-500">
                          Upload your PAN card
                        </p>
                        {panFile && (
                          <div className="mt-2 flex items-center text-green-500">
                            <Check className="h-4 w-4 mr-1" />
                            <span className="text-xs">{panFile.name}</span>
                          </div>
                        )}
                      </div>
                      <input
                        id="pan-file"
                        type="file"
                        className="hidden"
                        onChange={handlePanChange}
                        accept="image/*,.pdf"
                      />
                    </label>
                  </div>
                  
                  {/* Income Certificate Upload */}
                  <div className="border-2 border-dashed rounded-lg p-4 hover:bg-gray-50">
                    <label htmlFor="income-file" className="cursor-pointer">
                      <div className="flex flex-col items-center justify-center">
                        <FileSpreadsheet className="w-10 h-10 mb-3 text-[#007373]" />
                        <p className="mb-2 text-sm font-medium">Income Certificate</p>
                        <p className="text-xs text-gray-500">
                          Income proof or certificate
                        </p>
                        {incomeFile && (
                          <div className="mt-2 flex items-center text-green-500">
                            <Check className="h-4 w-4 mr-1" />
                            <span className="text-xs">{incomeFile.name}</span>
                          </div>
                        )}
                      </div>
                      <input
                        id="income-file"
                        type="file"
                        className="hidden"
                        onChange={handleIncomeChange}
                        accept="image/*,.pdf"
                      />
                    </label>
                  </div>
                  
                  {/* Additional Documents Upload */}
                  <div className="border-2 border-dashed rounded-lg p-4 hover:bg-gray-50">
                    <label htmlFor="other-files" className="cursor-pointer">
                      <div className="flex flex-col items-center justify-center">
                        <File className="w-10 h-10 mb-3 text-[#007373]" />
                        <p className="mb-2 text-sm font-medium">Additional Documents</p>
                        <p className="text-xs text-gray-500">
                          Any other supporting documents (optional)
                        </p>
                        {otherFiles.length > 0 && (
                          <div className="mt-2 flex items-center text-green-500">
                            <Check className="h-4 w-4 mr-1" />
                            <span className="text-xs">{otherFiles.length} files added</span>
                          </div>
                        )}
                      </div>
                      <input
                        id="other-files"
                        type="file"
                        className="hidden"
                        multiple
                        onChange={handleOtherFilesChange}
                        accept="image/*,.pdf"
                      />
                    </label>
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
                disabled={!aadhaarFile || !panFile || !incomeFile || isProcessing}
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
