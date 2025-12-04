const express = require("express");
const path = require("path");
const app = express();

// Public 資料夾（放 CSS、JS、圖片）
app.use(express.static("public"));

// 首頁
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// 儀表板
app.get("/dashboard", (req, res) => {
    res.sendFile(path.join(__dirname, "dashboard.html"));
});

// Render 伺服器用 PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`網站運行中: http://localhost:${PORT}`);
});
