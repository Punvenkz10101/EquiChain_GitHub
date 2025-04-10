
import { createContext, useState, useContext, ReactNode, useEffect } from "react";

interface Claim {
  id: string;
  userHash: string;
  userName: string;
  scheme: string;
  timestamp: string;
  tokenCode: string;
  isEligible: boolean;
  blockchainHash: string;
}

interface BlockchainContextType {
  claims: Claim[];
  isConnected: boolean;
  isLoading: boolean;
  addClaim: (claim: Omit<Claim, "id" | "blockchainHash" | "timestamp">) => Promise<Claim>;
  getClaimByTokenCode: (tokenCode: string) => Claim | undefined;
  connectWallet: () => Promise<void>;
}

const BlockchainContext = createContext<BlockchainContextType | undefined>(undefined);

export const BlockchainProvider = ({ children }: { children: ReactNode }) => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load stored claims when the app starts
    const storedClaims = localStorage.getItem("sahyogClaims");
    if (storedClaims) {
      setClaims(JSON.parse(storedClaims));
    }
    
    // Mock blockchain connection status
    const mockConnection = localStorage.getItem("sahyogBlockchainConnected");
    setIsConnected(mockConnection === "true");
  }, []);

  const connectWallet = async () => {
    setIsLoading(true);
    try {
      // Simulate blockchain wallet connection
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsConnected(true);
      localStorage.setItem("sahyogBlockchainConnected", "true");
    } catch (error) {
      console.error("Blockchain connection error:", error);
      throw new Error("Failed to connect to blockchain. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const addClaim = async (claimData: Omit<Claim, "id" | "blockchainHash" | "timestamp">) => {
    setIsLoading(true);
    try {
      // Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate mock blockchain hash
      const blockchainHash = "0x" + Array(40).fill(0).map(() => 
        Math.floor(Math.random() * 16).toString(16)).join('');
      
      const newClaim: Claim = {
        id: "claim_" + Math.random().toString(36).substring(2, 9),
        blockchainHash,
        timestamp: new Date().toISOString(),
        ...claimData
      };
      
      setClaims(prevClaims => {
        const updatedClaims = [...prevClaims, newClaim];
        localStorage.setItem("sahyogClaims", JSON.stringify(updatedClaims));
        return updatedClaims;
      });
      
      return newClaim;
    } catch (error) {
      console.error("Blockchain transaction error:", error);
      throw new Error("Failed to record claim on blockchain. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getClaimByTokenCode = (tokenCode: string) => {
    return claims.find(claim => claim.tokenCode === tokenCode);
  };

  return (
    <BlockchainContext.Provider
      value={{
        claims,
        isConnected,
        isLoading,
        addClaim,
        getClaimByTokenCode,
        connectWallet
      }}
    >
      {children}
    </BlockchainContext.Provider>
  );
};

export const useBlockchain = () => {
  const context = useContext(BlockchainContext);
  if (context === undefined) {
    throw new Error("useBlockchain must be used within a BlockchainProvider");
  }
  return context;
};
