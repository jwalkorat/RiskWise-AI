// ============================================================
// RiskWise AI — Mock Data Layer
// 60 Students, 6 Subjects, 4 Roles
// ============================================================

export type RiskLevel = "Low" | "Medium" | "High";

export interface ExamMark {
  subject: string;
  marks: number; // out of 100
  maxMarks: number;
  date: string;
}

export interface MarkHistory {
  month: string;
  marks: number;
}

export interface Intervention {
  id: string;
  date: string;
  mentorName: string;
  feedback: string;
  preScore: number;
  postScore: number;
}

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  submitted: boolean;
}

export interface Student {
  id: string;
  studentName: string;
  email: string;
  rollNo: string;
  semester: number;
  branch: string;
  overallRiskScore: number; // 0-100 (100 = highest risk)
  riskLevel: RiskLevel;
  attendancePercentage: number;
  pendingAssignments: Assignment[];
  examMarks: ExamMark[];
  markHistory: MarkHistory[];
  recentInterventions: Intervention[];
  riskReasons: string[];
  assignedMentorId: string;
  subjectTeacherIds: string[];
  lastMentorIntervention: string | null;
  lastMentorFeedback: string | null;
  notifications: string[];
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  role: "teacher";
  subject: string;
  studentIds: string[];
}

export interface Mentor {
  id: string;
  name: string;
  email: string;
  role: "mentor";
  studentIds: string[];
}

export interface Coordinator {
  id: string;
  name: string;
  email: string;
  role: "coordinator";
}

// ─── Subjects ──────────────────────────────────────────────
export const SUBJECTS = [
  "Physics",
  "Mathematics",
  "Computer Science",
  "English",
  "Electronics",
  "Chemistry",
] as const;

// ─── Mentors ───────────────────────────────────────────────
export const mentors: Mentor[] = [
  {
    id: "m1",
    name: "Dr. Priya Sharma",
    email: "priya.sharma@college.edu",
    role: "mentor",
    studentIds: [],
  },
];

// ─── Coordinator ───────────────────────────────────────────
export const coordinator: Coordinator = {
  id: "coord1",
  name: "Prof. Rajesh Mehta",
  email: "rajesh.mehta@college.edu",
  role: "coordinator",
};

// ─── Subject Teachers ──────────────────────────────────────
export const teachers: Teacher[] = [
  {
    id: "t1",
    name: "Prof. Anita Patel",
    email: "anita.patel@college.edu",
    role: "teacher",
    subject: "Physics",
    studentIds: [],
  },
  {
    id: "t2",
    name: "Prof. Sanjay Gupta",
    email: "sanjay.gupta@college.edu",
    role: "teacher",
    subject: "Mathematics",
    studentIds: [],
  },
  {
    id: "t3",
    name: "Prof. Meera Joshi",
    email: "meera.joshi@college.edu",
    role: "teacher",
    subject: "Computer Science",
    studentIds: [],
  },
  {
    id: "t4",
    name: "Prof. David Williams",
    email: "david.williams@college.edu",
    role: "teacher",
    subject: "English",
    studentIds: [],
  },
  {
    id: "t5",
    name: "Prof. Suresh Nair",
    email: "suresh.nair@college.edu",
    role: "teacher",
    subject: "Electronics",
    studentIds: [],
  },
  {
    id: "t6",
    name: "Prof. Kavita Reddy",
    email: "kavita.reddy@college.edu",
    role: "teacher",
    subject: "Chemistry",
    studentIds: [],
  },
];

