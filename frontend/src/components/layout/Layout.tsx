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
    <div className="flex flex-col min-h-screen">
      {/* Header always at top */}
      <Header />

      {/* Content Wrapper */}
      <div className="flex flex-1 pt-16">
        {/* Sidebar */}
        {user && (
          <aside className="hidden md:block w-64 border-r border-gray-200 bg-gray-50 relative z-10">
            <Sidebar />
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 bg-white p-4 sm:p-6 lg:p-8">{children}</main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Layout;
