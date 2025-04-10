import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useBlockchain } from "@/context/BlockchainContext";
import { getSchemeById } from "@/data/schemes";
import { Check as CheckIcon, X as XIcon } from "lucide-react";
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
import { extractDataFromDocuments, checkEligibility, generateTokenCode, verifyExtractedData, type VerificationResults } from "@/data/mockAiService";
import { useUser } from "@clerk/clerk-react";

interface ExtractedInfo {
  'Personal Information': {
    'Full Name': string | null;
    'Date of Birth': string | null;
    'Age': string | null;
    'Gender': string | null;
    'Mobile Number': string | null;
    "Father's Name": string | null;
    'Caste': string | null;
  };
  'Aadhaar Details': {
    'Aadhaar Number': string | null;
    'VID': string | null;
    'Address': string | null;
    'Issue Date': string | null;
  };
  'PAN Details': {
    'PAN Number': string | null;
  };
  'Financial Information': {
    'Annual Income': string | null;
  };
}

interface DocumentData {
  name: string;
  aadhaarNumber: string;
  age: number;
  address: string;
  faces: string[];
  ocrText: string;
  extractedInfo: ExtractedInfo;
  filenames: string[];
}

interface EligibilityResult {
  eligible: boolean;
  reason: string;
  fraud_score: number;
}

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

