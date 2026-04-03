require("dotenv").config();

const express = require("express");
const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

app.get("/", (req, res) => {
  res.send("Server running 🚀");
});

app.post("/upload", async (req, res) => {
  try {
    const { image, userId, name, reg, final } = req.body;

    if (final) {
  await axios.post(
    `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
    {
      chat_id: CHAT_ID,
      text: `✅ FINAL DATA\nID: ${userId}\nName: ${name}\nReg: ${reg}`
    }
  );

  return res.json({ message: "Final data sent ✅" });
}

    if (!image || !userId) {
      return res.status(400).json({ message: "Missing data ❌" });
    }

    const base64Data = image.replace(/^data:image\/png;base64,/, "");
    const fileName = `${userId}_${Date.now()}.png`;

    fs.writeFileSync(fileName, base64Data, "base64");

    const formData = new FormData();
    formData.append("chat_id", CHAT_ID);
    formData.append("photo", fs.createReadStream(fileName));
    let caption = `ID: ${userId}`;

    if (name && reg) {
      caption += `\nName: ${name}\nReg: ${reg}`;
    }
    
    formData.append("caption", caption);

    await axios.post(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`,
      formData,
      { headers: formData.getHeaders() }
    );

    if (fs.existsSync(fileName)) {
      fs.unlinkSync(fileName);
    }

    res.json({ message: "Sent ✅" });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running"));
