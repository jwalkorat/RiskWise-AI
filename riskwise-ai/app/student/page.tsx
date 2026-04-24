"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  ChevronRight,
  LogOut,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Loader2,
  ClipboardList,
  TrendingUp,
  BookOpen,
  Calendar,
  MessageSquare,
  Download,
  Upload,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts";
import { supabase } from "@/lib/Client";
import {
  getStudentDashboardData,
  submitGeneralFeedback,
  submitAssignmentReason,
} from "@/actions/studentActions";
import { RiskRing } from "@/components/RiskRing";
import { RiskBadge } from "@/components/RiskBadge";
import { SubjectRadarChart } from "@/components/SubjectRadarChart";
import { generateStudentReport } from "@/lib/pdfGenerator";
import { useSessionGuard } from "@/hooks/useSessionGuard";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";

// Must match studentActions.ts SUBJECT_ATTENDANCE_COLS
const SUBJECT_COLS = [
  { label: "Math", marksKey: "math_marks", attKey: "math_attendance" },
  { label: "Physics", marksKey: "physics_marks", attKey: "physics_attendance" },
  { label: "CS", marksKey: "cs_marks", attKey: "cs_attendance" },
  { label: "English", marksKey: "english_marks", attKey: "english_attendance" },
  {
    label: "Electronics",
    marksKey: "electronics_marks",
    attKey: "electronics_attendance",
  },
  {
    label: "Chemistry",
    marksKey: "chemistry_marks",
    attKey: "chemistry_attendance",
  },
];

type Assignment = {
  id: string;
  assignment_title: string;
  subject: string | null;
  due_date: string;
  is_completed: boolean;
  student_reason: string | null;
};

type StudentRow = {
  id: string;
  current_risk_score: number;
  risk_category: string;
  top_risk_reasons: string | null;
  general_feedback: string | null;
  [key: string]: unknown; // subject columns
  student_assignments: Assignment[];
  interventions: {
    id: string;
    session_date: string;
    status: string;
    mentor_feedback: string | null;
  }[];
  risk_history: { recorded_date: string; risk_score: number }[];
};

