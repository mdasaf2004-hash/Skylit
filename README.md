# Skylit

A retro-themed weather app with personality. Built with Python (FastAPI) and vanilla HTML/CSS/JS.

**Live**: https://skylit-silk.vercel.app

## Features

- Real-time weather data from OpenWeatherMap API
- 5-day forecast
- 17 dynamic background themes based on weather conditions (freezing, rain, storm, aurora, sunset, etc.)
- NPC character "Bob" with snarky weather commentary
- Bob's expression changes (smiley/sad) based on whether it's good to go outside
- Typewriter text effect for dialog
- CRT scanline retro game aesthetic
- HP bar that maps temperature to game-style status levels
- Responsive design

## Tech Stack

- **Backend**: Python 3.12, FastAPI, httpx, uvicorn
- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Fonts**: Press Start 2P (pixel), VT323 (terminal)
- **API**: OpenWeatherMap (current weather + 5-day forecast)
- **Hosting**: Vercel (serverless)
- **Keep-Alive**: UptimeRobot

## Project Structure

```
weatherapp/
├── api/
│   └── index.py          # FastAPI serverless function (Vercel)
├── backend/
│   ├── main.py           # FastAPI app (local dev)
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── index.html            # Root copies for Vercel static serving
├── style.css
├── script.js
├── requirements.txt      # Vercel dependencies
└── vercel.json
```

## Local Development

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Open http://127.0.0.1:8000

## Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENWEATHER_API_KEY` | Your OpenWeatherMap API key |

## Deployment

```bash
# Push to GitHub
git add . && git commit -m "update" && git push

# Deploy to Vercel
vercel --prod
```

## How It Works

1. Page loads and immediately fetches London weather
2. Background changes based on temperature and conditions
3. Bob appears with a personality message about the weather
4. Bob smiles if it's 10-25C (good to go outside), frowns otherwise
5. Search any city to get updated weather and forecast
