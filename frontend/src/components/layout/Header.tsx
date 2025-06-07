import React, { useState, useEffect } from "react";
import { Bell, Menu, X, LogOut, User, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import NotificationsPanel from "../features/NotificationsPanel";
import pmiLogo from "../../assets/pmi-logo.png";

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [prevScrollPos, setPrevScrollPos] = useState(0);
  const [visible, setVisible] = useState(true);

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.scrollY;

      if (currentScrollPos < 50) {
        // Always show header when near top
        setVisible(true);
      } else {
        setVisible(prevScrollPos > currentScrollPos);
      }

      setPrevScrollPos(currentScrollPos);
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, [prevScrollPos]);

  return (
    <header
      className={`bg-white border-b border-gray-200 fixed top-0 w-full z-20 transition-transform duration-300 ${
        visible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <img
                src={pmiLogo}
                alt="Philip Morris International"
                className="h-10 object-contain"
              />
            </Link>
          </div>

          {/* Navigation links */}
          <nav className="hidden md:flex space-x-8 ml-10">
            <Link
              to="/dashboard"
              className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
            >
              Dashboard
            </Link>
            <Link
              to="/programs"
              className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
            >
              Programs
            </Link>
            <Link
              to="/resources"
              className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
            >
              Resources
            </Link>
            {user?.role === "hr" && (
              <Link
                to="/admin"
                className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
              >
                Admin
              </Link>
            )}
          </nav>

          {/* Right icons */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button
              className="text-gray-500 hover:text-blue-600 relative focus:outline-none"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                3
              </span>
            </button>

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex text-sm rounded-full focus:outline-none"
              >
                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                  {user?.name?.charAt(0) || "U"}
                </div>
              </button>

              {showProfileMenu && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white py-1 ring-1 ring-black ring-opacity-5">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <User size={16} className="mr-2" />
                    Profile
                  </Link>
                  <Link
                    to="/settings"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <Settings size={16} className="mr-2" />
                    Settings
                  </Link>
                  <button
                    onClick={logout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <LogOut size={16} className="mr-2" />
                    Logout
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 rounded-md text-gray-500 hover:text-blue-600 hover:bg-gray-100 focus:outline-none"
              >
                {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {showMobileMenu && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              to="/dashboard"
              className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
            >
              Dashboard
            </Link>
            <Link
              to="/programs"
              className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
            >
              Programs
            </Link>
            <Link
              to="/resources"
              className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
            >
              Resources
            </Link>
            {user?.role === "hr" && (
              <Link
                to="/admin"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
              >
                Admin
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Notifications */}
      {showNotifications && (
        <NotificationsPanel onClose={() => setShowNotifications(false)} />
      )}
    </header>
  );
};

export default Header;
