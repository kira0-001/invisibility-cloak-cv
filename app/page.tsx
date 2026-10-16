"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useTheme } from "next-themes";
import { Slider } from "@/components/ui/slider";
import {
  Camera, Settings, Zap, Video, ScanLine, Download,
  ChevronDown, ChevronUp, Wand2, Eye, Crosshair,
  RefreshCw, Sun, Moon, Image as ImageIcon, Palette,
} from "lucide-react";
import { buildRangeFromPick, classifyPick, rgbToHsv, type HSV } from "./utils";

// ─── Colour presets ────────────────────────────────────────────────────────
const COLOR_PRESETS = [
  { key: "red",    name: "Red",    hex: "#EF4444", hsv: { h: 0,   s: 0.82, v: 0.90 } },
  { key: "green",  name: "Green",  hex: "#22C55E", hsv: { h: 120, s: 0.82, v: 0.80 } },
  { key: "blue",   name: "Blue",   hex: "#3B82F6", hsv: { h: 220, s: 0.80, v: 0.90 } },
  { key: "yellow", name: "Yellow", hex: "#EAB308", hsv: { h: 50,  s: 0.82, v: 0.90 } },
  { key: "purple", name: "Purple", hex: "#A855F7", hsv: { h: 270, s: 0.72, v: 0.90 } },
  { key: "pink",   name: "Pink",   hex: "#EC4899", hsv: { h: 330, s: 0.72, v: 0.90 } },
] as const;

// ─── Background scene presets ──────────────────────────────────────────────
const BG_PRESETS = [
  { id: "space",     emoji: "🌌", name: "Deep Space"    },
  { id: "cyberpunk", emoji: "🌆", name: "Cyberpunk"     },
  { id: "sunset",    emoji: "🌅", name: "Sunset"        },
  { id: "ocean",     emoji: "🌊", name: "Deep Ocean"    },
] as const;

function drawBgPreset(canvas: HTMLCanvasElement, id: string) {
  const w = canvas.width || 640, h = canvas.height || 480;
  const c = canvas.getContext("2d")!;
  if (id === "space") {
    const g = c.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#020013"); g.addColorStop(0.5, "#0a0230"); g.addColorStop(1, "#060020");
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    const ng = c.createRadialGradient(w*.3,h*.4,0,w*.3,h*.4,w*.5);
    ng.addColorStop(0,"rgba(80,0,180,.35)"); ng.addColorStop(1,"transparent");
    c.fillStyle=ng; c.fillRect(0,0,w,h);
    const ng2 = c.createRadialGradient(w*.75,h*.6,0,w*.75,h*.6,w*.35);
    ng2.addColorStop(0,"rgba(0,80,180,.2)"); ng2.addColorStop(1,"transparent");
    c.fillStyle=ng2; c.fillRect(0,0,w,h);
    const rng=(s:number)=>{const x=Math.sin(s)*10000;return x-Math.floor(x);};
    for(let i=0;i<280;i++){
      c.beginPath(); c.arc(rng(i*3.1)*w, rng(i*7.3)*h, rng(i*5.9)*1.8, 0, Math.PI*2);
      c.fillStyle=`rgba(255,255,255,${.4+rng(i*2.7)*.6})`; c.fill();
    }
  } else if (id === "cyberpunk") {
    const sky=c.createLinearGradient(0,0,0,h*.6);
    sky.addColorStop(0,"#000d1a"); sky.addColorStop(1,"#001a2c");
    c.fillStyle=sky; c.fillRect(0,0,w,h*.6);
    const fl=c.createLinearGradient(0,h*.6,0,h);
    fl.addColorStop(0,"#050020"); fl.addColorStop(1,"#0a0033");
    c.fillStyle=fl; c.fillRect(0,h*.6,w,h*.4);
    c.strokeStyle="rgba(0,255,200,.2)"; c.lineWidth=1;
    for(let x=0;x<w;x+=40){c.beginPath();c.moveTo(x,h*.6);c.lineTo(w/2,h);c.stroke();}
    for(let d=0;d<9;d++){const y=h*.6+(h*.4*d)/9;c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();}
    c.fillStyle="#000814";
    const blds=[[0,.45],[.05,.3],[.12,.5],[.18,.25],[.25,.42],[.32,.2],[.38,.38],[.45,.15],[.5,.35],[.57,.22],[.64,.4],[.72,.28],[.8,.45],[.87,.32],[.95,.48],[1,.4]];
    c.beginPath(); c.moveTo(0,h);
    for(const [bx,by] of blds) c.lineTo(bx*w,by*h);
    c.lineTo(w,h); c.closePath(); c.fill();
    const mg=c.createRadialGradient(w*.7,h*.5,0,w*.7,h*.5,w*.4);
    mg.addColorStop(0,"rgba(255,0,180,.18)"); mg.addColorStop(1,"transparent");
    c.fillStyle=mg; c.fillRect(0,0,w,h);
  } else if (id === "sunset") {
    const g=c.createLinearGradient(0,0,0,h);
    g.addColorStop(0,"#0f0c29"); g.addColorStop(.25,"#302b63");
    g.addColorStop(.55,"#c94b4b"); g.addColorStop(.75,"#ff9f43"); g.addColorStop(1,"#f8c04d");
    c.fillStyle=g; c.fillRect(0,0,w,h);
    const sg=c.createRadialGradient(w*.5,h*.62,0,w*.5,h*.62,h*.22);
    sg.addColorStop(0,"rgba(255,235,120,1)"); sg.addColorStop(.4,"rgba(255,170,60,.6)"); sg.addColorStop(1,"transparent");
    c.fillStyle=sg; c.fillRect(0,0,w,h);
    c.fillStyle="#1a0a2e";
    c.beginPath(); c.moveTo(0,h*.78);
    [[.1,.55],[.2,.7],[.32,.44],[.45,.62],[.58,.4],[.7,.58],[.82,.36],[.92,.52],[1,.45]].forEach(([bx,by])=>c.lineTo(bx*w,by*h));
    c.lineTo(w,h); c.lineTo(0,h); c.closePath(); c.fill();
    c.fillStyle="#120820";
    c.beginPath(); c.moveTo(0,h*.88);
    [[.15,.72],[.3,.82],[.5,.68],[.65,.78],[.85,.64],[1,.72]].forEach(([bx,by])=>c.lineTo(bx*w,by*h));
    c.lineTo(w,h); c.lineTo(0,h); c.closePath(); c.fill();
  } else if (id === "ocean") {
    const g=c.createLinearGradient(0,0,0,h);
    g.addColorStop(0,"#0a1628"); g.addColorStop(.35,"#0d2137"); g.addColorStop(.65,"#083660"); g.addColorStop(1,"#0d5fa3");
    c.fillStyle=g; c.fillRect(0,0,w,h);
    for(let i=0;i<7;i++){
      const rx=w*(.05+i*.13);
      const rg=c.createLinearGradient(rx,0,rx+w*.08,h);
      rg.addColorStop(0,"rgba(100,200,255,.1)"); rg.addColorStop(1,"transparent");
      c.fillStyle=rg;
      c.beginPath(); c.moveTo(rx-w*.02,0); c.lineTo(rx+w*.1,h); c.lineTo(rx-w*.04,h); c.closePath(); c.fill();
    }
    const shine=c.createLinearGradient(0,0,0,h*.18);
    shine.addColorStop(0,"rgba(150,230,255,.15)"); shine.addColorStop(1,"transparent");
    c.fillStyle=shine; c.fillRect(0,0,w,h*.18);
  }
}

