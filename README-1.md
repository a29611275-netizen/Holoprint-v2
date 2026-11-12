# HoloPrint+

**Convert Minecraft Bedrock `.mcstructure` files into fully working `.mcpack` behavior packs that place real blocks.**

Inspired by [HoloPrint](https://holoprint-mc.github.io) (holograms). HoloPrint+ places **actual blocks** using the official Script API.

## Features

- Upload multiple `.mcstructure` files
- Rename / remove structures
- Customize pack name, description, icon, offsets (X/Y/Z), rotation
- Generates a valid Behavior Pack (`.mcpack`) containing:
  - `manifest.json` with Script module
  - Your structure files under `structures/holoprint/`
  - `scripts/main.js` – Armor Stand + Netherite Ingot interaction places the structure
- Pure client-side (HTML + CSS + JS + JSZip). No backend required.
- Mobile-friendly dark glassmorphism UI
- Ready for GitHub Pages

## How the in-game system works

1. Import the generated `.mcpack` into Minecraft Bedrock.
2. Create or open a world → enable the Behavior Pack.
3. **Enable the "Beta APIs" experiment** (required for Script API).
4. In Creative, place an **Armor Stand**.
5. Hold a **Netherite Ingot**.
6. Interact (right-click / long press) the Armor Stand.
7. The selected structure is placed as real blocks at the Armor Stand position + your configured offsets and rotation.

Uses `world.structureManager.place()` from `@minecraft/server`.

## Local usage

1. Clone or download this repo.
2. Open `index.html` in a modern browser (Chrome / Edge / Firefox / Safari).
   - Or serve with any static server:
     ```bash
     npx serve .
     # or
     python -m http.server 8080
     ```
3. Upload `.mcstructure` files → configure → Generate → Download `.mcpack`.

## Deploy to GitHub Pages

1. Create a new GitHub repository (e.g. `holoprint-plus`).
2. Upload all files from this project to the repo root (or a `docs/` folder).
3. Go to **Settings → Pages**.
4. Source: **Deploy from a branch**.
5. Branch: `main` (or `master`), folder: `/ (root)` or `/docs`.
6. Save. After a minute your site will be live at:
   `https://<your-username>.github.io/<repo-name>/`

### Quick git commands

```bash
git init
git add .
git commit -m "HoloPrint+ initial"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/holoprint-plus.git
git push -u origin main
```

Then enable Pages as described above.

## Project structure

```
holoprint-plus/
├── index.html          # Main SPA
├── css/
│   └── styles.css      # Dark glassmorphism theme
├── js/
│   ├── app.js          # UI logic, upload, navigation
│   ├── structures.js   # In-memory structure store
│   └── pack-generator.js # JSZip + manifest + script generation
├── assets/             # (optional icons)
└── README.md
```

## Requirements for the generated pack

| Requirement | Notes |
|-------------|-------|
| Minecraft Bedrock | 1.21+ recommended |
| Beta APIs experiment | Must be ON |
| Creative (for testing) | Or Survival with the items |

## Limitations

- Structure Block **Export** button is hidden on Android in recent versions. Workarounds: save structure to world and extract with tools, or use a PC/Windows.
- Very large structures may lag or fail (Minecraft internal limits ~64 blocks recommended).
- Beta APIs experiment disables achievements for that world.
- Only one primary structure is wired to the Armor Stand trigger (all uploaded structures are still included in the pack and can be loaded with `/structure load`).

## Credits

- Inspired by the original HoloPrint project.
- Uses [JSZip](https://stuk.github.io/jszip/).
- Minecraft Bedrock Script API (`@minecraft/server`).

## License

Free to use, modify and deploy. Do whatever you want with it.
