-- Bucket storage: foto pegawai & dokumen
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('pegawai-foto', 'pegawai-foto', TRUE, 2097152, ARRAY['image/jpeg','image/png','image/webp']),
  ('dokumen', 'dokumen', TRUE, 5242880, ARRAY['application/pdf','image/jpeg','image/png'])
ON CONFLICT (id) DO NOTHING;

-- Izinkan anon membaca file publik (bucket public = true), akses tulis lewat service role.
CREATE POLICY "public read pegawai-foto" ON storage.objects
  FOR SELECT USING (bucket_id = 'pegawai-foto');
CREATE POLICY "public read dokumen" ON storage.objects
  FOR SELECT USING (bucket_id = 'dokumen');
