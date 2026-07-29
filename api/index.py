from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import os
import random

app = FastAPI(title="Skylit API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

API_KEY = os.getenv("OPENWEATHER_API_KEY", "")


class ApiKeyUpdate(BaseModel):
    api_key: str


def get_persona_message(temp: float, wind_speed: float, humidity: int, description: str) -> dict:
    desc_lower = description.lower()

    if temp <= -10:
        lines = [
            ("BRRR! You live on HOTH?! Stay inside, dummy!", "freezing"),
            ("It's colder than a freezer in there. Why do you even go outside?", "freezing"),
            ("NEGATIVE TEMPS? Are you a penguin? Stay home!", "freezing"),
            ("The weather outside is FRIGHTFUL. And you're delightful. But stay home.", "freezing"),
            ("I'm literally freezing just reading this data. You ok?", "freezing"),
        ]
    elif temp <= 0:
        lines = [
            ("Bring a jacket. Bring TWO jackets. You'll need 'em, trust me.", "cold"),
            ("It's freezing out there. Your breath will look cool tho.", "cold"),
            ("Sub-zero vibes. Time to become one with the blanket.", "cold"),
            ("Even my circuits are shivering. Wear layers, champ.", "cold"),
        ]
    elif temp <= 10:
        lines = [
            ("It's chilly! Grab a hoodie or something, don't be brave.", "cold"),
            ("Kinda cold. Perfect weather for a hot chocolate flex.", "cold"),
            (" Jacket weather! Or if you're tough, just vibes.", "cold"),
            ("It's giving... autumn energy. Stay cozy, bestie.", "cold"),
        ]
    elif temp <= 18:
        lines = [
            ("Mild! Not too hot, not too cold. Chef's kiss weather.", "mild"),
            ("This is what they call 'perfect weather.' Enjoy it.", "mild"),
            ("Crisp and clean. You could go for a walk and feel fancy.", "mild"),
            ("Aight this is nice. Go touch some grass.", "mild"),
        ]
    elif temp <= 25:
        lines = [
            ("Chef's kiss! T-shirt weather, baby!", "nice"),
            ("Perfect temp. Go outside, the sun misses you.", "nice"),
            ("This is peak weather. Don't waste it inside!", "nice"),
            ("Beautiful out! Even I'm jealous and I live in a server.", "nice"),
        ]
    elif temp <= 32:
        lines = [
            ("It's getting toasty! Stay hydrated, bestie.", "warm"),
            ("Warm vibes! Sunscreen is your best friend today.", "warm"),
            ("Getting hot out there! Drink water, not just vibes.", "warm"),
            ("It's a spicy one! Maybe skip the jog today.", "warm"),
        ]
    elif temp <= 38:
        lines = [
            ("HOT HOT HOT! This ain't a sauna but it sure feels like one.", "hot"),
            ("Bro it's cooking outside. Stay in AC if you can!", "hot"),
            ("Heatwave alert! Your fridge called, it wants you to visit.", "hot"),
            ("It's giving oven vibes out there. You are not a pizza.", "hot"),
        ]
    else:
        lines = [
            ("EXTREME HEAT! Are you living on the SUN?! Stay inside!", "extreme"),
            ("It's literally melting out there. I repeat: DO NOT GO OUT.", "extreme"),
            ("This temperature is illegal. Call the weather police.", "extreme"),
            ("Congratulations, you live in a volcano now.", "extreme"),
        ]

    msg, mood = random.choice(lines)

    if "rain" in desc_lower:
        rain_msgs = [
            ("Also it's raining. Bring an umbrella or accept your soggy fate.", "rainy"),
            ("Oh and it's raining. Nature's shower, I guess?", "rainy"),
            ("Rain alert! Your hair is gonna have a bad time.", "rainy"),
            ("It's pouring! Stay dry or become a duck.", "rainy"),
        ]
        rain_msg, rain_mood = random.choice(rain_msgs)
        msg = f"{msg} {rain_msg}"
        mood = rain_mood

    if "snow" in desc_lower:
        snow_msgs = [
            ("Also SNOW! Go build a snowman or something.", "snowy"),
            ("Snow too?! It's a winter wonderland out there!", "snowy"),
            ("Snowfall detected! Time for hot cocoa and chill.", "snowy"),
        ]
        snow_msg, snow_mood = random.choice(snow_msgs)
        msg = f"{msg} {snow_msg}"
        mood = snow_mood

    if "thunder" in desc_lower or "storm" in desc_lower:
        storm_msgs = [
            ("THUNDERSTORM?! Stay inside unless you want to be a lightning rod.", "stormy"),
            ("There's a storm! Hide your cables and your fears.", "stormy"),
        ]
        storm_msg, storm_mood = random.choice(storm_msgs)
        msg = f"{msg} {storm_msg}"
        mood = storm_mood

    if wind_speed > 20:
        wind_msgs = [
            ("Also the wind is INSANE. Hold onto your hat!", "windy"),
            ("Windy as heck out there. You'll fly away like a balloon.", "windy"),
        ]
        wind_msg, wind_mood = random.choice(wind_msgs)
        msg = f"{msg} {wind_msg}"
        mood = wind_mood

    if humidity > 80:
        humid_msgs = [
            ("And it's super humid. Your hair will have its own personality.", "humid"),
            ("Humidity is off the charts. It's a swamp out there.", "humid"),
        ]
        humid_msg, humid_mood = random.choice(humid_msgs)
        msg = f"{msg} {humid_msg}"
        mood = humid_mood

    return {"message": msg, "mood": mood}


@app.post("/api/set-key")
async def set_api_key(payload: ApiKeyUpdate):
    global API_KEY
    API_KEY = payload.api_key
    return {"status": "ok", "message": "API key updated"}


@app.get("/api/has-key")
async def has_key():
    return {"has_key": bool(API_KEY)}


@app.get("/api/weather/{city}")
async def get_weather(city: str):
    if not API_KEY:
        raise HTTPException(status_code=400, detail="API key not set. Use POST /api/set-key first.")

    url = "https://api.openweathermap.org/data/2.5/weather"
    params = {"q": city, "appid": API_KEY, "units": "metric"}

    async with httpx.AsyncClient() as client:
        resp = await client.get(url, params=params)

    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail="City not found or API error")

    data = resp.json()
    temp = data["main"]["temp"]
    wind_speed = data["wind"]["speed"]
    humidity = data["main"]["humidity"]
    description = data["weather"][0]["description"]

    persona = get_persona_message(temp, wind_speed, humidity, description)

    return {
        "city": data["name"],
        "country": data["sys"]["country"],
        "temp": temp,
        "feels_like": data["main"]["feels_like"],
        "humidity": humidity,
        "pressure": data["main"]["pressure"],
        "wind_speed": wind_speed,
        "description": description.title(),
        "icon": data["weather"][0]["icon"],
        "visibility": data.get("visibility", 0) / 1000,
        "temp_min": data["main"]["temp_min"],
        "temp_max": data["main"]["temp_max"],
        "persona": persona,
    }


