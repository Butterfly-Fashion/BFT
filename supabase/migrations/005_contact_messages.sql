CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied')),
  admin_reply TEXT,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS contact_messages_status_idx ON contact_messages (status);
CREATE INDEX IF NOT EXISTS contact_messages_created_at_idx ON contact_messages (created_at DESC);
