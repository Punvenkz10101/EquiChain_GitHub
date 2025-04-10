
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-[#58508d] text-white">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">EquiChain</h3>
            <p className="text-gray-300 text-sm">
              Streamlining social welfare scheme distribution using AI and blockchain technology.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Quick Links</h3>
            <ul className="space-y-1">
              <li>
                <Link to="/" className="text-gray-300 hover:text-white text-sm">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/public-verification" className="text-gray-300 hover:text-white text-sm">
                  Public Verification
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-gray-300 hover:text-white text-sm">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Legal</h3>
            <ul className="space-y-1">
              <li>
                <Link to="#" className="text-gray-300 hover:text-white text-sm">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="#" className="text-gray-300 hover:text-white text-sm">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-4 pt-4 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-300 text-sm">
            &copy; {new Date().getFullYear()} EquiChain. All rights reserved.
          </p>
          <p className="text-gray-300 text-sm mt-2 md:mt-0">
            A Hackathon Project
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
