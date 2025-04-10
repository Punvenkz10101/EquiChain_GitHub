import { SignUp } from "@clerk/clerk-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

const Register = () => {
  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-180px)] py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Create an Account</CardTitle>
          <CardDescription className="text-center">
            Register to access welfare schemes and benefits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignUp 
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
            afterSignUpUrl="/dashboard"
          />
        </CardContent>
        <CardFooter className="flex flex-col">
          <div className="text-sm text-center text-gray-500 mt-2">
            Already have an account?{" "}
            <Link to="/sign-in" className="text-[#007373] hover:underline">
              Log in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Register;
