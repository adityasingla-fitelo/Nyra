-- =========================
-- USERS
-- =========================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,                    -- MUST match auth.uid()
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  login_method TEXT NOT NULL CHECK (login_method = 'google'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- PERSONAS
-- =========================
CREATE TABLE IF NOT EXISTS personas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  age INTEGER,
  height_cm NUMERIC,
  weight_kg NUMERIC,
  gender TEXT,
  occupation TEXT,
  wake_time TEXT,
  sleep_time TEXT,
  activity_type TEXT,
  activity_frequency TEXT,
  activity_duration TEXT,
  health_goal TEXT,
  diet_preference TEXT,
  medical_conditions TEXT,
  water_intake TEXT,
  stress_level TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- =========================
-- CHATS
-- =========================
CREATE TABLE IF NOT EXISTS chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'New Chat',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- MESSAGES
-- =========================
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- INDEXES
-- =========================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_personas_user ON personas(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_user ON chats(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat ON messages(chat_id);

-- =========================
-- ROW LEVEL SECURITY
-- =========================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- =========================
-- RLS POLICIES (SECURE)
-- =========================

-- USERS
CREATE POLICY "Users can read own profile"
ON users FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON users FOR INSERT
WITH CHECK (auth.uid() = id);

-- PERSONAS
CREATE POLICY "Users manage own persona"
ON personas FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- CHATS
CREATE POLICY "Users manage own chats"
ON chats FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- MESSAGES
CREATE POLICY "Users manage own messages"
ON messages FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
