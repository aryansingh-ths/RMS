import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Landing = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('role', data.role);
        sessionStorage.setItem('username', username);
        
        // Small delay for smooth animation
        setTimeout(() => {
          if (data.role === 'Admin') navigate('/admin-console');
          else if (data.role === 'Host' || data.role === 'Kitchen') navigate('/sales-and-operations');
          else navigate('/sales-and-operations');
        }, 400);
      } else {
        setErrorMsg(data.error || 'Login failed. Please check your credentials.');
        setIsLoading(false);
      }
    } catch (err) {
      setErrorMsg('Error connecting to the server.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 font-sans flex flex-col lg:flex-row relative overflow-hidden">
      
      {/* Left Side - Login Container */}
      {/* Background: warm cream that echoes the restaurant's marble/plaster walls */}
      <div 
        className={`w-full lg:w-1/2 min-h-screen flex items-center justify-center relative p-6 bg-[#F5EFE6] transition-transform duration-[800ms] ease-out ${mounted ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Brand Logo - Top Left */}
        <div className="absolute top-5 left-5 md:top-6 md:left-8 flex items-center gap-3 z-20">
          <img src="/techhansa-logo.png" alt="TechHansa Logo" className="w-20 h-20 object-contain hover:scale-105 transition-transform duration-500" />
          <h1 className="text-3xl font-black text-yellow-600 tracking-tight">
            Pragati RMS
          </h1>
        </div>

        {/* Main Login Form Container (No Card) */}
        <div className="w-full max-w-sm relative z-10">
          <div className="mb-8">
            {/* Heading: deep warm charcoal, like the restaurant's dark ceilings */}
            <h2 className="text-3xl font-bold text-[#2C1A0E] mb-1">Welcome Back</h2>
            {/* Subtext: medium warm brown */}
            <p className="text-sm text-[#8D6E63] font-medium">Please enter your details to sign in.</p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3 animate-pulse">
              <span className="material-symbols-outlined text-red-500 text-[20px]">error</span>
              <p className="text-sm font-semibold text-red-700">{errorMsg}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div className="group">
              {/* Label: muted warm taupe */}
              <label className="text-xs font-bold text-[#8D6E63] uppercase tracking-widest mb-2 block group-focus-within:text-[#5D4037] transition-colors">
                Username
              </label>
              <div className="relative">
                {/* Icon: warm amber-brown, shifts darker on focus */}
                <span className="material-symbols-outlined absolute left-0 top-1/2 -translate-y-1/2 text-[#A1887F] group-focus-within:text-[#5D4037] transition-colors text-[20px]">
                  person
                </span>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-transparent border-0 border-b-2 border-[#D7C4B0] rounded-none py-3 pl-8 pr-4 text-sm font-semibold text-[#2C1A0E] focus:outline-none focus:border-[#5D4037] transition-all placeholder:text-[#C4A882] placeholder:font-normal"
                  placeholder="Enter your username"
                  required 
                />
              </div>
            </div>

            <div className="group">
              <div className="flex justify-between items-end mb-2">
                <label className="text-xs font-bold text-[#8D6E63] uppercase tracking-widest block group-focus-within:text-[#5D4037] transition-colors">
                  Password
                </label>
                <button type="button" className="text-[10px] font-bold text-[#A1887F] hover:text-[#5D4037] hover:underline transition-all">
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-0 top-1/2 -translate-y-1/2 text-[#A1887F] group-focus-within:text-[#5D4037] transition-colors text-[20px]">
                  lock
                </span>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent border-0 border-b-2 border-[#D7C4B0] rounded-none py-3 pl-8 pr-4 text-sm font-semibold text-[#2C1A0E] focus:outline-none focus:border-[#5D4037] transition-all placeholder:font-normal"
                  placeholder="••••••••"
                  required 
                />
              </div>
            </div>

            {/* Button: deep warm charcoal-brown, like the dark wood in the restaurant */}
            <button 
              type="submit" 
              disabled={isLoading}
              className={`mt-4 w-full py-3.5 rounded-xl font-semibold text-sm text-[#FDFAF6] shadow-lg flex items-center justify-center gap-3 transition-all ${
                isLoading ? 'bg-[#5D4037]/70 cursor-wait shadow-[#5D4037]/20' : 'bg-[#3E2723] hover:bg-[#4E342E] hover:-translate-y-1 shadow-[#3E2723]/30'
              }`}
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[20px]">autorenew</span>
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In to Workspace
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-[10px] font-bold text-[#A1887F]/60 uppercase tracking-widest">
              Powered by TechHansa IT
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Image Showcase */}
      <div className={`hidden lg:block lg:w-1/2 min-h-screen relative bg-black transition-transform duration-[800ms] ease-out ${mounted ? 'translate-x-0' : 'translate-x-full'}`}>
        <img 
          src="/res_logo.png" 
          alt="Restaurant Atmosphere" 
          className="absolute inset-0 w-full h-full object-cover opacity-90"
        />
        {/* Gradient overlay to make the image fit the theme */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
        
        {/* Optional text or branding on the image side */}
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <h2 className="text-4xl font-bold mb-4 tracking-tight text-white shadow-sm">Streamline your operations.</h2>
          <p className="text-lg text-slate-200 font-medium max-w-md">Experience seamless management from kitchen to table with Pragati RMS.</p>
        </div>
      </div>
    </div>
  );
};

export default Landing;
