"use server";

import { supabase } from "@/lib/Client";
import { createClient } from "@supabase/supabase-js";
import { exec } from "child_process";
import util from "util";
import path from "path";

const execPromise = util.promisify(exec);

// Admin client using Service Role key — bypasses RLS for coordinator views
const getAdminSupabase = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service Role bypasses RLS
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
};

export async function getCoordinatorDashboardData() {
  const adminSupabase = getAdminSupabase();

  // 1. Fetch all STUDENT users
  const { data: users, error: uErr } = await adminSupabase
    .from("users")
    .select("id, full_name, email")
    .eq("role", "STUDENT");

  if (uErr) throw new Error(uErr.message);

  // 2. Fetch all students with their interventions
  const { data: students, error: sErr } = await adminSupabase.from("students")
    .select(`
      user_id,
      current_risk_score,
      risk_category,
      parent_email,
      parent_phone,
      math_attendance,
      physics_attendance,
      cs_attendance,
      english_attendance,
      electronics_attendance,
      chemistry_attendance,
      math_marks,
      physics_marks,
      cs_marks,
      english_marks,
      electronics_marks,
      chemistry_marks,
      interventions (
        session_date,
        mentor_feedback
      )
    `);

  if (sErr) throw new Error(sErr.message);

  const studentMap = new Map();
  students?.forEach((s) => studentMap.set(s.user_id, s));

  let totalRisk = 0;
  let totalAtt = 0;
  let highRisk = 0;
  let mediumRisk = 0;
  let lowRisk = 0;

  const allStudents = (users ?? []).map((u, i) => {
    const sData = studentMap.get(u.id);

    const score = sData?.current_risk_score ?? 0;
    const level = sData?.risk_category ?? "Low";

    if (level === "High") highRisk++;
    else if (level === "Medium") mediumRisk++;
    else lowRisk++;

    totalRisk += score;

    const attFields = [
      sData?.math_attendance,
      sData?.physics_attendance,
      sData?.cs_attendance,
      sData?.english_attendance,
      sData?.electronics_attendance,
      sData?.chemistry_attendance,
    ].filter((a) => a !== null && a !== undefined && Number(a) > 0) as number[];

    // Only compute avg if at least one subject has real data; otherwise show N/A as 0
    const attPercent =
      attFields.length > 0
        ? Math.round(attFields.reduce((a, b) => a + b, 0) / attFields.length)
        : 0; // 0 means no data yet — NOT defaulting to 100

    totalAtt += attPercent;

    const markFields = [
      sData?.math_marks,
      sData?.physics_marks,
      sData?.cs_marks,
      sData?.english_marks,
      sData?.electronics_marks,
      sData?.chemistry_marks,
    ].filter((m) => m !== null && m !== undefined) as number[];

    const marksPercent =
      markFields.length > 0
        ? Math.round(markFields.reduce((a, b) => a + b, 0) / markFields.length)
        : 0;

    // Interventions
    const invs = sData?.interventions ?? [];
    invs.sort(
      (a: any, b: any) =>
        new Date(b.session_date).getTime() - new Date(a.session_date).getTime(),
    );
    const latestInv = invs[0];

    // Use email prefix as roll number since DB doesn't have a dedicated field
    const emailPrefix =
      u.email?.split("@")[0]?.toUpperCase() ??
      `STU${String(i + 1).padStart(3, "0")}`;
    // Use email domain as branch hint — e.g. cs.ldce.edu → CS Dept
    const emailDomain = u.email?.split("@")[1] ?? "";
    const branch = emailDomain.includes("cs")
      ? "Computer Sci."
      : emailDomain.includes("it")
        ? "Info. Tech."
        : "Engineering";

    return {
      id: u.id,
      studentName: u.full_name || u.email || "Unknown Student",
      rollNo: emailPrefix,
      branch,
      overallRiskScore: score,
      riskLevel: level,
      attendancePercentage: attPercent,
      marksPercentage: marksPercent,
      parent_email: sData?.parent_email,
      parent_phone: sData?.parent_phone ?? null,
      hasData: attFields.length > 0 || markFields.length > 0, // flag that subject data exists
      lastMentorIntervention: latestInv
        ? new Date(latestInv.session_date).toLocaleDateString()
        : null,
      lastMentorFeedback: latestInv ? latestInv.mentor_feedback : null,
    };
  });

  // Sort by risk descending
  allStudents.sort((a, b) => b.overallRiskScore - a.overallRiskScore);

  const totalS = allStudents.length || 1;
  const departmentStats = {
    totalStudents: allStudents.length,
    highRisk,
    mediumRisk,
    lowRisk,
    avgAttendance: Math.round(totalAtt / totalS),
    departmentOverallRisk: Math.round(totalRisk / totalS),
  };

  return { allStudents, departmentStats };
}

export async function createUserInPlatform(
  name: string,
  email: string,
  password?: string,
  parentEmail?: string,
  parentPhone?: string,
) {
  try {
    const role = "STUDENT";
    const formattedRole = role.toUpperCase();
    const tempPassword = password || `${role.toLowerCase()}123`;

    const adminSupabase = getAdminSupabase();

    // Find the single MENTOR in the system
    const { data: mentorUser } = await adminSupabase
      .from("users")
      .select("id")
      .eq("role", "MENTOR")
      .limit(1)
      .single();

    // 1. Create auth user securely
    const { data: authData, error: authError } =
      await adminSupabase.auth.signUp({
        email,
        password: tempPassword,
      });

    if (authError) throw new Error(authError.message);
    if (!authData.user)
      throw new Error("Could not create user auth. Email might be in use.");

    const userId = authData.user.id;

    // 2. Insert into users array
    const { error: insertUserError } = await adminSupabase
      .from("users")
      .insert({
        id: userId,
        full_name: name,
        email: email.toLowerCase(),
        role: formattedRole,
        demo_password: tempPassword,
      });

    if (insertUserError)
      throw new Error(`User insertion failed: ${insertUserError.message}`);

    // 3. Initialize student profile with baseline empty data
    // Because Teachers will add actual grades later, we default to Low risk.
    const { error: studentError } = await adminSupabase
      .from("students")
      .insert({
        user_id: userId,
        mentor_id: mentorUser?.id || null,
        parent_email: parentEmail || null,
        parent_phone: parentPhone || null,
        current_risk_score: 0,
        risk_category: "Low",
        average_marks: null,
        math_attendance: null,
        physics_attendance: null,
        cs_attendance: null,
      });

    if (studentError) {
      console.error(
        "Non-fatal: failed to init student table record: " +
          studentError.message,
      );
    }

    return {
      success: true,
      message: `Successfully provisioned ${name} as a STUDENT.`,
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create user." };
  }
}