// ─── Shared style tokens (avoids repeating long Tailwind strings) ──────────
const card = "rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] overflow-hidden";
const cardHeader = "flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-white/[0.05]";
const mutedText = "text-slate-500 dark:text-white/40";
const divider = "text-[11px] font-medium text-center text-slate-400 dark:text-white/25";

// ─── Main component ────────────────────────────────────────────────────────
export default function InvisibilityCloakApp() {
  const videoRef    = useRef<HTMLVideoElement>(null);
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef   = useRef<Worker | null>(null);
  const storedBgRef = useRef<{ data: Uint8ClampedArray; w: number; h: number } | null>(null);

  const [cameraReady, setCameraReady]     = useState(false);
  const [cameraError, setCameraError]     = useState<string | null>(null);
  const [hasBackground, setHasBackground] = useState(false);
  const [isActive, setIsActive]           = useState(false);
  const [fps, setFps]                     = useState(0);
  const [capturing, setCapturing]         = useState(false);
  const [countdown, setCountdown]         = useState(0);
  const [pickedHSV, setPickedHSV]         = useState<HSV>(COLOR_PRESETS[0].hsv);
  const [selectedColorKey, setSelectedColorKey] = useState("red");
  const [pickMode, setPickMode]           = useState(false);
  const [shadeCoverage, setShadeCoverage] = useState(0.6);
  const [hTolDeg, setHTolDeg]             = useState(16);
  const [morphIter, setMorphIter]         = useState(1);
  const [temporalAlpha, setTemporalAlpha] = useState(0.45);
  const [showMask, setShowMask]           = useState(false);
  const [showSettings, setShowSettings]   = useState(false);
  const [isRecording, setIsRecording]     = useState(false);
  const [mobileTab, setMobileTab]         = useState<"bg" | "color" | "settings">("bg");
  const [mounted, setMounted]             = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const frameIdRef       = useRef<number>(0);
  const isWorkerBusy     = useRef(false);
  const lastFrameTime    = useRef(0);
  const isActiveRef      = useRef(false);

  const { theme, setTheme } = useTheme();

  const hsvRange = useMemo(
    () => buildRangeFromPick(pickedHSV, shadeCoverage, hTolDeg),
    [pickedHSV, shadeCoverage, hTolDeg]
  );
  const detMode = useMemo(() => classifyPick(pickedHSV), [pickedHSV]);
  const canStart = hasBackground && !!pickedHSV && cameraReady;
  const step = !cameraReady ? 0 : !hasBackground ? 1 : !pickedHSV ? 2 : !isActive ? 3 : 4;

  // ── Mount (SSR guard for theme) ──────────────────────────────────────────
  useEffect(() => setMounted(true), []);

  // ── Worker — init ONCE ───────────────────────────────────────────────────
  useEffect(() => {
    const worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
    workerRef.current = worker;
    worker.onmessage = (e) => {
      if (e.data.type !== "FRAME_PROCESSED") return;
      const cvs = canvasRef.current;
      if (!cvs || !isActiveRef.current) { isWorkerBusy.current = false; return; }
      const ctx = cvs.getContext("2d");
      if (ctx) {
        ctx.putImageData(new ImageData(new Uint8ClampedArray(e.data.payload.frameData), cvs.width, cvs.height), 0, 0);
        const now = performance.now(), dt = now - lastFrameTime.current;
        if (dt > 0) setFps(Math.round(1000 / dt));
        lastFrameTime.current = now;
      }
      isWorkerBusy.current = false;
    };
    return () => worker.terminate();
  }, []);

  useEffect(() => { isActiveRef.current = isActive; }, [isActive]);

  // ── Camera ───────────────────────────────────────────────────────────────
  useEffect(() => {
    let active = true;
    navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } }
    }).then(stream => {
      if (!active) return;
      const vid = videoRef.current;
      if (vid) { vid.srcObject = stream; vid.play(); setCameraReady(true); }
    }).catch(err => { if (active) setCameraError(err?.message || "Camera access denied"); });
    return () => {
      active = false;
      (videoRef.current?.srcObject as MediaStream)?.getTracks().forEach(t => t.stop());
    };
  }, []);

  // ── Send bg to worker ────────────────────────────────────────────────────
  const sendBgToWorker = useCallback((data: Uint8ClampedArray, w: number, h: number) => {
    storedBgRef.current = { data: new Uint8ClampedArray(data), w, h };
    const transfer = new Uint8ClampedArray(data);
    workerRef.current?.postMessage(
      { type: "SET_BACKGROUND", payload: { bgData: transfer.buffer, width: w, height: h } },
      [transfer.buffer]
    );
  }, []);

  // ── Capture background ───────────────────────────────────────────────────
  const captureBackground = useCallback(async () => {
    const vid = videoRef.current, bgc = bgCanvasRef.current;
    if (!vid || !bgc || !cameraReady) return;
    setCapturing(true);
    for (let i = 3; i > 0; i--) { setCountdown(i); await new Promise(r => setTimeout(r, 1000)); }
    setCountdown(0);
    const w = vid.videoWidth || 640, h = vid.videoHeight || 480;
    bgc.width = w; bgc.height = h;
    const ctx = bgc.getContext("2d", { willReadFrequently: true })!;
    const accum = new Float32Array(w * h * 4);
    for (let k = 0; k < 8; k++) {
      ctx.drawImage(vid, 0, 0, w, h);
      const snap = ctx.getImageData(0, 0, w, h).data;
      for (let i = 0; i < snap.length; i++) accum[i] += snap[i];
      await new Promise(r => requestAnimationFrame(() => r(null)));
    }
    const out = new Uint8ClampedArray(w * h * 4);
    for (let i = 0; i < out.length; i++) out[i] = Math.round(accum[i] / 8);
    sendBgToWorker(out, w, h);
    setHasBackground(true);
    setCapturing(false);
  }, [cameraReady, sendBgToWorker]);

  // ── Preset background ────────────────────────────────────────────────────
  const applyBgPreset = useCallback((presetId: string) => {
    const vid = videoRef.current, bgc = bgCanvasRef.current;
    if (!bgc) return;
    const w = vid?.videoWidth || 640, h = vid?.videoHeight || 480;
    bgc.width = w; bgc.height = h;
    drawBgPreset(bgc, presetId);
    sendBgToWorker(new Uint8ClampedArray(bgc.getContext("2d")!.getImageData(0, 0, w, h).data), w, h);
    setHasBackground(true);
  }, [sendBgToWorker]);

  // ── Upload custom background ─────────────────────────────────────────────
  const handleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0], vid = videoRef.current, bgc = bgCanvasRef.current;
    if (!file || !bgc) return;
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const w = vid?.videoWidth || 640, h = vid?.videoHeight || 480;
      bgc.width = w; bgc.height = h;
      bgc.getContext("2d")!.drawImage(img, 0, 0, w, h);
      sendBgToWorker(new Uint8ClampedArray(bgc.getContext("2d")!.getImageData(0, 0, w, h).data), w, h);
      setHasBackground(true);
      URL.revokeObjectURL(img.src);
    };
  }, [sendBgToWorker]);

  // ── Click-to-pick colour from live feed ──────────────────────────────────
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!pickMode) return;
    const cvs = canvasRef.current, vid = videoRef.current;
    if (!cvs || !vid) return;
    setPickMode(false);
    const tmp = document.createElement("canvas");
    tmp.width = vid.videoWidth; tmp.height = vid.videoHeight;
    const tc = tmp.getContext("2d", { willReadFrequently: true })!;
    tc.drawImage(vid, 0, 0);
    const rect = cvs.getBoundingClientRect();
    const cx = Math.floor((e.clientX - rect.left) * (vid.videoWidth / rect.width));
    const cy = Math.floor((e.clientY - rect.top) * (vid.videoHeight / rect.height));
    const R = 5, x0 = Math.max(0, cx - R), y0 = Math.max(0, cy - R);
    const px = tc.getImageData(x0, y0, Math.min(tmp.width - x0, R*2+1), Math.min(tmp.height - y0, R*2+1)).data;
    let sumCos = 0, sumSin = 0, sumS = 0, sumV = 0, n = 0;
    for (let i = 0; i < px.length; i += 4) {
      const hsv = rgbToHsv(px[i], px[i+1], px[i+2]);
      const rad = hsv.h * Math.PI / 180;
      sumCos += Math.cos(rad); sumSin += Math.sin(rad); sumS += hsv.s; sumV += hsv.v; n++;
    }
    setPickedHSV({ h: ((Math.atan2(sumSin/n, sumCos/n) * 180 / Math.PI) + 360) % 360, s: sumS/n, v: sumV/n });
    setSelectedColorKey("custom");
  }, [pickMode]);

  // ── Render loop ──────────────────────────────────────────────────────────
  const loop = useCallback(() => {
    const vid = videoRef.current, cvs = canvasRef.current;
    if (!vid || !cvs || !isActiveRef.current || isWorkerBusy.current) {
      if (isActiveRef.current) frameIdRef.current = requestAnimationFrame(loop);
      return;
    }
    const w = vid.videoWidth, h = vid.videoHeight;
    if (!w || !h) { frameIdRef.current = requestAnimationFrame(loop); return; }
    if (cvs.width !== w) cvs.width = w;
    if (cvs.height !== h) cvs.height = h;
    const ctx = cvs.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    ctx.drawImage(vid, 0, 0, w, h);
    const frameData = ctx.getImageData(0, 0, w, h).data;
    isWorkerBusy.current = true;
    workerRef.current?.postMessage(
      { type: "PROCESS_FRAME", payload: { frameData: frameData.buffer, hsvRange, detMode, morphIter, temporalAlpha, showMask } },
      [frameData.buffer]
    );
    frameIdRef.current = requestAnimationFrame(loop);
  }, [hsvRange, detMode, morphIter, temporalAlpha, showMask]);

  useEffect(() => {
    if (isActive) { isWorkerBusy.current = false; frameIdRef.current = requestAnimationFrame(loop); }
    else cancelAnimationFrame(frameIdRef.current);
    return () => cancelAnimationFrame(frameIdRef.current);
  }, [isActive, loop]);

  // ── Action handlers ───────────────────────────────────────────────────────
  const toggleMagic = () => setIsActive(v => !v);

  const takeScreenshot = () => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const a = document.createElement("a");
    a.href = cvs.toDataURL("image/png");
    a.download = `invisibility-cloak-${Date.now()}.png`;
    a.click();
  };

  const toggleRecording = () => {
    if (isRecording) { mediaRecorderRef.current?.stop(); setIsRecording(false); return; }
    const cvs = canvasRef.current;
    if (!cvs) return;
    const recorder = new MediaRecorder(cvs.captureStream(30), { mimeType: "video/webm" });
    const chunks: Blob[] = [];
    recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = () => {
      const url = URL.createObjectURL(new Blob(chunks, { type: "video/webm" }));
      Object.assign(document.createElement("a"), { href: url, download: `magic-${Date.now()}.webm` }).click();
      URL.revokeObjectURL(url);
    };
    recorder.start();
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
  };

  // ── Reusable section JSX ──────────────────────────────────────────────────
  const BgSection = (
    <div className="space-y-3">
      <button onClick={captureBackground} disabled={!cameraReady || capturing}
        className="w-full h-11 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all shadow-sm">
        {capturing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
        {capturing ? `Step away… ${countdown}` : "Capture Empty Room"}
      </button>
      <p className={divider}>— or pick a scene —</p>
      <div className="grid grid-cols-2 gap-2">
        {BG_PRESETS.map(p => (
          <button key={p.id} onClick={() => applyBgPreset(p.id)}
            className="h-12 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-white/10 hover:border-purple-300 dark:hover:border-purple-400/40 text-slate-700 dark:text-white/70 text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.97]">
            <span className="text-xl">{p.emoji}</span>{p.name}
          </button>
        ))}
      </div>
      <p className={divider}>— or upload image —</p>
      <div className="relative">
        <input type="file" accept="image/*" onChange={handleUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
        <div className="h-11 rounded-xl border-2 border-dashed border-slate-300 dark:border-white/15 hover:border-purple-400 dark:hover:border-purple-400/40 flex items-center justify-center gap-2 text-sm text-slate-400 dark:text-white/40 font-medium transition-all">
          <ImageIcon className="w-4 h-4" /> Upload Custom Image
        </div>
      </div>
    </div>
  );

  const ColorSection = (
    <div className="space-y-3">
      <div className="grid grid-cols-6 gap-2">
        {COLOR_PRESETS.map(p => (
          <button key={p.key} onClick={() => { setSelectedColorKey(p.key); setPickedHSV(p.hsv); }}
            title={p.name}
            className={`h-10 rounded-xl border-2 transition-all duration-200 active:scale-90 ${selectedColorKey === p.key ? "border-slate-900 dark:border-white scale-110 shadow-lg" : "border-transparent opacity-70 hover:opacity-100 hover:scale-105 hover:border-slate-300 dark:hover:border-white/30"}`}
            style={{ background: `linear-gradient(135deg,${p.hex},${p.hex}99)`, boxShadow: selectedColorKey === p.key ? `0 0 16px ${p.hex}80` : "none" }}
          />
        ))}
      </div>
      <button onClick={() => setPickMode(v => !v)} disabled={!cameraReady}
        className={`w-full h-11 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40 transition-all active:scale-[0.98] ${pickMode ? "bg-fuchsia-100 dark:bg-fuchsia-500/20 border-fuchsia-400 text-fuchsia-700 dark:text-fuchsia-300" : "border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/10"}`}>
        <Crosshair className={`w-4 h-4 ${pickMode ? "animate-spin" : ""}`} />
        {pickMode ? "Click on the video to pick…" : "Pick Color from Video"}
      </button>
      <div className="flex items-center gap-3 h-11 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
        <span className="text-sm text-slate-500 dark:text-white/50 flex-1">Manual colour picker</span>
        <input type="color" onChange={e => {
          const r = parseInt(e.target.value.slice(1,3),16), g = parseInt(e.target.value.slice(3,5),16), b = parseInt(e.target.value.slice(5,7),16);
          setPickedHSV(rgbToHsv(r,g,b)); setSelectedColorKey("custom");
        }} className="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent" />
      </div>
      <p className={`${mutedText} text-xs text-center`}>
        Mode: <span className="text-purple-600 dark:text-purple-300 font-bold">{detMode.toUpperCase()}</span>
        {" · "}Hue: <span className="text-purple-600 dark:text-purple-300 font-bold">{pickedHSV.h.toFixed(0)}°</span>
      </p>
    </div>
  );

  const SettingsSection = (
    <div className="space-y-4">
      {[
        { label:"Shade Coverage", val:shadeCoverage, set:setShadeCoverage, min:0, max:1, step:.01, fmt:(v:number)=>`${Math.round(v*100)}%`, desc:"Accepts lighter/darker variants of your color" },
        { label:"Hue Tolerance",  val:hTolDeg,       set:setHTolDeg,       min:5, max:45, step:1,   fmt:(v:number)=>`±${v}°`, desc:"Widens the hue band" },
        { label:"Noise Removal",  val:morphIter,     set:setMorphIter,     min:0, max:3,  step:1,   fmt:(v:number)=>v===0?"Off":`${v}×`, desc:"Removes speckles via morphology" },
        { label:"Temporal Smooth",val:temporalAlpha, set:setTemporalAlpha, min:.15, max:.95, step:.01, fmt:(v:number)=>`${Math.round(v*100)}%`, desc:"Stabilises mask flicker" },
      ].map(s => (
        <div key={s.label} className="space-y-1.5">
          <div className="flex justify-between">
            <label className={`text-xs font-medium ${mutedText}`}>{s.label}</label>
            <span className="text-xs font-bold text-purple-600 dark:text-purple-300">{s.fmt(s.val)}</span>
          </div>
          <Slider value={[s.val]} onValueChange={([v]) => s.set(v)} min={s.min} max={s.max} step={s.step} />
          <p className={`text-[10px] ${mutedText} opacity-70`}>{s.desc}</p>
        </div>
      ))}
      <button onClick={() => setShowMask(v=>!v)}
        className={`w-full h-9 rounded-xl border text-xs font-bold transition-all ${showMask ? "bg-emerald-100 dark:bg-green-500/20 border-emerald-400 text-emerald-700 dark:text-green-300" : "border-slate-200 dark:border-white/10 text-slate-400 dark:text-white/40 hover:text-slate-600 dark:hover:text-white/60"}`}>
        {showMask ? "🟢 Debug Mask: ON" : "Debug Mask: OFF"}
      </button>
    </div>
  );

  const TipsCard = (
    <div className="rounded-2xl border border-amber-200 dark:border-amber-500/15 bg-amber-50 dark:bg-amber-500/5 p-4">
      <div className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1.5">
        <span>💡</span> Quick Tips
      </div>
      <ul className={`space-y-1.5 text-[11px] ${mutedText} leading-relaxed`}>
        <li>• Use a <strong className="text-slate-700 dark:text-white/60">solid-colored cloth</strong> (no patterns)</li>
        <li>• Step <strong className="text-slate-700 dark:text-white/60">completely out of frame</strong> when capturing</li>
        <li>• <strong className="text-slate-700 dark:text-white/60">Even lighting</strong> on the cloth gives best results</li>
        <li>• If flickering, lower <strong className="text-slate-700 dark:text-white/60">Temporal Smoothing</strong></li>
      </ul>
    </div>
  );

  // ── Step badge component ────────────────────────────────────────────────
  const STEPS = ["Camera", "Background", "Color", "Magic!"];
  const StepBadges = (
    <div className="hidden lg:flex items-center gap-1">
      {STEPS.map((s, i) => (
        <React.Fragment key={s}>
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
            step > i+1 ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30"
            : step === i+1 ? "bg-purple-100 dark:bg-purple-500/30 text-purple-700 dark:text-purple-200 border border-purple-300 dark:border-purple-400/50 shadow-[0_0_12px_rgba(168,85,247,0.3)]"
            : "bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-white/30 border border-slate-200 dark:border-white/10"
          }`}>
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
              step > i+1 ? "bg-emerald-500 text-white" : step === i+1 ? "bg-purple-500 text-white" : "bg-slate-200 dark:bg-white/10 text-slate-400 dark:text-white/40"
            }`}>{i+1}</span>
            {s}
          </div>
          {i < 3 && <div className="w-3 h-px bg-slate-200 dark:bg-white/10" />}
        </React.Fragment>
      ))}
    </div>
  );

  // ── Action buttons (shared) ──────────────────────────────────────────────
  const ActionButtons = (
    <div className="shrink-0 grid grid-cols-3 gap-2 p-3">
      <button onClick={toggleMagic} disabled={!canStart}
        className={`relative h-12 md:h-14 rounded-2xl font-bold text-sm text-white transition-all duration-200 flex items-center justify-center gap-1.5 md:gap-2 overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] ${
          isActive ? "bg-gradient-to-br from-red-500 to-red-700 shadow-[0_4px_20px_rgba(239,68,68,0.4)]"
                   : "bg-gradient-to-br from-purple-500 to-indigo-700 shadow-[0_4px_20px_rgba(139,92,246,0.4)]"}`}>
        <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
        <Zap className={`w-4 h-4 md:w-5 md:h-5 ${isActive ? "animate-pulse" : ""}`} />
        <span className="text-xs md:text-sm">{isActive ? "Stop" : "Activate"}</span>
      </button>
      <button onClick={toggleRecording} disabled={!isActive}
        className={`relative h-12 md:h-14 rounded-2xl font-bold text-sm text-white transition-all duration-200 flex items-center justify-center gap-1.5 md:gap-2 overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] ${
          isRecording ? "bg-gradient-to-br from-red-600 to-rose-800 animate-pulse"
                      : "bg-gradient-to-br from-pink-500 to-rose-700 shadow-[0_4px_20px_rgba(236,72,153,0.3)]"}`}>
        <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
        {isRecording ? <Download className="w-4 h-4 md:w-5 md:h-5 animate-bounce" /> : <Video className="w-4 h-4 md:w-5 md:h-5" />}
        <span className="text-xs md:text-sm">{isRecording ? "Save" : "Record"}</span>
      </button>
      <button onClick={takeScreenshot} disabled={!isActive}
        className="relative h-12 md:h-14 rounded-2xl font-bold text-sm text-white bg-gradient-to-br from-emerald-500 to-teal-700 shadow-[0_4px_20px_rgba(16,185,129,0.3)] transition-all duration-200 flex items-center justify-center gap-1.5 md:gap-2 overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]">
        <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
        <ScanLine className="w-4 h-4 md:w-5 md:h-5" />
        <span className="text-xs md:text-sm">Shot</span>
      </button>
    </div>
  );

  // ── Video area (shared) ──────────────────────────────────────────────────
  const VideoArea = (
    <div
      className="relative w-full shrink-0 md:flex-1 md:min-h-0 rounded-2xl md:rounded-3xl overflow-hidden border border-slate-200 dark:border-white/10 bg-black shadow-lg dark:shadow-[0_0_60px_rgba(139,92,246,0.12)] mx-0"
      style={{ aspectRatio: "16/9" }}
      /* On md+, flex-1 overrides the aspect-ratio via height:auto from flex */
    >
      {/* Animated glow border when active */}
      {isActive && (
        <div className="absolute inset-0 pointer-events-none z-20 rounded-2xl md:rounded-3xl"
          style={{ boxShadow: "inset 0 0 0 2px rgba(168,85,247,0.5), 0 0 40px rgba(168,85,247,0.2)" }} />
      )}

      {/* Raw video */}
      <video ref={videoRef} muted playsInline
        className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${isActive ? "opacity-0" : "opacity-100"}`}
        style={{ transform: "scaleX(-1)" }}
      />

      {/* Processed canvas */}
      <canvas ref={canvasRef} onClick={handleCanvasClick}
        className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${isActive ? "opacity-100" : "opacity-0"} ${pickMode ? "cursor-crosshair" : ""}`}
        style={{ transform: "scaleX(-1)" }}
      />

      {/* Idle placeholder */}
      {!isActive && !cameraError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-purple-100 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 flex items-center justify-center mb-3">
            <Eye className="w-8 h-8 md:w-10 md:h-10 text-purple-400/70 dark:text-purple-400/50" />
          </div>
          <p className="text-slate-500 dark:text-white/40 text-sm font-medium">Camera preview — magic inactive</p>
          {!cameraReady && <p className="text-slate-400 dark:text-white/20 text-xs mt-1 animate-pulse">Initialising camera…</p>}
        </div>
      )}

      {/* Countdown overlay */}
      {capturing && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-black/60 backdrop-blur-sm">
          <div className="relative flex items-center justify-center mb-4">
            <div className="absolute w-28 h-28 border-2 border-yellow-400/30 rounded-full animate-ping" />
            <span className="text-7xl font-black text-yellow-300 drop-shadow-[0_0_30px_rgba(234,179,8,0.8)]">{countdown || "📸"}</span>
          </div>
          <p className="text-white font-bold tracking-widest text-base md:text-lg">STEP AWAY FROM CAMERA</p>
        </div>
      )}

      {/* Pick mode hint */}
      {pickMode && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-black/70 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 flex items-center gap-2">
          <Crosshair className="w-4 h-4 text-fuchsia-400 animate-spin" />
          <span className="text-xs md:text-sm font-medium text-white">Click on your cloak</span>
        </div>
      )}

      {/* LIVE badge */}
      {isActive && (
        <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-full px-2.5 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          <span className="text-[10px] font-bold text-white">LIVE · {fps}fps</span>
        </div>
      )}

      {/* Recording badge */}
      {isRecording && (
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-red-600/80 backdrop-blur-md border border-red-400/40 rounded-full px-2.5 py-1 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
          <span className="text-[10px] font-bold text-white">REC</span>
        </div>
      )}

      {/* Scan line */}
      {isActive && (
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
          <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/30 to-transparent"
            style={{ animation: "scanLine 4s linear infinite" }} />
        </div>
      )}
    </div>
  );

  // ── Camera error banner ──────────────────────────────────────────────────
  const ErrorBanner = cameraError ? (
    <div className="shrink-0 mx-3 mt-3 rounded-2xl border border-red-300 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300 flex items-center gap-3">
      <span className="text-xl shrink-0">⚠️</span>
      <span><strong>Camera Error:</strong> {cameraError}. Allow camera access then reload.</span>
    </div>
  ) : null;

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-100 dark:bg-[#04010f] text-slate-900 dark:text-white transition-colors duration-300">

      {/* Ambient glows — dark mode only */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-0 dark:opacity-100 transition-opacity duration-500">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-purple-950/40 blur-[160px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-950/30 blur-[160px]" />
        <div className="absolute top-[30%] right-[20%] w-[30%] h-[30%] rounded-full bg-fuchsia-950/20 blur-[120px]" />
      </div>

      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <header className="relative z-10 shrink-0 flex items-center justify-between px-4 md:px-6 py-3 border-b border-slate-200 dark:border-white/5 bg-white/90 dark:bg-black/20 backdrop-blur-xl">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Wand2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm md:text-base font-bold leading-none">Invisibility Cloak</h1>
            <p className="text-[10px] md:text-[11px] text-slate-500 dark:text-purple-300/60 mt-0.5">Real-time CV</p>
          </div>
        </div>

        {/* Step badges — desktop only */}
        {StepBadges}

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {isActive && (
            <div className="hidden sm:flex items-center gap-1.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-full px-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              <span className="text-red-600 dark:text-red-300 text-xs font-bold">{fps} FPS</span>
            </div>
          )}

          {/* Theme toggle */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-9 h-9 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark"
                ? <Sun className="w-4 h-4 text-amber-400" />
                : <Moon className="w-4 h-4 text-purple-600" />}
            </button>
          )}
        </div>
      </header>

      {/* ── MAIN WORKSPACE ────────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-1 min-h-0 overflow-hidden">

        {/* ── LEFT: Video column (always visible) ─────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Error */}
          {ErrorBanner}

          {/* Video — shrink-0 on mobile (aspect-ratio drives height), flex-1 fill on desktop */}
          <div className="shrink-0 md:flex-1 md:min-h-0 p-3 pb-0 overflow-hidden">
            {/* aspect-video on mobile resets to aspect-auto+h-full on desktop */}
            <div className="relative w-full aspect-video md:aspect-auto md:h-full overflow-hidden rounded-2xl md:rounded-3xl border border-slate-200 dark:border-white/10 bg-black shadow-lg dark:shadow-[0_0_60px_rgba(139,92,246,0.12)]">

              {/* Glow border on active */}
              {isActive && (
                <div className="absolute inset-0 pointer-events-none z-20 rounded-2xl md:rounded-3xl"
                  style={{ boxShadow: "inset 0 0 0 2px rgba(168,85,247,0.5)" }} />
              )}

              <video ref={videoRef} muted playsInline
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isActive ? "opacity-0" : "opacity-100"}`}
                style={{ transform: "scaleX(-1)" }}
              />
              <canvas ref={canvasRef} onClick={handleCanvasClick}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isActive ? "opacity-100" : "opacity-0"} ${pickMode ? "cursor-crosshair" : ""}`}
                style={{ transform: "scaleX(-1)" }}
              />

              {!isActive && !cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                  <div className="w-14 h-14 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-purple-100 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 flex items-center justify-center mb-3">
                    <Eye className="w-7 h-7 md:w-10 md:h-10 text-purple-400/70 dark:text-purple-400/50" />
                  </div>
                  <p className="text-slate-500 dark:text-white/40 text-sm font-medium">Camera preview</p>
                  {!cameraReady && <p className="text-slate-400 dark:text-white/20 text-xs mt-1 animate-pulse">Initialising…</p>}
                </div>
              )}

              {capturing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-black/60 backdrop-blur-sm">
                  <div className="relative flex items-center justify-center mb-3">
                    <div className="absolute w-24 h-24 border-2 border-yellow-400/30 rounded-full animate-ping" />
                    <span className="text-6xl md:text-8xl font-black text-yellow-300">{countdown || "📸"}</span>
                  </div>
                  <p className="text-white font-bold tracking-widest text-sm md:text-lg">STEP AWAY FROM CAMERA</p>
                </div>
              )}

              {pickMode && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-black/70 backdrop-blur-md border border-white/20 rounded-full px-3 py-1.5 flex items-center gap-2">
                  <Crosshair className="w-3.5 h-3.5 text-fuchsia-400 animate-spin" />
                  <span className="text-xs font-medium text-white">Click on your cloak</span>
                </div>
              )}

              {isActive && (
                <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-full px-2 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                  <span className="text-[10px] font-bold text-white">LIVE · {fps}fps</span>
                </div>
              )}
              {isRecording && (
                <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5 bg-red-600/80 rounded-full px-2 py-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  <span className="text-[10px] font-bold text-white">REC</span>
                </div>
              )}
              {isActive && (
                <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
                  <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/30 to-transparent"
                    style={{ animation: "scanLine 4s linear infinite" }} />
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="shrink-0 grid grid-cols-3 gap-2 p-3">
            <button onClick={toggleMagic} disabled={!canStart}
              className={`relative h-11 md:h-14 rounded-xl md:rounded-2xl font-bold text-white text-xs md:text-sm transition-all flex items-center justify-center gap-1.5 md:gap-2 overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] ${
                isActive ? "bg-gradient-to-br from-red-500 to-red-700 shadow-[0_4px_16px_rgba(239,68,68,0.4)]"
                         : "bg-gradient-to-br from-purple-500 to-indigo-700 shadow-[0_4px_16px_rgba(139,92,246,0.4)]"}`}>
              <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity rounded-xl" />
              <Zap className={`w-4 h-4 ${isActive ? "animate-pulse" : ""}`} />
              {isActive ? "Stop" : "Activate"}
            </button>
            <button onClick={toggleRecording} disabled={!isActive}
              className={`relative h-11 md:h-14 rounded-xl md:rounded-2xl font-bold text-white text-xs md:text-sm transition-all flex items-center justify-center gap-1.5 md:gap-2 overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] ${
                isRecording ? "bg-gradient-to-br from-red-600 to-rose-800 animate-pulse"
                            : "bg-gradient-to-br from-pink-500 to-rose-700 shadow-[0_4px_16px_rgba(236,72,153,0.3)]"}`}>
              <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity rounded-xl" />
              {isRecording ? <Download className="w-4 h-4 animate-bounce" /> : <Video className="w-4 h-4" />}
              {isRecording ? "Save" : "Record"}
            </button>
            <button onClick={takeScreenshot} disabled={!isActive}
              className="relative h-11 md:h-14 rounded-xl md:rounded-2xl font-bold text-white text-xs md:text-sm bg-gradient-to-br from-emerald-500 to-teal-700 shadow-[0_4px_16px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-1.5 md:gap-2 overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]">
              <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity rounded-xl" />
              <ScanLine className="w-4 h-4" />
              Screenshot
            </button>
          </div>

          {/* ── MOBILE TABS — flex-1 fills remaining space below video+buttons ─── */}
          <div className="md:hidden flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="flex border-t border-b border-slate-200 dark:border-white/5 bg-white/80 dark:bg-black/20">
              {(["bg","color","settings"] as const).map((tab, i) => {
                const icons = [<Camera key="c" className="w-4 h-4" />, <Palette key="p" className="w-4 h-4" />, <Settings key="s" className="w-4 h-4" />];
                const labels = ["Background", "Color", "Settings"];
                return (
                  <button key={tab} onClick={() => setMobileTab(tab)}
                    className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition-all ${
                      mobileTab === tab
                        ? "text-purple-600 dark:text-purple-300 border-b-2 border-purple-500"
                        : "text-slate-400 dark:text-white/40 border-b-2 border-transparent hover:text-slate-600 dark:hover:text-white/60"
                    }`}>
                    {icons[i]}{labels[i]}
                  </button>
                );
              })}
            </div>

            {/* Mobile tab content */}
            <div className="overflow-y-auto flex-1 p-3">
              {mobileTab === "bg"       && BgSection}
              {mobileTab === "color"    && ColorSection}
              {mobileTab === "settings" && SettingsSection}
            </div>
          </div>
        </div>

        {/* ── RIGHT SIDEBAR — desktop only (hidden on mobile) ─────────────── */}
        <div className="hidden md:block w-64 lg:w-72 xl:w-80 shrink-0 overflow-y-auto overflow-x-hidden border-l border-slate-200 dark:border-white/5 bg-white/50 dark:bg-black/10 backdrop-blur-sm">
          <div className="p-3 space-y-3">

            {/* Background card */}
            <div className={card}>
              <div className={cardHeader}>
                <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white shrink-0">1</div>
                <div>
                  <div className="text-sm font-semibold">Set Background</div>
                  <div className={`text-xs ${mutedText}`}>What's behind the cloak</div>
                </div>
                {hasBackground && <span className="ml-auto text-xs text-emerald-600 dark:text-emerald-400 font-bold">✓ Done</span>}
              </div>
              <div className="p-4">{BgSection}</div>
            </div>

            {/* Color card */}
            <div className={card}>
              <div className={cardHeader}>
                <div className="w-7 h-7 rounded-full bg-pink-500 flex items-center justify-center text-xs font-bold text-white shrink-0">2</div>
                <div>
                  <div className="text-sm font-semibold">Cloak Color</div>
                  <div className={`text-xs ${mutedText}`}>Pick your cloth's color</div>
                </div>
              </div>
              <div className="p-4">{ColorSection}</div>
            </div>

            {/* Settings card */}
            <div className={card}>
              <button onClick={() => setShowSettings(v => !v)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center shrink-0">
                  <Settings className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold">Advanced Tuning</div>
                  <div className={`text-xs ${mutedText}`}>Fine-tune detection</div>
                </div>
                {showSettings ? <ChevronUp className="ml-auto w-4 h-4 text-slate-400 dark:text-white/30" /> : <ChevronDown className="ml-auto w-4 h-4 text-slate-400 dark:text-white/30" />}
              </button>
              {showSettings && <div className="p-4 pt-2 border-t border-slate-100 dark:border-white/5">{SettingsSection}</div>}
            </div>

            {/* Tips */}
            {TipsCard}
          </div>
        </div>
      </div>

      {/* Hidden bg canvas */}
      <canvas ref={bgCanvasRef} className="hidden" />

      <style>{`
        @keyframes scanLine { 0% { top:-2px; } 100% { top:100%; } }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(139,92,246,0.3); border-radius:4px; }
        /* On md+, override aspect-ratio so video fills the flex-1 parent */
        @media (min-width:768px) {
          .video-wrapper { aspect-ratio:unset !important; height:100%; }
        }
      `}</style>
    </div>
  );
}
