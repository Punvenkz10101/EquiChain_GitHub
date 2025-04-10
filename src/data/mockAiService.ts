
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

// Mock database of trusted users
const trustedUsers = [
  {
    aadhaarNumber: "1234 5678 9012",
    name: "Ramesh Kumar",
    age: 65,
    income: 75000,
    address: "123, Some Street, City, State"
  },
  {
    aadhaarNumber: "9876 5432 1098",
    name: "Priya Singh",
    age: 32,
    income: 180000,
    address: "456, Some Street, City, State"
  },
  {
    aadhaarNumber: "5678 1234 5678",
    name: "Suresh Patel",
    age: 70,
    income: 50000,
    address: "789, Some Street, City, State"
  },
  {
    aadhaarNumber: "1111 2222 3333",
    name: "Anjali Sharma",
    age: 22,
    income: 150000,
    address: "101, Some Street, City, State"
  }
];

/**
 * Mock function to extract data from uploaded documents using OCR
 */
export const extractDataFromDocuments = async (files: File[]): Promise<DocumentData> => {
  // Simulating document processing delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // For the hackathon, we'll return random mock data from our trusted users
  const randomUser = trustedUsers[Math.floor(Math.random() * trustedUsers.length)];
  
  // Simulate some variation in the data
  return {
    ...randomUser,
    income: randomUser.income + Math.floor(Math.random() * 10000) // Add some random variation
  };
};

/**
 * Mock function to check eligibility based on scheme criteria and extracted data
 */
export const checkEligibility = async (
  schemeId: string, 
  documentData: DocumentData
): Promise<EligibilityResult> => {
  // Simulating API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Check eligibility based on scheme ID
  switch (schemeId) {
    case "old-age-pension":
      if (documentData.age && documentData.age >= 60 && 
          documentData.income && documentData.income <= 100000) {
        return {
          eligible: true,
          fraud_score: Math.floor(Math.random() * 30), // Random score between 0-29
          reason: "Meets age and income criteria for pension scheme"
        };
      } else {
        return {
          eligible: false,
          fraud_score: 0,
          reason: documentData.age && documentData.age < 60 
            ? "Age below required minimum of 60 years"
            : "Income exceeds maximum limit of ₹1,00,000"
        };
      }
    
    case "food-subsidy":
      if (documentData.income && documentData.income <= 250000) {
        return {
          eligible: true,
          fraud_score: Math.floor(Math.random() * 30),
          reason: "Meets income criteria for food subsidy"
        };
      } else {
        return {
          eligible: false,
          fraud_score: 0,
          reason: "Income exceeds maximum limit of ₹2,50,000"
        };
      }
    
    case "education-scholarship":
      // For education, we'll just check income and assume marks requirement is met
      if (documentData.income && documentData.income <= 300000) {
        return {
          eligible: true,
          fraud_score: Math.floor(Math.random() * 30),
          reason: "Meets income criteria for scholarship"
        };
      } else {
        return {
          eligible: false,
          fraud_score: 0,
          reason: "Family income exceeds maximum limit of ₹3,00,000"
        };
      }
    
    case "health-insurance":
      if (documentData.income && documentData.income <= 150000) {
        return {
          eligible: true,
          fraud_score: Math.floor(Math.random() * 30),
          reason: "Meets income criteria for health insurance"
        };
      } else {
        return {
          eligible: false,
          fraud_score: 0,
          reason: "Income exceeds maximum limit of ₹1,50,000"
        };
      }
    
    default:
      return {
        eligible: false,
        fraud_score: 50,
        reason: "Unknown scheme or invalid data"
      };
  }
};

/**
 * Generate a unique token code for eligible beneficiaries
 */
export const generateTokenCode = (): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  // Generate a 10-character token
  for (let i = 0; i < 10; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
};
