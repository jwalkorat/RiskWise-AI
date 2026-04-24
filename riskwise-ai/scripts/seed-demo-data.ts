import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const DUMMY_STUDENTS = [
  {
    email: "student@demo.edu",
    name: "Alex Johnson (Demo)",
    risk_profile: "High",
    math_marks: 32,
    physics_marks: 28,
    cs_marks: 45,
    english_marks: 55,
    biology_marks: 30,
    math_attendance: 55,
    physics_attendance: 40,
    cs_attendance: 65,
    english_attendance: 70,
    biology_attendance: 45,
    general_feedback: "I've been dealing with a prolonged illness which is why I missed so many Physics and Biology classes. Trying to catch up but it's overwhelming.",
    parent_email: "parent.alex@demo.edu",
  },
  {
    email: "sarah@demo.edu",
    name: "Sarah Williams",
    risk_profile: "Low",
    math_marks: 92,
    physics_marks: 88,
    cs_marks: 95,
    english_marks: 85,
    biology_marks: 90,
    math_attendance: 95,
    physics_attendance: 98,
    cs_attendance: 100,
    english_attendance: 92,
    biology_attendance: 96,
    parent_email: "parent.sarah@demo.edu",
  },
  {
    email: "michael@demo.edu",
    name: "Michael Chen",
    risk_profile: "Medium",
    math_marks: 85,
    physics_marks: 78,
    cs_marks: 82,
    english_marks: 42,
    biology_marks: 60,
    math_attendance: 80,
    physics_attendance: 85,
    cs_attendance: 75,
    english_attendance: 50,
    biology_attendance: 65,
    general_feedback: "I commute 2 hours every day, which makes it hard to attend the early morning English classes.",
    parent_email: "parent.michael@demo.edu",
  }
];

