-- ==========================================================
-- 🎓 COMBO & STREAK SYSTEM MIGRATION
-- ==========================================================
-- Execute este script no SQL Editor do Supabase para criar
-- as tabelas e índices necessários para a funcionalidade de
-- Especializações Personalizadas e Ofensivas (Streaks).
-- ==========================================================

-- 1. Tabela de Cursos Personalizados (Especializações)
CREATE TABLE IF NOT EXISTS member_custom_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  objective TEXT,
  syllabus JSONB NOT NULL DEFAULT '[]'::jsonb,
  product_ids UUID[] NOT NULL DEFAULT '{}',
  total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  discounted_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (payment_status IN ('draft', 'pending', 'completed')),
  stripe_session_id VARCHAR(255),
  checklist_progress JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_member_custom_courses_member ON member_custom_courses(member_id);
CREATE INDEX IF NOT EXISTS idx_member_custom_courses_status ON member_custom_courses(payment_status);

-- 2. Tabela de Ofensivas (Streaks)
CREATE TABLE IF NOT EXISTS member_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL UNIQUE REFERENCES members(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_member_streaks_member ON member_streaks(member_id);
CREATE INDEX IF NOT EXISTS idx_member_streaks_last_activity ON member_streaks(last_activity_date);
