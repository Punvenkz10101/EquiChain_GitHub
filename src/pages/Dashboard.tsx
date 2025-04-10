
import { useAuth } from "@/context/AuthContext";
import { useBlockchain } from "@/context/BlockchainContext";
import { schemes } from "@/data/schemes";
import SchemeCard from "@/components/SchemeCard";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { user } = useAuth();
  const { claims } = useBlockchain();
  
  const userClaims = claims.filter(claim => 
    claim.userHash.includes(user?.id || '')
  );

  return (
    <div className="container max-w-6xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Welcome, {user?.name || 'User'}</h1>
      
      {/* User's approved schemes */}
      {userClaims.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Your Approved Schemes</h2>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Scheme</th>
                    <th className="text-left py-2 px-4">Date</th>
                    <th className="text-left py-2 px-4">Token Code</th>
                    <th className="text-left py-2 px-4">Verification</th>
                  </tr>
                </thead>
                <tbody>
                  {userClaims.map((claim) => (
                    <tr key={claim.id} className="border-b">
                      <td className="py-3 px-4">{claim.scheme}</td>
                      <td className="py-3 px-4">
                        {new Date(claim.timestamp).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono">{claim.tokenCode}</span>
                      </td>
                      <td className="py-3 px-4">
                        <Link 
                          to={`/public-verification?code=${claim.tokenCode}`}
                          className="text-[#007373] hover:underline flex items-center gap-1"
                        >
                          Verify
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      {/* Available schemes */}
      <h2 className="text-xl font-semibold mb-4">Available Welfare Schemes</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schemes.map((scheme) => (
          <SchemeCard
            key={scheme.id}
            title={scheme.title}
            description={scheme.description}
            eligibility={scheme.eligibility}
            icon={scheme.icon}
            schemeId={scheme.id}
          />
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