async function seed() {
  console.log("🌱 Starting detailed Hackathon UI seeding...");

  // 1. Fetch some real student IDs from Auth
  const { data: users, error: usersErr } = await supabase
    .from("users")
    .select("id, email, full_name")
    .eq("role", "STUDENT");

  if (usersErr) throw usersErr;

  console.log(`Found ${users.length} student accounts... mapping 3 for the demo.`);

  // We will apply our 3 dummy profiles to the first 3 students we find
  // If we don't have enough, we'll just apply to whatever we have
  const targets = users.slice(0, 3);
  
  // Guarantee student@demo.edu gets the "High Risk" profile if we find them
  const demoStudentIndex = targets.findIndex(u => u.email === "student@demo.edu");
  if (demoStudentIndex > -1) {
    // Swap so student@demo.edu is index 0
    const temp = targets[0];
    targets[0] = targets[demoStudentIndex];
    targets[demoStudentIndex] = temp;
  }

  // 2. We need some master assignments
  const { data: assignments, error: asgErr } = await supabase
    .from("assignments")
    .insert([
      { subject_name: "Physics", assignment_title: "Thermodynamics Lab Report", due_date: new Date(Date.now() - 86400000 * 3).toISOString() }, // 3 days overdue
      { subject_name: "Math", assignment_title: "Calculus Worksheet 4", due_date: new Date(Date.now() - 86400000 * 1).toISOString() }, // 1 day overdue
      { subject_name: "CS", assignment_title: "Data Structures Project", due_date: new Date(Date.now() + 86400000 * 5).toISOString() } // Due in 5 days
    ])
    .select("id");

  if (asgErr) throw asgErr;
  
  for (let i = 0; i < Math.min(targets.length, DUMMY_STUDENTS.length); i++) {
    const user = targets[i];
    const dummy = DUMMY_STUDENTS[i];
    console.log(`Processing ${user.full_name || user.email} as ${dummy.risk_profile} risk...`);

    // Ensure student record exists
    let { data: studentRecord } = await supabase
      .from("students")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!studentRecord) {
      const inserted = await supabase.from("students").insert({ user_id: user.id }).select("id").single();
      studentRecord = inserted.data;
    }

    // Assign mock data
    const currentScore = dummy.risk_profile === "High" ? 82 : dummy.risk_profile === "Medium" ? 54 : 12;
    const reasons = dummy.risk_profile === "High" 
      ? "Critical: Extremely low attendance in Physics (40%) | Critical: Failing internal marks in Math & Physics | 2 overdue assignments"
      : dummy.risk_profile === "Medium"
      ? "Warning: Low attendance in English (50%) | Warning: Borderline marks in English (42%)"
      : "Student is performing exceptionally well.";

    await supabase.from("students").update({
      math_marks: dummy.math_marks,
      physics_marks: dummy.physics_marks,
      cs_marks: dummy.cs_marks,
      english_marks: dummy.english_marks,
      biology_marks: dummy.biology_marks,
      math_attendance: dummy.math_attendance,
      physics_attendance: dummy.physics_attendance,
      cs_attendance: dummy.cs_attendance,
      english_attendance: dummy.english_attendance,
      biology_attendance: dummy.biology_attendance,
      current_risk_score: currentScore,
      risk_category: dummy.risk_profile,
      top_risk_reasons: reasons,
      general_feedback: dummy.general_feedback || null,
      parent_email: dummy.parent_email,
    }).eq("id", studentRecord!.id);

    // Update the real name of the user to match the dummy (looks nicer in UI)
    await supabase.from("users").update({ full_name: dummy.name }).eq("id", user.id);

    // Build Risk History for graphs
    const now = new Date();
    await supabase.from("risk_history").delete().eq("student_id", studentRecord!.id);
    
    const historyPayload = [];
    let baseScore = currentScore;
    
    // Create 5 data points leading up to today
    for(let d=4; d>=0; d--) {
        const hDate = new Date(now);
        hDate.setDate(now.getDate() - (d*3)); // every 3 days
        
        let histScore;
        // make a trend
        if (dummy.risk_profile === "High") {
            histScore = baseScore - (d*4) + Math.floor(Math.random() * 5); // getting worse (going up from ~60 to 82)
        } else if (dummy.risk_profile === "Medium") {
            histScore = baseScore + (d*3) - Math.floor(Math.random() * 5); // getting better (going down from ~70 to 54)
        } else {
            histScore = baseScore + Math.floor(Math.random() * 3); // always safely low
        }
        
        historyPayload.push({
            student_id: studentRecord!.id,
            risk_score: Math.max(0, Math.min(100, histScore)),
            recorded_date: hDate.toISOString()
        });
    }
    await supabase.from("risk_history").insert(historyPayload);

    // Assign tasks to the student
    if (assignments && assignments.length > 0) {
      await supabase.from("student_assignments").delete().eq("student_id", studentRecord!.id);
      
      const asgsPayload = [
        { student_id: studentRecord!.id, assignment_id: assignments[0].id, is_completed: dummy.risk_profile === "Low", student_reason: dummy.risk_profile === "High" ? "Couldn't understand the concepts, need help." : null },
        { student_id: studentRecord!.id, assignment_id: assignments[1].id, is_completed: false, student_reason: null },
        { student_id: studentRecord!.id, assignment_id: assignments[2].id, is_completed: true, student_reason: null }
      ];
      await supabase.from("student_assignments").insert(asgsPayload);
    }
    
    // Force a mentor intervention for the High Risk student to make the UI look rich
    if (dummy.risk_profile === "High") {
       // get a mentor
       const { data: mentors } = await supabase.from("users").select("id").eq("role", "MENTOR").limit(1);
       if (mentors && mentors.length > 0) {
           await supabase.from("interventions").delete().eq("student_id", studentRecord!.id);
           await supabase.from("interventions").insert([
               { 
                 student_id: studentRecord!.id, 
                 mentor_id: mentors[0].id, 
                 session_date: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
                 status: "COMPLETED",
                 pre_intervention_score: 75,
                 mentor_feedback: "Student is heavily stressed due to health issues at home. Recommended a 3-day extension on the thermodynamics report and advised peer tutoring for Math."
               }
           ]);
       }
    }
  }

  console.log("✅ Successfully seeded rich hackathon layout data!");
}

seed().catch(console.error);
