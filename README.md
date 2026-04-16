# Mordor — The Depths of Dejenol

> A retro DOS-style dungeon crawler RPG built with Angular. Explore procedurally generated dungeons, fight monsters, manage your party, and delve ever deeper into the depths.

🎮 **[Live Demo → http://mdmordor.s3-website-us-east-1.amazonaws.com/](http://mdmordor.s3-website-us-east-1.amazonaws.com/)**

---

## Screenshots

### 🏰 Town of Dejenol
![Town](public/screenshots/town.png)

### ⚔️ Combat — Fighting a Kobold
![Combat Kobold](public/screenshots/combat-kobold.png)

### 💀 Combat — Three Skeletons (Round 1)
![Combat Skeletons](public/screenshots/combat-skeletons.png)

### ⚡ Combat — Round 2 with Combat Log
![Combat Round 2](public/screenshots/combat-round2.png)

### 🏆 Victory Screen with Loot
![Victory](public/screenshots/combat-victory2.png)

### 🏦 Dejenol Savings Bank
![Bank](public/screenshots/bank.png)

---

## Features

- **Procedurally generated dungeons** — Rooms, corridors, doors, traps, and chests on every floor
- **Turn-based combat** — Attack, defend, cast spells, or flee; enemies counter-attack each round
- **Party system** — Build and manage a guild of adventurers across multiple classes and races
- **Town of Dejenol** — Inn, Shop, Temple, Training Hall, Bank, and Library
- **Monster Library** — Look up lore and stats on creatures found in the upper floors
- **Minimap exploration** — Fog-of-war map that reveals as you explore
- **Keyboard-driven** — Full keyboard shortcuts across every screen
- **DOS aesthetic** — Green-on-black terminal UI inspired by the original Mordor (1995)

## Keyboard Shortcuts

| Screen | Key | Action |
|--------|-----|--------|
| Town | `I` | Inn |
| Town | `S` | Shop |
| Town | `T` | Temple |
| Town | `R` | Training Hall |
| Town | `B` | Bank |
| Town | `L` | Library |
| Town | `D` | Enter Dungeon |
| Dungeon | `WASD` / Arrows | Move |
| Dungeon | `>` or `.` | Descend stairs |
| Dungeon | `<` or `,` | Ascend stairs |
| Dungeon | `I` | Open Inventory |
| Combat | `A` | Attack |
| Combat | `D` | Defend |
| Combat | `F` | Flee |
| Combat | `S` | Spells |
| Anywhere | `Esc` | Back / Cancel |

---

## Getting Started

### Frontend (Angular)

```bash
npm install
ng serve
```

Then open [http://localhost:4200](http://localhost:4200).

Free single-player mode works immediately — no backend required.

---

### Backend (Python / Django) — MMO Premium Features

The backend powers cloud saves, real-time overworld, global chat, trading, and leaderboards for premium subscribers.

**Requirements:** Python 3.11+, pip

**1. Install dependencies**

```bash
cd backend
pip install -r requirements.txt
```

**2. Configure environment**

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

| Variable | Description |
|----------|-------------|
| `SECRET_KEY` | Django secret key (any random string for dev) |
| `DEBUG` | `True` for local dev |
| `DATABASE_URL` | Postgres URL — omit to use SQLite |
| `STRIPE_SECRET_KEY` | From your Stripe dashboard |
| `STRIPE_WEBHOOK_SECRET` | From `stripe listen` CLI (see below) |
| `STRIPE_PRICE_ID` | Your monthly subscription price ID |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:4200` |

**3. Apply migrations**

```bash
python manage.py migrate
```

**4. Create an admin user (optional)**

```bash
python manage.py createsuperuser
```

**5. Run the dev server**

For HTTP only (no WebSockets):
```bash
python manage.py runserver
```

For full WebSocket support (chat + real-time overworld), use Daphne:
```bash
daphne mordor_backend.asgi:application
```

API is available at **http://localhost:8000/api/**  
Admin panel at **http://localhost:8000/admin/**

**6. Test Stripe webhooks locally (optional)**

```bash
stripe listen --forward-to localhost:8000/api/accounts/stripe/webhook/
```

Copy the webhook signing secret printed by `stripe listen` into `STRIPE_WEBHOOK_SECRET` in your `.env`.

---

## Build

```bash
ng build
```

Output goes to `dist/mordor/`.

