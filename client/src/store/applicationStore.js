import { create } from "zustand";
import axios from "axios";

const useApplicationStore = create((set, get) => ({
  applications: [],
  loading: false,
  error: null,

  fetchApplications: async (options = {}) => {
    const { background = false } = options;
    if (!background) set({ loading: true });
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/applications", {
        headers: { "x-auth-token": token },
      });
      set({ applications: res.data, loading: false });
    } catch (err) {
      set({ error: "Failed to fetch applications", loading: false });
    }
  },

  apply: async (jobId) => {
    set({ loading: true });
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/api/applications/apply",
        { jobId },
        {
          headers: { "x-auth-token": token },
        },
      );
      get().fetchApplications();
      return true;
    } catch (err) {
      set({
        error: err.response?.data?.message || "Application failed",
        loading: false,
      });
      return false;
    }
  },

  massApply: async (jobIds) => {
    set({ loading: true });
    try {
      const token = localStorage.getItem("token");
      // In a real app, this should be a single batch endpoint
      // For now, we'll loop it or simulate it
      const promises = jobIds.map((jobId) =>
        axios.post(
          "http://localhost:5000/api/applications/apply",
          { jobId },
          {
            headers: { "x-auth-token": token },
          },
        ),
      );
      await Promise.allSettled(promises);
      get().fetchApplications();
      set({ loading: false });
      return true;
    } catch (err) {
      set({ error: "Mass application encountered issues", loading: false });
      return false;
    }
  },
}));

export default useApplicationStore;
