import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useBlockchain } from "@/context/BlockchainContext";
import { getSchemeById } from "@/data/schemes";
import { Check as CheckIcon } from "lucide-react";
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
                Review the extracted information from your documents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {documentData && (
                <>
                  {/* Personal Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center border-b pb-2">
                        <span className="text-gray-600">Full Name</span>
                        <span className={`font-medium ${!documentData.extractedInfo?.['Personal Information']?.['Full Name'] ? 'text-gray-400 italic' : 'text-gray-800'}`}>
                          {documentData.extractedInfo?.['Personal Information']?.['Full Name'] || 'Not available'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-b pb-2">
                        <span className="text-gray-600">Date of Birth</span>
                        <span className={`font-medium ${!documentData.extractedInfo?.['Personal Information']?.['Date of Birth'] ? 'text-gray-400 italic' : 'text-gray-800'}`}>
                          {documentData.extractedInfo?.['Personal Information']?.['Date of Birth'] || 'Not available'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-b pb-2">
                        <span className="text-gray-600">Age</span>
                        <span className={`font-medium ${!documentData.extractedInfo?.['Personal Information']?.Age ? 'text-gray-400 italic' : 'text-gray-800'}`}>
                          {documentData.extractedInfo?.['Personal Information']?.Age || 'Not available'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-b pb-2">
                        <span className="text-gray-600">Gender</span>
                        <span className={`font-medium ${!documentData.extractedInfo?.['Personal Information']?.Gender ? 'text-gray-400 italic' : 'text-gray-800'}`}>
                          {documentData.extractedInfo?.['Personal Information']?.Gender || 'Not available'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-b pb-2">
                        <span className="text-gray-600">Mobile Number</span>
                        <span className={`font-medium ${!documentData.extractedInfo?.['Personal Information']?.['Mobile Number'] ? 'text-gray-400 italic' : 'text-gray-800'}`}>
                          {documentData.extractedInfo?.['Personal Information']?.['Mobile Number'] || 'Not available'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-b pb-2">
                        <span className="text-gray-600">Father's Name</span>
                        <span className={`font-medium ${!documentData.extractedInfo?.['Personal Information']?.["Father's Name"] ? 'text-gray-400 italic' : 'text-gray-800'}`}>
                          {documentData.extractedInfo?.['Personal Information']?.["Father's Name"] || 'Not available'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-b pb-2">
                        <span className="text-gray-600">Caste</span>
                        <span className={`font-medium ${!documentData.extractedInfo?.['Personal Information']?.Caste ? 'text-gray-400 italic' : 'text-gray-800'}`}>
                          {documentData.extractedInfo?.['Personal Information']?.Caste || 'Not available'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Aadhaar Details */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Aadhaar Details</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center border-b pb-2">
                        <span className="text-gray-600">Aadhaar Number</span>
                        <span className={`font-medium ${!documentData.extractedInfo?.['Aadhaar Details']?.['Aadhaar Number'] ? 'text-gray-400 italic' : 'text-gray-800'}`}>
                          {documentData.extractedInfo?.['Aadhaar Details']?.['Aadhaar Number'] || 'Not available'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-b pb-2">
                        <span className="text-gray-600">VID</span>
                        <span className={`font-medium ${!documentData.extractedInfo?.['Aadhaar Details']?.VID ? 'text-gray-400 italic' : 'text-gray-800'}`}>
                          {documentData.extractedInfo?.['Aadhaar Details']?.VID || 'Not available'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-b pb-2">
                        <span className="text-gray-600">Address</span>
                        <span className={`font-medium ${!documentData.extractedInfo?.['Aadhaar Details']?.Address ? 'text-gray-400 italic' : 'text-gray-800'}`}>
                          {documentData.extractedInfo?.['Aadhaar Details']?.Address || 'Not available'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-b pb-2">
                        <span className="text-gray-600">Issue Date</span>
                        <span className={`font-medium ${!documentData.extractedInfo?.['Aadhaar Details']?.['Issue Date'] ? 'text-gray-400 italic' : 'text-gray-800'}`}>
                          {documentData.extractedInfo?.['Aadhaar Details']?.['Issue Date'] || 'Not available'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* PAN Details */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">PAN Details</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center border-b pb-2">
                        <span className="text-gray-600">Permanent Account Number</span>
                        <span className={`font-medium ${!documentData.extractedInfo?.['PAN Details']?.['PAN Number'] ? 'text-gray-400 italic' : 'text-gray-800'}`}>
                          {documentData.extractedInfo?.['PAN Details']?.['PAN Number'] || 'Not available'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Financial Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Financial Information</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center border-b pb-2">
                        <span className="text-gray-600">Annual Income</span>
                        <span className={`font-medium ${!documentData.extractedInfo?.['Financial Information']?.['Annual Income'] ? 'text-gray-400 italic' : 'text-gray-800'}`}>
                          {documentData.extractedInfo?.['Financial Information']?.['Annual Income'] ? (
                            <span className="flex items-center">
                              <span className="mr-1">₹</span>
                              {parseInt(documentData.extractedInfo['Financial Information']['Annual Income']).toLocaleString('en-IN')}
                            </span>
                          ) : 'Not available'}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
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
