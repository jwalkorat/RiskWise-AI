export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import twilio from "twilio";

export async function POST(req: Request) {
  try {
    const { students } = await req.json();

    if (
      !process.env.TWILIO_ACCOUNT_SID ||
      !process.env.TWILIO_AUTH_TOKEN ||
      !process.env.TWILIO_PHONE_NUMBER
    ) {
      throw new Error("Missing Twilio credentials in .env.local");
    }

    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN,
    );
    const results: { name: string; sent: boolean }[] = [];

    for (const student of students) {
      if (!student.parent_phone) {
        results.push({ name: student.name, sent: false });
        continue;
      }

      // Hardcode the message since SMS is concise
      const messageBody = `*URGENT: RiskWise AI*\nAcademic warning for ${student.name}.\nZero attendance and marks recorded. Scholarships and continued enrollment at risk. Please contact the Academic Coordinator immediately to prevent expulsion.`;

      try {
        const message = await client.messages.create({
          body: messageBody,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: student.parent_phone, // Must be formatted as E.164 (e.g. +917359129704)
        });

        console.log(
          `Twilio SMS dispatched for ${student.name}: ${message.sid}`,
        );
        results.push({ name: student.name, sent: true });

        // Small 100ms throttle just in case to prevent API rate limit issues on trial account
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (err: any) {
        console.error(`Twilio SMS failed for ${student.name}: `, err.message);
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
    console.error("SMS API Error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
