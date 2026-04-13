import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Compass, User, LogOut, Shield, Briefcase } from 'lucide-react';
import useAuthStore from '../store/authStore';

const glassClass = "bg-[#030712]/50 backdrop-blur-2xl border-r border-white/5";

const Navbar = () => {
  const logout = useAuthStore(state => state.logout);

  return (
    <nav className={`fixed left-0 top-0 h-screen w-20 flex flex-col items-center py-10 ${glassClass} z-50`}>
      <NavLink 
        to="/fresher-jobs"
        className="h-12 w-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-16 flex items-center justify-center font-black text-white italic shadow-lg shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer"
      >
        TD
      </NavLink>
      
      <div className="flex-1 flex flex-col gap-10">
        <NavLink 
          to="/fresher-jobs" 
          title="Fresher (0-1 Yrs)"
          className={({ isActive }) => `p-3.5 rounded-2xl transition-all duration-300 ${isActive ? 'bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]' : 'text-slate-600 hover:text-white hover:bg-white/5'}`}
        >
          <Compass className="h-6 w-6" />
        </NavLink>
        <NavLink 
          to="/experienced-jobs" 
          title="Experienced (2+ Yrs)"
          className={({ isActive }) => `p-3.5 rounded-2xl transition-all duration-300 ${isActive ? 'bg-purple-600 text-white shadow-[0_0_20px_rgba(147,51,234,0.4)]' : 'text-slate-600 hover:text-white hover:bg-white/5'}`}
        >
          <Briefcase className="h-6 w-6" />
        </NavLink>
      </div>

      <button 
        onClick={logout}
        className="p-3.5 text-slate-600 hover:text-rose-400 hover:bg-rose-400/10 rounded-2xl transition-all duration-300 active:scale-90"
      >
        <LogOut className="h-6 w-6" />
      </button>
    </nav>
  );
};

export default Navbar;
