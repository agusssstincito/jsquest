-- Usuarios (sincronizados con Clerk)
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  username TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Secciones (ej: "JavaScript Basics", "Intermediate JavaScript")
CREATE TABLE IF NOT EXISTS public.sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cursos (ej: "variables", "booleans")
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID REFERENCES public.sections(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lecciones (contenido teórico)
CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '[]',
  order_index INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, slug)
);

-- Quizzes inline dentro de lecciones
CREATE TABLE IF NOT EXISTS public.lesson_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_option_index INTEGER NOT NULL,
  explanation TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Challenges (ejercicios de código)
CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  starter_code TEXT NOT NULL DEFAULT '',
  solution_code TEXT NOT NULL DEFAULT '',
  hints JSONB DEFAULT '[]',
  order_index INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, slug)
);

-- Test cases de cada challenge
CREATE TABLE IF NOT EXISTS public.test_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  function_call TEXT NOT NULL,
  expected_output TEXT NOT NULL,
  is_hidden BOOLEAN DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0
);

-- Progreso del usuario
CREATE TABLE IF NOT EXISTS public.user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('lesson', 'challenge')),
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT only_one_type CHECK (
    (lesson_id IS NOT NULL AND challenge_id IS NULL AND type = 'lesson') OR
    (challenge_id IS NOT NULL AND lesson_id IS NULL AND type = 'challenge')
  ),
  UNIQUE(user_id, lesson_id),
  UNIQUE(user_id, challenge_id)
);

-- RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Políticas de users
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (id = (select auth.uid()::text));
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (id = (select auth.uid()::text));
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (id = (select auth.uid()::text));

-- Políticas de progreso
CREATE POLICY "Users can view own progress" ON public.user_progress
  FOR SELECT USING (user_id = (select auth.uid()::text));
CREATE POLICY "Users can insert own progress" ON public.user_progress
  FOR INSERT WITH CHECK (user_id = (select auth.uid()::text));

-- Contenido público (solo lectura)
CREATE POLICY "Public read sections" ON public.sections FOR SELECT USING (true);
CREATE POLICY "Public read courses" ON public.courses FOR SELECT USING (is_published = true);
CREATE POLICY "Public read lessons" ON public.lessons FOR SELECT USING (is_published = true);
CREATE POLICY "Public read quizzes" ON public.lesson_quizzes FOR SELECT USING (true);
CREATE POLICY "Public read challenges" ON public.challenges FOR SELECT USING (is_published = true);
CREATE TABLE IF NOT EXISTS public.dom_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  html_template TEXT NOT NULL DEFAULT '',
  starter_js TEXT NOT NULL DEFAULT '',
  hints JSONB DEFAULT '[]',
  order_index INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, slug)
);

CREATE TABLE IF NOT EXISTS public.dom_assertions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES public.dom_challenges(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  assertion TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.dom_challenges DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.dom_assertions DISABLE ROW LEVEL SECURITY;

