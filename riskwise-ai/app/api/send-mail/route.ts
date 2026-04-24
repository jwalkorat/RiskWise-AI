export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export async function POST(req: NextRequest) {
  try {
    const { students, type } = await req.json();

    if (!students || students.length === 0) {
      return NextResponse.json(
        { success: false, error: "No students to notify." },
        { status: 400 },
      );
    }

    const results: { name: string; sent: boolean }[] = [];
    const brevoApiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.EMAIL_USER;

    for (const student of students) {
      if (!student.parent_email) {
        results.push({ name: student.name, sent: false });
        continue;
      }

      let subject = "";
      let text = "";
      let html: string | undefined;
      let pdfBase64: string | undefined;

      if (type === "WARNING") {
        const avgMarks = student.avg_marks ?? 100;
        const avgAttendance = student.avg_attendance ?? 100;
        const riskCategory = student.risk_category ?? "Low";

        const shouldSend =
          riskCategory === "High" || avgAttendance < 60 || avgMarks < 35;
        if (!shouldSend) {
          results.push({ name: student.name, sent: false });
          continue;
        }

        subject = `🔴 URGENT: Academic Warning for ${student.name}`;

        html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #4f46e5; margin: 0;">RiskWise AI</h2>
            <p style="color: #64748b; font-size: 14px; margin-top: 5px;">Official Academic Progress Report</p>
          </div>
          
          <p style="color: #334155;">Respected Parent/Guardian,</p>
          <p style="color: #334155; line-height: 1.6;">
            We wish to inform you that your child, <strong>${student.name}</strong>, requires immediate academic attention. 
            Below is their current academic summary across all subjects:
          </p>

          <table style="width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 20px;">
            <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
              <th style="padding: 12px; text-align: left; color: #475569;">Metric</th>
              <th style="padding: 12px; text-align: left; color: #475569;">Value</th>
              <th style="padding: 12px; text-align: left; color: #475569;">Status</th>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px; font-weight: bold; color: #334155;">Risk Classification</td>
              <td style="padding: 12px; color: ${riskCategory === "High" ? "#ef4444" : "#f59e0b"}; font-weight: bold;">${riskCategory} Risk</td>
              <td style="padding: 12px; color: #ef4444;">⚠️ Critical</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px; font-weight: bold; color: #334155;">Average Marks</td>
              <td style="padding: 12px; color: #334155;">${avgMarks}%</td>
              <td style="padding: 12px; color: ${avgMarks < 35 ? "#ef4444" : "#f59e0b"}; font-weight: bold;">${avgMarks < 35 ? "Fail" : "Low"}</td>
            </tr>
            <tr>
              <td style="padding: 12px; font-weight: bold; color: #334155;">Average Attendance</td>
              <td style="padding: 12px; color: #334155;">${avgAttendance}%</td>
              <td style="padding: 12px; color: ${avgAttendance < 75 ? "#ef4444" : "#10b981"}; font-weight: bold;">${avgAttendance < 75 ? "Default" : "Safe"}</td>
            </tr>
          </table>

          <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
            <p style="margin: 0; color: #991b1b; font-weight: bold; font-size: 14px;">
              Action Required: Please contact the faculty coordinator or mentor immediately to discuss an action plan before the final examinations.
            </p>
          </div>
          
          <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 30px;">
            This is an automated message. Please see the attached PDF for the official report.<br/>
            With regards,<br/><strong>RiskWise AI — Automated Academic Safety System</strong>
          </p>
        </div>
        `;

        text = undefined as unknown as string; // We'll pass html below

        // === GENERATE DYNAMIC PDF ===
        try {
          const pdfDoc = await PDFDocument.create();
          const page = pdfDoc.addPage([600, 400]);
          const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
          const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

          page.drawText("RiskWise AI - Official Academic Report", {
            x: 50,
            y: 350,
            size: 20,
            font: helveticaBold,
            color: rgb(0.2, 0.2, 0.8),
          });

          page.drawText(`Student Name: ${student.name}`, { x: 50, y: 300, size: 14, font: helveticaFont });
          
          const isHighRisk = riskCategory === "High";
          page.drawText(`Risk Classification: ${riskCategory} Risk`, { 
            x: 50, 
            y: 275, 
            size: 14, 
            font: helveticaBold, 
            color: isHighRisk ? rgb(0.9, 0.1, 0.1) : rgb(0.8, 0.5, 0.1) 
          });
          
          page.drawText(`Average Marks: ${avgMarks}%`, { x: 50, y: 250, size: 14, font: helveticaFont });
          page.drawText(`Average Attendance: ${avgAttendance}%`, { x: 50, y: 225, size: 14, font: helveticaFont });

          page.drawText("ACTION REQUIRED:", {
            x: 50,
            y: 175,
            size: 12,
            font: helveticaBold,
            color: rgb(0.8, 0.1, 0.1),
          });
          page.drawText("Please contact the faculty coordinator immediately to discuss an action plan.", {
            x: 50,
            y: 155,
            size: 12,
            font: helveticaFont,
            color: rgb(0.1, 0.1, 0.1),
          });
          
          page.drawText(`Generated on: ${new Date().toLocaleDateString()}`, {
            x: 50,
            y: 50,
            size: 10,
            font: helveticaFont,
            color: rgb(0.5, 0.5, 0.5),
          });

          pdfBase64 = await pdfDoc.saveAsBase64();
        } catch (pdfErr) {
          console.error("PDF Generation failed:", pdfErr);
        }
        // ============================

      } else if (type === "RETENTION") {
        subject = `Regarding the Academic Future of ${student.name}`;
        text = `Respected Parent/Guardian,

I am writing to you from the Academic Department regarding your child, ${student.name}.

We have received word that there may be concerns about ${student.name}'s continuation of studies. While we fully respect your family's circumstances, we wanted to personally reach out.

${student.name} is a student with real potential. Completing this degree could provide long-term stability and open doors to respected career opportunities.

If your concerns are regarding fees, travel, or any other matter, please visit the college so we can discuss possible scholarship solutions that might help. We would be very proud to see ${student.name} graduate.

With deep respect,
RiskWise AI — Faculty Retention Program`;
      }

      try {
        if (brevoApiKey && senderEmail) {
          const payload: any = {
            sender: { name: "RiskWise AI", email: senderEmail },
            to: [{ email: student.parent_email }],
            subject: subject,
            htmlContent: typeof html !== "undefined" ? html : undefined,
            textContent: text ? text : undefined,
          };

          if (pdfBase64) {
            payload.attachment = [
              {
                content: pdfBase64,
                name: `${student.name.replace(/\s+/g, "_")}_Academic_Report.pdf`,
              },
            ];
          }

          const response = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
              "accept": "application/json",
              "api-key": brevoApiKey,
              "content-type": "application/json",
            },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`Brevo API Error: ${response.status} ${errBody}`);
          }
        } else {
          // Demo Mode if keys are missing
          await new Promise((resolve) => setTimeout(resolve, 800));
          console.log(`[DEMO MODE] Simulated email sent to ${student.name} (${student.parent_email})`);
        }
        
        results.push({ name: student.name, sent: true });

        // Anti-spam throttling
        if (brevoApiKey) {
          await new Promise((resolve) => setTimeout(resolve, 300)); // Brevo handles HTTP rapidly
        }
      } catch (err: any) {
        console.error(`Mail failed for ${student.name}: `, err);
        results.push({ name: student.name, sent: false });
      }
    }

    const sent = results.filter((r) => r.sent).length;
    return NextResponse.json({
      success: true,
      sent,
      total: students.length,
      results,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
