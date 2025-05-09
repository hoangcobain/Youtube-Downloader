-- Create a table for tracking YouTube downloads
CREATE TABLE youtube_downloads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  video_url TEXT NOT NULL,
  video_title TEXT,
  format TEXT NOT NULL,
  quality TEXT,
  is_audio BOOLEAN DEFAULT false,
  file_size BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create an index on user_id for faster lookups
CREATE INDEX youtube_downloads_user_id_idx ON youtube_downloads(user_id);
