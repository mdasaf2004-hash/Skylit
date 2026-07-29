const API_BASE = '';

const apiModal = document.getElementById('apiModal');
const mainApp = document.getElementById('mainApp');
const apiKeyInput = document.getElementById('apiKeyInput');
const saveKeyBtn = document.getElementById('saveKeyBtn');
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const errorDiv = document.getElementById('error');
const errorMsg = document.getElementById('errorMsg');
const weatherContent = document.getElementById('weatherContent');
const scene = document.getElementById('scene');
const dialogMessage = document.getElementById('dialogMessage');
const dialogSpeaker = document.getElementById('dialogSpeaker');
const npcBust = document.getElementById('npcBust');
const starsContainer = document.getElementById('stars');

function createStars() {
    starsContainer.innerHTML = '';
    for (let i = 0; i < 60; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 60 + '%';
        star.style.animationDelay = Math.random() * 3 + 's';
        star.style.animationDuration = (1.5 + Math.random() * 2) + 's';
        starsContainer.appendChild(star);
    }
}

function getSceneClass(mood, temp) {
    const desc = mood.toLowerCase();
    if (desc.includes('snow') || desc.includes('freezing')) return 'scene-snowy';
    if (desc.includes('cold')) {
        if (temp <= -10) return 'scene-freezing';
        if (temp <= 0) return 'scene-cold';
        return 'scene-cool';
    }
    if (desc.includes('mild')) return 'scene-mild';
    if (desc.includes('nice')) return 'scene-nice';
    if (desc.includes('warm')) return 'scene-warm';
    if (desc.includes('hot') || desc.includes('extreme')) {
        if (temp > 38) return 'scene-extreme';
        if (temp > 35) return 'scene-hot';
        return 'scene-warm';
    }
    if (desc.includes('rain') || desc.includes('humid')) {
        if (desc.includes('humid') && !desc.includes('rain')) return 'scene-humid';
        return 'scene-rainy';
    }
    if (desc.includes('storm')) return 'scene-stormy';
    if (desc.includes('wind')) return 'scene-windy';
    if (desc.includes('fog') || desc.includes('mist') || desc.includes('haze')) return 'scene-foggy';
    if (desc.includes('dust') || desc.includes('sand')) return 'scene-dust';
    if (desc.includes('smoke') || desc.includes('pollution')) return 'scene-pollution';
    if (desc.includes('clear')) return 'scene-clear-night';
    if (desc.includes('cloud')) return 'scene-default';
    return 'scene-default';
}

function updateHPBar(temp) {
    const bar = document.getElementById('tempBar');
    const label = document.getElementById('tempLabel');
    let pct, color, display;

    if (temp <= 0) {
        pct = 10;
        color = '#4488ff';
        display = 'FROST';
    } else if (temp <= 10) {
        pct = 25;
        color = '#44cccc';
        display = 'CHILL';
    } else if (temp <= 18) {
        pct = 45;
        color = '#44cc44';
        display = 'COOL';
    } else if (temp <= 25) {
        pct = 65;
        color = '#88cc44';
        display = 'NICE';
    } else if (temp <= 32) {
        pct = 80;
        color = '#ccaa44';
        display = 'WARM';
    } else if (temp <= 38) {
        pct = 90;
        color = '#cc6644';
        display = 'HOT!';
    } else {
        pct = 100;
        color = '#cc2222';
        display = 'MELT';
    }

    bar.style.width = pct + '%';
    bar.style.background = color;
    bar.style.boxShadow = `0 0 8px ${color}66`;
    label.textContent = display;
}

function typeWriter(element, text, speed = 30) {
    return new Promise(resolve => {
        element.textContent = '';
        element.classList.add('typewriter');
        let i = 0;
        const interval = setInterval(() => {
            element.textContent += text[i];
            i++;
            if (i >= text.length) {
                clearInterval(interval);
                setTimeout(() => {
                    element.classList.remove('typewriter');
                    resolve();
                }, 1000);
            }
        }, speed);
    });
}

async function checkApiKey() {
    try {
        const res = await fetch(`${API_BASE}/api/has-key`);
        const data = await res.json();
        if (data.has_key) {
            showMainApp();
            loadWeather('London');
        } else {
            showApiModal();
        }
    } catch {
        showApiModal();
    }
}

