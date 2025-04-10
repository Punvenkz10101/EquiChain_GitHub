
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, UserCheck, UserIcon, BadgeIndianRupee, ChevronsUp } from "lucide-react";
import { Link } from "react-router-dom";

interface SchemeCardProps {
  title: string;
  description: string;
  eligibility: string[];
  icon: "pension" | "food" | "education" | "health";
  schemeId: string;
}

const SchemeCard = ({ title, description, eligibility, icon, schemeId }: SchemeCardProps) => {
  const getIcon = () => {
    switch (icon) {
      case "pension":
        return <ChevronsUp className="h-8 w-8 text-[#00CCCC]" />;
      case "food":
        return <BadgeIndianRupee className="h-8 w-8 text-[#00CCCC]" />;
      case "education":
        return <UserCheck className="h-8 w-8 text-[#00CCCC]" />;
      case "health":
        return <UserIcon className="h-8 w-8 text-[#00CCCC]" />;
      default:
        return <UserCheck className="h-8 w-8 text-[#00CCCC]" />;
    }
  };

  return (
    <Card className="transition-all hover:shadow-lg flex flex-col h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold">{title}</CardTitle>
          <div className="rounded-full p-2 bg-[#003333]/10">{getIcon()}</div>
        </div>
        <CardDescription className="text-sm text-[#232020]">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <h4 className="text-sm font-semibold mb-2">Eligibility Criteria:</h4>
        <ul className="text-sm list-disc pl-5 space-y-1 text-gray-700">
          {eligibility.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full bg-[#003333] hover:bg-[#00CCCC]">
          <Link 
            to="/verification-process" 
            state={{ schemeId, schemeTitle: title }}
          >
            Apply Now <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SchemeCard;
