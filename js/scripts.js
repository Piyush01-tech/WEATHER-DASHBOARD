const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const BACKEND_URL = isLocal
  ? 'http://localhost:5000/api'
  : 'https://weather-dashboard-2r5w.onrender.com/api';
let units = localStorage.getItem('weatherUnits') || 'metric';
let currentQuery = '';
let weatherHistory = JSON.parse(localStorage.getItem('weatherHistory')) || [];

const popularCities = [
  { name: 'London', country: 'GB' },
  { name: 'New York', country: 'US' },
  { name: 'Tokyo', country: 'JP' },
  { name: 'Paris', country: 'FR' },
  { name: 'Sydney', country: 'AU' },
  { name: 'Berlin', country: 'DE' },
  { name: 'Toronto', country: 'CA' },
  { name: 'Mumbai', country: 'IN' },
  { name: 'Delhi', country: 'IN' },
  { name: 'Bangalore', country: 'IN' },
  { name: 'Chennai', country: 'IN' },
  { name: 'Kolkata', country: 'IN' },
  { name: 'Hyderabad', country: 'IN' },
  { name: 'Pune', country: 'IN' },
  { name: 'Singapore', country: 'SG' },
  { name: 'Cape Town', country: 'ZA' },
  { name: 'Dubai', country: 'AE' }
];

const topCountries = [
  { code: 'IN', name: 'India' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'AU', name: 'Australia' },
  { code: 'BR', name: 'Brazil' },
  { code: 'CA', name: 'Canada' },
  { code: 'CN', name: 'China' },
  { code: 'DE', name: 'Germany' },
  { code: 'ES', name: 'Spain' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'JP', name: 'Japan' },
  { code: 'MX', name: 'Mexico' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'NP', name: 'Nepal' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'RU', name: 'Russia' },
  { code: 'SE', name: 'Sweden' },
  { code: 'SG', name: 'Singapore' },
  { code: 'ZA', name: 'South Africa' }
];

function pruneHistory() {
  const MAX = 8;
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  weatherHistory = weatherHistory.filter(h => h.ts > cutoff).slice(0, MAX);
  localStorage.setItem('weatherHistory', JSON.stringify(weatherHistory));
}
pruneHistory();

let loadingTimer = null;

function showLoading() {
  const el = document.getElementById('loading');
  if (el) el.style.display = 'flex';
  clearTimeout(loadingTimer);
  loadingTimer = setTimeout(hideLoading, 15000);
}

function hideLoading() {
  clearTimeout(loadingTimer);
  const el = document.getElementById('loading');
  if (el) el.style.display = 'none';
}

function updateUnitDisplay() {
  const btn = document.getElementById('unit_toggle');
  if (btn) btn.textContent = units === 'metric' ? '°C' : '°F';
}

function generateCityDropdown() {
  const sel = document.getElementById('city_select');
  if (!sel) return;
  popularCities.forEach(c => {
    const opt = document.createElement('option');
    opt.value = `${c.name},${c.country}`;
    opt.textContent = c.name;
    sel.appendChild(opt);
  });
}

function generateCountryDropdown() {
  const sel = document.getElementById('select_country');
  if (!sel) return;
  topCountries.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.code;
    opt.textContent = c.name;
    sel.appendChild(opt);
  });
}

function renderHistory() {
  const ul = document.getElementById('city_names');
  const section = document.getElementById('past_searches');
  if (!ul || !section) return;

  if (weatherHistory.length === 0) {
    section.style.display = 'none';
    return;
  }
  section.style.display = 'block';
  ul.innerHTML = '';
  weatherHistory.forEach(h => {
    const li = document.createElement('li');
    li.classList.add('past_city');
    li.dataset.query = h.query;
    li.textContent = h.label || h.query;
    ul.appendChild(li);
  });
}

function updateHistory(query, city, country) {
  const label = `${city}, ${country}`;
  weatherHistory = weatherHistory.filter(h => h.query !== query);
  weatherHistory.unshift({ query, label, ts: Date.now() });
  weatherHistory = weatherHistory.slice(0, 8);
  localStorage.setItem('weatherHistory', JSON.stringify(weatherHistory));
  renderHistory();
}

