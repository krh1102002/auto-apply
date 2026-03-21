import { create } from "zustand";
import axios from "axios";
import API_BASE_URL from "../config/api";

const useJobStore = create((set, get) => ({
  jobs: [],
  loading: false,
  error: null,

  fetchJobs: async (filters = {}) => {
    set({ loading: true });
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/api/jobs`, {
        headers: { "x-auth-token": token },
        params: filters,
      });
      set({ jobs: res.data, loading: false });
    } catch (err) {
      set({ error: "Failed to fetch jobs", loading: false });
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
}));

export default useJobStore;