// ── Custom Tooltip for Recharts ───────────────────────────────────────────────
const RiskTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-slate-200 rounded-xl shadow-xl text-sm min-w-[200px]">
        <p className="font-bold text-slate-800 mb-1">{label}</p>
        <p
          className={`font-semibold mb-1 ${data.score > 70 ? "text-red-600" : data.score >= 40 ? "text-amber-600" : "text-teal-600"}`}
        >
          Risk Score: {data.score}
        </p>
        {data.hasIntervention && (
          <div className="mt-2 pt-2 border-t border-slate-100">
            <p className="text-xs font-bold text-indigo-600 flex items-center gap-1">
              <MessageSquare className="w-3 h-3" /> Mentor Session Logged
            </p>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export default function StudentDashboard() {
  const router = useRouter();
  useSessionGuard("STUDENT");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [studentName, setStudentName] = useState("Student");
  const [studentData, setStudentData] = useState<StudentRow | null>(null);
  const [studentUserId, setStudentUserId] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);

  // general feedback
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  // per-assignment reason
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [reasonLoading, setReasonLoading] = useState<string | null>(null);
  const [reasonSuccess, setReasonSuccess] = useState<Record<string, boolean>>(
    {},
  );

  // ── Bouncer + data fetch ────────────────────────────────────────────────────
  useEffect(() => {
    const run = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const { data: userData } = await supabase
        .from("users")
        .select("role, full_name")
        .eq("id", session.user.id)
        .single();

      if (userData?.role !== "STUDENT") {
        router.push("/login");
        return;
      }
      setStudentName(userData?.full_name || "Student");
      setStudentUserId(session.user.id);

      try {
        const data = await getStudentDashboardData(session.user.id);
        if (data) {
          setStudentData(data as unknown as StudentRow);
          setFeedbackText(
            (data as unknown as StudentRow).general_feedback ?? "",
          );
        }
      } catch (e) {
        console.error(e);
      }

      setIsAuthorized(true);
    };
    run();
  }, [router]);

  if (!isAuthorized) {
    return <DashboardSkeleton roleName="Student Dashboard" />;
  }

  const now = new Date();
  const riskScore = studentData?.current_risk_score ?? 0;
  const riskLevel =
    (studentData?.risk_category as "Low" | "Medium" | "High") ?? "Low";
  const riskReasons =
    studentData?.top_risk_reasons?.split(" | ").filter(Boolean) ?? [];

  // Subjects that have data and are below 75%
  const lowAttendanceSubjects = SUBJECT_COLS.filter((s) => {
    const val = Number(studentData?.[s.attKey] ?? 0);
    return val > 0 && val < 75;
  });

  // All subjects with any data
  const activeSubjects = SUBJECT_COLS.filter((s) => {
    const m = Number(studentData?.[s.marksKey] ?? 0);
    const a = Number(studentData?.[s.attKey] ?? 0);
    return m > 0 || a > 0;
  });

  const overdueAssignments = (studentData?.student_assignments ?? []).filter(
    (a) => !a.is_completed && new Date(a.due_date) < now,
  );

  // Latest intervention feedback for the banner
  const latestIntervention = (studentData?.interventions ?? []).find(
    (inv) => inv.mentor_feedback,
  );

  // Chart Data prep with Gap Filling (so every day has a point)
  let chartData: any[] = [];
  const history = studentData?.risk_history || [];
  
  if (history.length > 0) {
    // 1. Sort history by date
    const sortedHistory = [...history].sort(
      (a, b) =>
        new Date(a.recorded_date).getTime() -
        new Date(b.recorded_date).getTime(),
    );

    // 2. Determine date range (from first record to today)
    const startDate = new Date(sortedHistory[0].recorded_date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date();
    endDate.setHours(0, 0, 0, 0);

    const filledData = [];
    let lastKnownScore = sortedHistory[0].risk_score;
    const curr = new Date(startDate);

    // 3. Loop through every single day
    while (curr <= endDate) {
      // Create a local YYYY-MM-DD string to avoid timezone offset bugs
      const yyyy = curr.getFullYear();
      const mm = String(curr.getMonth() + 1).padStart(2, "0");
      const dd = String(curr.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;

      // Find the LATEST score recorded on this specific local day
      const dayRecords = sortedHistory.filter((rh) => {
        // Convert DB UTC timestamp to local Date before comparing
        const rhDate = new Date(rh.recorded_date);
        const rhStr = `${rhDate.getFullYear()}-${String(rhDate.getMonth() + 1).padStart(2, "0")}-${String(rhDate.getDate()).padStart(2, "0")}`;
        return rhStr === dateStr;
      });

      if (dayRecords.length > 0) {
        lastKnownScore = dayRecords[dayRecords.length - 1].risk_score;
      }

      // Check for interventions on this local day
      const intervention = (studentData?.interventions || []).find((inv) => {
        const invDate = new Date(inv.session_date);
        const invStr = `${invDate.getFullYear()}-${String(invDate.getMonth() + 1).padStart(2, "0")}-${String(invDate.getDate()).padStart(2, "0")}`;
        return invStr === dateStr;
      });

      // Is this the final point on the graph (Today)?
      const isToday = curr.getTime() === endDate.getTime();

      filledData.push({
        date: curr.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        // Bulletproof sync: Today's dot MUST exactly match the current live score
        score: isToday && studentData?.current_risk_score !== undefined
          ? studentData.current_risk_score
          : lastKnownScore,
        hasIntervention: !!intervention,
      });

      curr.setDate(curr.getDate() + 1);
    }
    chartData = filledData;
  }

  const handleFeedbackSubmit = async () => {
    if (!studentData?.id || !feedbackText.trim()) return;
    setFeedbackLoading(true);
    setFeedbackSuccess(false);
    try {
      await submitGeneralFeedback(studentData.id, feedbackText.trim());
      setFeedbackSuccess(true);
    } finally {
      setFeedbackLoading(false);
    }
  };

  const handleReasonSubmit = async (asgId: string) => {
    const text = reasons[asgId]?.trim();
    if (!text) return;
    setReasonLoading(asgId);
    try {
      await submitAssignmentReason(asgId, text);
      setReasonSuccess((prev) => ({ ...prev, [asgId]: true }));
      // Update local state so the submitted reason shows up immediately
      setStudentData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          student_assignments: prev.student_assignments.map((a) =>
            a.id === asgId ? { ...a, student_reason: text } : a,
          ),
        };
      });
    } finally {
      setReasonLoading(null);
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    isMedical: boolean,
    assignmentId?: string,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !studentData?.id) return;

    const targetState = isMedical ? "medical" : assignmentId || "unknown";
    setReasonLoading(targetState);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("studentId", studentData.id);
      formData.append("isMedical", isMedical ? "true" : "false");
      if (assignmentId) formData.append("assignmentId", assignmentId);

      const res = await fetch("/api/upload-verification", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");

      setReasonSuccess((prev) => ({ ...prev, [targetState]: true }));

      if (!isMedical && assignmentId) {
        setStudentData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            student_assignments: prev.student_assignments.map((a) =>
              a.id === assignmentId
                ? ({ ...a, is_completed: true, file_url: json.url } as any)
                : a,
            ),
          };
        });
      }
    } catch (err: any) {
      console.error(err);
      alert("Upload failed: " + err.message);
    } finally {
      setReasonLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-blue-500 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-800">RiskWise AI</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-500 font-medium">
              Student Dashboard
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-blue-300 flex items-center justify-center text-white text-xs font-bold">
                {studentName[0]}
              </div>
              <span className="text-sm font-medium text-slate-700">
                {studentName}
              </span>
            </div>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.push("/login");
              }}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-xl transition-all"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Good day, {studentName.split(" ")[0]} 👋
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Here&apos;s your current academic risk status.
          </p>
        </div>

        {/* No profile banner */}
        {!studentData && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-2xl px-5 py-4 text-sm flex items-center gap-3">
            <Bell className="w-4 h-4 shrink-0" />
            <p>
              Your academic profile hasn&apos;t been set up yet. Your teacher
              will add your records soon.
            </p>
          </div>
        )}

        {/* Mentor Message Banner */}
        {latestIntervention?.mentor_feedback && (
          <div className="bg-indigo-600 rounded-2xl p-5 md:px-6 md:py-5 text-white shadow-xl shadow-indigo-200/50 flex flex-col md:flex-row items-start md:items-center gap-4 border border-indigo-500">
            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center shrink-0 border-2 border-indigo-400">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 mb-1">
                <h2 className="font-bold text-indigo-50">
                  Message from your Mentor
                </h2>
                <span className="text-xs bg-indigo-500/50 text-indigo-100 px-2 py-0.5 rounded-full font-semibold border border-indigo-400/50">
                  {new Date(
                    latestIntervention.session_date,
                  ).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-indigo-100 italic">
                &quot;{latestIntervention.mentor_feedback}&quot;
              </p>
            </div>
          </div>
        )}

        {studentData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ── LEFT ─────────────────────────────────────────────────────── */}
            <div className="space-y-6">
              {/* Risk Card */}
              <div
                className={`bg-white rounded-2xl shadow-sm border p-6 ${
                  riskLevel === "High"
                    ? "border-red-200"
                    : riskLevel === "Medium"
                      ? "border-amber-200"
                      : "border-teal-200"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">
                    Risk Index
                  </h2>
                  <RiskBadge level={riskLevel} />
                </div>
                <div className="flex items-center gap-5">
                  <RiskRing score={riskScore} level={riskLevel} size="lg" />
                  <div className="flex-1 space-y-2">
                    {riskReasons.length > 0 ? (
                      riskReasons.map((r, i) => (
                        <p
                          key={i}
                          className="flex items-start gap-1.5 text-xs text-slate-600"
                        >
                          <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                          {r}
                        </p>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400">
                        No risk factors recorded yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Subject Records */}
              {activeSubjects.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <h2 className="font-semibold text-slate-800 text-sm uppercase tracking-wide mb-4 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-500" /> Subject
                    Records
                  </h2>
                  <div className="space-y-4">
                    {activeSubjects.map((s) => {
                      const marks = Number(studentData[s.marksKey] ?? 0);
                      const att = Number(studentData[s.attKey] ?? 0);
                      return (
                        <div key={s.label}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-medium text-slate-600">
                              {s.label}
                            </span>
                            <span
                              className={`font-bold ${marks < 50 ? "text-red-600" : marks < 65 ? "text-amber-600" : "text-teal-600"}`}
                            >
                              {marks}% · Att:{" "}
                              <span
                                className={
                                  att < 75 ? "text-red-600" : "text-teal-600"
                                }
                              >
                                {att}%
                              </span>
                            </span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${marks < 50 ? "bg-red-400" : marks < 65 ? "bg-amber-400" : "bg-teal-400"}`}
                              style={{ width: `${marks}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {/* Radar Chart */}
              {activeSubjects.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <h2 className="font-semibold text-slate-800 text-sm uppercase tracking-wide mb-1 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-500" /> Subject
                    Performance Radar
                  </h2>
                  <p className="text-xs text-slate-400 mb-3">
                    Solid = Marks &bull; Dashed = Attendance
                  </p>
                  <SubjectRadarChart
                    riskLevel={riskLevel}
                    data={activeSubjects.map((s) => ({
                      label: s.label,
                      marks: Number(studentData?.[s.marksKey] ?? 0),
                      attendance: Number(studentData?.[s.attKey] ?? 0),
                    }))}
                  />
                </div>
              )}

              {/* PDF Download */}
              <button
                onClick={async () => {
                  if (!studentData) return;
                  setPdfLoading(true);
                  try {
                    await generateStudentReport({
                      name: studentName,
                      email: "",
                      risk_category: riskLevel,
                      current_risk_score: riskScore,
                      top_risk_reasons: studentData.top_risk_reasons,
                      math_marks: Number(studentData.math_marks ?? 0),
                      physics_marks: Number(studentData.physics_marks ?? 0),
                      cs_marks: Number(studentData.cs_marks ?? 0),
                      english_marks: Number(studentData.english_marks ?? 0),
                      electronics_marks: Number(
                        studentData.electronics_marks ?? 0,
                      ),
                      chemistry_marks: Number(studentData.chemistry_marks ?? 0),
                      math_attendance: Number(studentData.math_attendance ?? 0),
                      physics_attendance: Number(
                        studentData.physics_attendance ?? 0,
                      ),
                      cs_attendance: Number(studentData.cs_attendance ?? 0),
                      english_attendance: Number(
                        studentData.english_attendance ?? 0,
                      ),
                      electronics_attendance: Number(
                        studentData.electronics_attendance ?? 0,
                      ),
                      chemistry_attendance: Number(
                        studentData.chemistry_attendance ?? 0,
                      ),
                    });
                  } finally {
                    setPdfLoading(false);
                  }
                }}
                disabled={pdfLoading}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold text-sm py-3 rounded-2xl transition-all shadow-md shadow-indigo-100"
              >
                {pdfLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {pdfLoading
                  ? "Generating PDF..."
                  : "Download My Risk Report (PDF)"}
              </button>
            </div>

            {/* ── RIGHT ────────────────────────────────────────────────────── */}
            <div className="lg:col-span-2 space-y-6">
              {/* RISK HISTORY CHART */}
              {chartData.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <TrendingUp className="w-5 h-5 text-indigo-500" />
                    <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">
                      Risk Improvement History
                    </h3>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={chartData}
                        margin={{ top: 10, right: 20, left: -20, bottom: 0 }}
                      >
                        <XAxis
                          dataKey="date"
                          stroke="#94a3b8"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          dy={10}
                        />
                        <YAxis
                          stroke="#94a3b8"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          domain={[0, 100]}
                        />
                        <Tooltip content={<RiskTooltip />} />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="#6366f1"
                          strokeWidth={3}
                          dot={{
                            r: 4,
                            strokeWidth: 2,
                            fill: "#fff",
                            stroke: "#6366f1",
                          }}
                          activeDot={{
                            r: 6,
                            fill: "#6366f1",
                            stroke: "#fff",
                            strokeWidth: 2,
                          }}
                        />
                        {/* Reference dots for mentor interventions */}
                        {chartData.map(
                          (entry, index) =>
                            entry.hasIntervention && (
                              <ReferenceDot
                                key={`ref_${index}`}
                                x={entry.date}
                                y={entry.score}
                                r={8}
                                fill="#f59e0b"
                                stroke="#fff"
                                strokeWidth={2}
                              />
                            ),
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-4 text-xs font-semibold text-slate-500">
                    <div className="w-3 h-3 rounded-full bg-amber-500" /> =
                    Mentor Session
                  </div>
                </div>
              )}

              {/* LOW ATTENDANCE ALERT */}
              {lowAttendanceSubjects.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <h3 className="font-bold text-red-700">
                      ⚠️ Warning: Low Attendance Detected
                    </h3>
                  </div>
                  <p className="text-sm text-red-600 mb-3">
                    Your attendance is below 75% in:{" "}
                    <strong>
                      {lowAttendanceSubjects
                        .map(
                          (s) =>
                            `${s.label} (${Number(studentData[s.attKey])}%)`,
                        )
                        .join(", ")}
                    </strong>
                    . Please submit an explanation for your mentor.
                  </p>
                  <textarea
                    rows={3}
                    value={feedbackText}
                    onChange={(e) => {
                      setFeedbackText(e.target.value);
                      setFeedbackSuccess(false);
                    }}
                    placeholder="Explain your attendance situation (illness, travel, emergency)..."
                    className="w-full px-4 py-3 rounded-xl border border-red-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-300 resize-none placeholder:text-slate-400"
                  />
                  <div className="flex items-center gap-3 mt-3">
                    <button
                      onClick={handleFeedbackSubmit}
                      disabled={feedbackLoading}
                      className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all"
                    >
                      {feedbackLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Bell className="w-4 h-4" />
                      )}
                      Submit Explanation
                    </button>

                    <label className="flex items-center gap-2 bg-white border border-red-300 text-red-700 hover:bg-red-50 cursor-pointer disabled:opacity-60 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all">
                      {reasonLoading === "medical" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      Upload Medical Proof
                      <input
                        type="file"
                        className="hidden"
                        accept="application/pdf,image/*"
                        onChange={(e) => handleFileUpload(e, true)}
                        disabled={reasonLoading === "medical"}
                      />
                    </label>

                    {feedbackSuccess && (
                      <span className="text-sm text-teal-600 font-medium ml-2">
                        Submitted text!
                      </span>
                    )}
                    {reasonSuccess["medical"] && (
                      <span className="text-sm text-teal-600 font-medium ml-2">
                        Medical Proof Uploaded!
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* OVERDUE ASSIGNMENTS */}
              {overdueAssignments.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-amber-600" />
                    <h3 className="font-bold text-amber-700">
                      ⏰ Overdue Assignments
                    </h3>
                  </div>
                  {overdueAssignments.map((asg) => (
                    <div
                      key={asg.id}
                      className="bg-white rounded-xl border border-amber-200 p-4 space-y-3"
                    >
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">
                          {asg.assignment_title}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {asg.subject} · Due: {asg.due_date}
                        </p>
                      </div>
                      {asg.student_reason ? (
                        <p className="text-xs text-indigo-600 italic bg-indigo-50 rounded-lg px-3 py-2">
                          ✅ Your submitted reason: &quot;{asg.student_reason}
                          &quot;
                        </p>
                      ) : (
                        <>
                          <textarea
                            rows={2}
                            value={reasons[asg.id] ?? ""}
                            onChange={(e) =>
                              setReasons((prev) => ({
                                ...prev,
                                [asg.id]: e.target.value,
                              }))
                            }
                            placeholder="Why is this assignment incomplete or late?"
                            className="w-full px-3 py-2 rounded-lg border border-amber-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none placeholder:text-slate-400 bg-amber-50"
                          />
                          <div className="flex items-center gap-3 mt-2">
                            <button
                              onClick={() => handleReasonSubmit(asg.id)}
                              disabled={reasonLoading === asg.id}
                              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-all"
                            >
                              {reasonLoading === asg.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Bell className="w-3.5 h-3.5" />
                              )}
                              Submit Reason
                            </button>

                            <label className="flex items-center gap-1.5 bg-white border border-amber-300 text-amber-700 hover:bg-amber-100 cursor-pointer disabled:opacity-60 text-xs font-semibold px-3 py-2 rounded-lg transition-all">
                              {reasonLoading === asg.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Upload className="w-3.5 h-3.5" />
                              )}
                              Upload Assignment
                              <input
                                type="file"
                                className="hidden"
                                accept="application/pdf,image/*"
                                onChange={(e) =>
                                  handleFileUpload(e, false, asg.id)
                                }
                                disabled={reasonLoading === asg.id}
                              />
                            </label>

                            {reasonSuccess[asg.id] && (
                              <span className="text-xs text-teal-600 font-medium flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />{" "}
                                Uploaded!
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* ALL ASSIGNMENTS */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-indigo-500" /> All
                  Assignments
                </h2>
                {(studentData.student_assignments ?? []).length === 0 ? (
                  <p className="text-sm text-slate-400">
                    No assignments assigned yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {studentData.student_assignments.map((asg) => {
                      const overdue =
                        !asg.is_completed && new Date(asg.due_date) < now;
                      return (
                        <div
                          key={asg.id}
                          className={`flex items-center gap-4 px-4 py-3 rounded-xl border ${
                            asg.is_completed
                              ? "border-teal-100 bg-teal-50"
                              : overdue
                                ? "border-red-100 bg-red-50"
                                : "border-slate-200 bg-slate-50"
                          }`}
                        >
                          <div
                            className={`w-2 h-2 rounded-full shrink-0 ${asg.is_completed ? "bg-teal-400" : overdue ? "bg-red-400" : "bg-amber-400"}`}
                          />
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-semibold truncate ${asg.is_completed ? "line-through text-slate-400" : "text-slate-800"}`}
                            >
                              {asg.assignment_title}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {asg.subject} · Due: {asg.due_date}
                            </p>
                          </div>
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                              asg.is_completed
                                ? "bg-teal-100 text-teal-700"
                                : overdue
                                  ? "bg-red-100 text-red-700"
                                  : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {asg.is_completed
                              ? "Done"
                              : overdue
                                ? "Overdue"
                                : "Pending"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Interventions */}
              {(studentData.interventions ?? []).length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-500" /> Recent
                    Mentor Sessions
                  </h2>
                  <div className="space-y-3">
                    {studentData.interventions.map((inv) => (
                      <div
                        key={inv.id}
                        className="flex items-start gap-3 px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-xl text-sm"
                      >
                        <div className="w-2 h-2 rounded-full bg-indigo-400 shrink-0 mt-1.5" />
                        <div>
                          <p className="font-semibold text-indigo-700">
                            {inv.status} —{" "}
                            {new Date(inv.session_date).toLocaleDateString()}
                          </p>
                          {inv.mentor_feedback && (
                            <p className="text-slate-600 mt-1 text-xs">
                              💬 {inv.mentor_feedback}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
