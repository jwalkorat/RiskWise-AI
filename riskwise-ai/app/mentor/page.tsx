"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  ChevronRight,
  LogOut,
  Search,
  Users,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Loader2,
  Send,
  MessageSquare,
  TrendingUp,
  Bell,
  BookOpen,
  Mail,
} from "lucide-react";
import { supabase } from "@/lib/Client";
import {
  getAssignedStudents,
  getStudentDetails,
  logIntervention,
} from "@/actions/mentorActions";
import { RiskRing } from "@/components/RiskRing";
import { RiskBadge } from "@/components/RiskBadge";
import { SubjectRadarChart } from "@/components/SubjectRadarChart";
import { EscalationChain } from "@/components/EscalationChain";
import { useSessionGuard } from "@/hooks/useSessionGuard";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";

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

type StudentCard = { id: string; studentName: string; email: string };

type Assignment = {
  id: string;
  assignment_title: string;
  subject: string | null;
  due_date: string;
  is_completed: boolean;
  student_reason: string | null;
};

type Intervention = {
  id: string;
  session_date: string;
  status: string;
  mentor_feedback: string | null;
  pre_intervention_score: number | null;
};

type StudentDetail = {
  id: string;
  current_risk_score: number;
  risk_category: string;
  top_risk_reasons: string | null;
  general_feedback: string | null;
  medical_proof_url: string | null;
  [key: string]: unknown;
  student_assignments: Assignment[];
  interventions: Intervention[];
};

