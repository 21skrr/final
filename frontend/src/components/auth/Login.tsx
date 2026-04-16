import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from "../../context/AuthContext";
import pmiLogoo from "../../assets/pmi.png";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
}

const AppInput = (props: InputProps) => {
  const { label, icon, ...rest } = props;
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  return (
    <div className="w-full relative text-left">
      { label && 
        <label className='block mb-1.5 text-sm font-semibold text-gray-700'>
          {label}
        </label>
      }
      <div className="relative w-full">
        <input
          className="peer relative z-10 border border-gray-300 h-12 w-full rounded-lg bg-white px-4 pl-11 font-medium outline-none shadow-sm transition-all duration-200 ease-in-out focus:bg-pmi-50/50 focus:border-transparent placeholder:font-normal placeholder-gray-400"
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          {...rest}
        />
        {isHovering && (
          <>
            <div
              className="absolute pointer-events-none top-0 left-0 right-0 h-[2px] z-20 rounded-t-lg overflow-hidden"
              style={{
                background: `radial-gradient(40px circle at ${mousePosition.x}px 0px, #002e6d 0%, transparent 70%)`,
              }}
            />
            <div
              className="absolute pointer-events-none bottom-0 left-0 right-0 h-[2px] z-20 rounded-b-lg overflow-hidden"
              style={{
                background: `radial-gradient(40px circle at ${mousePosition.x}px 2px, #002e6d 0%, transparent 70%)`,
              }}
            />
            <div
              className="absolute pointer-events-none top-0 bottom-0 left-0 w-[2px] z-20 rounded-l-lg overflow-hidden"
              style={{
                background: `radial-gradient(40px circle at 0px ${mousePosition.y}px, #002e6d 0%, transparent 70%)`,
              }}
            />
            <div
              className="absolute pointer-events-none top-0 bottom-0 right-0 w-[2px] z-20 rounded-r-lg overflow-hidden"
              style={{
                background: `radial-gradient(40px circle at 0px ${mousePosition.y}px, #002e6d 0%, transparent 70%)`,
              }}
            />
          </>
        )}
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 z-20 text-gray-400 peer-focus:text-pmi-800 transition-colors">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();

  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    const leftSection = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - leftSection.left,
      y: e.clientY - leftSection.top
    });
  };

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => setIsHovering(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch {
      // Error is handled by the AuthContext
    }
  };

  return (
    <div className="h-screen w-full bg-slate-100 flex items-center justify-center p-4 lg:p-8 overflow-hidden relative">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center blur-sm scale-105 opacity-20"></div>

      <div className='glass-card w-full max-w-6xl flex xl:w-[85%] h-full max-h-[750px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] relative z-10 bg-white/95 rounded-2xl overflow-hidden'>
        
        {/* Left Side: Form */}
        <div
          className='w-full lg:w-[45%] xl:w-[40%] px-8 sm:px-12 lg:px-16 py-12 flex flex-col justify-center h-full relative overflow-hidden bg-white/70 backdrop-blur-md'
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Subtle cursor tracking gradient */}
          <div
            className={`absolute pointer-events-none w-[400px] h-[400px] bg-gradient-to-r from-pmi-300/20 via-pmi-500/10 to-transparent rounded-full blur-3xl transition-opacity duration-300 ${
              isHovering ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              transform: `translate(${mousePosition.x - 200}px, ${mousePosition.y - 200}px)`,
              transition: 'transform 0.1s ease-out'
            }}
          />

          <div className="z-10 w-full max-w-sm mx-auto">
            <div className="text-center mb-8">
              <img
                src={pmiLogoo}
                alt="Philip Morris International"
                className="h-20 mx-auto object-contain mb-5"
              />
              <h1 className="text-4xl font-display font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pmi-600 to-pmi-800 tracking-tight">
                DayOne
              </h1>
              <p className="mt-2 text-gray-500 font-medium tracking-wide text-xs uppercase">
                Your Onboarding Journey
              </p>
            </div>

            {error && (
              <div className="mb-6 bg-red-50/90 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start shadow-sm">
                <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            <form className='grid gap-5 w-full' onSubmit={handleSubmit}>
              <div className='grid gap-4'>
                <AppInput 
                  label="Email Address"
                  placeholder="you@pmi.com" 
                  type="email" 
                  icon={<Mail className="w-5 h-5" />}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <AppInput 
                  label="Password"
                  placeholder="••••••••" 
                  type="password" 
                  icon={<Lock className="w-5 h-5" />}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-between items-center text-sm px-1">
                <label className="flex items-center text-gray-600 cursor-pointer">
                  <input type="checkbox" className="mr-2 rounded border-gray-300 text-pmi-800 focus:ring-pmi-800" />
                  Remember me
                </label>
                <a href="#" className='font-semibold text-pmi-700 hover:text-pmi-900 transition-colors'>Forgot password?</a>
              </div>

              <div className='flex justify-center mt-2'>
                <button 
                  disabled={loading}
                  className={`group/button relative inline-flex w-full justify-center items-center overflow-hidden rounded-xl bg-pmi-800 px-4 py-3.5 text-sm font-bold text-white transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-[0_8px_20px_rgba(0,46,109,0.3)] shadow-[0_4px_10px_rgba(0,46,109,0.2)] cursor-pointer ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  <span>{loading ? "Signing In..." : "Sign In"}</span>
                  <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-13deg)_translateX(-100%)] group-hover/button:duration-1000 group-hover/button:[transform:skew(-13deg)_translateX(100%)]">
                    <div className="relative h-full w-12 bg-white/20" />
                  </div>
                </button>
              </div>
            </form>

            {/* Demo Accounts */}
            <div className="mt-8 pt-6 border-t border-gray-200">
               <p className="text-xs text-center text-gray-400 font-semibold uppercase mb-4 tracking-wider">Demo Accounts</p>
               <div className="grid grid-cols-2 gap-2.5">
                 {['employee', 'supervisor', 'hr', 'manager'].map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => { setEmail(`${role}@pmi.com`); setPassword("password"); }}
                      className="py-2 px-3 border border-gray-200 bg-white/50 rounded-lg text-xs font-semibold text-gray-600 hover:bg-pmi-50 hover:border-pmi-200 hover:text-pmi-800 transition-colors capitalize shadow-sm"
                    >
                      {role}
                    </button>
                 ))}
               </div>
            </div>

          </div>
        </div>

        {/* Right Side: Image / Cover */}
        <div className='hidden lg:flex flex-1 right h-full overflow-hidden relative items-center justify-center bg-pmi-900'>
          <div className="absolute inset-0 bg-gradient-to-tr from-pmi-950 via-pmi-900/80 to-transparent z-10 mix-blend-multiply"></div>
          <img
            src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2070&auto=format&fit=crop"
            alt="PMI Office"
            className="absolute inset-0 w-full h-full object-cover scale-105"
          />
          <div className="relative z-20 text-white max-w-lg px-12 text-center lg:text-left mx-auto">
            <h2 className="text-4xl xl:text-5xl font-display font-extrabold mb-6 leading-tight">Empowering your future.</h2>
            <div className="w-16 h-1 bg-white mb-6 opacity-80 rounded-full"></div>
            <p className="text-white/90 font-medium text-lg leading-relaxed">Join us on an interactive journey designed to set you up for success from DayOne at Philip Morris International.</p>
          </div>
        </div>

      </div>
    </div>
  )
}

export default Login;
