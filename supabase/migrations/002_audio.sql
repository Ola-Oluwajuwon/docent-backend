-- Add audio status to lessons
ALTER TABLE lessons ADD COLUMN audio_status TEXT
  CHECK (audio_status IN ('pending', 'generating', 'ready', 'failed'))
  DEFAULT 'pending';

-- Audio manifests table
CREATE TABLE audio_manifests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE UNIQUE,
  manifest JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add unique constraint on progress for upsert support
ALTER TABLE progress ADD CONSTRAINT progress_lesson_user_unique
  UNIQUE (lesson_id, user_id);
