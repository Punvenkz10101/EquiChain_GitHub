import { SignIn } from "@clerk/clerk-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

const Login = () => {
  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-180px)] py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Login to EquiChain</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignIn 
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            afterSignInUrl="/dashboard"
          />
        </CardContent>
        <CardFooter className="flex flex-col">
          <div className="text-sm text-center text-gray-500 mt-2">
            Don't have an account?{" "}
            <Link to="/sign-up" className="text-[#007373] hover:underline">
              Register here
            </Link>
          </div>
          <div className="text-sm text-center text-gray-500 mt-2">
            Are you a verifier?{" "}
            <Link to="/verifier-login" className="text-[#58508d] hover:underline">
              Verifier login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
