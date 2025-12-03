// index.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const DISCORD_REDIRECT = process.env.DISCORD_REDIRECT; // e.g. https://hank97296.twdevs.com/auth/discord/callback OR railway url
const SESSION_SECRET = process.env.SESSION_SECRET || 'change_this_secret';

// basic OAuth2 endpoints
const OAUTH_URL = 'https://discord.com/api/oauth2/authorize';
const TOKEN_URL = 'https://discord.com/api/oauth2/token';
const API_BASE = 'https://discord.com/api';

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(cookieParser());
app.set('trust proxy', 1);

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // require HTTPS in production
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Redirect to Discord OAuth2
app.get('/auth/discord', (req, res) => {
  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: DISCORD_REDIRECT,
    response_type: 'code',
    scope: 'identify guilds'
  });
  res.redirect(`${OAUTH_URL}?${params.toString()}`);
});

// OAuth2 callback
app.get('/auth/discord/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send('No code provided');

  try {
    // exchange code for token
    const params = new URLSearchParams({
      client_id: DISCORD_CLIENT_ID,
      client_secret: DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: DISCORD_REDIRECT
    });

    const tokenResp = await axios.post(TOKEN_URL, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const token = tokenResp.data;
    // get user
    const userResp = await axios.get(`${API_BASE}/users/@me`, {
      headers: { Authorization: `${token.token_type} ${token.access_token}` }
    });

    // get guilds
    const guildsResp = await axios.get(`${API_BASE}/users/@me/guilds`, {
      headers: { Authorization: `${token.token_type} ${token.access_token}` }
    });

    // save to session
    req.session.discord = {
      token,
      user: userResp.data,
      guilds: guildsResp.data
    };

    res.redirect('/dashboard.html');
  } catch (err) {
    console.error('OAuth callback error', err.response?.data || err.message);
    res.status(500).send('OAuth error');
  }
});

// logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// API: get current user and guilds
app.get('/api/me', (req, res) => {
  if (!req.session.discord) return res.json({ logged: false });
  const { user, guilds } = req.session.discord;
  res.json({ logged: true, user, guilds });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
