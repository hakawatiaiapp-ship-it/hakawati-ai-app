import express from "express";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json({limit:"2mb"}));
app.use(express.static("public"));

const API = "https://api.heygen.com";
function hgHeaders(){
  if(!process.env.HEYGEN_API_KEY) throw new Error("HEYGEN_API_KEY غير موجود");
  return {"X-Api-Key": process.env.HEYGEN_API_KEY, "Content-Type":"application/json"};
}

app.get("/api/health", (req,res)=>res.json({ok:true}));

app.get("/api/avatars", async (req,res)=>{
  try{
    const r = await fetch(`${API}/v2/avatars`, {headers:hgHeaders()});
    const data = await r.json();
    res.status(r.status).json(data);
  }catch(e){res.status(500).json({error:e.message});}
});

app.get("/api/voices", async (req,res)=>{
  try{
    const r = await fetch(`${API}/v2/voices`, {headers:hgHeaders()});
    const data = await r.json();
    res.status(r.status).json(data);
  }catch(e){res.status(500).json({error:e.message});}
});

app.post("/api/generate", async (req,res)=>{
  try{
    const {avatar_id, voice_id, text, ratio="9:16"} = req.body;
    if(!avatar_id || !voice_id || !text) return res.status(400).json({error:"avatar_id و voice_id و text مطلوبة"});

    const dimension = ratio === "16:9"
      ? {width:1280,height:720}
      : {width:720,height:1280};

    const payload = {
      video_inputs: [{
        character: {type:"avatar", avatar_id, avatar_style:"normal"},
        voice: {type:"text", input_text:text, voice_id}
      }],
      dimension,
      test:false,
      caption:false
    };

    const r = await fetch(`${API}/v2/video/generate`, {
      method:"POST", headers:hgHeaders(), body:JSON.stringify(payload)
    });
    const data = await r.json();
    res.status(r.status).json(data);
  }catch(e){res.status(500).json({error:e.message});}
});

app.get("/api/status/:videoId", async (req,res)=>{
  try{
    const r = await fetch(`${API}/v1/video_status.get?video_id=${encodeURIComponent(req.params.videoId)}`, {
      headers:hgHeaders()
    });
    const data = await r.json();
    res.status(r.status).json(data);
  }catch(e){res.status(500).json({error:e.message});}
});

const port = process.env.PORT || 3000;
app.listen(port, ()=>console.log(`Hakawati AI: http://localhost:${port}`));
