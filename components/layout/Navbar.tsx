"use client";
import { ShieldCheck } from 'lucide-react';
import SmoothLink from '../animations/SmoothLink';
import { useAuth } from '../providers/AuthProvider';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { userProfile, signOutUser, loading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOutUser();
    router.push('/login');
  };

  const getDashboardLink = () => {
    if (userProfile?.role === 'CUSTOMER') {
      return <SmoothLink href="/customer/orders" className="text-blue-400 hover:text-blue-300">Dashboard</SmoothLink>;
    }
    if (userProfile?.role === 'MERCHANT') {
      return (
        <>
          <SmoothLink href="/merchant/products" className="text-cyan-400 hover:text-cyan-300 border-r border-white/10 pr-4 mr-4">Products</SmoothLink>
          <SmoothLink href="/merchant/dashboard" className="text-blue-400 hover:text-blue-300">Portal</SmoothLink>
        </>
      );
    }
    if (userProfile?.role === 'ADMIN') {
      return (
        <>
          <SmoothLink href="/admin/merchants" className="text-purple-400 hover:text-purple-300 border-r border-white/10 pr-4 mr-4">Merchants</SmoothLink>
          <SmoothLink href="/admin/dashboard" className="text-blue-400 hover:text-blue-300">Admin</SmoothLink>
        </>
      );
    }
    return null;
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#040b16]/70 backdrop-blur-3xl border-b border-white/10 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex justify-between items-center p-4 px-6 overflow-x-auto no-scrollbar">
        <SmoothLink href="/" className="flex items-center gap-2 text-white font-bold text-xl tracking-wide group shrink-0 mr-6">
          <ShieldCheck className="text-blue-500 group-hover:text-cyan-400 transition-colors duration-500" />
          <span className="tracking-widest hidden sm:inline-block">SAPPHIRE</span>
        </SmoothLink>

        <div className="flex gap-6 text-sm font-medium items-center whitespace-nowrap">
          <SmoothLink href="/store" className="text-slate-400 hover:text-white transition">Store</SmoothLink>
          <SmoothLink href="/verify" className="text-slate-400 hover:text-white transition">Verify</SmoothLink>
          <SmoothLink href="/demo-flow" className="text-slate-400 hover:text-white transition hidden md:inline-block">Demo Flow</SmoothLink>
          <SmoothLink href="/architecture" className="text-slate-400 hover:text-white transition hidden lg:inline-block">Architecture</SmoothLink>
          
          {loading ? (
             <span className="text-slate-500 animate-pulse ml-4">Loading...</span>
          ) : userProfile ? (
            <div className="flex items-center gap-4 ml-4 pl-4 border-l border-white/10">
              <span className="text-slate-300 hidden sm:inline-block">
                {userProfile.name} <span className="bg-white/10 text-xs px-2 py-0.5 rounded text-slate-400 ml-2">{userProfile.role}</span>
              </span>
              <button onClick={handleLogout} className="text-red-400 hover:text-red-300 text-sm">Logout</button>
              {getDashboardLink()}
            </div>
          ) : (
            <div className="flex items-center gap-4 ml-4 pl-4 border-l border-white/10">
              <SmoothLink href="/login" className="text-white hover:text-blue-400 transition">Login</SmoothLink>
              <SmoothLink href="/register" className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-500 transition">Register</SmoothLink>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}