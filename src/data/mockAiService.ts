// Mock AI service for document verification and eligibility checking

interface EligibilityResult {
  eligible: boolean;
  fraud_score: number;
  reason: string;
}

interface DocumentData {
  aadhaarNumber?: string;
  name?: string;
  age?: number;
  income?: number;
  address?: string;
}

// Mock database of verified individuals
const verifiedIndividuals = [
  {
    aadhaarNumber: "7803 1543 5762",
    personalInfo: {
      fullName: "Balaji Ram R",
      dateOfBirth: "10/05/2004",
      age: 20,
      gender: "MALE",
      mobileNumber: "8088564593",
      fatherName: "RANGA YERRASWAMY",
      caste: "PadmaSale/PadmaShali/PadmaSali"
    },
    aadhaarDetails: {
      vid: "9128 9098 6303 8330",
      address: "C/O: Ranga Yerraswamy, 2/18 Flat No 10 Shinto Niaya, K Hanumatha Layout 2nd Cross 52nd Main, Near Niranjan Central Apartments, BTM 1st Stage Tavarekere, Bangalore South, Bengaluru Karnataka - 560029",
      issueDate: "30/03/2013"
    },
    panDetails: {
      panNumber: "GCQPR3497N"
    },
    financialInfo: {
      annualIncome: 482000
    },
    isReal: true
  },
  {
    aadhaarNumber: "5678 9012 3456",
    personalInfo: {
      fullName: "Priya Sharma",
      dateOfBirth: "15/08/1995",
      age: 29,
      gender: "FEMALE",
      mobileNumber: "9876543210",
      fatherName: "Rajesh Sharma",
      caste: "General"
    },
    aadhaarDetails: {
      vid: "8765 4321 9876 5432",
      address: "123, Park Street, Koramangala, Bangalore, Karnataka - 560034",
      issueDate: "12/06/2015"
    },
    panDetails: {
      panNumber: "ABCDE1234F"
    },
    financialInfo: {
      annualIncome: 750000
    },
    isReal: true
  },
  {
    aadhaarNumber: "9012 3456 7890",
    personalInfo: {
      fullName: "Mohammed Ahmed",
      dateOfBirth: "22/03/1988",
      age: 36,
      gender: "MALE",
      mobileNumber: "7654321098",
      fatherName: "Abdul Ahmed",
      caste: "OBC"
    },
    aadhaarDetails: {
      vid: "6543 2109 8765 4321",
      address: "45/2, MG Road, Chennai, Tamil Nadu - 600001",
      issueDate: "05/11/2014"
    },
    panDetails: {
      panNumber: "FGHIJ5678K"
    },
    financialInfo: {
      annualIncome: 620000
    },
    isReal: true
  },
  {
    aadhaarNumber: "3456 7890 1234",
    personalInfo: {
      fullName: "Sita Patel",
      dateOfBirth: "30/12/1992",
      age: 32,
      gender: "FEMALE",
      mobileNumber: "8765432109",
      fatherName: "Ramesh Patel",
      caste: "OBC"
    },
    aadhaarDetails: {
      vid: "5432 1098 7654 3210",
      address: "789, Lake View Apartments, HSR Layout, Bangalore, Karnataka - 560102",
      issueDate: "18/09/2016"
    },
    panDetails: {
      panNumber: "LMNOP9012Q"
    },
    financialInfo: {
      annualIncome: 850000
    },
    isReal: true
  },
  // Fake entry with mismatched information
  {
    aadhaarNumber: "1234 5678 9012",
    personalInfo: {
      fullName: "John Doe",
      dateOfBirth: "01/01/1990",
      age: 34,
      gender: "MALE",
      mobileNumber: "9999999999",
      fatherName: "Richard Doe",
      caste: "General"
    },
    aadhaarDetails: {
      vid: "4321 0987 6543 2109",
      address: "Fake Address, Nowhere City - 000000",
      issueDate: "01/01/2020"
    },
    panDetails: {
      panNumber: "XYZZZ9999Z"
    },
    financialInfo: {
      annualIncome: 1000000
    },
    isReal: false
  }
];

/**
 * Mock function to extract data from uploaded documents using OCR
 */
