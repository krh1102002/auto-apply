import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import useJobStore from '../store/jobStore';
import useApplicationStore from '../store/applicationStore';
import { Search, Globe, MapPin, Building2, ExternalLink, Play, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import FloatingShapes from '../three-ui/FloatingShapes';

const glassClass = "bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl";
const glassCardClass = `${glassClass} rounded-3xl transition-all duration-500 border-white/5 hover:bg-white/10 hover:border-white/20`;
const btnPrimaryClass = "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 px-6 rounded-2xl transition-all duration-300 shadow-lg shadow-indigo-500/20 active:scale-[0.98]";

const JobDiscovery = () => {
  const { jobs, loading, fetchJobs, crawlUrl } = useJobStore();
  const { apply, applications, fetchApplications, massApply } = useApplicationStore();
  const [crawlInput, setCrawlInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [daysAgo, setDaysAgo] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [massApplying, setMassApplying] = useState(false);

  useEffect(() => {
    fetchJobs({ daysAgo, experienceLevel });
    fetchApplications();
  }, [daysAgo, experienceLevel]);

  const handleCrawl = (e) => {
    e.preventDefault();
    if (crawlInput) {
      crawlUrl(crawlInput);
      setCrawlInput('');
    }
  };

  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 p-8 font-sans relative overflow-hidden">
      <FloatingShapes />
      <div className="max-w-7xl mx-auto relative z-10">
        <header className="mb-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-5xl font-extrabold font-display text-gradient tracking-tight mb-4">
              Opportunity Discovery
            </h1>
            <p className="text-slate-400 font-medium leading-relaxed">
              Our global engine is active. Scan specific career pages or explore curated roles.
            </p>
          </motion.div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Sidebar / Filters */}
          <div className="space-y-8">
            <div className={`${glassCardClass} p-8`}>
              <h3 className="text-lg font-bold mb-6 font-display flex items-center gap-2">
                 <div className="h-2 w-2 rounded-full bg-indigo-500" /> Targeted Scan
              </h3>
              <form onSubmit={handleCrawl} className="space-y-4">
                <div className="relative group">
                  <Globe className="absolute left-4 top-4 h-5 w-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                  <input 
                    type="url" 
                    placeholder="Company jobs URL..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 text-sm focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-600"
                    value={crawlInput}
                    onChange={(e) => setCrawlInput(e.target.value)}
                  />
                </div>
                <button 
                  className="w-full py-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl flex items-center justify-center gap-2 transition-all font-bold text-sm"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin text-indigo-400" /> : <Play className="h-4 w-4 text-indigo-400 fill-current" />}
                  {loading ? 'Processing...' : 'Initiate Scan'}
                </button>
              </form>
            </div>

            <div className={`${glassCardClass} p-8`}>
              <h3 className="text-lg font-bold mb-6 font-display flex items-center gap-2">
                 <div className="h-2 w-2 rounded-full bg-purple-500" /> Refined Search
              </h3>
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Timeframe</label>
                  <select 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-indigo-500/50 transition-all text-slate-200"
                    value={daysAgo}
                    onChange={(e) => setDaysAgo(e.target.value)}
                  >
                    <option value="" className="bg-[#0f172a]">Global View (All)</option>
                    <option value="1" className="bg-[#0f172a]">Last 24 Hours</option>
                    <option value="7" className="bg-[#0f172a]">Past 7 Days</option>
                    <option value="30" className="bg-[#0f172a]">Past 30 Days</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Rank</label>
                  <select 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-indigo-500/50 transition-all text-slate-200"
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                  >
                    <option value="" className="bg-[#0f172a]">All Tiers</option>
                    <option value="Entry" className="bg-[#0f172a]">Graduate / Freshers</option>
                    <option value="Mid" className="bg-[#0f172a]">Mid-Level Ops</option>
                    <option value="Senior" className="bg-[#0f172a]">Lead / Senior</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            <div className="flex gap-4">
              <div className="relative flex-1 group">
                <Search className="absolute left-5 top-5 h-6 w-6 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Filter by role, company, or tech stack..."
                  className="w-full bg-white/5 border border-white/10 rounded-3xl p-5 pl-14 text-lg focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-600 shadow-inner shadow-black/20 font-medium"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={async () => {
                  setMassApplying(true);
                  const unappliedIds = filteredJobs
                    .filter(j => !applications.some(a => a.jobId?._id === j._id))
                    .map(j => j._id);
                  if (unappliedIds.length > 0) {
                    await massApply(unappliedIds);
                  }
                  setMassApplying(false);
                }}
                disabled={massApplying || filteredJobs.every(j => applications.some(a => a.jobId?._id === j._id))}
                className={`${btnPrimaryClass} px-10 flex items-center gap-3 disabled:opacity-50 min-w-[200px]`}
              >
                {massApplying ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                Mass Apply ({filteredJobs.filter(j => !applications.some(a => a.jobId?._id === j._id)).length})
              </motion.button>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {loading && (
                <div className="text-center py-20">
                   <Loader2 className="h-10 w-10 animate-spin text-indigo-400 mx-auto mb-4" />
                   <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Curating high-growth roles...</p>
                </div>
              )}
              {!loading && filteredJobs.length === 0 && (
                <div className={`text-center py-24 ${glassCardClass}`}>
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No matching nodes found in the global grid.</p>
                </div>
              )}
              {filteredJobs.map((job) => (
                <motion.div 
                  key={job._id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`${glassCardClass} p-8 group border-transparent hover:border-indigo-500/20 active:scale-[0.99] cursor-pointer`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex gap-6 items-center">
                      <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center font-black text-2xl text-indigo-400 border border-indigo-500/10 group-hover:scale-110 transition-transform">
                        {job.company?.[0]}
                      </div>
                      <div>
                        <h3 className="text-2xl font-black font-display group-hover:text-indigo-400 transition-colors tracking-tight">{job.title}</h3>
                        <div className="flex items-center gap-6 mt-3 text-slate-500 font-bold text-[10px] uppercase tracking-widest">
                          <span className="flex items-center gap-2"><Building2 className="h-4 w-4" /> {job.company}</span>
                          <span className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {job.location || 'Remote'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <a 
                        href={job.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-slate-500 hover:text-white"
                      >
                        <ExternalLink className="h-6 w-6" />
                      </a>
                      <button 
                        onClick={() => apply(job._id)}
                        disabled={applications.some(a => a.jobId?._id === job._id)}
                        className={`px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                          applications.some(a => a.jobId?._id === job._id)
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default'
                            : 'bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 active:scale-95'
                        }`}
                      >
                        {applications.some(a => a.jobId?._id === job._id) ? 'Active Target' : 'Initiate Auto-Apply'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDiscovery;
