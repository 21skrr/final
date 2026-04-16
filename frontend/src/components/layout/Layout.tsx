import React from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import { useAuth } from "../../context/AuthContext";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Fixed Header */}
      <Header />

      {/* Main Content Area */}
      <div className="flex flex-1 pt-16">
        {/* Sidebar - full height */}
        {user && (
          <aside className="hidden md:flex w-64 flex-col z-10 min-h-full shadow-lg">
            <Sidebar />
          </aside>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Layout;
