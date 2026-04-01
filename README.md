# SBK Estimator

Full electrical estimating app for Saybrook Electric, LLC.
Built with React + Vite + Tailwind. NEC 2023. iPad-optimized PWA.

## Job Types
- Whole House Rewire
- Service Upgrade / Panel
- EV Charger
- Generator & Transfer Switch
- Kitchen / Bath Remodel Circuits
- Ceiling Fan / Light Fixture
- Hot Tub / Pool
- Outdoor / Landscape
- Smoke & CO Detector Install
- Custom / Misc Job

## Features
- Assembly-based estimating with pre-built line items per job type
- Customer database with search
- Digital signature capture on iPad
- PDF quote export (summary or itemized) with logo
- Labor difficulty multipliers (wall type, access)
- Material + labor pricing with markup
- All data stored locally — no account, no internet required

## Setup

```bash
npm install
npm run dev
```

## Deploy to GitHub Pages

```bash
npm run build
cd dist
git init
git add .
git commit -m "build"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/sbk-estimator.git
git push -u origin main
```
Then enable Pages in repo Settings → Pages → Deploy from branch → main.

## iPad Home Screen
Open your GitHub Pages URL in Safari → Share → Add to Home Screen.
