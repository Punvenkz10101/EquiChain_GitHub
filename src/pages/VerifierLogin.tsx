
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { LogIn, ShieldCheck } from "lucide-react";

const VerifierLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Here we would have a separate verifier login function in a real app
      // For the hackathon, we're using the same login function
      await login(email, password);
      toast.success("Verifier login successful");
      navigate("/verifier-dashboard");
    } catch (error) {
      let message = "Failed to login";
      if (error instanceof Error) {
        message = error.message;
      }
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-180px)] py-12 px-4">
      <Card className="w-full max-w-md border-[#58508d]">
        <CardHeader className="space-y-1">
          <div className="flex justify-center">
            <ShieldCheck className="h-12 w-12 text-[#58508d]" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Verifier Login</CardTitle>
          <CardDescription className="text-center">
            Authorized personnel only. Enter your credentials to access the verification portal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Official Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="official@gov.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="#" className="text-xs text-[#58508d] hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-[#58508d] hover:bg-[#4a4377]" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="loading-spinner mr-2"></div>
                  <span>Logging in...</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <LogIn className="mr-2 h-4 w-4" />
                  <span>Verifier Login</span>
                </div>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <div className="text-sm text-center text-gray-500 w-full">
            Regular user?{" "}
            <Link to="/login" className="text-[#007373] hover:underline">
              User login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default VerifierLogin;
