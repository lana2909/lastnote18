
-- Create majors table
CREATE TABLE IF NOT EXISTS majors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  short_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create classes table
CREATE TABLE IF NOT EXISTS classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  major_id uuid REFERENCES majors(id) ON DELETE CASCADE,
  name text NOT NULL, -- e.g. "PPLG 1"
  display_name text, -- e.g. "XII PPLG 1"
  theme_id text NOT NULL DEFAULT 'default', -- e.g. "gta", "ocean"
  created_at timestamptz DEFAULT now()
);

-- Add class_id and absent_no to users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS class_id uuid REFERENCES classes(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS absent_no integer;

-- Add RLS for majors and classes
ALTER TABLE majors ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- Everyone can read majors and classes (needed for login/signup/ui)
CREATE POLICY "Everyone can read majors"
  ON majors FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Everyone can read classes"
  ON classes FOR SELECT
  TO authenticated, anon
  USING (true);

-- Only admins can modify
CREATE POLICY "Admins can insert majors"
  ON majors FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'ADMIN'));

CREATE POLICY "Admins can update majors"
  ON majors FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'ADMIN'));

CREATE POLICY "Admins can insert classes"
  ON classes FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'ADMIN'));

CREATE POLICY "Admins can update classes"
  ON classes FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'ADMIN'));

-- Seed Initial Data
DO $$
DECLARE
  v_pplg uuid;
  v_klr uuid;
  v_bcf uuid;
  v_tjkt uuid;
  v_dkv uuid;
  v_akl uuid;
  v_tbsm uuid;
  v_tkro uuid;
BEGIN
  -- Insert Majors
  INSERT INTO majors (name, short_name) VALUES ('Pengembangan Perangkat Lunak dan Gim', 'PPLG') RETURNING id INTO v_pplg;
  INSERT INTO majors (name, short_name) VALUES ('Kuliner', 'KLR') RETURNING id INTO v_klr;
  INSERT INTO majors (name, short_name) VALUES ('Broadcasting dan Perfilman', 'BCF') RETURNING id INTO v_bcf;
  INSERT INTO majors (name, short_name) VALUES ('Teknik Jaringan Komputer dan Telekomunikasi', 'TJKT') RETURNING id INTO v_tjkt;
  INSERT INTO majors (name, short_name) VALUES ('Desain Komunikasi Visual', 'DKV') RETURNING id INTO v_dkv;
  INSERT INTO majors (name, short_name) VALUES ('Akuntansi dan Keuangan Lembaga', 'AKL') RETURNING id INTO v_akl;
  INSERT INTO majors (name, short_name) VALUES ('Teknik dan Bisnis Sepeda Motor', 'TBSM') RETURNING id INTO v_tbsm;
  INSERT INTO majors (name, short_name) VALUES ('Teknik Kendaraan Ringan Otomotif', 'TKRO') RETURNING id INTO v_tkro;

  -- Insert Classes with Themes
  -- PPLG
  INSERT INTO classes (major_id, name, display_name, theme_id) VALUES (v_pplg, 'PPLG 1', 'XII PPLG 1', 'gta');
  INSERT INTO classes (major_id, name, display_name, theme_id) VALUES (v_pplg, 'PPLG 2', 'XII PPLG 2', 'ocean');
  
  -- KLR
  INSERT INTO classes (major_id, name, display_name, theme_id) VALUES (v_klr, 'KLR', 'XII KLR', 'vintage_simple');

  -- BCF
  INSERT INTO classes (major_id, name, display_name, theme_id) VALUES (v_bcf, 'BCF', 'XII BCF', 'film');

  -- TJKT
  INSERT INTO classes (major_id, name, display_name, theme_id) VALUES (v_tjkt, 'TJKT 1', 'XII TJKT 1', 'computer');
  INSERT INTO classes (major_id, name, display_name, theme_id) VALUES (v_tjkt, 'TJKT 2', 'XII TJKT 2', 'computer'); -- Assuming same theme

  -- DKV
  INSERT INTO classes (major_id, name, display_name, theme_id) VALUES (v_dkv, 'DKV 1', 'XII DKV 1', 'galaxy');
  INSERT INTO classes (major_id, name, display_name, theme_id) VALUES (v_dkv, 'DKV 2', 'XII DKV 2', 'polaroid');

  -- AKL
  INSERT INTO classes (major_id, name, display_name, theme_id) VALUES (v_akl, 'AKL 1', 'XII AKL 1', 'mars');
  INSERT INTO classes (major_id, name, display_name, theme_id) VALUES (v_akl, 'AKL 2', 'XII AKL 2', 'inside_out');
  INSERT INTO classes (major_id, name, display_name, theme_id) VALUES (v_akl, 'AKL 3', 'XII AKL 3', 'monochrome');
  INSERT INTO classes (major_id, name, display_name, theme_id) VALUES (v_akl, 'AKL 4', 'XII AKL 4', 'nuanu');

  -- TO (Mixed TKRO and TBSM)
  -- TO 1 = TKRO 1
  INSERT INTO classes (major_id, name, display_name, theme_id) VALUES (v_tkro, 'TKRO 1', 'XII TO 1 (TKRO 1)', 'machine_engineering');
  -- TO 2 = TKRO 2
  INSERT INTO classes (major_id, name, display_name, theme_id) VALUES (v_tkro, 'TKRO 2', 'XII TO 2 (TKRO 2)', 'machine_banget');
  -- TO 3 = TKRO 3
  INSERT INTO classes (major_id, name, display_name, theme_id) VALUES (v_tkro, 'TKRO 3', 'XII TO 3 (TKRO 3)', 'graffiti');
  -- TO 4 = TBSM 1
  INSERT INTO classes (major_id, name, display_name, theme_id) VALUES (v_tbsm, 'TBSM 1', 'XII TO 4 (TBSM 1)', 'hooligans');
  -- TO 5 = TBSM 2
  INSERT INTO classes (major_id, name, display_name, theme_id) VALUES (v_tbsm, 'TBSM 2', 'XII TO 5 (TBSM 2)', 'hardcore_hooligans');

END $$;