@app.get("/api/forecast/{city}")
async def get_forecast(city: str):
    if not API_KEY:
        raise HTTPException(status_code=400, detail="API key not set.")

    url = "https://api.openweathermap.org/data/2.5/forecast"
    params = {"q": city, "appid": API_KEY, "units": "metric"}

    async with httpx.AsyncClient() as client:
        resp = await client.get(url, params=params)

    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail="City not found or API error")

    data = resp.json()

    daily = {}
    for item in data["list"]:
        day = item["dt_txt"].split(" ")[0]
        if day not in daily:
            daily[day] = {
                "date": day,
                "temps": [],
                "descriptions": [],
                "icons": [],
            }
        daily[day]["temps"].append(item["main"]["temp"])
        daily[day]["descriptions"].append(item["weather"][0]["description"])
        daily[day]["icons"].append(item["weather"][0]["icon"])

    forecast = []
    for day, info in list(daily.items())[:5]:
        forecast.append({
            "date": info["date"],
            "temp_min": round(min(info["temps"]), 1),
            "temp_max": round(max(info["temps"]), 1),
            "description": max(set(info["descriptions"]), key=info["descriptions"].count).title(),
            "icon": max(set(info["icons"]), key=info["icons"].count),
        })

    return {"forecast": forecast}
