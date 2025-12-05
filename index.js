const express = require("express");
const path = require("path");
const axios = require("axios");
const cookieParser = require("cookie-parser");
const app = express();

// ====== CONFIG ======
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = "https://hank97296.twdevs.com/oauth/callback";

// ====== MIDDLEWARE ======
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// ====== ROUTES ======

// Home
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "views/index.html"));
});

// Login page
app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "views/login.html"));
});

// Dashboard
app.get("/dashboard", (req, res) => {
    if (!req.cookies.token) {
        return res.redirect("/login");
    }
    res.sendFile(path.join(__dirname, "views/dashboard.html"));
});

// OAuth callback
app.get("/oauth/callback", async (req, res) => {
    const code = req.query.code;
    if (!code) return res.send("No code provided.");

    try {
        const data = new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: "authorization_code",
            redirect_uri: REDIRECT_URI,
            code: code
        });

        const headers = {
            "Content-Type": "application/x-www-form-urlencoded"
        };

        const response = await axios.post(
            "https://discord.com/api/oauth2/token",
            data,
            { headers }
        );

        // Save token in cookie
        res.cookie("token", response.data.access_token, { httpOnly: true });

        return res.redirect("/dashboard");

    } catch (err) {
        console.log(err.response?.data || err);
        return res.send("OAuth error");
    }
});

// Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Website running on port " + PORT);
});
