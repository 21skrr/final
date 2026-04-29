import React, { useState, useEffect } from "react";
import { Bell, Menu, X, LogOut, User, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import NotificationsPanel from "../features/NotificationsPanel";
import pmiLogo from "../../assets/pmi-logo.png";
import { useNotifications } from '../../context/NotificationContext';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [prevScrollPos, setPrevScrollPos] = useState(0);
  const [visible, setVisible] = useState(true);
  const [greeting, setGreeting] = useState('');
  const [time, setTime] = useState(new Date());
  const { unreadCount } = useNotifications();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Scroll detection & Time
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.scrollY;
      if (currentScrollPos < 50) {
        setVisible(true);
      } else {
        setVisible(prevScrollPos > currentScrollPos);
      }
      setPrevScrollPos(currentScrollPos);
    };

    window.addEventListener("scroll", handleScroll);

    // Time update
    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearInterval(timer);
    };
  }, [prevScrollPos]);

  // Greeting logic
  useEffect(() => {
    const hour = time.getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, [time]);

  const formattedDate = time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const formattedTime = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <header
      className={`bg-white/80 backdrop-blur-md border-b border-slate-200/50 shadow-sm fixed top-0 w-full z-30 transition-transform duration-300 ${
        visible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo & Greeting */}
          <div className="flex items-center space-x-6">
            <Link to="/" className="flex items-center">
              <img
                src={pmiLogo}
                alt="Philip Morris International"
                className="h-9 object-contain"
              />
            </Link>
            
            {/* Divider */}
            <div className="hidden lg:block h-8 w-px bg-slate-200"></div>

            {/* Personalized Greeting */}
            {user && (
              <div className="hidden lg:flex flex-col justify-center">
                <span className="text-sm font-semibold text-slate-800">
                  {greeting}, {user.name?.split(' ')[0] || 'User'}
                </span>
                <span className="text-[11px] text-slate-500 font-medium capitalize tracking-wide">
                  {user.role} Portal
                </span>
              </div>
            )}
          </div>

          {/* Flexible space to push right section */}
          <div className="flex-1"></div>

          {/* Right Section: Time, Notifications, Profile */}
          <div className="flex items-center space-x-5">
            
            {/* Live Clock / Date */}
            <div className="hidden xl:flex items-center space-x-4 mr-2">
              <div className="flex items-center text-slate-500 text-xs font-medium">
                <CalendarIcon size={14} className="mr-1.5 text-slate-400"/>
                {formattedDate}
              </div>
              <div className="flex items-center text-slate-500 text-xs font-medium">
                <Clock size={14} className="mr-1.5 text-slate-400"/>
                {formattedTime}
              </div>
            </div>

            {/* Notifications */}
            {user && (
              <div className="relative">
                <button
                  className="p-2 text-slate-400 hover:text-pmi-800 hover:bg-slate-100 rounded-full transition-all relative focus:outline-none"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center border-2 border-white shadow-sm">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <NotificationsPanel onClose={() => setShowNotifications(false)} />
                )}
              </div>
            )}

            {/* Profile */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center focus:outline-none rounded-full ring-2 ring-transparent hover:ring-pmi-200 transition-all"
                >
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-pmi-700 to-indigo-600 shadow-sm border-2 border-white flex items-center justify-center text-white text-sm font-semibold relative overflow-hidden group">
                    <span className="z-10">{user.name?.charAt(0) || "U"}</span>
                    {/* Hover effect glow */}
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                </button>

                {showProfileMenu && (
                  <>
                    {/* Invisible overlay to close menu on click outside */}
                    <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)}></div>
                    <div className="origin-top-right absolute right-0 mt-3 w-56 rounded-xl shadow-glass bg-white ring-1 ring-slate-900/5 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      
                      {/* Profile Header */}
                      <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100">
                        <p className="text-sm font-semibold text-slate-800 truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 font-medium capitalize mt-0.5">{user.role}</p>
                      </div>

                      <div className="p-1">
                        <Link
                          to="/profile"
                          onClick={() => setShowProfileMenu(false)}
                          className="flex items-center px-3 py-2 text-sm font-medium text-slate-600 hover:text-pmi-700 hover:bg-slate-50 rounded-lg transition-colors"
                        >
                          <User size={16} className="mr-2.5 text-slate-400" />
                          My Profile
                        </Link>
                        
                        <div className="h-px w-full bg-slate-100 my-1"></div>

                        <button
                          onClick={() => { setShowProfileMenu(false); handleLogout(); }}
                          className="flex items-center w-full text-left px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <LogOut size={16} className="mr-2.5 text-red-400" />
                          Sign out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link to="/login" className="text-sm font-semibold text-pmi-800 hover:text-pmi-600 transition-colors">
                Sign In
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            {user && (
              <div className="md:hidden flex items-center ml-2">
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="p-2 rounded-md text-slate-500 hover:text-pmi-600 hover:bg-slate-100 focus:outline-none"
                >
                  {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {showMobileMenu && user && (
        <div className="md:hidden bg-white border-t border-slate-200 px-4 pt-4 pb-6 shadow-inner animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pmi-600 to-pmi-800 flex items-center justify-center text-white font-semibold">
              {user.name?.charAt(0) || "U"}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">{user.name}</p>
              <p className="text-xs text-slate-500 capitalize">{user.role}</p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
