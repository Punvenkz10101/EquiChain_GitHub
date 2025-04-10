
import { createContext, useState, useContext, ReactNode, useEffect } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  aadhaarNumber?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUserProfile: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is stored in localStorage
    const storedUser = localStorage.getItem("sahyogUser");
    
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      // For the hackathon, simulating backend authentication
      // In a real app, this would be an API call
      
      // Mock login delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create mock user data
      const mockUser = {
        id: "user_" + Math.random().toString(36).substring(2, 9),
        name: email.split('@')[0],
        email
      };
      
      setUser(mockUser);
      localStorage.setItem("sahyogUser", JSON.stringify(mockUser));
    } catch (error) {
      console.error("Login error:", error);
      throw new Error("Failed to login. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    
    try {
      // Simulating backend registration
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newUser = {
        id: "user_" + Math.random().toString(36).substring(2, 9),
        name,
        email
      };
      
      setUser(newUser);
      localStorage.setItem("sahyogUser", JSON.stringify(newUser));
    } catch (error) {
      console.error("Registration error:", error);
      throw new Error("Failed to register. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("sahyogUser");
  };

  const updateUserProfile = (data: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      localStorage.setItem("sahyogUser", JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateUserProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
