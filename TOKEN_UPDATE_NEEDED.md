# ⚠️ TOKEN PERLU UPDATE

Cloudflare API token yang ada sekarang **VALID** tapi **TIDAK PUNYA AI PERMISSIONS**.

## Solusi: Buat Token Baru dengan AI Permissions

### Langkah-langkah:

1. **Login ke Cloudflare Dashboard**
   - https://dash.cloudflare.com

2. **Buka Account Profile**
   - Klik profile icon (top right)
   - Pilih "My Profile"

3. **Buka API Tokens**
   - Sidebar: "API Tokens"
   - Atau direct: https://dash.cloudflare.com/profile/api-tokens

4. **Revoke Token Lama** (opsional tapi recommended)
   - Find token "cfat_pOBRzfC9JI..." 
   - Click delete

5. **Create New Token**
   - Klik "Create Token"
   - Pilih **"Create Custom Token"** (bukan template)

6. **Configure Permissions**
   ```
   Permissions:
   ✓ Account - Workers AI - Read
   ✓ Account - Workers AI - Write
   ✓ Account - AI (jika ada option)
   ✓ Account - Account Settings - Read
   
   Account Resources:
   ✓ All accounts (atau pilih akun: af1e9573c547e540a4a988467b4c2304)
   ```

7. **Review & Create**
   - Continue to summary
   - Create Token
   - **Copy token yang baru** (jangan lupa, hanya tampil sekali!)

8. **Update .env**
   ```
   CLOUDFLARE_API_TOKEN=<paste_new_token_here>
   ```

9. **Test Again**
   ```bash
   cd nodejs
   node test-cf.js
   ```

---

## FAQ

**Q: Gimana cari permission yang tepat?**  
A: Cari "Workers AI" atau "AI" di permission list saat create token

**Q: Token lama masih bisa digunakan?**  
A: Bisa, tapi hanya untuk operasi yang sesuai permissions-nya (bukan AI)

**Q: Berapa lama token berlaku?**  
A: Selamanya sampai di-revoke (atau set expiry saat create)

---

**Next**: Update token di .env dan test lagi! 🎯
