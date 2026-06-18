
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
  console.log("Checking Supabase tables...");
  
  const { data: courses, error: coursesError } = await supabase.from('courses').select('id, slug, title').limit(5);
  if (coursesError) console.error("Error fetching courses:", coursesError);
  else console.log("Courses:", courses);

  const { data: lessons, error: lessonsError } = await supabase.from('lessons').select('id, slug, title').limit(5);
  if (lessonsError) console.error("Error fetching lessons:", lessonsError);
  else console.log("Lessons:", lessons);

  const { data: challenges, error: challengesError } = await supabase.from('challenges').select('id, slug, title').limit(5);
  if (challengesError) console.error("Error fetching challenges:", challengesError);
  else console.log("Challenges:", challenges);

  const { data: domChallenges, error: domError } = await supabase.from('dom_challenges').select('id, slug, title').limit(5);
  if (domError) console.error("Error fetching dom_challenges:", domError);
  else console.log("DOM Challenges:", domChallenges);
}

verify();
