# 🧙 Invisibility Cloak CV

> Real-time Harry Potter–style invisibility cloak effect powered by computer vision — right in your browser. No Python, no OpenCV, no server needed.

[![Next.js](https://img.shields.io/badge/Next.js-15.3-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## ✨ Live Demo

🔗 **[invisibility-cloak-cv.vercel.app](https://invisibility-cloak-cv.vercel.app)**

---

## 🎬 How It Works

1. **Capture background** — hold your cloak away from the frame and press *Capture Background*
2. **Wear your cloak** — hold any solid-coloured cloth in front of the camera
3. **Activate** — the cloak colour is masked and replaced with the captured background in real time
4. **Record or screenshot** — save your invisible moments

The effect runs entirely in a **Web Worker** (off the main thread) using HSV colour-space masking, morphological noise filtering, and temporal smoothing — no server round-trips.

---

## 🚀 Features

| Feature | Details |
|---|---|
| 🎨 **HSV colour detection** | Click any pixel on the video to auto-sample your cloak colour |
| 🌄 **Scenic background presets** | Deep Space, Cyberpunk City, Ocean Sunset, Mountain Forest |
| 🖼️ **Custom background** | Upload your own image as the background |
| ⚡ **Web Worker pipeline** | All CV processing runs off the main thread — UI stays buttery smooth |
| 🌓 **Dark / Light mode** | Persisted theme toggle using `next-themes` |
| 📱 **Fully responsive** | Desktop sidebar + mobile bottom tab navigation |
| 📹 **Recording** | Record the cloaked video and download as WebM |
| 📸 **Screenshot** | One-click screenshot of the current frame |
| 🔧 **Adjustable parameters** | Hue tolerance, saturation/value thresholds, noise removal, edge smoothing |

---

## 🛠️ Tech Stack

- **[Next.js 15](https://nextjs.org)** — App Router, React Server Components
- **[React 19](https://react.dev)** — Concurrent rendering
- **[TypeScript 5](https://www.typescriptlang.org)** — Type safety throughout
- **[Tailwind CSS v4](https://tailwindcss.com)** — Utility-first styling
- **[next-themes](https://github.com/pacocoursey/next-themes)** — Dark/light mode
- **[Lucide React](https://lucide.dev)** — Icon library
- **[Web Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)** — Off-thread computer vision
- **[MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)** — In-browser video recording

---

## 🖥️ Local Development

### Prerequisites

- Node.js 18+
- npm / pnpm / yarn

### Setup

```bash
# Clone the repo
git clone https://github.com/kira0-001/invisibility-cloak-cv.git
cd invisibility-cloak-cv

# Install dependencies
npm install --legacy-peer-deps

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> ⚠️ **Camera access required.** Allow camera permissions when the browser prompts.

---

## 🎮 Usage Guide

### Step 1 — Prepare your scene
- Set up your camera on a tripod or stable surface
- Make sure your background is clearly visible and evenly lit

### Step 2 — Capture the background
- Leave the cloak **out of frame**
- Click **"Capture Background"** (or use a preset from the Background tab)

### Step 3 — Pick your cloak colour
- Hold your cloak in front of the camera
- Click **"Pick from Video"** then click on the cloak colour on the live feed
- Or use the colour swatches for common colours (red, blue, green, yellow)

### Step 4 — Activate the effect
- Click **"Activate"** — the cloak becomes invisible! 🧙‍♂️
- Fine-tune with the **Settings** sliders if needed

### Step 5 — Record or Screenshot
- **Record** — starts a video recording; click again to save the WebM file
- **Screenshot** — instantly downloads the current frame as a PNG

---

## 📁 Project Structure

```
invisibility-cloak-cv/
├── app/
│   ├── layout.tsx        # Root layout with ThemeProvider & viewport config
│   ├── page.tsx          # Main UI — camera, controls, mobile tabs
│   ├── providers.tsx     # next-themes ThemeProvider wrapper
│   ├── worker.ts         # Web Worker: HSV masking + morphological filtering
│   └── globals.css       # Global styles & Tailwind base
├── public/               # Static assets
└── package.json
```

---

## 🔧 CV Algorithm (Worker Pipeline)

```
Raw camera frame (ImageData)
        │
        ▼
  Convert RGB → HSV
        │
        ▼
  Threshold mask (hue ± tolerance, saturation/value min)
        │
        ▼
  Morphological open (erosion → dilation) — removes noise
        │
        ▼
  Morphological close (dilation → erosion) — fills holes
        │
        ▼
  Temporal smoothing (blend with previous 3 frames)
        │
        ▼
  Composite: mask pixels → background, rest → camera
        │
        ▼
  Output frame rendered to canvas
```

---

## 📱 Responsive Breakpoints

| Breakpoint | Layout |
|---|---|
| `< 768px` (mobile) | Stacked: 16:9 video → action buttons → tab bar (Background / Color / Settings) |
| `≥ 768px` (desktop) | Side-by-side: video panel (flex-fill) + settings sidebar |

---

## 🌐 Deployment

This project is deployed on **Vercel**. Any push to `main` triggers an automatic rebuild.

To deploy your own fork:
1. Fork this repository
2. Go to [vercel.com/new](https://vercel.com/new) and import your fork
3. All settings are auto-detected for Next.js — click **Deploy**

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first.

---

## 📄 License

MIT © [kira0-001](https://github.com/kira0-001)

---

<p align="center">Built with ❤️ and computer vision magic 🧙‍♂️</p>