export const extractDataFromDocuments = async (files: File[]): Promise<any> => {
  // Simulating API call delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // For demo, return the first verified individual's data
  const mockData = verifiedIndividuals[0];
  
  return {
    name: mockData.personalInfo.fullName,
    aadhaarNumber: mockData.aadhaarNumber,
    age: mockData.personalInfo.age,
    address: mockData.aadhaarDetails.address,
    extractedInfo: {
      'Personal Information': {
        'Full Name': mockData.personalInfo.fullName,
        'Date of Birth': mockData.personalInfo.dateOfBirth,
        'Age': mockData.personalInfo.age.toString(),
        'Gender': mockData.personalInfo.gender,
        'Mobile Number': mockData.personalInfo.mobileNumber,
        "Father's Name": mockData.personalInfo.fatherName,
        'Caste': mockData.personalInfo.caste
      },
      'Aadhaar Details': {
        'Aadhaar Number': mockData.aadhaarNumber,
        'VID': mockData.aadhaarDetails.vid,
        'Address': mockData.aadhaarDetails.address,
        'Issue Date': mockData.aadhaarDetails.issueDate
      },
      'PAN Details': {
        'PAN Number': mockData.panDetails.panNumber
      },
      'Financial Information': {
        'Annual Income': mockData.financialInfo.annualIncome.toString()
      }
    }
  };
};

/**
 * Mock function to check eligibility based on scheme criteria and extracted data
 */
export const checkEligibility = async (schemeId: string, extractedInfo: any): Promise<EligibilityResult> => {
  // Simulating API call delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Get Aadhaar number from extracted info
  const aadhaarNumber = extractedInfo?.['Aadhaar Details']?.['Aadhaar Number'];
  
  // Find the individual in our verified database
  const verifiedIndividual = verifiedIndividuals.find(
    individual => individual.aadhaarNumber === aadhaarNumber
  );
  
  if (!verifiedIndividual) {
    return {
      eligible: false,
      reason: "Unable to verify identity. No matching records found.",
      fraud_score: 100
    };
  }
  
  // Compare extracted info with verified data
  const matchScore = calculateMatchScore(extractedInfo, verifiedIndividual);
  const fraudScore = 100 - matchScore;
  
  return {
    eligible: fraudScore < 30,
    reason: fraudScore < 30 
      ? "Identity verified successfully. All documents match our records." 
      : "Possible fraudulent application. Information mismatch detected.",
    fraud_score: fraudScore
  };
};

const calculateMatchScore = (extractedInfo: any, verifiedData: any): number => {
  let totalPoints = 0;
  let matchedPoints = 0;
  
  // Check Personal Information
  const personalInfo = extractedInfo['Personal Information'];
  if (personalInfo) {
    totalPoints += 60; // Personal info carries more weight
    if (personalInfo['Full Name']?.toLowerCase() === verifiedData.personalInfo.fullName.toLowerCase()) matchedPoints += 15;
    if (personalInfo['Date of Birth'] === verifiedData.personalInfo.dateOfBirth) matchedPoints += 15;
    if (personalInfo['Gender'] === verifiedData.personalInfo.gender) matchedPoints += 10;
    if (personalInfo['Father\'s Name']?.toLowerCase() === verifiedData.personalInfo.fatherName.toLowerCase()) matchedPoints += 10;
    if (personalInfo['Mobile Number'] === verifiedData.personalInfo.mobileNumber) matchedPoints += 10;
  }
  
  // Check Aadhaar Details
  const aadhaarDetails = extractedInfo['Aadhaar Details'];
  if (aadhaarDetails) {
    totalPoints += 40;
    if (aadhaarDetails['VID'] === verifiedData.aadhaarDetails.vid) matchedPoints += 15;
    if (aadhaarDetails['Address']?.toLowerCase().includes(verifiedData.aadhaarDetails.address.toLowerCase())) matchedPoints += 15;
    if (aadhaarDetails['Issue Date'] === verifiedData.aadhaarDetails.issueDate) matchedPoints += 10;
  }
  
  return (matchedPoints / totalPoints) * 100;
};

export interface FieldVerificationResult {
  isMatch: boolean;
  expectedValue?: string | number;
  extractedValue?: string | number;
}

export interface VerificationResults {
  personalInfo: {
    fullName: FieldVerificationResult;
    dateOfBirth: FieldVerificationResult;
    age: FieldVerificationResult;
    gender: FieldVerificationResult;
    mobileNumber: FieldVerificationResult;
    fatherName: FieldVerificationResult;
    caste: FieldVerificationResult;
  };
  aadhaarDetails: {
    aadhaarNumber: FieldVerificationResult;
    vid: FieldVerificationResult;
    address: FieldVerificationResult;
    issueDate: FieldVerificationResult;
  };
  panDetails: {
    panNumber: FieldVerificationResult;
  };
  financialInfo: {
    annualIncome: FieldVerificationResult;
  };
}

