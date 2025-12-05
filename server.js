const express = require("express");
const axios = require("axios");
const cookieParser = require("cookie-parser");
const path = require("path");
require("dotenv").config();

const app = express();

app.use(cookieParser());
app.use(express.static("public"));

// Discord OAuth2 連結
app.get("/login", (req, res) => {
  const url =
    `https://discord.com/api/oauth2/authorize?client_id=${process.env.CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}` +
    `&response_type=code&scope=identify%20guilds`;
  res.redirect(url);
});

// OAuth Callback
app.get("/oauth/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.send("No OAuth code received");

  try {
    const tokenResponse = await axios.post(
      "https://discord.com/api/oauth2/token",
      new URLSearchParams({
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        grant_type: "authorization_code",
        code: code,
        redirect_uri: process.env.REDIRECT_URI
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      }
    );

    const accessToken = tokenResponse.data.access_token;

    // 存 Token 在 Cookie
    res.cookie("token", accessToken, { httpOnly: true });

    res.redirect("/dashboard");
  } catch (e) {
    return res.send("OAuth Error: " + e);
  }
});

// Dashboard 伺服器列表
app.get("/dashboard", async (req, res) => {
  const token = req.cookies.token;

  if (!token) return res.redirect("/login");

  try {
    const guildResponse = await axios.get(
      "https://discord.com/api/users/@me/guilds",
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    let list = "<h1>你的伺服器列表</h1>";

    guildResponse.data.forEach(g => {
      list += `<p>${g.name} (${g.id})</p>`;
    });

    res.send(list);
  } catch (e) {
    return res.send("Dashboard Error: " + e);
  }
});

// 主頁
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// Render 需要明確指定 port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
