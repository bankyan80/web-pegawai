require('dotenv').config();
const express = require('express');
const cookieSession = require('cookie-session');
const crypto = require('crypto');
const path = require('path');

const pages = require('./routes/pages');
const controllers = require('./routes/controllers');
const apiKep = require('./routes/api-kep');
const apiDashboard = require('./routes/api-dashboard');
const analysisRoutes = require('./routes/analysis');
const menuModel = require('./models/menu');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.set('trust proxy', true);

app.use(express.urlencoded({ extended: false }));
app.use(express.json({ limit: '8mb' }));

app.use(cookieSession({
  name: 'kepegawaian_session',
  secret: process.env.SESSION_SECRET || 'ganti-dengan-secret-panjang-acak',
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 8 * 60 * 60 * 1000
}));

app.use((req, res, next) => {
  res.set('X-Frame-Options', 'SAMEORIGIN');
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use((req, res, next) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }
  res.locals.csrf = req.session.csrfToken;
  next();
});

const publicRoot = process.env.PUBLIC_ROOT || path.join(__dirname, '..', 'public');
app.use('/css', express.static(path.join(publicRoot, 'css')));
app.use('/js', express.static(path.join(publicRoot, 'js')));
app.use('/images', express.static(path.join(publicRoot, 'images')));
app.use('/fontawesome', express.static(path.join(publicRoot, 'fontawesome')));
app.use('/icons', express.static(path.join(publicRoot, 'icons')));
app.use('/manifest.webmanifest', express.static(path.join(publicRoot, 'manifest.webmanifest'), { setHeaders: (res) => res.setHeader('Content-Type', 'application/manifest+json') }));
app.use('/sw.js', express.static(path.join(publicRoot, 'sw.js')));

// Muat menu navbar dari DB (di-cache) dan saring sesuai role member.
app.use(async (req, res, next) => {
  try {
    const rows = await menuModel.all();
    res.locals.menus = menuModel.forRole(rows, req.session.MEMBER);
  } catch (err) {
    console.error('MENU:', err.message);
    res.locals.menus = [];
  }
  next();
});

app.use('/', pages);
app.use('/controller', controllers);
app.use('/api/kep', apiKep);
app.use('/api', apiDashboard);
app.use('/api/analysis', analysisRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  const debug = process.env.APP_DEBUG === '1' && process.env.NODE_ENV !== 'production';
  if (debug) {
    res.status(500).send(err.message);
  } else {
    res.status(500).send('Terjadi kesalahan server.');
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
  });
}

module.exports = app;
