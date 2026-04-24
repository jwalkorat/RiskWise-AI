export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import os from "os";
import { supabase } from "@/lib/Client";

const execPromise = promisify(exec);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const studentId = formData.get("studentId") as string | null;
    const assignmentId = formData.get("assignmentId") as string | null;
    const isMedical = formData.get("isMedical") === "true";

    if (!file || !studentId) {
      return NextResponse.json(
        { error: "File and Student ID required" },
        { status: 400 },
      );
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    // 1. Upload to Supabase Storage
    const bucketName = "riskwise-uploads";

    // Note: this assumes the bucket exists and is public.
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase Upload Error:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    const fileUrl = publicUrlData.publicUrl;

    // 2. Handle Medical Proof (No AI needed)
    if (isMedical) {
      const { error: dbError } = await supabase
        .from("students")
        .update({ medical_proof_url: fileUrl })
        .eq("id", studentId);

      if (dbError) throw dbError;

      return NextResponse.json({
        success: true,
        url: fileUrl,
        isMedical: true,
      });
    }

    // 3. Handle Assignment (Requires AI Verification)
    if (!assignmentId) {
      return NextResponse.json(
        { error: "assignmentId required for assignments" },
        { status: 400 },
      );
    }

    // Save temporary file locally for Python script
    const tempPath = path.join(os.tmpdir(), fileName);
    fs.writeFileSync(tempPath, fileBuffer);

    let aiPrediction = "Unknown";
    let aiConfidence = 0;

    try {
      // Get absolute path of the script
      const scriptPath = path.join(
        process.cwd(),
        "scripts",
        "verify_assignment.py",
      );

      // Execute the PyTorch script via python3 (Linux/HF Spaces uses python3, not python)
      const command = `python3 "${scriptPath}" "${tempPath}"`;
      const { stdout, stderr } = await execPromise(command);

      if (stderr) console.warn("Python Stderr:", stderr);

      const parsed = JSON.parse(stdout.trim());
      if (parsed.error) {
        throw new Error(parsed.error);
      }

      aiPrediction = parsed.prediction;
      aiConfidence = parsed.confidence;
    } catch (e: any) {
      console.error("AI Model Error:", e);
      // We don't fail the entire upload if the AI script fails (e.g., if Python missing locally)
      aiPrediction = "AI Model Failed/Missing";
      aiConfidence = 0;
    } finally {
      // Clean up temp file
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    }

    // Reject if the AI determines it is Typed
    if (aiPrediction.toLowerCase().includes("typed")) {
      return NextResponse.json(
        {
          error: `Assignment rejected. The AI scanner detected that this document is not handwritten (Confidence: ${aiConfidence}%). Please upload a valid handwritten submission.`,
        },
        { status: 400 },
      );
    }

    // Threshold Check: Reject if it says "Handwritten" but is too unsure (less than 85%)
    if (
      aiPrediction.toLowerCase().includes("handwritten") &&
      Number(aiConfidence) < 85
    ) {
      return NextResponse.json(
        {
          error: `Assignment rejected. The AI scanner is too uncertain if this is handwritten (Confidence: ${aiConfidence}%). Please ensure your document is clearly handwritten and legible.`,
        },
        { status: 400 },
      );
    }

    // 4. Update Database
    const { error: assignError } = await supabase
      .from("student_assignments")
      .update({
        file_url: fileUrl,
        ai_prediction: aiPrediction,
        ai_confidence: aiConfidence,
        is_completed: true, // auto-mark complete upon upload
      })
      .eq("id", assignmentId);

    if (assignError) throw assignError;

    return NextResponse.json({
      success: true,
      url: fileUrl,
      prediction: aiPrediction,
      confidence: aiConfidence,
    });
  } catch (error: any) {
    console.error("Upload API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