const VerificationProcess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user: clerkUser, isLoaded } = useUser();
  const { user, updateUserProfile } = useAuth();
  const { isConnected, addClaim } = useBlockchain();
  
  const { schemeId, schemeTitle } = location.state || {};
  const scheme = getSchemeById(schemeId);
  
  const [activeTab, setActiveTab] = useState("requirements");
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [documentData, setDocumentData] = useState<DocumentData | null>(null);
  const [eligibilityResult, setEligibilityResult] = useState<EligibilityResult | null>(null);
  const [tokenCode, setTokenCode] = useState<string | null>(null);
  const [isRecordingOnBlockchain, setIsRecordingOnBlockchain] = useState(false);
  const [blockchainRecorded, setBlockchainRecorded] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState<{
    hash: string;
    timestamp: string;
  } | null>(null);
  const [faces, setFaces] = useState<string[]>([]);
  const [verificationResults, setVerificationResults] = useState<VerificationResults | null>(null);

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

    if (!isLoaded) {
      toast.error("Authentication is still loading");
      return;
    }

    if (!clerkUser) {
      toast.error("Please sign in to process documents");
      navigate("/sign-in");
      return;
    }

    setIsProcessing(true);
    setDocumentData(null);
    setEligibilityResult(null);
    setUploadStatus('uploading');
    
    try {
      const formData = new FormData();
      files.forEach(file => formData.append('file', file));
      formData.append('userId', clerkUser.id);

      console.log("Processing documents for user:", clerkUser.id);
      console.log("Number of files:", files.length);

      // Add timeout and proper error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout for multiple files

      const response = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      }).catch(error => {
        if (error.name === 'AbortError') {
          throw new Error('Request timed out. Please check if the server is running.');
        }
        throw new Error('Failed to connect to the server. Please check if the server is running.');
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process documents');
      }

      const data = await response.json();
      console.log("Received data from backend:", data);
      
      if (data.status === 'error') {
        throw new Error(data.message || 'Failed to process documents');
      }

      // Log detailed information
      console.log("Gemini Response Text:", data.geminiResponse);
      console.log("Extracted Information:", data.extractedInfo);
      console.log("Detected Faces:", data.faces);
      console.log("OCR Text:", data.ocrText);
      console.log("Processed Files:", data.filenames);

      // Store in localStorage
      const storedData = {
        ...data,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(`document_${clerkUser.id}_${data._id}`, JSON.stringify(storedData));

      // Update state with processed data
      const newDocumentData = {
        name: data.extractedInfo?.['Personal Information']?.['Full Name'] || '',
        aadhaarNumber: data.extractedInfo?.['Aadhaar Details']?.['Aadhaar Number'] || '',
        age: calculateAge(data.extractedInfo?.['Personal Information']?.['Date of Birth']),
        address: data.extractedInfo?.['Aadhaar Details']?.Address || '',
        faces: data.faces || [],
        ocrText: data.ocrText || '',
        extractedInfo: data.extractedInfo || {},
        filenames: data.filenames || []
      };

      console.log("Setting document data:", newDocumentData);
      setDocumentData(newDocumentData);
      setUploadStatus('success');

      toast.success("Documents processed successfully");
      
      // Update user profile with extracted Aadhaar if available
      if (data.extractedInfo?.['Aadhaar Details']?.['Aadhaar Number']) {
        updateUserProfile({ aadhaarNumber: data.extractedInfo['Aadhaar Details']['Aadhaar Number'] });
      }
      
      // Check eligibility based on scheme criteria and extracted data
      const result = await checkEligibility(schemeId, data.extractedInfo);
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
      setUploadStatus('error');
      toast.error(error instanceof Error ? error.message : "Failed to process documents. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper function to calculate age from date of birth
  const calculateAge = (dob: string | undefined): number => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleRecordOnBlockchain = async () => {
    if (!eligibilityResult?.eligible || !tokenCode) {
      toast.error("Unable to record on blockchain. Invalid eligibility or token.");
      return;
    }

    setIsRecordingOnBlockchain(true);
    
    try {
      // Record the claim on the blockchain
      const result = await addClaim({
        userHash: clerkUser?.id || "unknown",
        userName: clerkUser?.fullName || "Unknown User",
        scheme: scheme.title,
        tokenCode,
        isEligible: true
      });
      
      setTransactionDetails({
        hash: result.transactionHash || 'Unknown',
        timestamp: new Date().toISOString()
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setUploadStatus('uploading');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      console.log('Server response:', data);

      if (data.status === 'success') {
        setUploadStatus('success');
        setExtractedInfo(data.extractedInfo);
        setFaces(data.faces);
        setOcrText(data.ocrText);
        
        // Store in localStorage
        localStorage.setItem('extractedInfo', JSON.stringify(data.extractedInfo));
        localStorage.setItem('faces', JSON.stringify(data.faces));
        localStorage.setItem('ocrText', data.ocrText);
      } else {
        setUploadStatus('error');
        console.error('Error:', data.message);
      }
    } catch (error) {
      setUploadStatus('error');
      console.error('Error uploading file:', error);
    }
  };

  const fetchFaceImages = async (faceFiles: string[]) => {
    try {
      const images = await Promise.all(
        faceFiles.map(async (filename) => {
          const response = await fetch(`http://localhost:5000/api/faces/${filename}`);
          if (!response.ok) throw new Error('Failed to fetch face image');
          const blob = await response.blob();
          return URL.createObjectURL(blob);
        })
      );
      setFaces(images);
    } catch (error) {
      console.error('Error fetching face images:', error);
      toast.error('Failed to load face images');
    }
  };

  useEffect(() => {
    if (documentData?.faces?.length > 0) {
      fetchFaceImages(documentData.faces);
    }
  }, [documentData?.faces]);

  const verifyDocumentData = async () => {
    if (!documentData?.extractedInfo || !documentData?.aadhaarNumber) {
      toast.error("No document data available for verification");
      return;
    }

    const results = verifyExtractedData(documentData.extractedInfo, documentData.aadhaarNumber);
    setVerificationResults(results);
    
    if (!results) {
      toast.error("Could not verify document data - no matching record found");
      return;
    }

    const totalFields = Object.values(results).reduce((acc, section) => {
      return acc + Object.values(section).length;
    }, 0);

    const matchedFields = Object.values(results).reduce((acc, section) => {
      return acc + Object.values(section).filter(field => field.isMatch).length;
    }, 0);

    const matchPercentage = (matchedFields / totalFields) * 100;
    
    if (matchPercentage === 100) {
      toast.success("All fields verified successfully!");
    } else {
      toast.warning(`${matchPercentage.toFixed(1)}% of fields matched. Please review discrepancies.`);
    }
  };

  useEffect(() => {
    if (documentData?.extractedInfo && documentData?.aadhaarNumber) {
      verifyDocumentData();
    }
  }, [documentData]);

  const renderVerificationStatus = (isMatch: boolean, expectedValue?: string | number, extractedValue?: string | number) => (
    <div className="flex items-center gap-2">
      {isMatch ? (
        <CheckIcon className="h-5 w-5 text-green-500" />
      ) : (
        <div className="flex flex-col">
          <XIcon className="h-5 w-5 text-red-500" />
          <span className="text-xs text-red-500 mt-1">
            Expected: {expectedValue}
          </span>
        </div>
      )}
    </div>
  );

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
              <CardTitle>Document Verification Results</CardTitle>
              <CardDescription>
                Verification status for each field from your documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              {verificationResults ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Personal Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex justify-between items-center">
                        <span>Full Name</span>
                        {renderVerificationStatus(
                          verificationResults.personalInfo.fullName.isMatch,
                          verificationResults.personalInfo.fullName.expectedValue,
                          verificationResults.personalInfo.fullName.extractedValue
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Date of Birth</span>
                        {renderVerificationStatus(
                          verificationResults.personalInfo.dateOfBirth.isMatch,
                          verificationResults.personalInfo.dateOfBirth.expectedValue,
                          verificationResults.personalInfo.dateOfBirth.extractedValue
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Age</span>
                        {renderVerificationStatus(
                          verificationResults.personalInfo.age.isMatch,
                          verificationResults.personalInfo.age.expectedValue,
                          verificationResults.personalInfo.age.extractedValue
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Gender</span>
                        {renderVerificationStatus(
                          verificationResults.personalInfo.gender.isMatch,
                          verificationResults.personalInfo.gender.expectedValue,
                          verificationResults.personalInfo.gender.extractedValue
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Mobile Number</span>
                        {renderVerificationStatus(
                          verificationResults.personalInfo.mobileNumber.isMatch,
                          verificationResults.personalInfo.mobileNumber.expectedValue,
                          verificationResults.personalInfo.mobileNumber.extractedValue
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Father's Name</span>
                        {renderVerificationStatus(
                          verificationResults.personalInfo.fatherName.isMatch,
                          verificationResults.personalInfo.fatherName.expectedValue,
                          verificationResults.personalInfo.fatherName.extractedValue
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Caste</span>
                        {renderVerificationStatus(
                          verificationResults.personalInfo.caste.isMatch,
                          verificationResults.personalInfo.caste.expectedValue,
                          verificationResults.personalInfo.caste.extractedValue
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-medium mb-4">Aadhaar Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex justify-between items-center">
                        <span>Aadhaar Number</span>
                        {renderVerificationStatus(
                          verificationResults.aadhaarDetails.aadhaarNumber.isMatch,
                          verificationResults.aadhaarDetails.aadhaarNumber.expectedValue,
                          verificationResults.aadhaarDetails.aadhaarNumber.extractedValue
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        <span>VID</span>
                        {renderVerificationStatus(
                          verificationResults.aadhaarDetails.vid.isMatch,
                          verificationResults.aadhaarDetails.vid.expectedValue,
                          verificationResults.aadhaarDetails.vid.extractedValue
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Address</span>
                        {renderVerificationStatus(
                          verificationResults.aadhaarDetails.address.isMatch,
                          verificationResults.aadhaarDetails.address.expectedValue,
                          verificationResults.aadhaarDetails.address.extractedValue
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Issue Date</span>
                        {renderVerificationStatus(
                          verificationResults.aadhaarDetails.issueDate.isMatch,
                          verificationResults.aadhaarDetails.issueDate.expectedValue,
                          verificationResults.aadhaarDetails.issueDate.extractedValue
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-medium mb-4">PAN Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex justify-between items-center">
                        <span>PAN Number</span>
                        {renderVerificationStatus(
                          verificationResults.panDetails.panNumber.isMatch,
                          verificationResults.panDetails.panNumber.expectedValue,
                          verificationResults.panDetails.panNumber.extractedValue
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-medium mb-4">Financial Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex justify-between items-center">
                        <span>Annual Income</span>
                        {renderVerificationStatus(
                          verificationResults.financialInfo.annualIncome.isMatch,
                          verificationResults.financialInfo.annualIncome.expectedValue,
                          verificationResults.financialInfo.annualIncome.extractedValue
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No verification results available</p>
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
              
              <Separator className="my-6" />

              {/* Add Eligibility and Fraud Score Section */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium mb-4">Identity Verification Result</h3>
                
                <div className="space-y-6">
                  {/* Eligibility Status */}
                  <div className="flex items-start gap-3">
                    {eligibilityResult?.eligible ? (
                      <>
                        <CheckIcon className="h-6 w-6 text-green-500 mt-1" />
                        <div>
                          <h4 className="font-medium text-green-700">Identity Verified</h4>
                          <p className="text-sm text-green-600">{eligibilityResult.reason}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <XIcon className="h-6 w-6 text-red-500 mt-1" />
                        <div>
                          <h4 className="font-medium text-red-700">Verification Failed</h4>
                          <p className="text-sm text-red-600">{eligibilityResult?.reason}</p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Fraud Score */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Identity Match Score</span>
                      <span className={`text-sm font-medium ${
                        (100 - (eligibilityResult?.fraud_score || 0)) >= 70 
                          ? 'text-green-600' 
                          : (100 - (eligibilityResult?.fraud_score || 0)) >= 30 
                            ? 'text-yellow-600' 
                            : 'text-red-600'
                      }`}>
                        {100 - (eligibilityResult?.fraud_score || 0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full transition-all duration-500 ${
                          (100 - (eligibilityResult?.fraud_score || 0)) >= 70 
                            ? 'bg-green-500' 
                            : (100 - (eligibilityResult?.fraud_score || 0)) >= 30 
                              ? 'bg-yellow-500' 
                              : 'bg-red-500'
                        }`}
                        style={{ width: `${100 - (eligibilityResult?.fraud_score || 0)}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      {(100 - (eligibilityResult?.fraud_score || 0)) >= 70 
                        ? 'High confidence in identity match' 
                        : (100 - (eligibilityResult?.fraud_score || 0)) >= 30 
                          ? 'Moderate confidence in identity match' 
                          : 'Low confidence in identity match'}
                    </p>
                  </div>

                  {/* Token Display (if eligible) */}
                  {eligibilityResult?.eligible && tokenCode && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckIcon className="h-5 w-5 text-green-500" />
                        <h4 className="font-medium text-gray-900">Verification Token</h4>
                      </div>
                      <div className="flex items-center justify-center gap-2 bg-white p-3 rounded-md">
                        <code className="text-lg font-mono font-semibold">{tokenCode}</code>
                        <button 
                          onClick={copyTokenToClipboard}
                          className="text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          <Clipboard className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 text-center mt-2">
                        This token will be recorded on the blockchain for verification
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="flex flex-col items-center py-6">
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
                  <div className="mt-4 text-sm text-gray-500">
                    <p className="font-medium">Transaction Details:</p>
                    <p className="font-mono break-all mt-1">{transactionDetails.hash}</p>
                    <p className="mt-1">Recorded on: {new Date(transactionDetails.timestamp).toLocaleString()}</p>
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

      {uploadStatus === 'success' && faces.length > 0 && (
        <div className="p-6 bg-white rounded-lg shadow-sm">
          <div className="flex flex-wrap gap-4 justify-center">
            {faces.map((faceUrl, index) => (
              <div key={index} className="relative">
                <img 
                  src={faceUrl}
                  alt={`Face ${index + 1}`}
                  className="w-24 h-24 rounded-lg object-cover border-2 border-[#007373]"
                />
                <div className="absolute -top-2 -right-2 bg-[#007373] rounded-full w-6 h-6 flex items-center justify-center">
                  <CheckIcon className="w-4 h-4 text-white" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VerificationProcess;
