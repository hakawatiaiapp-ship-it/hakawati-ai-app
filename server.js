import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(express.json({ limit: "20mb" }));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile("index.html", { root: "public" });
});

app.post("/api/generate", async (req, res) => {
  try {
    const { imageBase64, mimeType, text, dialect, voice } = req.body;

    if (!process.env.HEYGEN_API_KEY) {
      return res.status(500).json({ error: "HEYGEN_API_KEY غير موجود" });
    }

    if (!imageBase64 || !text) {
      return res.status(400).json({ error: "الصورة أو النص ناقص" });
    }

    const headers = {
      "X-Api-Key": process.env.HEYGEN_API_KEY
    };

    // 1) رفع الصورة إلى HeyGen
    const binary = Buffer.from(imageBase64, "base64");
    const blob = new Blob([binary], { type: mimeType || "image/jpeg" });

    const form = new FormData();
    form.append("file", blob, "photo.jpg");

    const uploadResp = await fetch("https://api.heygen.com/v3/assets", {
      method: "POST",
      headers,
      body: form
    });

    const uploadData = await uploadResp.json();

    if (!uploadResp.ok) {
      return res.status(uploadResp.status).json({
        error: uploadData?.message || "فشل رفع الصورة إلى HeyGen"
      });
    }

    const assetId =
      uploadData?.data?.asset_id ||
      uploadData?.asset_id;

    if (!assetId) {
      return res.status(500).json({ error: "لم نحصل على asset_id" });
    }

    // 2) اختيار صوت عربي رجالي
    const voicesResp = await fetch(
      "https://api.heygen.com/v3/voices?language=Arabic&gender=male&limit=1",
      { headers }
    );

    const voicesData = await voicesResp.json();

    const voiceId = voicesData?.data?.[0]?.voice_id;

    if (!voiceId) {
      return res.status(500).json({ error: "لم نجد صوت عربي في HeyGen" });
    }

    // 3) إنشاء الفيديو
    const videoResp = await fetch("https://api.heygen.com/v3/videos", {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        type: "image",
        image: {
          type: "asset_id",
          asset_id: assetId
        },
        script: text,
        voice_id: voiceId,
        title: "Hakawati AI",
        resolution: "720p",
        aspect_ratio: "auto"
      })
    });

    const videoData = await videoResp.json();

    if (!videoResp.ok) {
      return res.status(videoResp.status).json({
        error: videoData?.message || "فشل بدء إنشاء الفيديو"
      });
    }

    const videoId = videoData?.data?.video_id;

    res.json({ ok: true, videoId });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "حدث خطأ" });
  }
});

app.get("/api/status/:videoId", async (req, res) => {
  try {
    const r = await fetch(
      `https://api.heygen.com/v3/videos/${req.params.videoId}`,
      {
        headers: {
          "X-Api-Key": process.env.HEYGEN_API_KEY
        }
      }
    );

    const data = await r.json();
    res.status(r.status).json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Hakawati AI running on port ${PORT}`);
});
