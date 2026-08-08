require('dotenv').config();
require('./config/db');
const express = require('express');
const session = require('express-session');
const crypto = require('crypto');
const path = require('path');

const pages = require('./routes/pages');
const controllers = require('./routes/controllers');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: false }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'ganti-dengan-secret-panjang-acak',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax'
  }
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

const staticRoot = process.env.STATIC_ROOT || path.join(__dirname, '..');
app.use('/css', express.static(path.join(staticRoot, 'css')));
app.use('/js', express.static(path.join(staticRoot, 'js')));
app.use('/images', express.static(path.join(staticRoot, 'images')));
app.use('/fontawesome', express.static(path.join(staticRoot, 'fontawesome')));

app.use('/', pages);
app.use('/controller', controllers);

app.use((err, req, res, next) => {
  console.error(err);
  if (process.env.APP_DEBUG === '1') {
    res.status(500).send(err.message);
  } else {
    res.status(500).send('Terjadi kesalahan server.');
  }
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