function showApiModal() {
    apiModal.classList.remove('hidden');
    mainApp.classList.add('hidden');
}

function showMainApp() {
    apiModal.classList.add('hidden');
    mainApp.classList.remove('hidden');
}

saveKeyBtn.addEventListener('click', async () => {
    const key = apiKeyInput.value.trim();
    if (!key) {
        apiKeyInput.parentElement.style.borderColor = '#ff4444';
        return;
    }

    saveKeyBtn.textContent = 'LOADING...';
    saveKeyBtn.disabled = true;

    try {
        const res = await fetch(`${API_BASE}/api/set-key`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ api_key: key }),
        });

        if (res.ok) {
            showMainApp();
            loadWeather('London');
        } else {
            apiKeyInput.parentElement.style.borderColor = '#ff4444';
        }
    } catch {
        apiKeyInput.parentElement.style.borderColor = '#ff4444';
    } finally {
        saveKeyBtn.textContent = 'START QUEST';
        saveKeyBtn.disabled = false;
    }
});

searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) loadWeather(city);
});

cityInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) loadWeather(city);
    }
});

async function loadWeather(city) {
    hideError();
    weatherContent.classList.add('hidden');
    searchBtn.textContent = '...';
    searchBtn.disabled = true;

    try {
        const [weatherRes, forecastRes] = await Promise.all([
            fetch(`${API_BASE}/api/weather/${encodeURIComponent(city)}`),
            fetch(`${API_BASE}/api/forecast/${encodeURIComponent(city)}`),
        ]);

        if (!weatherRes.ok) {
            const err = await weatherRes.json();
            throw new Error(err.detail || 'Failed to fetch weather');
        }

        const weather = await weatherRes.json();
        const forecast = await forecastRes.json();

        const mood = weather.persona.mood;
        const sceneClass = getSceneClass(mood, weather.temp);
        scene.className = 'scene ' + sceneClass;

        updateHPBar(weather.temp);

        renderWeather(weather);
        renderForecast(forecast.forecast);
        weatherContent.classList.remove('hidden');

        await typeWriter(dialogMessage, weather.persona.message);
        dialogSpeaker.textContent = 'Bob';

        const npcBust = document.getElementById('npcBust');
        npcBust.classList.remove('npc-happy', 'npc-sad');
        if (weather.temp >= 10 && weather.temp <= 25) {
            npcBust.classList.add('npc-happy');
        } else {
            npcBust.classList.add('npc-sad');
        }
    } catch (err) {
        showError(err.message);
    } finally {
        searchBtn.textContent = 'GO!';
        searchBtn.disabled = false;
    }
}

function renderWeather(data) {
    document.getElementById('locationLabel').textContent = `${data.city}, ${data.country}`;
    document.getElementById('statTemp').textContent = `${Math.round(data.temp)}C`;
    document.getElementById('statFeels').textContent = `${Math.round(data.feels_like)}C`;
    document.getElementById('statWind').textContent = `${data.wind_speed}m/s`;
    document.getElementById('statHumid').textContent = `${data.humidity}%`;
    document.getElementById('statPress').textContent = `${data.pressure}hPa`;
    document.getElementById('statVis').textContent = `${data.visibility.toFixed(1)}km`;
}

function renderForecast(days) {
    const container = document.getElementById('forecast');
    container.innerHTML = days.map(day => {
        const date = new Date(day.date);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        return `
            <div class="forecast-card">
                <div class="forecast-day">${dayName}</div>
                <div class="forecast-date">${dateStr}</div>
                <img src="https://openweathermap.org/img/wn/${day.icon}@2x.png" alt="${day.description}">
                <div class="forecast-temps">
                    <span class="forecast-high">${Math.round(day.temp_max)}&deg;</span>
                    <span class="forecast-low">${Math.round(day.temp_min)}&deg;</span>
                </div>
                <div class="forecast-desc">${day.description}</div>
            </div>
        `;
    }).join('');
}

function showError(msg) {
    errorMsg.textContent = msg;
    errorDiv.classList.remove('hidden');
}

function hideError() {
    errorDiv.classList.add('hidden');
}

apiKeyInput.addEventListener('input', () => {
    apiKeyInput.parentElement.style.borderColor = '';
});

createStars();
checkApiKey();
