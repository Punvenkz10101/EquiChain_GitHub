
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ShieldCheck, User, BarChart3, ExternalLink } from "lucide-react";
import { useBlockchain } from "@/context/BlockchainContext";
import { schemes, getIconForScheme } from "@/data/schemes";
import { useAuth } from "@/context/AuthContext";

const Index = () => {
  const { claims } = useBlockchain();
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full bg-gradient-to-br from-[#003333] to-[#00CCCC] py-16 md:py-24 text-white">
        <div className="container max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-6">
            Secure & Transparent Welfare Benefits Distribution
          </h1>
          <p className="text-lg md:text-xl mb-8 max-w-3xl mx-auto">
            EquiChain combines AI verification and blockchain technology to streamline government 
            welfare programs, ensuring benefits reach only legitimate recipients while maintaining 
            complete transparency throughout the process.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="bg-white text-[#003333] hover:bg-gray-100">
              <Link to="/dashboard">Check Eligibility</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-white border-white hover:bg-[#003333]/30">
              <Link to="/public-verification">Verify Benefits</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 container max-w-6xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 text-[#003333]">How EquiChain Works</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="flex justify-center mb-4">
              <User className="h-12 w-12 text-[#00CCCC]" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-[#003333]">Verify Identity</h3>
            <p className="text-gray-600">
              Upload your documents securely. Our AI system verifies your identity 
              and eligibility for various welfare schemes.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="flex justify-center mb-4">
              <ShieldCheck className="h-12 w-12 text-[#00CCCC]" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-[#003333]">Blockchain Verification</h3>
            <p className="text-gray-600">
              All eligibility checks are recorded on the blockchain, ensuring 
              permanent, tamper-proof verification of your benefits.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="flex justify-center mb-4">
              <BarChart3 className="h-12 w-12 text-[#00CCCC]" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-[#003333]">Public Transparency</h3>
            <p className="text-gray-600">
              Anyone can verify the authenticity of benefit claims through our 
              public verification portal, ensuring complete transparency.
            </p>
          </div>
        </div>
      </section>
      
      {/* Available Schemes Section */}
      <section className="w-full bg-[#f7f9fa] py-16">
        <div className="container max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-[#003333]">Available Welfare Schemes</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {schemes.slice(0, 3).map((scheme) => {
              const IconComponent = getIconForScheme(scheme.icon);
              return (
                <div key={scheme.id} className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex items-center mb-4">
                    <div className="p-2 rounded-full bg-[#003333]/10 mr-3">
                      <IconComponent className="h-6 w-6 text-[#00CCCC]" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#003333]">{scheme.title}</h3>
                  </div>
                  <p className="text-gray-600 mb-4 text-sm">{scheme.description}</p>
                  <Button asChild className="w-full bg-[#003333] hover:bg-[#00CCCC]">
                    <Link to={isAuthenticated ? "/dashboard" : "/login"}>Check Eligibility</Link>
                  </Button>
                </div>
              );
            })}
          </div>
          
          <div className="text-center mt-8">
            <Button asChild variant="outline" className="border-[#003333] text-[#003333] hover:bg-[#003333]/5">
              <Link to={isAuthenticated ? "/dashboard" : "/login"}>View All Schemes</Link>
            </Button>
          </div>
        </div>
      </section>
      
      {/* Verification Records Section - Simplified */}
      <section className="py-16 container max-w-6xl mx-auto px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-[#003333]">Verification Records</h2>
        
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          All benefit claims are verified and recorded on the blockchain, 
          ensuring complete transparency and preventing fraud.
        </p>
        
        <Button asChild className="bg-[#003333] hover:bg-[#00CCCC]">
          <Link to="/public-verification">Verify a Claim</Link>
        </Button>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 container max-w-6xl mx-auto px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-[#003333]">Ready to Get Started?</h2>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          Check your eligibility for government welfare schemes now, or verify the 
          authenticity of an existing benefit claim.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button asChild size="lg" className="bg-[#003333] hover:bg-[#00CCCC] text-white">
            <Link to={isAuthenticated ? "/dashboard" : "/register"}>
              {isAuthenticated ? "Go to Dashboard" : "Register Now"}
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-[#003333] text-[#003333] hover:bg-[#003333]/5">
            <Link to="/public-verification">Verify a Claim</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