// ─── Seeded deterministic pseudo-random (no Math.random!) ─
function seededRand(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

// ─── Helper to generate mark history ───────────────────────
function generateMarkHistory(baseScore: number, trend: "up" | "down" | "stable", seed = 42): MarkHistory[] {
  const months = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
  return months.map((month, i) => {
    let delta = 0;
    const r = seededRand(seed + i);
    if (trend === "up") delta = i * 3 + Math.floor(r * 5) - 2;
    else if (trend === "down") delta = -(i * 4) + Math.floor(r * 5) - 2;
    else delta = Math.floor(r * 10) - 5;
    return {
      month,
      marks: Math.max(10, Math.min(100, baseScore + delta)),
    };
  });
}

// ─── 10 Detailed Student Profiles ──────────────────────────
const detailedStudents: Student[] = [
  // HIGH RISK
  {
    id: "s1",
    studentName: "Arjun Verma",
    email: "arjun.verma@student.edu",
    rollNo: "CE2021001",
    semester: 5,
    branch: "Computer Engineering",
    overallRiskScore: 88,
    riskLevel: "High",
    attendancePercentage: 52,
    riskReasons: [
      "Attendance below 60% threshold (52%)",
      "3 pending assignments overdue by more than 2 weeks",
      "Failed Physics mid-term (32/100)",
      "No Mentor session in the last 30 days",
    ],
    pendingAssignments: [
      { id: "a1", title: "Physics Lab Report", subject: "Physics", dueDate: "2024-02-10", submitted: false },
      { id: "a2", title: "Math Problem Set 3", subject: "Mathematics", dueDate: "2024-02-14", submitted: false },
      { id: "a3", title: "Database Design Project", subject: "Computer Science", dueDate: "2024-02-05", submitted: false },
    ],
    examMarks: [
      { subject: "Physics", marks: 32, maxMarks: 100, date: "2024-01-15" },
      { subject: "Mathematics", marks: 44, maxMarks: 100, date: "2024-01-16" },
      { subject: "Computer Science", marks: 58, maxMarks: 100, date: "2024-01-17" },
      { subject: "English", marks: 61, maxMarks: 100, date: "2024-01-18" },
      { subject: "Electronics", marks: 39, maxMarks: 100, date: "2024-01-19" },
      { subject: "Chemistry", marks: 28, maxMarks: 100, date: "2024-01-20" },
    ],
    markHistory: generateMarkHistory(45, "down"),
    recentInterventions: [
      {
        id: "int1",
        date: "2024-01-05",
        mentorName: "Dr. Priya Sharma",
        feedback: "Student appears disengaged. Discussed personal challenges affecting attendance. Recommended counseling session.",
        preScore: 60,
        postScore: 45,
      },
    ],
    assignedMentorId: "m1",
    subjectTeacherIds: ["t1", "t2", "t3", "t4", "t5", "t6"],
    lastMentorIntervention: "2024-01-05",
    lastMentorFeedback: "Student appears disengaged. Discussed personal challenges affecting attendance.",
    notifications: [
      "⚠️ Your attendance has dropped to 52%. Minimum required: 75%",
      "📋 3 assignments are overdue. Please contact your subject teachers.",
      "📅 Mentor session scheduled: Feb 20, 2024 at 10:00 AM",
    ],
  },
  {
    id: "s2",
    studentName: "Neha Singh",
    email: "neha.singh@student.edu",
    rollNo: "CE2021002",
    semester: 5,
    branch: "Computer Engineering",
    overallRiskScore: 82,
    riskLevel: "High",
    attendancePercentage: 58,
    riskReasons: [
      "Attendance at 58% (threshold: 75%)",
      "Consistently low marks in Chemistry (avg 31%)",
      "2 pending assignments overdue",
      "Mid-term aggregate below passing grade",
    ],
    pendingAssignments: [
      { id: "a4", title: "Chemistry Lab Analysis", subject: "Chemistry", dueDate: "2024-02-08", submitted: false },
      { id: "a5", title: "English Essay Draft", subject: "English", dueDate: "2024-02-12", submitted: false },
    ],
    examMarks: [
      { subject: "Physics", marks: 45, maxMarks: 100, date: "2024-01-15" },
      { subject: "Mathematics", marks: 52, maxMarks: 100, date: "2024-01-16" },
      { subject: "Computer Science", marks: 63, maxMarks: 100, date: "2024-01-17" },
      { subject: "English", marks: 55, maxMarks: 100, date: "2024-01-18" },
      { subject: "Electronics", marks: 48, maxMarks: 100, date: "2024-01-19" },
      { subject: "Chemistry", marks: 31, maxMarks: 100, date: "2024-01-20" },
    ],
    markHistory: generateMarkHistory(50, "down"),
    recentInterventions: [
      {
        id: "int2",
        date: "2024-01-20",
        mentorName: "Dr. Priya Sharma",
        feedback: "Neha is struggling with Chemistry. Arranged tutoring with Prof. Reddy. Will monitor over next 2 weeks.",
        preScore: 55,
        postScore: 50,
      },
    ],
    assignedMentorId: "m1",
    subjectTeacherIds: ["t1", "t2", "t3", "t4", "t5", "t6"],
    lastMentorIntervention: "2024-01-20",
    lastMentorFeedback: "Neha is struggling with Chemistry. Arranged tutoring with Prof. Reddy.",
    notifications: [
      "⚠️ Your Chemistry score is critically low. Please attend extra classes.",
      "📋 2 assignments pending submission.",
    ],
  },
  {
    id: "s3",
    studentName: "Rahul Khanna",
    email: "rahul.khanna@student.edu",
    rollNo: "CE2021003",
    semester: 5,
    branch: "Computer Engineering",
    overallRiskScore: 75,
    riskLevel: "High",
    attendancePercentage: 63,
    riskReasons: [
      "Attendance declining (63%, down from 78% last month)",
      "Failed Electronics mid-term",
      "Pattern of late submissions detected",
    ],
    pendingAssignments: [
      { id: "a6", title: "Circuit Analysis Lab", subject: "Electronics", dueDate: "2024-02-09", submitted: false },
    ],
    examMarks: [
      { subject: "Physics", marks: 55, maxMarks: 100, date: "2024-01-15" },
      { subject: "Mathematics", marks: 60, maxMarks: 100, date: "2024-01-16" },
      { subject: "Computer Science", marks: 70, maxMarks: 100, date: "2024-01-17" },
      { subject: "English", marks: 65, maxMarks: 100, date: "2024-01-18" },
      { subject: "Electronics", marks: 38, maxMarks: 100, date: "2024-01-19" },
      { subject: "Chemistry", marks: 52, maxMarks: 100, date: "2024-01-20" },
    ],
    markHistory: generateMarkHistory(57, "down"),
    recentInterventions: [
      {
        id: "int3",
        date: "2024-02-01",
        mentorName: "Dr. Priya Sharma",
        feedback: "Discussed study habits. Rahul committed to attending all Electronics lab sessions.",
        preScore: 65,
        postScore: 57,
      },
    ],
    assignedMentorId: "m1",
    subjectTeacherIds: ["t1", "t2", "t3", "t4", "t5", "t6"],
    lastMentorIntervention: "2024-02-01",
    lastMentorFeedback: "Discussed study habits. Rahul committed to attending all Electronics lab sessions.",
    notifications: [
      "⚠️ Electronics attendance below subject minimum.",
      "📅 Next mentor check-in: Feb 22, 2024",
    ],
  },

  // MEDIUM RISK
  {
    id: "s4",
    studentName: "Priya Nair",
    email: "priya.nair@student.edu",
    rollNo: "CE2021004",
    semester: 5,
    branch: "Computer Engineering",
    overallRiskScore: 58,
    riskLevel: "Medium",
    attendancePercentage: 71,
    riskReasons: [
      "Attendance slightly below threshold (71%)",
      "Mathematics performance showing decline over last 3 months",
      "1 assignment pending",
    ],
    pendingAssignments: [
      { id: "a7", title: "Calculus Assignment 4", subject: "Mathematics", dueDate: "2024-02-15", submitted: false },
    ],
    examMarks: [
      { subject: "Physics", marks: 68, maxMarks: 100, date: "2024-01-15" },
      { subject: "Mathematics", marks: 55, maxMarks: 100, date: "2024-01-16" },
      { subject: "Computer Science", marks: 78, maxMarks: 100, date: "2024-01-17" },
      { subject: "English", marks: 72, maxMarks: 100, date: "2024-01-18" },
      { subject: "Electronics", marks: 66, maxMarks: 100, date: "2024-01-19" },
      { subject: "Chemistry", marks: 61, maxMarks: 100, date: "2024-01-20" },
    ],
    markHistory: generateMarkHistory(68, "stable"),
    recentInterventions: [
      {
        id: "int4",
        date: "2024-01-28",
        mentorName: "Dr. Priya Sharma",
        feedback: "Priya is managing well overall. Advised to improve Math study time. Will reassess in 2 weeks.",
        preScore: 70,
        postScore: 68,
      },
    ],
    assignedMentorId: "m1",
    subjectTeacherIds: ["t1", "t2", "t3", "t4", "t5", "t6"],
    lastMentorIntervention: "2024-01-28",
    lastMentorFeedback: "Priya is managing well overall. Advised to improve Math study time.",
    notifications: [
      "📋 1 assignment due in 3 days.",
      "📈 Your overall performance is improving – keep it up!",
    ],
  },
  {
    id: "s5",
    studentName: "Vikram Iyer",
    email: "vikram.iyer@student.edu",
    rollNo: "CE2021005",
    semester: 5,
    branch: "Computer Engineering",
    overallRiskScore: 52,
    riskLevel: "Medium",
    attendancePercentage: 73,
    riskReasons: [
      "Borderline attendance (73%)",
      "Inconsistent performance across subjects",
    ],
    pendingAssignments: [
      { id: "a8", title: "Physics Wave Optics", subject: "Physics", dueDate: "2024-02-18", submitted: false },
      { id: "a9", title: "CS Data Structures HW", subject: "Computer Science", dueDate: "2024-02-20", submitted: false },
    ],
    examMarks: [
      { subject: "Physics", marks: 62, maxMarks: 100, date: "2024-01-15" },
      { subject: "Mathematics", marks: 71, maxMarks: 100, date: "2024-01-16" },
      { subject: "Computer Science", marks: 66, maxMarks: 100, date: "2024-01-17" },
      { subject: "English", marks: 74, maxMarks: 100, date: "2024-01-18" },
      { subject: "Electronics", marks: 60, maxMarks: 100, date: "2024-01-19" },
      { subject: "Chemistry", marks: 69, maxMarks: 100, date: "2024-01-20" },
    ],
    markHistory: generateMarkHistory(67, "stable"),
    recentInterventions: [],
    assignedMentorId: "m1",
    subjectTeacherIds: ["t1", "t2", "t3", "t4", "t5", "t6"],
    lastMentorIntervention: null,
    lastMentorFeedback: null,
    notifications: [
      "📋 2 assignments due this week.",
    ],
  },
  {
    id: "s6",
    studentName: "Ananya Das",
    email: "ananya.das@student.edu",
    rollNo: "CE2021006",
    semester: 5,
    branch: "Computer Engineering",
    overallRiskScore: 48,
    riskLevel: "Medium",
    attendancePercentage: 76,
    riskReasons: [
      "Chemistry score trending downward (-12 points in 2 months)",
      "Attendance just above threshold — monitor closely",
    ],
    pendingAssignments: [],
    examMarks: [
      { subject: "Physics", marks: 71, maxMarks: 100, date: "2024-01-15" },
      { subject: "Mathematics", marks: 69, maxMarks: 100, date: "2024-01-16" },
      { subject: "Computer Science", marks: 80, maxMarks: 100, date: "2024-01-17" },
      { subject: "English", marks: 78, maxMarks: 100, date: "2024-01-18" },
      { subject: "Electronics", marks: 72, maxMarks: 100, date: "2024-01-19" },
      { subject: "Chemistry", marks: 54, maxMarks: 100, date: "2024-01-20" },
    ],
    markHistory: generateMarkHistory(72, "stable"),
    recentInterventions: [
      {
        id: "int5",
        date: "2024-02-05",
        mentorName: "Dr. Priya Sharma",
        feedback: "Ananya is performing well in CS and English but needs support in Chemistry. Referred to subject tutor.",
        preScore: 72,
        postScore: 70,
      },
    ],
    assignedMentorId: "m1",
    subjectTeacherIds: ["t1", "t2", "t3", "t4", "t5", "t6"],
    lastMentorIntervention: "2024-02-05",
    lastMentorFeedback: "Ananya is performing well in CS and English but needs support in Chemistry.",
    notifications: [
      "✅ All assignments submitted. Great work!",
      "📅 Next evaluations in 3 weeks.",
    ],
  },

  // LOW RISK
  {
    id: "s7",
    studentName: "Siddharth Rao",
    email: "siddharth.rao@student.edu",
    rollNo: "CE2021007",
    semester: 5,
    branch: "Computer Engineering",
    overallRiskScore: 22,
    riskLevel: "Low",
    attendancePercentage: 91,
    riskReasons: [
      "Minor dip in Physics score — within normal variance",
    ],
    pendingAssignments: [],
    examMarks: [
      { subject: "Physics", marks: 78, maxMarks: 100, date: "2024-01-15" },
      { subject: "Mathematics", marks: 88, maxMarks: 100, date: "2024-01-16" },
      { subject: "Computer Science", marks: 92, maxMarks: 100, date: "2024-01-17" },
      { subject: "English", marks: 85, maxMarks: 100, date: "2024-01-18" },
      { subject: "Electronics", marks: 82, maxMarks: 100, date: "2024-01-19" },
      { subject: "Chemistry", marks: 79, maxMarks: 100, date: "2024-01-20" },
    ],
    markHistory: generateMarkHistory(84, "up"),
    recentInterventions: [],
    assignedMentorId: "m1",
    subjectTeacherIds: ["t1", "t2", "t3", "t4", "t5", "t6"],
    lastMentorIntervention: null,
    lastMentorFeedback: null,
    notifications: [
      "🌟 Excellent performance! Keep maintaining this standard.",
    ],
  },
  {
    id: "s8",
    studentName: "Kavya Pillai",
    email: "kavya.pillai@student.edu",
    rollNo: "CE2021008",
    semester: 5,
    branch: "Computer Engineering",
    overallRiskScore: 18,
    riskLevel: "Low",
    attendancePercentage: 95,
    riskReasons: [],
    pendingAssignments: [],
    examMarks: [
      { subject: "Physics", marks: 85, maxMarks: 100, date: "2024-01-15" },
      { subject: "Mathematics", marks: 91, maxMarks: 100, date: "2024-01-16" },
      { subject: "Computer Science", marks: 88, maxMarks: 100, date: "2024-01-17" },
      { subject: "English", marks: 90, maxMarks: 100, date: "2024-01-18" },
      { subject: "Electronics", marks: 86, maxMarks: 100, date: "2024-01-19" },
      { subject: "Chemistry", marks: 83, maxMarks: 100, date: "2024-01-20" },
    ],
    markHistory: generateMarkHistory(88, "up"),
    recentInterventions: [],
    assignedMentorId: "m1",
    subjectTeacherIds: ["t1", "t2", "t3", "t4", "t5", "t6"],
    lastMentorIntervention: null,
    lastMentorFeedback: null,
    notifications: [
      "🏆 Top performer in batch. Excellent attendance!",
    ],
  },
  {
    id: "s9",
    studentName: "Rohan Malhotra",
    email: "rohan.malhotra@student.edu",
    rollNo: "CE2021009",
    semester: 5,
    branch: "Computer Engineering",
    overallRiskScore: 30,
    riskLevel: "Low",
    attendancePercentage: 84,
    riskReasons: [
      "Occasional late submissions in English",
    ],
    pendingAssignments: [
      { id: "a10", title: "English Literature Review", subject: "English", dueDate: "2024-02-22", submitted: false },
    ],
    examMarks: [
      { subject: "Physics", marks: 75, maxMarks: 100, date: "2024-01-15" },
      { subject: "Mathematics", marks: 82, maxMarks: 100, date: "2024-01-16" },
      { subject: "Computer Science", marks: 86, maxMarks: 100, date: "2024-01-17" },
      { subject: "English", marks: 67, maxMarks: 100, date: "2024-01-18" },
      { subject: "Electronics", marks: 78, maxMarks: 100, date: "2024-01-19" },
      { subject: "Chemistry", marks: 71, maxMarks: 100, date: "2024-01-20" },
    ],
    markHistory: generateMarkHistory(77, "up"),
    recentInterventions: [],
    assignedMentorId: "m1",
    subjectTeacherIds: ["t1", "t2", "t3", "t4", "t5", "t6"],
    lastMentorIntervention: null,
    lastMentorFeedback: null,
    notifications: [
      "📋 English assignment due in 5 days.",
    ],
  },
  {
    id: "s10",
    studentName: "Shruti Kapoor",
    email: "shruti.kapoor@student.edu",
    rollNo: "CE2021010",
    semester: 5,
    branch: "Computer Engineering",
    overallRiskScore: 35,
    riskLevel: "Low",
    attendancePercentage: 80,
    riskReasons: [
      "Slight dip in Electronics (70 → 62 over 2 months)",
    ],
    pendingAssignments: [],
    examMarks: [
      { subject: "Physics", marks: 73, maxMarks: 100, date: "2024-01-15" },
      { subject: "Mathematics", marks: 79, maxMarks: 100, date: "2024-01-16" },
      { subject: "Computer Science", marks: 84, maxMarks: 100, date: "2024-01-17" },
      { subject: "English", marks: 81, maxMarks: 100, date: "2024-01-18" },
      { subject: "Electronics", marks: 62, maxMarks: 100, date: "2024-01-19" },
      { subject: "Chemistry", marks: 76, maxMarks: 100, date: "2024-01-20" },
    ],
    markHistory: generateMarkHistory(76, "stable"),
    recentInterventions: [],
    assignedMentorId: "m1",
    subjectTeacherIds: ["t1", "t2", "t3", "t4", "t5", "t6"],
    lastMentorIntervention: null,
    lastMentorFeedback: null,
    notifications: [
      "✅ All assignments submitted.",
    ],
  },
];

// ─── Generate remaining 50 students ────────────────────────
const firstNames = [
  "Aditya","Aisha","Akash","Alok","Amrita","Ankit","Ankita","Arnav","Arushi","Ashish",
  "Bhavesh","Chinmay","Deepa","Devesh","Divya","Farhan","Gaurav","Harini","Ishaan","Jaya",
  "Karan","Kritika","Lavanya","Manish","Maya","Mihir","Mohan","Namrata","Nikhil","Nisha",
  "Om","Payal","Pooja","Pranav","Preeti","Raj","Ravi","Ritika","Rohini","Sachin",
  "Sameer","Sandhya","Simran","Sneha","Suhas","Sunil","Swati","Tanisha","Tushar","Uday",
];

const lastNames = [
  "Agarwal","Bhat","Chauhan","Desai","Fernandes","Gaikwad","Hegde","Jain","Krishnan","Lal",
  "Menon","Naik","Ojha","Pandya","Qureshi","Raut","Saxena","Trivedi","Upadhyay","Verma",
  "Wagh","Xavier","Yadav","Zafar","Ahuja","Bhosle","Chowdhary","Dubey","Ekbote","Fulzele",
  "Garg","Hazare","Inamdar","Joglekar","Kamble","Lokhandwala","Mistry","Nadkarni","Oak","Patil",
  "Rele","Salvi","Tiwari","Ubale","Vartak","Waghmare","Yadao","Zagade","Zende","Abhyankar",
];

const branches = ["Computer Engineering", "Electronics Engineering", "Information Technology", "Mechanical Engineering"];

function getRiskLevel(score: number): RiskLevel {
  if (score >= 65) return "High";
  if (score >= 35) return "Medium";
  return "Low";
}

function generateRiskReasons(score: number, attendance: number): string[] {
  const reasons: string[] = [];
  if (attendance < 65) reasons.push(`Critically low attendance (${attendance}%)`);
  else if (attendance < 75) reasons.push(`Attendance below threshold (${attendance}%)`);
  if (score > 70) reasons.push("Multiple subjects below passing grade");
  if (score > 50) reasons.push("Declining performance trend detected");
  if (score > 40) reasons.push("Pending assignments affecting internal marks");
  if (reasons.length === 0) reasons.push("Performance within acceptable range — minor monitoring");
  return reasons;
}

// ─── Pre-computed deterministic risk scores & attendance for 50 students ──
// Generated once offline to avoid any Math.random() calls
const PRESET_RISK_SCORES = [
  73, 41, 88, 15, 62, 79, 34, 56, 91, 28,
  67, 83, 47, 19, 70, 55, 38, 95, 24, 61,
  86, 42, 77, 13, 58, 74, 31, 89, 22, 65,
  46, 82, 37, 68, 27, 93, 51, 76, 17, 63,
  84, 44, 71, 29, 57, 87, 35, 78, 20, 66,
];

const PRESET_ATTENDANCE = [
  61, 81, 53, 92, 68, 57, 85, 72, 51, 88,
  64, 55, 79, 95, 63, 73, 83, 50, 91, 67,
  54, 82, 60, 94, 71, 59, 86, 52, 90, 65,
  78, 56, 84, 62, 89, 53, 75, 58, 93, 66,
  55, 80, 61, 87, 72, 54, 84, 59, 92, 64,
];

const PRESET_DATES = [
  "2024-01-08", null, "2024-01-12", null, "2024-01-03",
  "2024-01-07", null, "2024-01-14", "2024-01-02", null,
  "2024-01-09", "2024-01-05", null, null, "2024-01-11",
  null, null, "2024-01-01", null, "2024-01-06",
  "2024-01-13", null, "2024-01-04", null, null,
  "2024-01-10", null, "2024-01-15", null, "2024-01-08",
  null, "2024-01-03", null, "2024-01-07", null,
  "2024-01-12", null, "2024-01-09", null, "2024-01-02",
  "2024-01-14", null, "2024-01-06", null, null,
  "2024-01-11", null, "2024-01-04", null, "2024-01-10",
];

const PRESET_SEMESTERS = [
  5, 4, 6, 5, 4, 6, 5, 4, 6, 5,
  4, 6, 5, 4, 6, 5, 4, 6, 5, 4,
  6, 5, 4, 6, 5, 4, 6, 5, 4, 6,
  5, 4, 6, 5, 4, 6, 5, 4, 6, 5,
  4, 6, 5, 4, 6, 5, 4, 6, 5, 4,
];

const generatedStudents: Student[] = Array.from({ length: 50 }, (_, i) => {
  const idx = i;
  const firstName = firstNames[idx % firstNames.length];
  const lastName = lastNames[idx % lastNames.length];
  const name = `${firstName} ${lastName}`;
  const rollNo = `CE2021${String(11 + i).padStart(3, "0")}`;
  const riskScore = PRESET_RISK_SCORES[i];
  const riskLevel = getRiskLevel(riskScore);
  const attendance = PRESET_ATTENDANCE[i];

  const marks = SUBJECTS.map((subj, si) => ({
    subject: subj,
    marks: Math.max(20, Math.min(100, Math.floor(100 - riskScore * 0.6 + seededRand(i * 10 + si) * 30))),
    maxMarks: 100,
    date: "2024-01-" + String(15 + si).padStart(2, "0"),
  }));

  const lastIntDate = PRESET_DATES[i];
  const feedbackSnippets = [
    "Student requires immediate academic support.",
    "Discussed time management strategies. Follow-up required.",
    "Performance improving after subject-specific tutoring.",
    "Counseling recommended due to personal challenges.",
    "Attendance plan discussed. Student agreed to comply.",
  ];

  return {
    id: `s${11 + i}`,
    studentName: name,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@student.edu`,
    rollNo,
    semester: PRESET_SEMESTERS[i],
    branch: branches[i % branches.length],
    overallRiskScore: riskScore,
    riskLevel,
    attendancePercentage: attendance,
    riskReasons: generateRiskReasons(riskScore, attendance),
    pendingAssignments: riskScore > 60 ? [
      {
        id: `a_gen_${i}`,
        title: `${SUBJECTS[i % SUBJECTS.length]} Assignment`,
        subject: SUBJECTS[i % SUBJECTS.length],
        dueDate: "2024-02-15",
        submitted: false,
      },
    ] : [],
    examMarks: marks,
    markHistory: generateMarkHistory(
      100 - riskScore,
      riskScore > 60 ? "down" : riskScore > 35 ? "stable" : "up",
      i * 7 + 13
    ),
    recentInterventions: lastIntDate ? [
      {
        id: `int_gen_${i}`,
        date: lastIntDate,
        mentorName: "Dr. Priya Sharma",
        feedback: feedbackSnippets[i % feedbackSnippets.length],
        preScore: 100 - riskScore + 10,
        postScore: 100 - riskScore,
      },
    ] : [],
    assignedMentorId: "m1",
    subjectTeacherIds: ["t1", "t2", "t3", "t4", "t5", "t6"],
    lastMentorIntervention: lastIntDate,
    lastMentorFeedback: lastIntDate ? feedbackSnippets[i % feedbackSnippets.length] : null,
    notifications: riskScore > 65 ? ["⚠️ High risk alert. Please contact your mentor."] : [],
  };
});

// ─── Combined & Sorted Student List ────────────────────────
export const allStudents: Student[] = [
  ...detailedStudents,
  ...generatedStudents,
].sort((a, b) => b.overallRiskScore - a.overallRiskScore);

// Assign student IDs to mentor and teachers
mentors[0].studentIds = allStudents.map((s) => s.id);
teachers.forEach((t) => {
  t.studentIds = allStudents.map((s) => s.id);
});

// ─── Department Stats ───────────────────────────────────────
export const departmentStats = {
  totalStudents: allStudents.length,
  highRisk: allStudents.filter((s) => s.riskLevel === "High").length,
  mediumRisk: allStudents.filter((s) => s.riskLevel === "Medium").length,
  lowRisk: allStudents.filter((s) => s.riskLevel === "Low").length,
  avgAttendance:
    Math.round(allStudents.reduce((sum, s) => sum + s.attendancePercentage, 0) / allStudents.length),
  avgRiskScore:
    Math.round(allStudents.reduce((sum, s) => sum + s.overallRiskScore, 0) / allStudents.length),
  departmentOverallRisk:
    Math.round(allStudents.reduce((sum, s) => sum + s.overallRiskScore, 0) / allStudents.length),
};

// ─── Auth Helper ────────────────────────────────────────────
export const AUTH_ROLES = [
  { role: "student", label: "Student", email: "arjun.verma@student.edu", password: "demo123", redirectTo: "/student" },
  { role: "mentor", label: "Faculty Mentor", email: "priya.sharma@college.edu", password: "demo123", redirectTo: "/mentor" },
  { role: "teacher", label: "Subject Teacher", email: "anita.patel@college.edu", password: "demo123", redirectTo: "/teacher" },
  { role: "coordinator", label: "Academic Coordinator", email: "rajesh.mehta@college.edu", password: "demo123", redirectTo: "/coordinator" },
] as const;

export type AuthRole = (typeof AUTH_ROLES)[number]["role"];