document.addEventListener('DOMContentLoaded', () => {
  generateCityDropdown();
  generateCountryDropdown();
  updateUnitDisplay();
  renderHistory();

  const form = document.querySelector('.search_div form');
  const citySelect = document.getElementById('city_select');
  const cityInput = document.getElementById('city_input');
  const countrySelect = document.getElementById('select_country');
  const pastSearches = document.getElementById('city_names');

  citySelect.addEventListener('change', () => {
    const val = citySelect.value;
    if (!val) return;
    const [name, code] = val.split(',');
    cityInput.value = name;
    countrySelect.value = code;
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const city = cityInput.value.trim();
    const country = countrySelect.value;
    if (!city) { alert('Please enter a city name'); return; }

    const query = country ? `${city},${country}` : city;
    showLoading();
    await fetchWeather(query);
  });

  document.addEventListener('click', async (e) => {
    if (e.target.id === 'unit_toggle') {
      units = units === 'metric' ? 'imperial' : 'metric';
      localStorage.setItem('weatherUnits', units);
      updateUnitDisplay();
      if (currentQuery) {
        showLoading();
        await fetchWeather(currentQuery);
      }
    }
  });

  if (pastSearches) {
    pastSearches.addEventListener('click', async (e) => {
      const li = e.target.closest('.past_city');
      if (!li) return;
      const query = li.dataset.query;
      showLoading();
      currentQuery = query;
      await fetchWeather(query);
    });
  }
});

async function fetchWeather(query) {
  try {
    const res = await fetch(`${BACKEND_URL}/weather?city=${encodeURIComponent(query)}&units=${units}`);
    const data = await res.json();
    if (data.success) {
      displayCurrentWeather(data.data);
      updateHistory(query, data.data.city, data.data.country);
      currentQuery = query;
      await fetchForecast(query);
    } else {
      hideLoading();
      alert(data.message || 'Weather data not available');
    }
  } catch (err) {
    hideLoading();
    console.error('Weather fetch error:', err);
    alert('Cannot reach backend.\nMake sure it is running:\n  cd backend && npm run dev');
  }
}

async function fetchForecast(query) {
  try {
    const res = await fetch(`${BACKEND_URL}/forecast?city=${encodeURIComponent(query)}&units=${units}`);
    const data = await res.json();
    if (data.success) {
      displayForecast(data.data);
    }
  } catch (err) {
    console.error('Forecast fetch error:', err);
  } finally {
    hideLoading();
  }
}

function displayCurrentWeather(data) {
  const placeholder = document.getElementById('placeholder');
  const details = document.getElementById('city_details');
  if (placeholder) placeholder.style.display = 'none';
  if (details) details.style.display = 'block';

  const cityNameEl = document.getElementById('city_name');
  const tempEl = document.querySelector('.temp');
  const tempUnitEl = document.querySelector('.temp-unit');
  const humidityEl = document.querySelector('.humidity');
  const windEl = document.querySelector('.wind');
  const feelsLikeEl = document.querySelector('.feels-like');
  const currentIconEl = document.querySelector('.current_icon');

  const tUnit = units === 'metric' ? '°C' : '°F';
  const wUnit = units === 'metric' ? 'km/h' : 'mph';

  if (cityNameEl) cityNameEl.textContent = `${data.city}, ${data.country}`;
  if (tempEl) tempEl.textContent = data.temp;
  if (tempUnitEl) tempUnitEl.textContent = tUnit;
  if (humidityEl) humidityEl.textContent = data.humidity + '%';
  if (windEl) windEl.textContent = data.wind_speed + ' ' + wUnit;
  if (feelsLikeEl) feelsLikeEl.textContent = (data.feels_like || '--') + tUnit;

  if (currentIconEl && data.icon) {
    currentIconEl.innerHTML = `<img src="https://openweathermap.org/img/wn/${data.icon}@4x.png" alt="${data.description}">`;
  }

  if (details) {
    details.style.animation = 'none';
    details.offsetHeight;
    details.style.animation = 'slideUp 0.5s var(--ease) forwards';
  }
}

function displayForecast(forecastList) {
  const container = document.getElementById('five_day_weather');
  if (!container) return;

  container.style.display = 'block';
  container.innerHTML = '<h2>5-Day Forecast</h2>';

  const row = document.createElement('div');
  row.classList.add('forecast-cards-row');

  forecastList.forEach((item, i) => {
    const tUnit = units === 'metric' ? '°C' : '°F';
    const wUnit = units === 'metric' ? 'km/h' : 'mph';
    const card = document.createElement('div');
    card.classList.add('forecast-card');
    card.style.setProperty('--i', i);
    card.innerHTML = `
      <h4>${item.date}</h4>
      <img src="https://openweathermap.org/img/wn/${item.icon}@2x.png" alt="${item.description}">
      <p>${item.temp}${tUnit}</p>
      <p>💧 ${item.humidity}%</p>
      <p>💨 ${item.wind_speed} ${wUnit}</p>
    `;
    row.appendChild(card);
  });

  container.appendChild(row);
}
