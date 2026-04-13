import { create } from "zustand";
import axios from "axios";
import API_BASE_URL from "../config/api";

const useJobStore = create((set, get) => ({
  jobs: [],
  loading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalJobs: 0,
  },
  stats: {},

  fetchJobs: async (filters = {}) => {
    set({ loading: true });
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/api/jobs`, {
        headers: { "x-auth-token": token },
        params: filters,
      });
      // API now returns { jobs, totalJobs, totalPages, currentPage, stats }
      set({ 
        jobs: res.data.jobs || [], 
        pagination: {
          currentPage: res.data.currentPage || 1,
          totalPages: res.data.totalPages || 1,
          totalJobs: res.data.totalJobs || 0
        },
        stats: res.data.stats || {},
        loading: false 
      });
    } catch (err) {
      set({ error: "Failed to fetch jobs", loading: false });
    }
  },

  markAsApplied: async (jobId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_BASE_URL}/api/jobs/${jobId}/apply`, {}, {
        headers: { "x-auth-token": token }
      });
      
      // Optimistically update the local state to show 'Applied'
      set((state) => ({
        jobs: state.jobs.map(job => 
          job._id === jobId ? { ...job, isApplied: true } : job
        )
      }));
    } catch (err) {
      console.error("Failed to mark job as applied", err);
    }
  },

  crawlUrl: async (url) => {
    set({ loading: true });
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_BASE_URL}/api/jobs/crawl`,
        { url },
        {
          headers: { "x-auth-token": token },
        },
      );
      get().fetchJobs();
    } catch (err) {
      set({ error: "Crawl failed", loading: false });
    }
  },

  refreshJobs: async () => {
    set({ loading: true });
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_BASE_URL}/api/jobs/refresh`,
        {},
        {
          headers: { "x-auth-token": token },
        },
      );
      get().fetchJobs();
    } catch (err) {
      set({ error: "Refresh failed", loading: false });
    }
  },
}));

export default useJobStore;
