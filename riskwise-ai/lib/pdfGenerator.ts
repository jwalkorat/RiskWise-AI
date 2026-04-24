// Browser-only PDF generator using pdfmake
// Must be called from client components only

export async function generateStudentReport(student: {
  name: string;
  email: string;
  risk_category: string;
  current_risk_score: number;
  top_risk_reasons?: string | null;
  parent_email?: string | null;
  math_marks?: number;
  physics_marks?: number;
  cs_marks?: number;
  english_marks?: number;
  electronics_marks?: number;
  chemistry_marks?: number;
  math_attendance?: number;
  physics_attendance?: number;
  cs_attendance?: number;
  english_attendance?: number;
  electronics_attendance?: number;
  chemistry_attendance?: number;
}) {
  // Dynamic import to avoid SSR issues
  const pdfMake = (await import("pdfmake/build/pdfmake")).default;
  const pdfFonts = (await import("pdfmake/build/vfs_fonts")).default;
  (pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs || (pdfFonts as any).vfs;

  // Build subject table rows
  const subjects = [
    { name: "Mathematics", marks: student.math_marks ?? 0, att: student.math_attendance ?? 0 },
    { name: "Physics", marks: student.physics_marks ?? 0, att: student.physics_attendance ?? 0 },
    { name: "Computer Science", marks: student.cs_marks ?? 0, att: student.cs_attendance ?? 0 },
    { name: "English", marks: student.english_marks ?? 0, att: student.english_attendance ?? 0 },
    { name: "Electronics", marks: student.electronics_marks ?? 0, att: student.electronics_attendance ?? 0 },
    { name: "Chemistry", marks: student.chemistry_marks ?? 0, att: student.chemistry_attendance ?? 0 },
  ].filter(s => s.marks > 0 || s.att > 0);

  const avgMarks = subjects.length > 0
    ? Math.round(subjects.reduce((a, s) => a + s.marks, 0) / subjects.length)
    : 0;
  const avgAtt = subjects.length > 0
    ? Math.round(subjects.reduce((a, s) => a + s.att, 0) / subjects.length)
    : 0;

  const riskColor = student.risk_category === "High" ? "#ef4444"
    : student.risk_category === "Medium" ? "#f59e0b"
    : "#14b8a6";

  const subjectTableBody = [
    [
      { text: "Subject", style: "tableHeader" },
      { text: "Marks (%)", style: "tableHeader" },
      { text: "Attendance (%)", style: "tableHeader" },
      { text: "Status", style: "tableHeader" },
    ],
    ...subjects.map(s => [
      s.name,
      { text: `${s.marks}%`, color: s.marks < 35 ? "#ef4444" : s.marks < 50 ? "#f59e0b" : "#14b8a6", bold: true },
      { text: `${s.att}%`, color: s.att < 60 ? "#ef4444" : s.att < 75 ? "#f59e0b" : "#14b8a6", bold: true },
      {
        text: s.marks < 35 || s.att < 60 ? "⚠ At Risk" : "✓ OK",
        color: s.marks < 35 || s.att < 60 ? "#ef4444" : "#14b8a6",
        bold: true,
      }
    ])
  ];

  const riskReasons = student.top_risk_reasons
    ? student.top_risk_reasons.split(" | ").filter(Boolean)
    : ["No risk factors recorded."];

  const docDefinition: any = {
    pageSize: "A4",
    pageMargins: [40, 60, 40, 60],
    content: [
      // Header
      {
        columns: [
          {
            text: [
              { text: "RiskWise AI\n", style: "mainTitle" },
              { text: "Official Academic Progress Report\n", style: "subTitle" },
              { text: `Generated: ${new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}`, style: "meta" },
            ],
          },
          {
            stack: [
              {
                canvas: [{
                  type: "rect",
                  x: 0, y: 0,
                  w: 120, h: 60,
                  r: 8,
                  color: riskColor,
                }]
              },
              {
                text: [
                  { text: `${student.current_risk_score}\n`, fontSize: 28, bold: true, color: "white" },
                  { text: `${student.risk_category} Risk`, fontSize: 12, color: "white" }
                ],
                absolutePosition: { x: 435, y: 65 },
                alignment: "center",
              }
            ],
            width: 140,
            alignment: "right",
          }
        ]
      },

      { canvas: [{ type: "line", x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 2, lineColor: "#4f46e5" }] },
      { text: "\n" },

      // Student Details
      {
        style: "section",
        columns: [
          {
            width: "*",
            stack: [
              { text: "Student Information", style: "sectionTitle" },
              { text: [{ text: "Name:  ", bold: true }, student.name], margin: [0, 3, 0, 0] },
              { text: [{ text: "Email:  ", bold: true }, student.email], margin: [0, 3, 0, 0] },
              student.parent_email
                ? { text: [{ text: "Parent Email:  ", bold: true }, student.parent_email], margin: [0, 3, 0, 0] }
                : {},
            ]
          }
        ]
      },

      { text: "\n" },

      // Subject Table
      { text: "Academic Performance Breakdown", style: "sectionTitle" },
      {
        margin: [0, 8, 0, 0],
        table: {
          headerRows: 1,
          widths: ["*", "auto", "auto", "auto"],
          body: subjectTableBody,
        },
        layout: {
          hLineColor: "#e2e8f0",
          vLineColor: "#e2e8f0",
          fillColor: (rowIndex: number) => rowIndex === 0 ? "#f8fafc" : null,
        }
      },

      { text: "\n" },

      // Summary Row
      {
        columns: [
          {
            width: "*",
            stack: [
              { text: "Department Summary", style: "sectionTitle" },
              { text: `Average Marks: ${avgMarks}%`, margin: [0, 5, 0, 2], color: avgMarks < 35 ? "#ef4444" : "#1e293b" },
              { text: `Average Attendance: ${avgAtt}%`, margin: [0, 2, 0, 2], color: avgAtt < 60 ? "#ef4444" : "#1e293b" },
              { text: `Risk Classification: ${student.risk_category}`, margin: [0, 2, 0, 0], color: riskColor, bold: true },
            ]
          },
          {
            width: "*",
            stack: [
              { text: "Risk Factor Analysis", style: "sectionTitle" },
              ...riskReasons.map(r => ({ text: `• ${r}`, margin: [0, 3, 0, 0], color: "#f59e0b", fontSize: 10 }))
            ]
          }
        ]
      },

      { text: "\n\n" },
      { canvas: [{ type: "line", x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 1, lineColor: "#cbd5e1" }] },
      {
        text: "\nThis document is auto-generated by RiskWise AI. For official record verification, contact your academic coordinator.",
        style: "footer",
        margin: [0, 8, 0, 0]
      }
    ],
    styles: {
      mainTitle: { fontSize: 22, bold: true, color: "#4f46e5" },
      subTitle: { fontSize: 13, color: "#64748b", margin: [0, 4, 0, 2] },
      meta: { fontSize: 10, color: "#94a3b8" },
      sectionTitle: { fontSize: 13, bold: true, color: "#0f172a", margin: [0, 0, 0, 5] },
      tableHeader: { bold: true, fontSize: 11, color: "#475569", fillColor: "#f8fafc" },
      section: { margin: [0, 0, 0, 10] },
      footer: { fontSize: 9, italics: true, color: "#94a3b8", alignment: "center" }
    },
    defaultStyle: { fontSize: 11, color: "#334155" }
  };

  const safeName = student.name.replace(/\s+/g, "_");
  pdfMake.createPdf(docDefinition).download(`${safeName}_RiskWise_Report.pdf`);
}
