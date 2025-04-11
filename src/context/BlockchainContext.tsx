import { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { ethers } from "ethers";

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

// Initialize ethers provider and wallet
const ALCHEMY_URL = "https://eth-sepolia.g.alchemy.com/v2/8dxqRQ2iuA67wiIYfyx-TYZMBWREYiV0";
const PRIVATE_KEY = "0x03fdb1ddeec7c4075abdedbdb6e31bfe3cb6de16249423d28915d92c8e1b0802";

const provider = new ethers.JsonRpcProvider(ALCHEMY_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

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
    
    // Check blockchain connection
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const network = await provider.getNetwork();
      setIsConnected(true);
      console.log("Connected to network:", network.name);
    } catch (error) {
      console.error("Blockchain connection error:", error);
      setIsConnected(false);
    }
  };

  const connectWallet = async () => {
    setIsLoading(true);
    try {
      await checkConnection();
      if (!isConnected) {
        throw new Error("Failed to connect to blockchain network");
      }
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
      // Create claim data to be stored
      const claimDataToStore = {
        userHash: claimData.userHash,
        scheme: claimData.scheme,
        tokenCode: claimData.tokenCode,
        timestamp: new Date().toISOString()
      };

      console.log("Creating claim with data:", claimDataToStore);

      // Create a transaction to store the claim hash on the blockchain
      const claimHash = ethers.keccak256(
        ethers.toUtf8Bytes(JSON.stringify(claimDataToStore))
      );

      console.log("Generated claim hash:", claimHash);

      // Prepare transaction
      const transaction = {
        to: wallet.address, // Send to self as a marker transaction
        value: ethers.parseEther("0"), // 0 ETH value
        data: claimHash, // Store claim hash in transaction data
        gasLimit: 100000 // Set explicit gas limit
      };

      console.log("Sending transaction:", transaction);

      // Send transaction
      const tx = await wallet.sendTransaction(transaction);
      console.log("Transaction sent:", tx.hash);

      // Wait for transaction confirmation
      console.log("Waiting for transaction confirmation...");
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);

      if (!tx.hash) {
        throw new Error("Transaction hash is missing");
      }

      const newClaim: Claim = {
        id: "claim_" + Math.random().toString(36).substring(2, 9),
        blockchainHash: tx.hash, // Use tx.hash instead of receipt.hash
        timestamp: new Date().toISOString(),
        ...claimData
      };

      console.log("Created new claim:", newClaim);
      
      setClaims(prevClaims => {
        const updatedClaims = [...prevClaims, newClaim];
        localStorage.setItem("sahyogClaims", JSON.stringify(updatedClaims));
        return updatedClaims;
      });
      
      return newClaim;
    } catch (error) {
      console.error("Detailed blockchain transaction error:", error);
      if (error instanceof Error) {
        throw new Error(`Failed to record claim on blockchain: ${error.message}`);
      }
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
