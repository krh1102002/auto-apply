import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Rocket } from 'lucide-react';
import useAuthStore from '../store/authStore';

const glassClass = "bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl";

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const register = useAuthStore((state) => state.register);
  const error = useAuthStore((state) => state.error);
  const loading = useAuthStore((state) => state.loading);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await register(name, email, password);
    if (success) navigate('/fresher-jobs');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030712] px-4 overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-indigo-500/10" />
      
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`${glassClass} p-10 rounded-3xl w-full max-w-md relative z-10`}
      >
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="h-16 w-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-purple-500/30"
          >
            <Rocket className="h-8 w-8 text-white" />
          </motion.div>
          <h2 className="text-4xl font-black text-white mb-2 tracking-tight">Join TechDiscovery</h2>
          <p className="text-slate-400 font-medium">Start your high-impact tech journey</p>
        </div>
        
        {error && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-rose-400 bg-rose-400/10 p-4 rounded-2xl mb-6 text-sm font-medium border border-rose-400/20"
          >
            {error}
          </motion.p>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-slate-400 mb-2 text-sm font-bold uppercase tracking-widest">Full Name</label>
            <div className="relative group">
              <User className="absolute left-4 top-4 h-5 w-5 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
              <input 
                type="text" 
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 text-white focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all placeholder:text-slate-600"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-slate-400 mb-2 text-sm font-bold uppercase tracking-widest">Email</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-4 h-5 w-5 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
              <input 
                type="email" 
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 text-white focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all placeholder:text-slate-600"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-slate-400 mb-2 text-sm font-bold uppercase tracking-widest">Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-4 h-5 w-5 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
              <input 
                type="password" 
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 text-white focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all placeholder:text-slate-600"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>
          
          <motion.button 
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 shadow-lg shadow-purple-500/30 flex items-center justify-center gap-3 mt-6 ${loading ? 'opacity-50' : ''}`}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Get Started'}
            {!loading && <ArrowRight className="h-5 w-5" />}
          </motion.button>
        </form>
        
        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <p className="text-slate-500 font-medium">
            Already have an account? <Link to="/login" className="text-purple-400 hover:text-purple-300 font-bold transition-colors">Sign In</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
