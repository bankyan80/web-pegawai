const crypto = require('crypto');

function csrfCheck(req, res) {
  const token = req.body.csrf_token;
  const stored = req.session.csrfToken;
  if (
    !stored ||
    !token ||
    stored.length !== token.length ||
    !crypto.timingSafeEqual(Buffer.from(stored), Buffer.from(token))
  ) {
    res.redirect('/?hal=home');
    return false;
  }
  return true;
}

module.exports = csrfCheck;
