"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/Client";

// ── getAssignedStudents ───────────────────────────────────────────────────────
/**
 * Returns all users with role=STUDENT for the mentor list sidebar,
 * alongside their risk metrics.
 */
export async function getAssignedStudents(_mentorId: string) {
  // 1. Fetch users
  const { data: users, error: uErr } = await supabase
    .from("users")
    .select("id, full_name, email")
    .eq("role", "STUDENT");

  if (uErr) throw new Error(uErr.message);

  // 2. Fetch students table to get risk scores, parent email, and actual grades/attendance
  const { data: students, error: sErr } = await supabase.from("students")
    .select(`
      user_id, current_risk_score, risk_category, parent_email,
      math_marks, physics_marks, cs_marks, english_marks, electronics_marks, chemistry_marks,
      math_attendance, physics_attendance, cs_attendance, english_attendance, electronics_attendance, chemistry_attendance
    `);

  if (sErr) throw new Error(sErr.message);

  const riskMap = new Map();
  students?.forEach((s) => riskMap.set(s.user_id, s));

  const list = (users ?? []).map((u) => {
    const sData = riskMap.get(u.id);

    const markFields = [
      sData?.math_marks,
      sData?.physics_marks,
      sData?.cs_marks,
      sData?.english_marks,
      sData?.electronics_marks,
      sData?.chemistry_marks,
    ].filter((m) => m !== null && m !== undefined) as number[];

    const attFields = [
      sData?.math_attendance,
      sData?.physics_attendance,
      sData?.cs_attendance,
      sData?.english_attendance,
      sData?.electronics_attendance,
      sData?.chemistry_attendance,
    ].filter((a) => a !== null && a !== undefined) as number[];

    const avgM =
      markFields.length > 0
        ? Math.round(markFields.reduce((a, b) => a + b, 0) / markFields.length)
        : 0;
    const avgA =
      attFields.length > 0
        ? Math.round(attFields.reduce((a, b) => a + b, 0) / attFields.length)
        : 0;

    return {
      id: u.id,
      studentName: u.full_name || u.email || "Unknown Student",
      email: u.email,
      parent_email: sData?.parent_email ?? null,
      current_risk_score: sData?.current_risk_score ?? 0,
      risk_category: sData?.risk_category ?? "Low",
      avg_marks: avgM,
      avg_attendance: avgA,
    };
  });

  // Sort: High -> Medium -> Low
  const order = { High: 3, Medium: 2, Low: 1 };
  list.sort(
    (a, b) =>
      order[b.risk_category as keyof typeof order] -
      order[a.risk_category as keyof typeof order],
  );

  return list;
}

// ── getStudentDetails ─────────────────────────────────────────────────────────
/**
 * Full student profile for mentor: all subject marks/attendance,
 * general_feedback, student_assignments (with student_reason), and interventions.
 * Pass the student's auth user ID (from users table).
 */
export async function getStudentDetails(studentUserId: string) {
  const { data: student, error } = await supabase
    .from("students")
    .select(
      `
      *,
      student_assignments (
        id,
        is_completed,
        student_reason,
        assignments (
          id,
          assignment_title,
          subject_name,
          due_date
        )
      ),
      interventions (
        id,
        session_date,
        status,
        mentor_feedback
      )
    `,
    )
    .eq("user_id", studentUserId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }

  // Map the relational assignments back to flat format so UI works perfectly
  if (student && student.student_assignments) {
    student.student_assignments = student.student_assignments.map((a: any) => ({
      id: a.id,
      is_completed: a.is_completed,
      student_reason: a.student_reason,
      assignment_title: a.assignments?.assignment_title || "Untitled",
      subject: a.assignments?.subject_name || "General",
      due_date: a.assignments?.due_date || "N/A",
    })) as any;
  }

  return student;
}

// ── logIntervention ───────────────────────────────────────────────────────────
/**
 * Mentor: logs a completed intervention session.
 */
export async function logIntervention(
  studentDbId: string,
  mentorId: string,
  feedback: string,
  date: string,
  preScore: number,
) {
  const { data, error } = await supabase
    .from("interventions")
    .insert([
      {
        student_id: studentDbId,
        mentor_id: mentorId,
        mentor_feedback: feedback,
        session_date: date,
        status: "COMPLETED",
        pre_intervention_score: preScore,
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/student");
  revalidatePath("/teacher");
  revalidatePath("/mentor");

  return data;
}