export const verifyExtractedData = (extractedInfo: any, aadhaarNumber: string): VerificationResults | null => {
  const verifiedPerson = verifiedIndividuals.find(person => person.aadhaarNumber.replace(/\s/g, '') === aadhaarNumber.replace(/\s/g, ''));
  
  if (!verifiedPerson) return null;

  return {
    personalInfo: {
      fullName: {
        isMatch: extractedInfo?.['Personal Information']?.['Full Name']?.toLowerCase() === verifiedPerson.personalInfo.fullName.toLowerCase(),
        expectedValue: verifiedPerson.personalInfo.fullName,
        extractedValue: extractedInfo?.['Personal Information']?.['Full Name']
      },
      dateOfBirth: {
        isMatch: extractedInfo?.['Personal Information']?.['Date of Birth'] === verifiedPerson.personalInfo.dateOfBirth,
        expectedValue: verifiedPerson.personalInfo.dateOfBirth,
        extractedValue: extractedInfo?.['Personal Information']?.['Date of Birth']
      },
      age: {
        isMatch: Number(extractedInfo?.['Personal Information']?.['Age']) === verifiedPerson.personalInfo.age,
        expectedValue: verifiedPerson.personalInfo.age,
        extractedValue: Number(extractedInfo?.['Personal Information']?.['Age'])
      },
      gender: {
        isMatch: extractedInfo?.['Personal Information']?.['Gender']?.toLowerCase() === verifiedPerson.personalInfo.gender.toLowerCase(),
        expectedValue: verifiedPerson.personalInfo.gender,
        extractedValue: extractedInfo?.['Personal Information']?.['Gender']
      },
      mobileNumber: {
        isMatch: extractedInfo?.['Personal Information']?.['Mobile Number'] === verifiedPerson.personalInfo.mobileNumber,
        expectedValue: verifiedPerson.personalInfo.mobileNumber,
        extractedValue: extractedInfo?.['Personal Information']?.['Mobile Number']
      },
      fatherName: {
        isMatch: extractedInfo?.['Personal Information']?.["Father's Name"]?.toLowerCase() === verifiedPerson.personalInfo.fatherName.toLowerCase(),
        expectedValue: verifiedPerson.personalInfo.fatherName,
        extractedValue: extractedInfo?.['Personal Information']?.["Father's Name"]
      },
      caste: {
        isMatch: extractedInfo?.['Personal Information']?.['Caste']?.toLowerCase() === verifiedPerson.personalInfo.caste.toLowerCase(),
        expectedValue: verifiedPerson.personalInfo.caste,
        extractedValue: extractedInfo?.['Personal Information']?.['Caste']
      }
    },
    aadhaarDetails: {
      aadhaarNumber: {
        isMatch: extractedInfo?.['Aadhaar Details']?.['Aadhaar Number']?.replace(/\s/g, '') === verifiedPerson.aadhaarNumber.replace(/\s/g, ''),
        expectedValue: verifiedPerson.aadhaarNumber,
        extractedValue: extractedInfo?.['Aadhaar Details']?.['Aadhaar Number']
      },
      vid: {
        isMatch: extractedInfo?.['Aadhaar Details']?.['VID'] === verifiedPerson.aadhaarDetails.vid,
        expectedValue: verifiedPerson.aadhaarDetails.vid,
        extractedValue: extractedInfo?.['Aadhaar Details']?.['VID']
      },
      address: {
        isMatch: extractedInfo?.['Aadhaar Details']?.['Address']?.toLowerCase() === verifiedPerson.aadhaarDetails.address.toLowerCase(),
        expectedValue: verifiedPerson.aadhaarDetails.address,
        extractedValue: extractedInfo?.['Aadhaar Details']?.['Address']
      },
      issueDate: {
        isMatch: extractedInfo?.['Aadhaar Details']?.['Issue Date'] === verifiedPerson.aadhaarDetails.issueDate,
        expectedValue: verifiedPerson.aadhaarDetails.issueDate,
        extractedValue: extractedInfo?.['Aadhaar Details']?.['Issue Date']
      }
    },
    panDetails: {
      panNumber: {
        isMatch: extractedInfo?.['PAN Details']?.['PAN Number'] === verifiedPerson.panDetails.panNumber,
        expectedValue: verifiedPerson.panDetails.panNumber,
        extractedValue: extractedInfo?.['PAN Details']?.['PAN Number']
      }
    },
    financialInfo: {
      annualIncome: {
        isMatch: Number(extractedInfo?.['Financial Information']?.['Annual Income']) === verifiedPerson.financialInfo.annualIncome,
        expectedValue: verifiedPerson.financialInfo.annualIncome,
        extractedValue: Number(extractedInfo?.['Financial Information']?.['Annual Income'])
      }
    }
  };
};

/**
 * Generate a unique token code for eligible beneficiaries
 */
export const generateTokenCode = (): string => {
  return Math.random().toString(36).substring(2, 15).toUpperCase();
};
