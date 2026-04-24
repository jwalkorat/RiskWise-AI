import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get correct path to .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function seed() {
  console.log('Fetching users from Supabase...');
  const { data: users, error } = await supabase.from('users').select('*');
  
  if (error) {
    console.error('Error fetching users:', error);
    return;
  }
  
  const students = users.filter((u) => u.role === 'STUDENT');
  const mentors = users.filter((u) => u.role === 'MENTOR');
  
  console.log(`Found ${students.length} students and ${mentors.length} mentors.`);
  if (students.length === 0) {
      console.log('No STUDENT users found in public.users to seed.');
      return;
  }

  // 1. Insert into students table
  for (const student of students) {
    // Pick a random mentor, or null
    const mentorId = mentors.length > 0 ? mentors[Math.floor(Math.random() * mentors.length)].id : null;
    
    // Check if student already exists
    const { data: existingStudent } = await supabase.from('students').select('id').eq('user_id', student.id).single();
    let studentRecordId;

    if (!existingStudent) {
      console.log(`Seeding student record for: ${student.full_name || student.id}`);
      const { data: newStudent, error: insertError } = await supabase.from('students').insert({
        user_id: student.id,
        mentor_id: mentorId,
        current_risk_score: Math.floor(Math.random() * (95 - 40) + 40),
        risk_category: 'High', // Placeholder
        top_risk_reasons: 'Low attendance | Dropping test scores'
      }).select().single();
      
      if (insertError) {
        console.error('Insert student error:', insertError);
        continue;
      }
      studentRecordId = newStudent.id;
    } else {
      studentRecordId = existingStudent.id;
    }

    // 2. Insert dummy academic records
    let { data: subjects } = await supabase.from('subjects').select('*');
    if (!subjects || subjects.length === 0) {
        await supabase.from('subjects').insert([
            { subject_name: 'Advanced Physics' },
            { subject_name: 'Applied Mathematics' },
            { subject_name: 'Computer Science' }
        ]);
        const { data: newSubjects } = await supabase.from('subjects').select('*');
        subjects = newSubjects;
    }

    // Insert academic records safely
    for (const sub of subjects) {
        await supabase.from('academic_records').upsert({
            student_id: studentRecordId,
            subject_id: sub.id,
            attendance_percentage: Math.floor(Math.random() * (95 - 30) + 30),
            internal_marks: Math.floor(Math.random() * (100 - 30) + 30)
        }, { onConflict: 'student_id, subject_id' });
    }

    // 3. Insert assignments
    await supabase.from('assignments').insert([
        {
            student_id: studentRecordId,
            subject_id: subjects[0]?.id,
            assignment_title: 'Midterm Report',
            due_date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0], // Overdue by 5 days
            status: 'PENDING'
        }
    ]);
  }
  
  console.log('Seeding complete! Check your database.');
}

seed();
