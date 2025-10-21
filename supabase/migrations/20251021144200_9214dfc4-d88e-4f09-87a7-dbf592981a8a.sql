-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create enum for question types
CREATE TYPE public.question_type AS ENUM ('mcq', 'text', 'audio');

-- Create enum for block types
CREATE TYPE public.block_type AS ENUM ('career', 'academic');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create questions table
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  type question_type NOT NULL,
  difficulty NUMERIC NOT NULL CHECK (difficulty >= 0 AND difficulty <= 10),
  block block_type NOT NULL,
  options JSONB, -- For MCQ options, stored as array
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on questions
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- RLS policies for questions - everyone can read, only admins can modify
CREATE POLICY "Anyone can view questions"
ON public.questions
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert questions"
ON public.questions
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update questions"
ON public.questions
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete questions"
ON public.questions
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_questions_updated_at
BEFORE UPDATE ON public.questions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample questions
INSERT INTO public.questions (question, type, difficulty, block, options) VALUES
('What motivates you most in your career?', 'audio', 3, 'career', NULL),
('Describe a challenging project you completed.', 'text', 5, 'career', NULL),
('Which skill is most important for leadership?', 'mcq', 4, 'career', '["Communication", "Technical expertise", "Decision making", "Empathy"]'::jsonb),
('What is 15% of 200?', 'mcq', 3, 'academic', '["30", "25", "35", "20"]'::jsonb),
('Explain the water cycle in your own words.', 'text', 4, 'academic', NULL),
('What is the square root of 144?', 'mcq', 2, 'academic', '["12", "14", "10", "16"]'::jsonb);