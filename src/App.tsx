import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { BlockchainProvider } from "@/context/BlockchainContext";
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";

import Index from "@/pages/Index";
import Dashboard from "@/pages/Dashboard";
import PublicVerification from "@/pages/PublicVerification";
import VerificationProcess from "@/pages/VerificationProcess";
import Login from "@/pages/Login";
import VerifierLogin from "@/pages/VerifierLogin";
import VerifierDashboard from "@/pages/VerifierDashboard";
import Register from "@/pages/Register";
import Layout from "@/components/Layout";
import NotFound from "@/pages/NotFound";
import ProtectedRoute from "@/components/ProtectedRoute";

const queryClient = new QueryClient();
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const App = () => (
  <ClerkProvider publishableKey={clerkPubKey}>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BlockchainProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter> 
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Index />} />
                  <Route path="/sign-in/*" element={<Login />} />
                  <Route path="/sign-up/*" element={<Register />} />
                  <Route path="/verifier-login" element={<VerifierLogin />} />
                  <Route path="/public-verification" element={<PublicVerification />} />
                  <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/verification-process" element={<VerificationProcess />} />
                    <Route path="/verifier-dashboard" element={<VerifierDashboard />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </BlockchainProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ClerkProvider>
);

export default App;