export default function MentorDashboard() {
  const router = useRouter();
  useSessionGuard("MENTOR");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [mentorId, setMentorId] = useState("");
  const [mentorName, setMentorName] = useState("Mentor");

  const [students, setStudents] = useState<StudentCard[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentCard[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [listLoading, setListLoading] = useState(true);

  const [selectedStudent, setSelectedStudent] = useState<StudentCard | null>(
    null,
  );
  const [detail, setDetail] = useState<StudentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [interventionText, setInterventionText] = useState("");
  const [interventionDate, setInterventionDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [interventionLoading, setInterventionLoading] = useState(false);
  const [interventionSuccess, setInterventionSuccess] = useState(false);

  // bulk email
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailResult, setEmailResult] = useState<{
    sent: number;
    total: number;
  } | null>(null);
  const [mentorUserId, setMentorUserId] = useState("");

  // ── Bouncer ──────────────────────────────────────────────────────────────────
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

      if (userData?.role !== "MENTOR") {
        router.push("/login");
        return;
      }
      setMentorName(userData?.full_name || "Mentor");
      setMentorId(session.user.id);
      setMentorUserId(session.user.id);

      try {
        const list = await getAssignedStudents(session.user.id);
        setStudents(list);
        setFilteredStudents(list);
      } finally {
        setListLoading(false);
      }

      setIsAuthorized(true);
    };
    run();
  }, [router]);

  useEffect(() => {
    const q = searchQuery.toLowerCase();
    setFilteredStudents(
      students.filter(
        (s) =>
          s.studentName.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q),
      ),
    );
  }, [searchQuery, students]);

  const handleSelectStudent = async (s: StudentCard) => {
    setSelectedStudent(s);
    setDetail(null);
    setInterventionText("");
    setInterventionSuccess(false);
    setDetailLoading(true);
    try {
      const d = await getStudentDetails(s.id);
      setDetail(d as unknown as StudentDetail);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleLogIntervention = async () => {
    if (!detail?.id || !interventionText.trim()) return;
    setInterventionLoading(true);
    try {
      await logIntervention(
        detail.id,
        mentorId,
        interventionText.trim(),
        interventionDate,
        detail.current_risk_score,
      );
      setInterventionText("");
      setInterventionSuccess(true);
      setTimeout(() => setInterventionSuccess(false), 4000);
    } finally {
      setInterventionLoading(false);
    }
  };

  const handleBulkEmail = async () => {
    setEmailLoading(true);
    setEmailResult(null);
    try {
      // Build at-risk student payload from the loaded list
      const atRiskStudents = students
        .filter(
          (s) =>
            (s as any).risk_category === "High" ||
            (s as any).current_risk_score >= 60,
        )
        .map((s) => ({
          name: s.studentName,
          parent_email: (s as any).parent_email ?? null,
          avg_marks: (s as any).avg_marks ?? 50,
          avg_attendance: (s as any).avg_attendance ?? 70,
          risk_category: (s as any).risk_category ?? "Low",
        }));

      const res = await fetch("/api/send-mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ students: atRiskStudents, type: "WARNING" }),
      });
      const data = await res.json();
      setEmailResult({ sent: data.sent ?? 0, total: data.total ?? 0 });
    } finally {
      setEmailLoading(false);
    }
  };

  if (!isAuthorized) {
    return <DashboardSkeleton roleName="Mentor Dashboard" />;
  }

  const now = new Date();
  const riskScore = detail?.current_risk_score ?? 0;
  const riskLevel =
    (detail?.risk_category as "Low" | "Medium" | "High") ?? "Low";
  const riskReasons =
    detail?.top_risk_reasons?.split(" | ").filter(Boolean) ?? [];

  const activeSubjects = SUBJECT_COLS.filter((s) => {
    const m = Number(detail?.[s.marksKey] ?? 0);
    const a = Number(detail?.[s.attKey] ?? 0);
    return m > 0 || a > 0;
  });

  const overdueAssignments = (detail?.student_assignments ?? []).filter(
    (a) => !a.is_completed && new Date(a.due_date) < now,
  );

  const lowAttendanceSubjects = SUBJECT_COLS.filter((s) => {
    const val = Number(detail?.[s.attKey] ?? 0);
    return val > 0 && val < 75;
  });

  const hasStudentPerspective =
    detail?.general_feedback ||
    detail?.medical_proof_url ||
    overdueAssignments.some((a) => a.student_reason) ||
    lowAttendanceSubjects.length > 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-800">RiskWise AI</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-500 font-medium">
              Mentor Portal
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleBulkEmail}
              disabled={emailLoading}
              title="Send warning emails to all at-risk students' parents"
              className="flex items-center gap-1.5 text-sm bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-semibold px-3 py-2 rounded-xl transition-all disabled:opacity-60"
            >
              {emailLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Mail className="w-4 h-4" />
              )}
              {emailLoading ? "Sending..." : "Alert Parents"}
            </button>
            <div className="flex items-center gap-2 bg-teal-50 border border-teal-100 rounded-xl px-3 py-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-400 to-emerald-300 flex items-center justify-center text-white text-xs font-bold">
                {mentorName[0]}
              </div>
              <span className="text-sm font-semibold text-teal-700">
                {mentorName}
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

      <div className="flex flex-1 max-w-screen-xl mx-auto w-full">
        {/* LEFT: Student list */}
        <aside className="w-80 shrink-0 border-r border-slate-200 bg-white flex flex-col">
          <div className="p-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-teal-500" /> Students
            </h2>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm text-slate-700 focus:outline-none placeholder:text-slate-400"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {listLoading ? (
              <div className="py-8 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading...
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">
                No students found.
              </div>
            ) : (
              filteredStudents.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSelectStudent(s)}
                  className={`w-full text-left px-4 py-3.5 hover:bg-teal-50 transition-all ${selectedStudent?.id === s.id ? "bg-teal-50 border-l-4 border-teal-400" : ""}`}
                >
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${
                          (s as any).risk_category === "High"
                            ? "bg-gradient-to-br from-red-500 to-rose-400"
                            : (s as any).risk_category === "Medium"
                              ? "bg-gradient-to-br from-amber-500 to-orange-400"
                              : "bg-gradient-to-br from-teal-400 to-emerald-300"
                        }`}
                      >
                        {s.studentName[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 text-sm truncate">
                          {s.studentName}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {s.email}
                        </p>
                      </div>
                    </div>
                    {(s as any).current_risk_score > 0 && (
                      <div
                        className={`shrink-0 flex items-center justify-center text-xs font-bold px-2 py-0.5 rounded-full border ${
                          (s as any).risk_category === "High"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : (s as any).risk_category === "Medium"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-teal-50 text-teal-700 border-teal-200"
                        }`}
                      >
                        {(s as any).current_risk_score}
                      </div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* RIGHT: Detail */}
        <main className="flex-1 overflow-y-auto p-6">
          {!selectedStudent ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
              <Users className="w-12 h-12 opacity-20" />
              <p className="text-sm">Select a student to view their profile.</p>
            </div>
          ) : detailLoading ? (
            <div className="flex items-center justify-center h-full text-slate-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading profile...
            </div>
          ) : !detail ? (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-blue-700 text-sm">
              <p className="font-semibold">
                No profile found for {selectedStudent.studentName}.
              </p>
              <p className="mt-1 text-blue-600">
                Their teacher hasn&apos;t entered records yet.
              </p>
            </div>
          ) : (
            <div className="space-y-6 max-w-3xl">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">
                    {selectedStudent.studentName}
                  </h1>
                  <p className="text-sm text-slate-400">
                    {selectedStudent.email}
                  </p>
                </div>
                <RiskBadge level={riskLevel} />
              </div>

              {/* Risk */}
              <div
                className={`bg-white rounded-2xl shadow-sm border p-6 flex items-center gap-6 ${
                  riskLevel === "High"
                    ? "border-red-200"
                    : riskLevel === "Medium"
                      ? "border-amber-200"
                      : "border-teal-200"
                }`}
              >
                <RiskRing score={riskScore} level={riskLevel} size="lg" />
                <div className="flex-1 space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Risk Factors
                  </p>
                  {riskReasons.length > 0 ? (
                    riskReasons.map((r, i) => (
                      <p
                        key={i}
                        className="flex items-start gap-1.5 text-sm text-slate-600"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        {r}
                      </p>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400">
                      No risk factors on record.
                    </p>
                  )}
                </div>
              </div>

              {/* Escalation Chain */}
              <EscalationChain
                riskScore={riskScore}
                riskCategory={riskLevel}
                hasMentor={true}
                hasIntervention={(detail.interventions ?? []).length > 0}
                emailSent={false}
              />

              {/* Subject Records + Radar Chart */}
              {activeSubjects.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-500" /> Academic
                    Performance
                  </h3>
                  {/* Radar Chart */}
                  {activeSubjects.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-slate-400 mb-2">
                        Solid = Marks &bull; Dashed = Attendance
                      </p>
                      <SubjectRadarChart
                        riskLevel={riskLevel as "Low" | "Medium" | "High"}
                        data={activeSubjects.map((s) => ({
                          label: s.label,
                          marks: Number(detail[s.marksKey] ?? 0),
                          attendance: Number(detail[s.attKey] ?? 0),
                        }))}
                      />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    {activeSubjects.map((s) => {
                      const m = Number(detail[s.marksKey] ?? 0);
                      const a = Number(detail[s.attKey] ?? 0);
                      return (
                        <div
                          key={s.label}
                          className={`rounded-xl border p-3 ${a < 75 ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-200"}`}
                        >
                          <p className="font-semibold text-slate-800 text-sm">
                            {s.label}
                          </p>
                          <p
                            className={`text-xs mt-1 ${m < 50 ? "text-red-600" : "text-teal-600"}`}
                          >
                            Marks: {m}%
                          </p>
                          <p
                            className={`text-xs ${a < 75 ? "text-red-600 font-semibold" : "text-slate-500"}`}
                          >
                            Attendance: {a}% {a < 75 && "⚠️"}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── STUDENT PERSPECTIVE ──────────────────────────────────── */}
              {hasStudentPerspective && (
                <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl border border-indigo-200 p-5 space-y-4">
                  <h3 className="font-bold text-indigo-800 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> Student Perspective
                    &amp; Notes
                  </h3>
                  <p className="text-xs text-indigo-600">
                    The following was submitted directly by the student. Use
                    this context before intervening.
                  </p>

                  {/* General feedback & Medical Proof */}
                  {detail.general_feedback || detail.medical_proof_url ? (
                    <div className="bg-white border border-indigo-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">
                          📝 Attendance Explanation
                        </p>
                        {detail.medical_proof_url && (
                          <a
                            href={detail.medical_proof_url as string}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded border border-teal-100 hover:bg-teal-100 transition-colors"
                          >
                            <BookOpen className="w-3.5 h-3.5" /> View Medical
                            Proof
                          </a>
                        )}
                      </div>
                      {detail.general_feedback && (
                        <p className="text-sm text-slate-700 italic">
                          &quot;{detail.general_feedback}&quot;
                        </p>
                      )}
                    </div>
                  ) : (
                    lowAttendanceSubjects.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        Low attendance detected. Student has not submitted an
                        explanation yet.
                      </div>
                    )
                  )}

                  {/* Per-assignment reasons */}
                  {overdueAssignments.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" /> Overdue Assignment
                        Context
                      </p>
                      {overdueAssignments.map((asg) => (
                        <div
                          key={asg.id}
                          className="bg-white border border-indigo-100 rounded-xl p-4"
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div>
                              <p className="text-sm font-semibold text-slate-800">
                                {asg.assignment_title}
                              </p>
                              <p className="text-xs text-slate-400">
                                {asg.subject} · Due: {asg.due_date}
                              </p>
                            </div>
                            <span className="text-xs bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full shrink-0">
                              Overdue
                            </span>
                          </div>
                          {asg.student_reason ? (
                            <div className="bg-indigo-50 rounded-lg px-3 py-2.5">
                              <p className="text-xs text-indigo-600 font-semibold mb-1">
                                Student&apos;s reason:
                              </p>
                              <p className="text-sm text-slate-700 italic">
                                &quot;{asg.student_reason}&quot;
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic">
                              Student has not yet provided a reason.
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* All Assignments */}
              {(detail.student_assignments ?? []).length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-teal-500" /> All
                    Assignments
                  </h3>
                  <div className="space-y-2">
                    {detail.student_assignments.map((asg) => {
                      const overdue =
                        !asg.is_completed && new Date(asg.due_date) < now;
                      return (
                        <div
                          key={asg.id}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${
                            asg.is_completed
                              ? "bg-teal-50 border-teal-100"
                              : overdue
                                ? "bg-red-50 border-red-100"
                                : "bg-slate-50 border-slate-200"
                          }`}
                        >
                          <div
                            className={`w-2 h-2 rounded-full shrink-0 ${asg.is_completed ? "bg-teal-400" : overdue ? "bg-red-400" : "bg-amber-400"}`}
                          />
                          <div className="flex-1 min-w-0">
                            <p
                              className={`font-semibold truncate ${asg.is_completed ? "line-through text-slate-400" : "text-slate-800"}`}
                            >
                              {asg.assignment_title}
                            </p>
                            <p className="text-xs text-slate-400">
                              {asg.subject} · Due: {asg.due_date}
                            </p>
                          </div>
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${
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
                </div>
              )}

              {/* Log Intervention */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Send className="w-4 h-4 text-teal-500" /> Log Intervention
                  Session
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                      Session Date
                    </label>
                    <input
                      type="date"
                      value={interventionDate}
                      onChange={(e) => setInterventionDate(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                      Notes / Feedback
                    </label>
                    <textarea
                      rows={4}
                      value={interventionText}
                      onChange={(e) => setInterventionText(e.target.value)}
                      placeholder="Describe what was discussed, action items, and next steps..."
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-slate-50 resize-none placeholder:text-slate-400"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleLogIntervention}
                      disabled={interventionLoading || !interventionText.trim()}
                      className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-all"
                    >
                      {interventionLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Bell className="w-4 h-4" />
                      )}
                      Log Session
                    </button>
                    {interventionSuccess && (
                      <span className="text-sm text-teal-600 font-medium flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> Session logged!
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Past Interventions */}
              {(detail.interventions ?? []).length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-500" /> Past
                    Interventions
                  </h3>
                  <div className="space-y-3">
                    {detail.interventions.map((inv) => (
                      <div
                        key={inv.id}
                        className="flex items-start gap-3 px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-xl"
                      >
                        <div className="w-2 h-2 rounded-full bg-indigo-400 shrink-0 mt-1.5" />
                        <div>
                          <p className="text-sm font-semibold text-indigo-700">
                            {inv.status} —{" "}
                            {new Date(inv.session_date).toLocaleDateString()}
                            {inv.pre_intervention_score != null && (
                              <span className="ml-2 text-xs font-normal text-indigo-400">
                                Pre-score: {inv.pre_intervention_score}
                              </span>
                            )}
                          </p>
                          {inv.mentor_feedback && (
                            <p className="text-xs text-slate-600 mt-1">
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
          )}
        </main>
      </div>

      {/* Email result toast */}
      {emailResult && (
        <div className="fixed bottom-24 right-6 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50 text-sm max-w-xs">
          <p className="font-semibold text-slate-800 mb-1">📧 Emails Sent</p>
          <p className="text-slate-600">
            {emailResult.sent} of {emailResult.total} parents notified
            successfully.
          </p>
          <button
            onClick={() => setEmailResult(null)}
            className="text-xs text-slate-400 hover:text-slate-600 mt-2"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
