
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown, LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="bg-[#007373] text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center">
                <span className="text-[#007373] font-bold text-xl">EC</span>
              </div>
              <span className="ml-2 text-xl font-bold">EquiChain</span>
            </Link>
            
            <div className="hidden md:flex ml-10 space-x-8">
              <Link to="/" className="hover:text-gray-200 px-3 py-2 rounded-md text-sm font-medium">
                Home
              </Link>
              <Link to="/public-verification" className="hover:text-gray-200 px-3 py-2 rounded-md text-sm font-medium">
                Public Verification
              </Link>
              {isAuthenticated && (
                <Link to="/dashboard" className="hover:text-gray-200 px-3 py-2 rounded-md text-sm font-medium">
                  Dashboard
                </Link>
              )}
            </div>
          </div>
          
          <div className="hidden md:flex items-center">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-white hover:bg-[#006363]">
                    <User className="h-4 w-4 mr-2" />
                    {user?.name}
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-500">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="space-x-4">
                <Button asChild variant="outline" className="text-white border-white hover:bg-[#006363]">
                  <Link to="/login">Login</Link>
                </Button>
                <Button asChild className="bg-white text-[#007373] hover:bg-gray-100">
                  <Link to="/register">Register</Link>
                </Button>
              </div>
            )}
          </div>
          
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              type="button"
              className="text-white hover:text-gray-200 focus:outline-none"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-[#007373] border-t border-[#006363]">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link 
              to="/" 
              className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-[#006363]"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/public-verification" 
              className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-[#006363]"
              onClick={() => setIsMenuOpen(false)}
            >
              Public Verification
            </Link>
            {isAuthenticated && (
              <Link 
                to="/dashboard" 
                className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-[#006363]"
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
            )}
            
            {isAuthenticated ? (
              <button
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-white hover:bg-[#006363]"
              >
                Logout
              </button>
            ) : (
              <div className="space-y-2 pt-4">
                <Button 
                  asChild 
                  variant="outline" 
                  className="w-full text-white border-white hover:bg-[#006363]"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Link to="/login">Login</Link>
                </Button>
                <Button 
                  asChild 
                  className="w-full bg-white text-[#007373] hover:bg-gray-100"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Link to="/register">Register</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
