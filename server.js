import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(express.json({ limit: "2mb" }));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile("index.html", { root: "public" });
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Hakawati AI running on port ${PORT}`);
});
