"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  GraduationCap,
  HeartHandshake,
  BookOpen,
  Building2,
  Eye,
  EyeOff,
} from "lucide-react";
import { AUTH_ROLES, type AuthRole } from "@/data/mock";
import { supabase } from "@/lib/Client";

const roleIcons: Record<string, React.ReactNode> = {
  student: <GraduationCap className="w-5 h-5" />,
  mentor: <HeartHandshake className="w-5 h-5" />,
  teacher: <BookOpen className="w-5 h-5" />,
  coordinator: <Building2 className="w-5 h-5" />,
};

const roleColors: Record<string, string> = {
  student: "from-indigo-500 to-blue-400",
  mentor: "from-teal-500 to-emerald-400",
  teacher: "from-amber-500 to-orange-400",
  coordinator: "from-purple-500 to-pink-400",
};

const roleBg: Record<string, string> = {
  student: "bg-indigo-50 border-indigo-200 text-indigo-700",
  mentor: "bg-teal-50 border-teal-200 text-teal-700",
  teacher: "bg-amber-50 border-amber-200 text-amber-700",
  coordinator: "bg-purple-50 border-purple-200 text-purple-700",
};

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<AuthRole>("student");
  const [email, setEmail] = useState("student@demo.edu");
  const [password, setPassword] = useState("demo123");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRoleSelect = (role: AuthRole) => {
    setSelectedRole(role);
    const found = AUTH_ROLES.find((r) => r.role === role);
    if (found) {
      setEmail(found.email);
      setPassword("demo123");
    }
    setError("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    console.log("--- STARTING LOGIN CHECK ---");
    console.log("Attempting to log in email:", email);

    // CHECKPOINT 1: Supabase Authentication
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

    if (authError) {
      console.error("AUTH ERROR:", authError.message);
      setError(`CHECKPOINT 1 FAILED: ${authError.message}`);
      setLoading(false);
      return; // Stops here
    }

    console.log("Checkpoint 1 Passed! User Auth ID:", authData.user?.id);

    // CHECKPOINT 2: Custom 'Users' Table Lookup
    const { data: userData, error: dbError } = await supabase
      .from("users")
      .select("role")
      .eq("id", authData.user?.id)
      .single();

    if (dbError) {
      console.error("DB ERROR:", dbError.message);
      setError(`CHECKPOINT 2 FAILED (Database Error): ${dbError.message}`);
      setLoading(false);
      return; // Stops here
    }

    if (!userData) {
      setError(
        "CHECKPOINT 2 FAILED: Auth worked, but this UID is missing from your custom 'Users' table!",
      );
      setLoading(false);
      return; // Stops here
    }

    console.log("Checkpoint 2 Passed! User Role found:", userData.role);

    // CHECKPOINT 3: Strict Tab Matching
    const currentTabUpper = selectedRole.toUpperCase();
    if (userData.role !== currentTabUpper) {
      await supabase.auth.signOut();
      setError(
        `CHECKPOINT 3 FAILED: You are a ${userData.role}, but tried logging in via the ${currentTabUpper} tab.`,
      );
      setLoading(false);
      return; // Stops here
    }

    // ALL CHECKS PASSED - ROUTE THEM
    if (userData.role === "STUDENT") router.push("/student");
    if (userData.role === "MENTOR") router.push("/mentor");
    if (userData.role === "TEACHER") router.push("/teacher");
    if (userData.role === "COORDINATOR") router.push("/coordinator");
  };

  const selectedRoleData = AUTH_ROLES.find((r) => r.role === selectedRole)!;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/40 to-indigo-50/30 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-16 w-80 h-80 bg-indigo-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-16 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-500 flex items-center justify-center shadow-lg shadow-indigo-200">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome to RiskWise AI
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Sign in to your academic dashboard
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/80 border border-slate-200/80 p-8">
          {/* Role Selection */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Select Your Role
            </p>
            <div className="grid grid-cols-2 gap-2">
              {AUTH_ROLES.map((r) => (
                <button
                  key={r.role}
                  id={`role-${r.role}`}
                  onClick={() => handleRoleSelect(r.role)}
                  className={`flex items-center gap-2 px-3 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                    selectedRole === r.role
                      ? `${roleBg[r.role]} border-2 shadow-sm`
                      : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-100"
                  }`}
                >
                  {roleIcons[r.role]}
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Role indicator */}
          <div
            className={`rounded-xl p-3 mb-6 bg-gradient-to-r ${roleColors[selectedRole]} bg-opacity-10`}
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-lg bg-gradient-to-r ${roleColors[selectedRole]} flex items-center justify-center text-white`}
              >
                {roleIcons[selectedRole]}
              </div>
              <div>
                <p className="text-xs font-semibold text-white opacity-90">
                  {selectedRoleData.label} Portal
                </p>
                <p className="text-xs text-white opacity-70">
                  You&apos;ll be redirected to: {selectedRoleData.redirectTo}
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Email Address
              </label>
              <input
                id="email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 focus:bg-white transition-all"
                required
              />
            </div>
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Password
              </label>
              <input
                id="password-input"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 focus:bg-white transition-all pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 bottom-3 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <button
              id="sign-in-btn"
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl shadow-md shadow-indigo-200 transition-all hover:shadow-lg hover:shadow-indigo-300 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="3"
                      className="opacity-25"
                    />
                    <path
                      d="M4 12a8 8 0 018-8"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      className="opacity-75"
                    />
                  </svg>
                  Signing In...
                </>
              ) : (
                <>Sign In to {selectedRoleData.label} Dashboard</>
              )}
            </button>
          </form>

          {/* Demo hint */}
          <div className="mt-4 bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
            <p className="text-xs text-amber-700 font-medium">
              🎯 Demo Mode: Credentials are pre-filled — just click Sign In!
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          RiskWise AI • Proactive Academic Intervention Platform
        </p>
      </div>
    </div>
  );
}
