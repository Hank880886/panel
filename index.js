const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// 靜態檔案
app.use(express.static("public"));

// 主頁
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// 儀表板
app.get("/dashboard", (req, res) => {
    res.sendFile(path.join(__dirname, "dashboard.html"));
});

// keep alive endpoint（讓 uptime 類服務 ping） 
app.get("/ping", (req, res) => {
    res.send("alive");
});

app.listen(PORT, () => {
    console.log(`Server running on PORT ${PORT}`);
});
