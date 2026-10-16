# 🧙 Invisibility Cloak CV

> **Real-time Harry Potter–style invisibility effect powered entirely by the browser — no backend, no server, zero installs.**

[![Live Demo](https://img.shields.io/badge/Live_Demo-Visit_App-8b5cf6?style=for-the-badge&logo=vercel)](https://invisibility-cloak-cv.vercel.app)
[![Tech Stack](https://img.shields.io/badge/Stack-Next.js_15_+_TypeScript-000?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-brightgreen?style=for-the-badge)](LICENSE)

---

## ✨ What it does

Hold up a **colored cloth** (red, green, blue, etc.) in front of your webcam — and watch yourself disappear into the background, just like Harry Potter's invisibility cloak!

Everything runs **100% in the browser** at 30+ FPS:
- No server uploads
- No OpenCV Python needed
- No GPU required
- Works on any modern laptop or desktop

---

## 🎬 How to use

| Step | Action |
|------|--------|
| **1** | Allow camera access in your browser |
| **2** | Set your background — click **Capture Empty Room** (step away for 3 seconds) OR choose a scenic preset (Deep Space 🌌, Cyberpunk 🌆, Sunset 🌅, Ocean 🌊) OR upload your own image |
| **3** | Pick your cloak color — use one of the 6 preset colors or click anywhere on the live video to sample the exact hue |
| **4** | Click **Start Magic** and wave your cloth — you're invisible! |
| **5** | Hit **📸 Screenshot** or **🎬 Record** to capture and share your magic |

---

## 🚀 Features

| Feature | Details |
|---|---|
| **Real-time Color Detection** | HSV color space, circular hue math, mode-aware detection (color / white / black) |
| **Temporal EMA Smoothing** | Eliminates flickering by blending mask across frames using exponential moving average |
| **Morphological Noise Removal** | Binary erosion + dilation cleans speckles and fills holes in the mask |
| **Web Worker Offload** | All pixel processing runs in a dedicated background thread — UI stays buttery smooth |
| **4 Scenic Background Presets** | Deep Space, Cyberpunk City, Sunset Mountains, Deep Ocean — drawn in-browser, zero loading |
| **Custom Background Upload** | Upload any image as your background (green screen mode!) |
| **Screenshot & Video Recording** | Save magic moments as PNG or WebM video using the Canvas + MediaRecorder API |
| **Debug Mask View** | Toggle mask overlay to see exactly what pixels are being detected |
| **FPS Counter** | Live frame-rate display |
| **Advanced Tuning** | Sliders for Hue Tolerance, Shade Coverage, Morphology iterations, Temporal Smoothing |

---

## 🛠️ Tech Stack

| Technology | Role |
|---|---|
| **Next.js 15** | React framework with App Router |
| **TypeScript** | Full type safety |
| **Canvas API** | Real-time pixel manipulation at the frame level |
| **Web Workers API** | Off-main-thread processing to prevent UI freezes |
| **MediaRecorder API** | Browser-native video capture from canvas stream |
| **Tailwind CSS v4** | Utility-first dark purple glassmorphism UI |
| **Radix UI + shadcn/ui** | Accessible, unstyled UI component primitives |
| **Lucide React** | Icon set |

---

## 🧠 How the Algorithm Works

```
Webcam Frame
     │
     ▼
[1] Convert each pixel RGB → HSV color space
     │
     ▼
[2] Build binary mask: pixel IN range? (hue distance, saturation, value)
     │  → Handles white/black cloth differently (special mode)
     │
     ▼
[3] Morphological Opening (erosion × N → dilation × N)
     │  → Removes salt-and-pepper noise speckles
     │
     ▼
[4] Temporal EMA Smoothing
     │  → prevMask × (1 − α) + curMask × α
     │  → Adaptive α based on mask coverage
     │
     ▼
[5] Composite: where mask=1, show background pixel; else show live pixel
     │
     ▼
Output Canvas (displayed at 30+ FPS)
```

The key innovation is the **circular hue distance math** — rather than a naive `|hue_a - hue_b|` which breaks near 0°/360°, we use:
```
d = |a - b| % 360
hueDist = d > 180 ? 360 - d : d
```
This correctly detects red cloth across the 0°/360° boundary.

---

## 💻 Run Locally

```bash
# Clone the repository
git clone https://github.com/your-username/invisibility-cloak-cv.git
cd invisibility-cloak-cv

# Install dependencies
npm install

# Start the development server
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

> **Note:** Camera access requires `localhost` or an `https://` origin. It won't work over `http://` on a non-local host.

---

## 📂 Project Structure

```
invisibility-cloak/
├── app/
│   ├── page.tsx          # Main app — all UI + state management
│   ├── worker.ts         # Web Worker — pixel processing off main thread
│   ├── utils.ts          # HSV math, range building, classify helpers
│   └── globals.css       # Global styles
├── components/ui/        # shadcn/ui components
└── public/               # Static assets
```

---

## 🧪 Tips for Best Results

- Use a **solid-colored cloth** (no patterns) — a t-shirt, scarf, or piece of fabric works great
- **Even lighting** on the cloth helps a lot — avoid shadows or bright spots
- Keep the camera **still** while capturing the background
- If you see speckles, increase **Morph Iterations** (1–2)
- If the cloth edges flicker, decrease **Temporal Smoothing** slightly
- If parts of the cloth are missed, increase **Shade Coverage** and **Hue Tolerance**

---

## 📸 Demo

> *(GIF of the live demo will be placed here)*

---

## 📄 License

MIT — feel free to use, modify, and share!

---

*Built with ❤️ using pure browser APIs — no backend, no Python, no OpenCV server needed.*
