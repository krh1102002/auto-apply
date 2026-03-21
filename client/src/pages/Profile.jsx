import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import {
  User,
  Mail,
  Briefcase,
  MapPin,
  Upload,
  Plus,
  X,
  CheckCircle,
} from "lucide-react";

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/users/profile", {
        headers: { "x-auth-token": token },
      });
      setProfile(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("resume", file);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5000/api/users/resume",
        formData,
        {
          headers: {
            "x-auth-token": token,
            "Content-Type": "multipart/form-data",
          },
        },
      );
      setProfile(res.data.user);
      setMessage({
        type: "success",
        text: "Resume parsed! Check your updated skills below.",
      });
    } catch (err) {
      setMessage({ type: "error", text: "Failed to parse resume" });
    } finally {
      setUploading(false);
    }
  };

  const addSkill = async () => {
    if (!skillInput || profile.preferences.skills.includes(skillInput)) return;

    const updatedSkills = [...profile.preferences.skills, skillInput];
    updatePreferences({ skills: updatedSkills });
    setSkillInput("");
  };

  const removeSkill = (skill) => {
    const updatedSkills = profile.preferences.skills.filter((s) => s !== skill);
    updatePreferences({ skills: updatedSkills });
  };

  const updatePreferences = async (newPrefs) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        "http://localhost:5000/api/users/profile",
        { preferences: { ...profile.preferences, ...newPrefs } },
        { headers: { "x-auth-token": token } },
      );
      setProfile(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading)
    return (
      <div className="p-8 text-center text-gray-400">
        Loading your profile...
      </div>
    );

  return (
    <div className="min-h-screen bg-dark text-white p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Profile</h1>
            <p className="text-gray-400">
              Manage your resume and job preferences.
            </p>
          </div>
          {message && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`p-3 rounded-xl flex items-center gap-2 text-sm ${message.type === "success" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}
            >
              <CheckCircle className="h-4 w-4" />
              {message.text}
            </motion.div>
          )}
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* User Info Card */}
          <div className="md:col-span-1 space-y-6">
            <div className="glass p-6 rounded-2xl flex flex-col items-center text-center">
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary to-secondary mb-4 flex items-center justify-center text-3xl font-bold">
                {profile.name[0]}
              </div>
              <h2 className="text-xl font-bold">{profile.name}</h2>
              <p className="text-gray-400 text-sm mt-1">{profile.email}</p>
            </div>

            <div className="glass p-6 rounded-2xl space-y-4">
              <h3 className="font-bold flex items-center gap-2">
                <Upload className="h-4 w-4 text-primary" /> Resume
              </h3>
              <label className="block w-full cursor-pointer group">
                <div
                  className={`border-2 border-dashed border-white/10 rounded-xl p-8 transition-all hover:border-primary/50 text-center ${uploading ? "opacity-50" : ""}`}
                >
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-500 group-hover:text-primary transition-colors" />
                  <p className="text-xs text-gray-400">
                    {uploading ? "Parsing..." : "Upload PDF Resume"}
                  </p>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf"
                    onChange={handleResumeUpload}
                    disabled={uploading}
                  />
                </div>
              </label>
            </div>
          </div>

          {/* Preferences Card */}
          <div className="md:col-span-2 space-y-6">
            <div className="glass p-8 rounded-2xl">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <Briefcase className="h-6 w-6 text-secondary" /> Job Preferences
              </h3>

              <div className="space-y-8">
                {/* Skills */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider">
                    Top Skills
                  </label>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {profile.preferences.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm flex items-center gap-2 group"
                      >
                        {skill}
                        <button
                          onClick={() => removeSkill(skill)}
                          className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add a skill..."
                      className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary transition-all flex-1"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addSkill()}
                    />
                    <button
                      onClick={addSkill}
                      className="p-2 bg-primary rounded-xl hover:bg-primary/80 transition-all"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Locations */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider">
                    Target Locations
                  </label>
                  <p className="text-sm text-gray-500 italic">
                    Remote, New York, San Francisco (Simulated)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
