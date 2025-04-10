
import { UserCheck, BadgeIndianRupee, ChevronsUp, UserIcon } from "lucide-react";
import { LucideIcon } from "lucide-react";

export interface Scheme {
  id: string;
  title: string;
  description: string;
  eligibility: string[];
  requiredDocuments: string[];
  icon: "pension" | "food" | "education" | "health";
}

export const schemes: Scheme[] = [
  {
    id: "old-age-pension",
    title: "Old Age Pension Scheme",
    description: "Monthly pension support for elderly citizens to ensure financial stability and dignity in old age.",
    eligibility: [
      "Age 60 years or above",
      "Annual income less than ₹1,00,000",
      "Not receiving any other pension"
    ],
    requiredDocuments: [
      "Aadhaar Card",
      "Age Proof Certificate",
      "Income Certificate",
      "Bank Account Details"
    ],
    icon: "pension"
  },
  {
    id: "food-subsidy",
    title: "National Food Security Scheme",
    description: "Subsidized food grains for low-income families to ensure access to essential nutrition.",
    eligibility: [
      "Annual household income less than ₹2,50,000",
      "Not owning a 4-wheeler vehicle",
      "Not paying income tax"
    ],
    requiredDocuments: [
      "Aadhaar Card",
      "Income Certificate",
      "Residence Proof",
      "Family Details"
    ],
    icon: "food"
  },
  {
    id: "education-scholarship",
    title: "Education Scholarship Program",
    description: "Financial support for students from underprivileged backgrounds to pursue higher education.",
    eligibility: [
      "Student of Class 9 to Post-Graduation",
      "Family income less than ₹3,00,000 per annum",
      "Minimum 60% marks in previous exam"
    ],
    requiredDocuments: [
      "Aadhaar Card",
      "Income Certificate",
      "Previous Year Marksheet",
      "School/College ID"
    ],
    icon: "education"
  },
  {
    id: "health-insurance",
    title: "Comprehensive Health Insurance",
    description: "Health coverage for families below poverty line to access quality healthcare services.",
    eligibility: [
      "Annual family income less than ₹1,50,000",
      "Not covered under any other government health scheme",
      "Valid proof of identity and residence"
    ],
    requiredDocuments: [
      "Aadhaar Card",
      "Income Certificate",
      "Residence Proof",
      "Family Details"
    ],
    icon: "health"
  }
];

export const getSchemeById = (id: string): Scheme | undefined => {
  return schemes.find(scheme => scheme.id === id);
};

// Helper function to get the appropriate icon component based on the scheme icon type
export const getIconForScheme = (iconType: Scheme['icon']): LucideIcon => {
  switch (iconType) {
    case "pension":
      return ChevronsUp;
    case "food":
      return BadgeIndianRupee;
    case "education":
      return UserCheck;
    case "health":
      return UserIcon;
    default:
      return UserCheck;
  }
};
