"use server";

import { createClient } from "@supabase/supabase-js";

// Admin client — bypasses RLS for all risk engine reads/writes
const getAdminSupabase = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );

export type RiskResult = {
  score: number;
  category: "Low" | "Medium" | "High";
  reasons: string[];
};

/**
 * Calculates risk score by calling the custom CatBoost ML model via Python subprocess.
 * Falls back to heuristic engine if Python is unavailable (e.g. on Vercel).
 */
export async function calculateRiskScore(
  studentDbId: string,
): Promise<RiskResult> {
  const admin = getAdminSupabase();
  let score = 0;
  const reasons: string[] = [];
  let subjectsCount = 0;
  let avgAttendance = 0;
  let avgMarks = 0;

  // 1. Fetch academic records from the flat students table
  const { data: student, error: studentError } = await admin
    .from("students")
    .select(
      "math_marks, math_attendance, physics_marks, physics_attendance, cs_marks, cs_attendance, english_marks, english_attendance, electronics_marks, electronics_attendance, chemistry_marks, chemistry_attendance",
    )
    .eq("id", studentDbId)
    .single();

  if (studentError) {
    console.error("RiskEngine: Failed to fetch student records", studentError);
  }

  if (student) {
    let totalAttendance = 0;
    let totalMarks = 0;

    const subjects = [
      "math",
      "physics",
      "cs",
      "english",
      "electronics",
      "chemistry",
    ];
    subjects.forEach((sub) => {
      const marks = student[`${sub}_marks` as keyof typeof student];
      const att = student[`${sub}_attendance` as keyof typeof student];

      if (marks !== null && att !== null) {
        if (Number(marks) > 0 || Number(att) > 0) {
          totalAttendance += Number(att);
          totalMarks += Number(marks);
          subjectsCount++;
        }
      }
    });

    if (subjectsCount > 0) {
      avgAttendance = totalAttendance / subjectsCount;
      avgMarks = totalMarks / subjectsCount;
    }
  }

  // 2. Fetch overdue assignments
  const { data: assignments, error: assignmentsError } = await admin
    .from("student_assignments")
    .select(`is_completed, assignments!inner ( due_date )`)
    .eq("student_id", studentDbId)
    .eq("is_completed", false);

  if (assignmentsError) {
    console.error("RiskEngine: Failed to fetch assignments", assignmentsError);
  }

  let pastDueCount = 0;
  if (assignments && assignments.length > 0) {
    const now = new Date();
    assignments.forEach((a: any) => {
      if (a.assignments?.due_date && new Date(a.assignments.due_date) < now) {
        pastDueCount++;
      }
    });
  }

  // 3. ── PRIMARY: Call the Custom ML Model (Python CatBoost) ──────────────────
  let category: "Low" | "Medium" | "High" = "Low";
  let mlUsed = false;

  if (subjectsCount > 0) {
    try {
      const { exec } = await import("child_process");
      const util = await import("util");
      const path = await import("path");
      const execPromise = util.promisify(exec);

      const scriptPath = path.resolve(process.cwd(), "../model/run_model.py");
      // Convert pastDueCount into a 0-100 assignment completion score
      const assignmentScore = Math.max(0, 100 - pastDueCount * 15);

      const { stdout } = await execPromise(
        `python3 "${scriptPath}" --attendance ${avgAttendance.toFixed(1)} --marks ${avgMarks.toFixed(1)} --assignment ${assignmentScore}`,
      );
      const mlOutput = JSON.parse(stdout.trim());

      if (mlOutput.score !== undefined && mlOutput.label) {
        score = Math.min(100, Math.max(0, Math.round(mlOutput.score)));
        category = mlOutput.label as "Low" | "Medium" | "High";
        mlUsed = true;
        console.log(`🎯 ML Model → score: ${score}, label: ${category}`);
      }
    } catch (mlErr) {
      console.warn("⚠️ ML model unavailable, using heuristic fallback.", mlErr);
    }
  }

  // 4. ── FALLBACK: Heuristic if ML failed or no data yet ──────────────────────
  if (!mlUsed) {
    if (subjectsCount > 0) {
      if (avgAttendance < 60) {
        score += 50;
        reasons.push(
          `Critical: Average attendance is severely low (${Math.round(avgAttendance)}%).`,
        );
      } else if (avgAttendance < 75) {
        score += 30;
        reasons.push(
          `Warning: Average attendance is below 75% (${Math.round(avgAttendance)}%).`,
        );
      }
      if (avgMarks < 40) {
        score += 20;
        reasons.push(
          `Warning: Overall internal marks average is failing (${Math.round(avgMarks)}%).`,
        );
      }
    }
    score += pastDueCount * 10;
    score = Math.min(score, 100);

    if (score > 70) category = "High";
    else if (score >= 40) category = "Medium";
  }

  // 5. Build human-readable reasons
  if (subjectsCount === 0 && pastDueCount === 0) {
    reasons.push("No academic data is currently available for evaluation.");
  } else if (mlUsed) {
    if (subjectsCount > 0) {
      reasons.push(
        `AI model evaluated avg attendance (${Math.round(avgAttendance)}%) and avg marks (${Math.round(avgMarks)}%).`,
      );
    }
    if (pastDueCount > 0) {
      reasons.push(
        `${pastDueCount} pending assignment(s) are past their due date.`,
      );
    }
    if (score === 0)
      reasons.push("Student is performing well with no notable risk factors.");
  } else if (score === 0) {
    reasons.push("Student is performing well with no notable risk factors.");
  }

  // 6. Persist updated risk profile to Supabase (admin bypasses RLS)
  await admin
    .from("students")
    .update({
      current_risk_score: score,
      risk_category: category,
      top_risk_reasons: reasons.join(" | "),
    })
    .eq("id", studentDbId);

  // 7. Log to risk_history chart
  await admin.from("risk_history").insert([
    {
      student_id: studentDbId,
      risk_score: score,
      recorded_date: new Date().toISOString(),
    },
  ]);

  return { score, category, reasons };
}
