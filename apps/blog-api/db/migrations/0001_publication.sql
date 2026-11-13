CREATE TABLE editors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE CHECK(email = lower(trim(email))),
  password_hash text NOT NULL,
  display_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE editor_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  editor_id uuid NOT NULL REFERENCES editors(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sessions_expiry_idx ON editor_sessions(expires_at);
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL UNIQUE
);
CREATE TABLE posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text NOT NULL CHECK(length(trim(title)) BETWEEN 1 AND 180),
  excerpt text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  cover_path text,
  cover_alt text NOT NULL DEFAULT '',
  category_id uuid NOT NULL REFERENCES categories(id),
  author_id uuid NOT NULL REFERENCES editors(id),
  status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published')),
  first_published_at timestamptz,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK((status='draft' AND published_at IS NULL) OR
        (status='published' AND published_at IS NOT NULL AND first_published_at IS NOT NULL
         AND length(trim(excerpt))>0 AND length(trim(body))>0 AND (cover_path IS NULL OR length(trim(cover_alt))>0)))
);
CREATE INDEX posts_public_order_idx ON posts(published_at DESC,id DESC) WHERE status='published';
CREATE INDEX posts_category_public_idx ON posts(category_id,published_at DESC,id DESC) WHERE status='published';
CREATE FUNCTION protect_published_slug() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.first_published_at IS NOT NULL AND NEW.slug IS DISTINCT FROM OLD.slug THEN
    RAISE EXCEPTION 'A previously published slug cannot change' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER lock_published_slug BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION protect_published_slug();
