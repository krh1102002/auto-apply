import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import useJobStore from '../store/jobStore';
import { Search, Globe, MapPin, Building2, ExternalLink, Play, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import SyncReminderModal from '../components/SyncReminderModal';

const glassClass = "bg-[#0f172a]/50 backdrop-blur-xl border border-white/5 shadow-2xl";
const glassCardClass = `${glassClass} rounded-2xl transition-all duration-300 hover:bg-[#0f172a]/80 hover:border-white/10`;
const btnPrimaryClass = "bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg shadow-indigo-600/20 active:scale-[0.98]";

const JobDiscovery = ({ mode = 'fresher' }) => {
  const { 
    jobs, 
    loading, 
    pagination = { totalJobs: 0, totalPages: 1, currentPage: 1 }, 
    stats = {},
    fetchJobs, 
    refreshJobs,
    markAsApplied
  } = useJobStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [experienceLevel, setExperienceLevel] = useState(mode === 'fresher' ? 'Entry' : ['Mid', 'Senior']);
  const [tech, setTech] = useState([]);
  const [applicationStatus, setApplicationStatus] = useState('Unapplied');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [showSyncModal, setShowSyncModal] = useState(false);

  // Tech options list
  const techStacks = [
    'React', 'Node', 'Java', 'Python', 'Go', 'DevOps', 'Mobile', 
    'Cyber', 'Data', 'AI', 'Cloud', 'Blockchain'
  ];

  // Sync mode with experienceLevel filter
  useEffect(() => {
    setPage(1); // Reset to first page when mode changes
    if (mode === 'fresher') {
      setExperienceLevel('Entry');
    } else {
      setExperienceLevel(['Mid', 'Senior']);
    }
  }, [mode]);
  
  // Daily Sync Reminder Logic
  useEffect(() => {
    const lastReminder = localStorage.getItem('lastSyncReminder');
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    if (!lastReminder || (now - parseInt(lastReminder)) > twentyFourHours) {
      // Delay modal slightly for better entrance effect
      const timer = setTimeout(() => setShowSyncModal(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleCloseModal = () => {
    setShowSyncModal(false);
    localStorage.setItem('lastSyncReminder', Date.now().toString());
  };

  const handleDiscoverySync = async () => {
    await refreshJobs();
    // Re-apply filters immediately after sync to prevent seniority leakage
    fetchJobs({ 
      title: searchQuery.trim(), 
      experienceLevel: experienceLevel,
      tech: tech.filter(t => t.trim() !== ''),
      applicationStatus,
      role,
      page: 1, // Reset to page 1 after sync
      limit: 7
    });
  };

  useEffect(() => {
    fetchJobs({ 
      title: searchQuery.trim(), 
      experienceLevel: experienceLevel,
      tech: tech.filter(t => t.trim() !== ''),
      applicationStatus,
      role,
      page,
      limit: 7
    });
  }, [searchQuery, experienceLevel, tech, applicationStatus, role, page, mode]);

  const toggleTech = (t) => {
    setTech(prev => 
      prev.includes(t) ? prev.filter(item => item !== t) : [...prev, t]
    );
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 p-8 font-sans">
      <SyncReminderModal 
        isOpen={showSyncModal} 
        onClose={handleCloseModal} 
        onSync={handleDiscoverySync} 
      />
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 flex justify-between items-end">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-black tracking-tight mb-2">
              {mode === 'fresher' ? 'Tech Freshers Grid' : 'Experienced Tech Grid'}
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              {mode === 'fresher' 
                ? 'Strictly verified entry-level software engineering roles from the last 30 days.' 
                : 'Mid-to-senior technical roles and lead positions across the global tech sector.'}
            </p>
          </motion.div>
          
          <div className="text-right">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400/60 block mb-1">Database Pulse</span>
            <div className="text-2xl font-black text-white">{pagination?.totalJobs?.toLocaleString() ?? '0'} <span className="text-slate-600">Roles</span></div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="space-y-6">
            <div className={`${glassCardClass} p-6`}>
              <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-4 flex items-center gap-2">
                 <div className="h-1.5 w-1.5 rounded-full bg-indigo-400" /> Action Center
              </h3>
              <button 
                onClick={handleDiscoverySync}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl flex items-center justify-center gap-2 transition-all font-bold text-xs shadow-lg shadow-indigo-600/20 active:scale-95 mb-4"
                disabled={loading}
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                {loading ? 'Discovering...' : 'Sync Latest Roles'}
              </button>
            </div>

            <div className={`${glassCardClass} p-6`}>
              <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-4 flex items-center gap-2">
                 <div className="h-1.5 w-1.5 rounded-full bg-indigo-400" /> Role Focus
              </h3>
              <div className="space-y-1">
                <button 
                  onClick={() => { setRole(''); setPage(1); }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all ${role === '' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:bg-white/5'}`}
                >
                  <span className="text-[10px] font-black uppercase tracking-widest">All Tracks</span>
                  <span className="text-[10px] bg-white/5 py-0.5 px-2 rounded-full font-bold opacity-50">{pagination.totalJobs}</span>
                </button>
                {Object.keys(stats).map(r => (
                  <button 
                    key={r}
                    onClick={() => { setRole(role === r ? '' : r); setPage(1); }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all ${role === r ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:bg-white/5'}`}
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest">{r}</span>
                    <span className={`text-[10px] py-0.5 px-2 rounded-full font-bold ${stats[r] > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 opacity-50'}`}>
                      {stats[r]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className={`${glassCardClass} p-6`}>
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                 <div className="h-1.5 w-1.5 rounded-full bg-slate-400" /> Filters
              </h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Rank</label>
                  <select 
                    className="w-full bg-white/5 border border-white/5 rounded-xl p-3 text-xs focus:outline-none focus:border-indigo-500/50 transition-all text-slate-200"
                    value={experienceLevel}
                    onChange={(e) => {
                      const val = e.target.value;
                      setExperienceLevel(val.includes(',') ? val.split(',') : val);
                      setPage(1);
                    }}
                  >
                    {mode === 'fresher' ? (
                      <option value="Entry" className="bg-[#0f172a]">Entry / Graduate Only</option>
                    ) : (
                      <>
                        <option value={['Mid', 'Senior']} className="bg-[#0f172a]">Mid & Senior Combined</option>
                        <option value="Mid" className="bg-[#0f172a]">Mid-Level Only</option>
                        <option value="Senior" className="bg-[#0f172a]">Senior / Lead Only</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center justify-between">
                    Technology
                    {tech.length > 0 && (
                      <button 
                        onClick={() => { setTech([]); setPage(1); }}
                        className="text-[9px] text-indigo-400 hover:text-indigo-300 transition-colors font-black"
                      >
                        CLEAR ALL
                      </button>
                    )}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {techStacks.map(stack => {
                      const isActive = tech.includes(stack);
                      return (
                        <button
                          key={stack}
                          onClick={() => toggleTech(stack)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                            isActive 
                              ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20' 
                              : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:border-white/10'
                          }`}
                        >
                          {stack}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Workflow</label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { id: 'Unapplied', label: 'New / Unapplied' },
                      { id: 'Applied', label: 'Handled / Applied' },
                      { id: 'All', label: 'All Global Roles' }
                    ].map(status => {
                      const isActive = applicationStatus === status.id;
                      return (
                        <button
                          key={status.id}
                          onClick={() => { setApplicationStatus(status.id); setPage(1); }}
                          className={`w-full px-4 py-3 rounded-xl text-[11px] font-bold transition-all border text-left flex items-center justify-between ${
                            isActive 
                              ? 'bg-indigo-600/10 border-indigo-500/50 text-indigo-400 shadow-inner' 
                              : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                          }`}
                        >
                          {status.label}
                          {isActive && <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.8)]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            <div className="relative group w-full mb-8">
              <Search className="absolute left-4 top-4 h-5 w-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
              <input 
                type="text" 
                placeholder="Search by title or company..."
                className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 pl-12 text-sm focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-600 shadow-inner shadow-black/20 font-medium"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              {loading && (
                <div className="text-center py-20">
                   <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mx-auto mb-4" />
                   <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                     Filtering tech pulse...
                   </p>
                </div>
              )}
              {!loading && (!jobs || jobs.length === 0) && (
                <div className={`text-center py-24 ${glassCardClass}`}>
                  <p className="text-slate-600 font-bold uppercase tracking-widest text-[10px]">No recent tech roles found matching your criteria.</p>
                </div>
              )}
              {jobs?.map((job) => (
                <motion.div 
                  key={job._id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`${glassCardClass} p-6 group flex items-center justify-between gap-6`}
                >
                  <div className="flex gap-5 items-center">
                    <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center font-black text-lg border border-white/5 text-slate-400 group-hover:border-indigo-500/20 group-hover:text-indigo-400 transition-all">
                      {job.company?.[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold tracking-tight">{job.title}</h3>
                        <div className="flex gap-2">
                          <span className="px-2 py-0.5 rounded bg-white/5 text-[9px] font-black uppercase tracking-tight text-slate-500 border border-white/5">
                            {job.experienceLevel}
                          </span>
                          {job.companyInfo?.industry && (
                            <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-[9px] font-black uppercase tracking-tight text-indigo-400 border border-indigo-500/20">
                              {job.companyInfo.industry}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-1.5 text-slate-500 font-bold text-[11px] uppercase tracking-wide">
                        <span className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" /> {job.company}</span>
                        <span className={`flex items-center gap-1.5 ${job.location?.toLowerCase().includes('india') || ['bangalore', 'pune', 'hyderabad', 'noida', 'chennai', 'mumbai', 'delhi', 'gurgaon'].some(hub => job.location?.toLowerCase().includes(hub)) ? 'text-emerald-400' : ''}`}>
                          <MapPin className="h-3.5 w-3.5" /> {job.location || 'Remote'}
                        </span>
                      </div>
                      {job.companyInfo?.description && (
                        <p className="mt-3 text-[11px] text-slate-500 line-clamp-1 italic max-w-xl">
                          "{job.companyInfo.description.substring(0, 120)}..."
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {job.isApplied ? (
                      <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-black uppercase tracking-widest">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Completed
                      </div>
                    ) : (
                      <button 
                        onClick={() => markAsApplied(job._id)}
                        className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white font-bold text-[10px] uppercase tracking-widest transition-all border border-white/5"
                      >
                        Mark Complete
                      </button>
                    )}
                    
                    <a 
                      href={job.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-indigo-600 hover:text-white text-slate-300 font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 border border-white/5 hover:border-indigo-500"
                    >
                      View & Apply <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-6 mt-12 py-8 border-t border-white/5">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1 || loading}
                  className="px-6 py-3 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-indigo-500 hover:text-white disabled:opacity-20 disabled:hover:border-white/5 transition-all"
                >
                  Previous Page
                </button>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <span className="text-white">{pagination.currentPage}</span> / <span className="text-slate-600">{pagination.totalPages}</span>
                </div>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === pagination.totalPages || loading}
                  className="px-6 py-3 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-indigo-500 hover:text-white disabled:opacity-20 disabled:hover:border-white/5 transition-all"
                >
                  Next Page
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDiscovery;
