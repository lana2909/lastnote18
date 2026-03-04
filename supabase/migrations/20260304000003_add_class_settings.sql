
-- Add questions and unlock_date columns to classes table
ALTER TABLE classes 
ADD COLUMN IF NOT EXISTS questions JSONB DEFAULT '[
  {"id": "kesan", "label": "Berikan kesanmu tentang dia", "type": "textarea", "placeholder": "Tuliskan kesan yang kamu rasakan..."},
  {"id": "pesan", "label": "Berikan pesanmu untuk dia", "type": "textarea", "placeholder": "Sampaikan pesan yang ingin kamu berikan..."},
  {"id": "larangan", "label": "Berikan 3 atau lebih larangan yang harus dia hindari", "type": "textarea", "placeholder": "Tuliskan hal-hal yang sebaiknya dia hindari..."},
  {"id": "sifat", "label": "Berikan 3 atau lebih sifat yang harus dia pertahankan", "type": "textarea", "placeholder": "Tuliskan sifat-sifat baik yang harus dia jaga..."},
  {"id": "kesimpulan", "label": "Simpulkan dia menjadi 1 kalimat", "type": "textarea", "placeholder": "Jika kamu harus menggambarkan dia dalam satu kalimat..."},
  {"id": "hal_terpendam", "label": "Hal yang selalu ingin kamu utarakan padanya", "type": "textarea", "placeholder": "Sampaikan hal yang selama ini terpendam..."},
  {"id": "momen_berkesan", "label": "Momen paling berkesan selama di kelas ini", "type": "textarea", "placeholder": "Ceritakan momen yang paling berkesan..."}
]'::jsonb,
ADD COLUMN IF NOT EXISTS unlock_date TIMESTAMPTZ;

-- Also update messages table to support dynamic fields if needed
-- Currently messages table has specific columns (kesan, pesan, etc.)
-- To support custom questions properly without altering schema heavily, 
-- we can add a 'content' JSONB column to store all answers dynamically.
-- But for backward compatibility, we'll keep the fixed columns and add 'additional_data' JSONB.

ALTER TABLE messages
ADD COLUMN IF NOT EXISTS additional_data JSONB DEFAULT '{}'::jsonb;
