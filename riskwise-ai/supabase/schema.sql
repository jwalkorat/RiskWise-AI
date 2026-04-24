-- Run this in Supabase SQL Editor to finalize schema for the 3-way data flow.
-- Adds subject-specific mark/attendance columns to `students`,
-- subject_specialty to `users`, and student_assignments if not already present.

-- ── users: add subject_specialty ─────────────────────────────────────────────
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS subject_specialty TEXT;
-- Example values: 'math', 'physics', 'cs', 'english', 'biology'

-- ── students: add per-subject mark/attendance columns ─────────────────────────
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS general_feedback TEXT;

ALTER TABLE public.students ADD COLUMN IF NOT EXISTS math_marks FLOAT DEFAULT 0;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS math_attendance FLOAT DEFAULT 0;

ALTER TABLE public.students ADD COLUMN IF NOT EXISTS physics_marks FLOAT DEFAULT 0;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS physics_attendance FLOAT DEFAULT 0;

ALTER TABLE public.students ADD COLUMN IF NOT EXISTS cs_marks FLOAT DEFAULT 0;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS cs_attendance FLOAT DEFAULT 0;

ALTER TABLE public.students ADD COLUMN IF NOT EXISTS english_marks FLOAT DEFAULT 0;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS english_attendance FLOAT DEFAULT 0;

ALTER TABLE public.students ADD COLUMN IF NOT EXISTS biology_marks FLOAT DEFAULT 0;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS biology_attendance FLOAT DEFAULT 0;

-- ── student_assignments: core table ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.student_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    assignment_title VARCHAR(255) NOT NULL,
    subject TEXT,                         -- plain text, no FK needed
    due_date DATE,
    is_completed BOOLEAN DEFAULT FALSE,
    student_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── students base table (safe re-run) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    mentor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    current_risk_score INT DEFAULT 0,
    risk_category VARCHAR(50) DEFAULT 'Low',
    top_risk_reasons TEXT
);

-- ── interventions ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.interventions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    mentor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    session_date TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'SCHEDULED',
    mentor_feedback TEXT,
    pre_intervention_score INT
);

-- ── 🏥 Medical & AI Verification Adds ──────────────────────────────────────────
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS medical_proof_url TEXT;

ALTER TABLE public.student_assignments ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE public.student_assignments ADD COLUMN IF NOT EXISTS ai_prediction TEXT;
ALTER TABLE public.student_assignments ADD COLUMN IF NOT EXISTS ai_confidence NUMERIC;
