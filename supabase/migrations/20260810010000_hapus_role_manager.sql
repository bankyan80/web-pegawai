-- Aplikasi hanya untuk administrator dan staff (pegawai yang login via NIP).
-- Role 'manager' dihapus: tersisa administrator & staff.

ALTER TABLE member DROP CONSTRAINT IF EXISTS member_role_check;
ALTER TABLE member ADD CONSTRAINT member_role_check CHECK (role IN ('administrator','staff'));

ALTER TABLE menu DROP COLUMN IF EXISTS for_manager;
