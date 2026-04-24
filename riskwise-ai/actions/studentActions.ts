"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/Client";

// ── All subject columns on the students table ─────────────────────────────────
const SUBJECT_ATTENDANCE_COLS: Record<string, string> = {
  math: "math_attendance",
  physics: "physics_attendance",
  cs: "cs_attendance",
  english: "english_attendance",
  electronics: "electronics_attendance",
  chemistry: "chemistry_attendance",
};

const SUBJECT_MARKS_COLS: Record<string, string> = {
  math: "math_marks",
  physics: "physics_marks",
  cs: "cs_marks",
  english: "english_marks",
  electronics: "electronics_marks",
  chemistry: "chemistry_marks",
};

// ── getStudentDashboardData ───────────────────────────────────────────────────
/**
 * Fetches the student row by auth user_id plus their assignments.
 */
export async function getStudentDashboardData(studentUserId: string) {
  // 1. Fetch core student metrics securely using '*'
  // This prevents crashes if some subject columns haven't been created yet in the db!
  const { data: student, error } = await supabase
    .from("students")
    .select("*")
    .eq("user_id", studentUserId)
    .single();

  let finalStudent = student;

  if (error) {
    if (error.code === "PGRST116") {
      // Auto-create profile if missing
      const { data: newProfile, error: insertErr } = await supabase
        .from("students")
        .insert({ user_id: studentUserId })
        .select("*")
        .single();

      if (insertErr) throw new Error(insertErr.message);
      finalStudent = newProfile;
    } else {
      throw new Error(error.message);
    }
  }

  // 2. Fetch Assignments safely (Option B: Relational schema mapping)
  let safeAssignments: any[] = [];
  const { data: asgData, error: asgErr } = await supabase
    .from("student_assignments")
    .select(
      `
      id,
      is_completed,
      student_reason,
      assignments (
        id,
        assignment_title,
        subject_name,
        due_date
      )
    `,
    )
    .eq("student_id", finalStudent.id);

  if (asgErr) {
    console.error("Safely ignoring assignments table error:", asgErr.message);
  } else if (asgData) {
    // Flatten the relational data so the frontend doesn't need to be altered
    safeAssignments = asgData.map((a: any) => ({
      id: a.id,
      is_completed: a.is_completed,
      student_reason: a.student_reason,
      assignment_title: a.assignments?.assignment_title || "Untitled",
      subject: a.assignments?.subject_name || null,
      due_date: a.assignments?.due_date || "N/A",
    }));
  }

  // 3. Fetch Interventions safely
  let safeInterventions: any[] = [];
  const { data: intData, error: intErr } = await supabase
    .from("interventions")
    .select("id, session_date, status, mentor_feedback")
    .eq("student_id", finalStudent.id)
    .order("session_date", { ascending: false });

  if (intErr) {
    console.error("Safely ignoring interventions table error:", intErr.message);
  } else if (intData) {
    safeInterventions = intData;
  }

  // 4. Fetch Risk History for the Timeline Graph
  let safeRiskHistory: any[] = [];
  const { data: rhData, error: rhErr } = await supabase
    .from("risk_history")
    .select("recorded_date, risk_score")
    .eq("student_id", finalStudent.id)
    .order("recorded_date", { ascending: true }); // chronological order for recharts

  if (rhErr) {
    console.error("Safely ignoring risk_history table error:", rhErr.message);
  } else if (rhData) {
    safeRiskHistory = rhData;
  }

  // Inject the safe relations into the final object
  return {
    ...finalStudent,
    student_assignments: safeAssignments,
    interventions: safeInterventions,
    risk_history: safeRiskHistory,
  };
}

// ── submitAssignmentReason ────────────────────────────────────────────────────
/**
 * Student: explains why an assignment is overdue/incomplete.
 */
export async function submitAssignmentReason(
  assignmentId: string,
  reasonText: string,
) {
  const { error } = await supabase
    .from("student_assignments")
    .update({ student_reason: reasonText })
    .eq("id", assignmentId);

  if (error) throw new Error(error.message);

  revalidatePath("/student");
  revalidatePath("/teacher");
  revalidatePath("/mentor");
}

// ── submitGeneralFeedback ─────────────────────────────────────────────────────
/**
 * Student: submits a general explanation for low attendance.
 */
export async function submitGeneralFeedback(
  studentDbId: string,
  feedbackText: string,
) {
  const { error } = await supabase
    .from("students")
    .update({ general_feedback: feedbackText })
    .eq("id", studentDbId);

  if (error) throw new Error(error.message);

  revalidatePath("/student");
  revalidatePath("/teacher");
  revalidatePath("/mentor");
}

// ── Helper: derive low-attendance subjects from a student row ─────────────────
function getLowAttendanceSubjects(
  studentRow: Record<string, unknown>,
  threshold = 75,
): { label: string; value: number }[] {
  return Object.entries(SUBJECT_ATTENDANCE_COLS)
    .map(([subj, col]) => ({
      label: subj,
      value: Number(studentRow[col] ?? 0),
    }))
    .filter(({ value }) => value > 0 && value < threshold); // only flag if data exists
}

// ── Helper: get all subject records for display ───────────────────────────────
function getAllSubjectRecord(
  studentRow: Record<string, unknown>,
): { label: string; marks: number; attendance: number }[] {
  return Object.entries(SUBJECT_MARKS_COLS)
    .map(([subj, marksCol]) => ({
      label: subj.charAt(0).toUpperCase() + subj.slice(1),
      marks: Number(studentRow[marksCol] ?? 0),
      attendance: Number(studentRow[SUBJECT_ATTENDANCE_COLS[subj]] ?? 0),
    }))
    .filter((r) => r.marks > 0 || r.attendance > 0); // only show subjects with data
}
