// Enhanced Weather App JavaScript - Free APIs Only

// Configuration
const CONFIG = {
    // Replace with your OpenWeatherMap API key
    WEATHER_API_KEY: 'd7acb6a9e15d1fa39d97b98a048fa4e5',
    
    // OpenWeatherMap API endpoints (ALL FREE)
    CURRENT_WEATHER_URL: 'https://api.openweathermap.org/data/2.5/weather',
    FORECAST_URL: 'https://api.openweathermap.org/data/2.5/forecast', // 5-day forecast (FREE)
    GEOCODING_URL: 'https://api.openweathermap.org/geo/1.0/direct',
    ICON_URL: 'https://openweathermap.org/img/wn/',
    
    DEFAULT_CITY: 'London'
};

// DOM Elements
const elements = {
    // Input and search elements
    cityInput: document.getElementById('city-input'),
    searchBtn: document.getElementById('search-btn'),
    locationBtn: document.getElementById('location-btn'),
    autocompleteDropdown: document.getElementById('autocomplete-dropdown'),
    
    // State elements
    loading: document.getElementById('loading'),
    error: document.getElementById('error'),
    weatherContent: document.getElementById('weather-content'),
    retryBtn: document.getElementById('retry-btn'),
    errorMessage: document.getElementById('error-message'),
    
    // Unit toggle
    unitToggle: document.getElementById('unit-toggle'),
    celsiusLabel: document.getElementById('celsius-label'),
    fahrenheitLabel: document.getElementById('fahrenheit-label'),
    
    // Current weather elements
    city: document.getElementById('city'),
    currentDateTime: document.getElementById('current-date-time'),
    currentTemperature: document.getElementById('current-temperature'),
    currentWeatherIcon: document.getElementById('current-weather-icon'),
    currentDescription: document.getElementById('current-description'),
    feelsLike: document.getElementById('feels-like'),
    
    // Quick stats
    precipitation: document.getElementById('precipitation'),
    humidity: document.getElementById('humidity'),
    windSpeed: document.getElementById('wind-speed'),
    
    // Detail elements
    pressure: document.getElementById('pressure'),
    visibility: document.getElementById('visibility'),
    uvIndex: document.getElementById('uv-index'),
    sunrise: document.getElementById('sunrise'),
    sunset: document.getElementById('sunset'),
    tempRange: document.getElementById('temp-range'),
    
    // Forecast elements
    hourlyForecast: document.getElementById('hourly-forecast'),
    dailyForecast: document.getElementById('daily-forecast'),
    hourlyChart: document.getElementById('hourly-chart')
};

// Application State
let currentWeatherData = null;
let forecastData = null;
let isMetricUnits = true;
let autocompleteTimeout = null;
let hourlyChart = null;
let lastSearchedCity = null;
let currentCoords = null;

// Enhanced Weather App Class
class EnhancedWeatherApp {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateUnitLabels();
        this.testAPIKey(); // Test API key before loading default weather
    }

    // Test API key first
    async testAPIKey() {
        console.log('🧪 Testing API key...');
        
        try {
            const testUrl = `${CONFIG.CURRENT_WEATHER_URL}?q=London&appid=${CONFIG.WEATHER_API_KEY}&units=metric`;
            const response = await fetch(testUrl);
            const data = await response.json();
            
            if (response.ok) {
                console.log('✅ API key is working! Loading default weather...');
                this.loadDefaultWeather();
            } else {
                console.error('❌ API key test failed:', data);
                this.showAPIKeyError(data.message || 'API key validation failed');
            }
        } catch (error) {
            console.error('❌ Network error during API key test:', error);
            this.showError('Network error. Please check your connection.');
        }
    }

    showAPIKeyError(message) {
        elements.loading.style.display = 'none';
        elements.weatherContent.style.display = 'none';
        elements.error.style.display = 'block';
        elements.errorMessage.innerHTML = `
            <strong>⚠️ API Key Issue</strong><br><br>
            <strong>Error:</strong> ${message}<br><br>
            <strong>Quick Fix:</strong><br>
            1. Go to <a href="https://home.openweathermap.org/api_keys" target="_blank" style="color: #3b82f6;">OpenWeatherMap API Keys</a><br>
            2. Copy your API key<br>
            3. Replace it in script.js (line 6)<br>
            4. Wait 10-60 minutes for activation<br><br>
            <strong>Current API Key:</strong> ${CONFIG.WEATHER_API_KEY.substring(0, 8)}...
        `;
    }

    setupEventListeners() {
        // Search functionality
        elements.searchBtn?.addEventListener('click', () => this.handleSearch());
        elements.cityInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch();
        });

        // Autocomplete functionality (simplified - no external API needed)
        elements.cityInput?.addEventListener('input', (e) => this.handleAutocompleteInput(e));
        elements.cityInput?.addEventListener('focus', () => this.showAutocompleteIfNeeded());
        elements.cityInput?.addEventListener('blur', () => this.hideAutocompleteDelayed());

        // Location functionality
        elements.locationBtn?.addEventListener('click', () => this.getCurrentLocation());

        // Unit toggle
        elements.unitToggle?.addEventListener('change', () => this.toggleUnits());

        // Retry functionality
        elements.retryBtn?.addEventListener('click', () => this.retryLastSearch());

        // Click outside to close autocomplete
        document.addEventListener('click', (e) => this.handleDocumentClick(e));

        // Keyboard navigation for autocomplete
        elements.cityInput?.addEventListener('keydown', (e) => this.handleAutocompleteKeydown(e));
    }

    // Simplified autocomplete using OpenWeatherMap Geocoding API (FREE)
    async handleAutocompleteInput(e) {
        const query = e.target.value.trim();
        
        if (query.length < 2) {
            this.hideAutocomplete();
            return;
        }

        // Clear previous timeout
        if (autocompleteTimeout) {
            clearTimeout(autocompleteTimeout);
        }

        // Debounce the API call
        autocompleteTimeout = setTimeout(async () => {
            await this.fetchAutocompleteSuggestions(query);
        }, 300);
    }

    async fetchAutocompleteSuggestions(query) {
        try {
            // Using OpenWeatherMap Geocoding API (FREE - no additional API key needed)
            const url = `${CONFIG.GEOCODING_URL}?q=${encodeURIComponent(query)}&limit=5&appid=${CONFIG.WEATHER_API_KEY}`;
            
            const response = await fetch(url);
            const data = await response.json();

            if (response.ok && data.length > 0) {
                this.displayAutocompleteSuggestions(data);
            } else {
                this.hideAutocomplete();
            }
        } catch (error) {
            console.error('Autocomplete error:', error);
            this.hideAutocomplete();
        }
    }

    displayAutocompleteSuggestions(suggestions) {
        const dropdown = elements.autocompleteDropdown;
        if (!dropdown) return;

        dropdown.innerHTML = '';

        suggestions.forEach((suggestion, index) => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            item.dataset.index = index;
            
            const mainText = `${suggestion.name}${suggestion.state ? `, ${suggestion.state}` : ''}`;
            const subText = suggestion.country;
            
            item.innerHTML = `
                <div class="autocomplete-item-main">${mainText}</div>
                <div class="autocomplete-item-sub">${subText}</div>
            `;
            
            // Store coordinates for later use
            item.dataset.lat = suggestion.lat;
            item.dataset.lon = suggestion.lon;
            item.dataset.name = suggestion.name;
            item.dataset.country = suggestion.country;
            
            item.addEventListener('click', () => this.selectAutocompleteSuggestion(item));
            dropdown.appendChild(item);
        });

        this.showAutocomplete();
    }

    selectAutocompleteSuggestion(item) {
        const lat = parseFloat(item.dataset.lat);
        const lon = parseFloat(item.dataset.lon);
        const name = item.dataset.name;
        const country = item.dataset.country;
        
        elements.cityInput.value = `${name}, ${country}`;
        this.hideAutocomplete();
        
        // Store for later use
        currentCoords = { lat, lon };
        lastSearchedCity = `${name}, ${country}`;
        
        this.getWeatherByCoords(lat, lon);
    }

    showAutocomplete() {
        const dropdown = elements.autocompleteDropdown;
        if (dropdown && dropdown.children.length > 0) {
            dropdown.style.display = 'block';
        }
    }

    hideAutocomplete() {
        const dropdown = elements.autocompleteDropdown;
        if (dropdown) {
            dropdown.style.display = 'none';
        }
    }

    hideAutocompleteDelayed() {
        setTimeout(() => this.hideAutocomplete(), 150);
    }

    showAutocompleteIfNeeded() {
        const dropdown = elements.autocompleteDropdown;
        if (dropdown && dropdown.children.length > 0) {
            dropdown.style.display = 'block';
        }
    }

    handleDocumentClick(e) {
        if (!elements.cityInput?.contains(e.target) && !elements.autocompleteDropdown?.contains(e.target)) {
            this.hideAutocomplete();
        }
    }

    handleAutocompleteKeydown(e) {
        const dropdown = elements.autocompleteDropdown;
        if (!dropdown || dropdown.style.display === 'none') return;

        const items = dropdown.querySelectorAll('.autocomplete-item');
        let currentIndex = -1;
        
        // Find currently highlighted item
        items.forEach((item, index) => {
            if (item.classList.contains('highlighted')) {
                currentIndex = index;
            }
        });

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.highlightAutocompleteItem(items, Math.min(currentIndex + 1, items.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.highlightAutocompleteItem(items, Math.max(currentIndex - 1, 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (currentIndex >= 0 && items[currentIndex]) {
                    this.selectAutocompleteSuggestion(items[currentIndex]);
                }
                break;
            case 'Escape':
                this.hideAutocomplete();
                break;
        }
    }

    highlightAutocompleteItem(items, index) {
        items.forEach(item => item.classList.remove('highlighted'));
        if (items[index]) {
            items[index].classList.add('highlighted');
        }
    }

    // Search handling
    async handleSearch() {
        const city = elements.cityInput.value.trim();
        
        if (!city) {
            this.showError('Please enter a city name');
            return;
        }

        // If we have coordinates from autocomplete, use them
        if (currentCoords) {
            await this.getWeatherByCoords(currentCoords.lat, currentCoords.lon);
            currentCoords = null;
        } else {
            await this.getWeatherByCity(city);
        }
    }

    async getWeatherByCity(city) {
        this.showLoading();
        lastSearchedCity = city;

        try {
            // First, get coordinates for the city
            const geoUrl = `${CONFIG.GEOCODING_URL}?q=${encodeURIComponent(city)}&limit=1&appid=${CONFIG.WEATHER_API_KEY}`;
            const geoResponse = await fetch(geoUrl);
            const geoData = await geoResponse.json();

            if (!geoResponse.ok || geoData.length === 0) {
                throw new Error('City not found. Please check the spelling and try again.');
            }

            const { lat, lon } = geoData[0];
            await this.getWeatherByCoords(lat, lon);
            
        } catch (error) {
            console.error('Error fetching weather by city:', error);
            this.showError(error.message || 'Failed to fetch weather data');
        }
    }

    async getWeatherByCoords(lat, lon) {
        this.showLoading();

        try {
            const units = isMetricUnits ? 'metric' : 'imperial';
            
            // Fetch current weather and 5-day forecast (BOTH FREE)
            const [currentResponse, forecastResponse] = await Promise.all([
                fetch(`${CONFIG.CURRENT_WEATHER_URL}?lat=${lat}&lon=${lon}&appid=${CONFIG.WEATHER_API_KEY}&units=${units}`),
                fetch(`${CONFIG.FORECAST_URL}?lat=${lat}&lon=${lon}&appid=${CONFIG.WEATHER_API_KEY}&units=${units}`)
            ]);

            const [currentData, forecastDataResponse] = await Promise.all([
                currentResponse.json(),
                forecastResponse.json()
            ]);

            if (!currentResponse.ok) {
                if (currentResponse.status === 401) {
                    this.showAPIKeyError(currentData.message || 'Invalid API key');
                    return;
                }
                throw new Error(this.getErrorMessage(currentResponse.status, currentData.message));
            }

            if (!forecastResponse.ok) {
                throw new Error(this.getErrorMessage(forecastResponse.status, forecastDataResponse.message));
            }

            currentWeatherData = currentData;
            forecastData = forecastDataResponse;
            
            this.displayAllWeatherData(currentData, forecastDataResponse);
            this.updateBackground(currentData.weather[0].main.toLowerCase());
            
        } catch (error) {
            console.error('Error fetching weather data:', error);
            this.showError(error.message || 'Failed to fetch weather data');
        }
    }

    async getCurrentLocation() {
        this.showLoading();

        if (!navigator.geolocation) {
            this.showError('Geolocation is not supported by this browser');
            return;
        }

        try {
            const position = await this.getCurrentPosition();
            await this.getWeatherByCoords(position.coords.latitude, position.coords.longitude);
        } catch (error) {
            console.error('Geolocation error:', error);
            this.showError(this.getGeolocationErrorMessage(error.code));
        }
    }

    getCurrentPosition() {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000
            });
        });
    }

    // Display weather data (adapted for 5-day forecast API)
    displayAllWeatherData(currentData, forecastDataResponse) {
        try {
            this.displayCurrentWeather(currentData);
            this.displayQuickStats(currentData);
            this.displayWeatherDetails(currentData);
            this.displayHourlyForecast(forecastDataResponse.list);
            this.displayDailyForecast(forecastDataResponse.list);
            this.createHourlyChart(forecastDataResponse.list);

            // Clear input field
            if (elements.cityInput) elements.cityInput.value = '';

            this.showWeatherContent();
            
        } catch (error) {
            console.error('Error displaying weather data:', error);
            this.showError('Error displaying weather data');
        }
    }

    displayCurrentWeather(data) {
        // Update city name and date
        if (elements.city) {
            elements.city.textContent = `${data.name}, ${data.sys.country}`;
        }

        if (elements.currentDateTime) {
            elements.currentDateTime.textContent = this.formatCurrentDateTime();
        }

        // Update temperature
        if (elements.currentTemperature) {
            elements.currentTemperature.textContent = Math.round(data.main.temp);
        }
        
        // Update weather icon and description
        const iconCode = data.weather[0].icon;
        if (elements.currentWeatherIcon) {
            elements.currentWeatherIcon.src = `${CONFIG.ICON_URL}${iconCode}@4x.png`;
            elements.currentWeatherIcon.alt = data.weather[0].description;
        }
        
        if (elements.currentDescription) {
            elements.currentDescription.textContent = data.weather[0].description;
        }

        // Update feels like temperature
        const feelsLikeTemp = Math.round(data.main.feels_like);
        const tempUnit = isMetricUnits ? '°C' : '°F';
        if (elements.feelsLike) {
            elements.feelsLike.innerHTML = `Feels like <span>${feelsLikeTemp}${tempUnit}</span>`;
        }
    }

    displayQuickStats(currentData) {
        // Precipitation (estimate from humidity and clouds)
        const precipitation = currentData.rain?.['1h'] || currentData.snow?.['1h'] || 0;
        if (elements.precipitation) {
            elements.precipitation.textContent = precipitation > 0 ? `${Math.round(precipitation)}mm` : '0%';
        }

        // Humidity
        if (elements.humidity) elements.humidity.textContent = `${currentData.main.humidity}%`;
        
        // Wind speed
        const windSpeed = Math.round(currentData.wind?.speed || 0);
        const speedUnit = isMetricUnits ? 'km/h' : 'mph';
        if (elements.windSpeed) elements.windSpeed.textContent = `${windSpeed} ${speedUnit}`;
    }

    displayWeatherDetails(currentData) {
        const tempUnit = isMetricUnits ? '°C' : '°F';
        
        // Pressure
        if (elements.pressure) elements.pressure.textContent = currentData.main.pressure;
        
        // Visibility
        const visibilityKm = currentData.visibility ? Math.round(currentData.visibility / 1000) : 'N/A';
        if (elements.visibility) elements.visibility.textContent = visibilityKm;

        // UV Index (not available in current weather API - show placeholder)
        if (elements.uvIndex) {
            elements.uvIndex.textContent = '--';
        }

        // Sunrise and Sunset
        if (elements.sunrise && currentData.sys.sunrise) {
            elements.sunrise.textContent = this.formatTime(new Date(currentData.sys.sunrise * 1000));
        }
        
        if (elements.sunset && currentData.sys.sunset) {
            elements.sunset.textContent = this.formatTime(new Date(currentData.sys.sunset * 1000));
        }

        // Temperature range
        if (elements.tempRange) {
            const minTemp = Math.round(currentData.main.temp_min);
            const maxTemp = Math.round(currentData.main.temp_max);
            elements.tempRange.textContent = `${minTemp}° / ${maxTemp}°`;
        }
    }

    displayHourlyForecast(forecastList) {
        const container = elements.hourlyForecast;
        if (!container || !forecastList) return;

        container.innerHTML = '';
        
        // Show next 24 hours (take first 8 items - 3-hour intervals)
        const next24Hours = forecastList.slice(0, 8);
        
        next24Hours.forEach((item, index) => {
            const hourElement = document.createElement('div');
            hourElement.className = 'hourly-item';
            
            const time = index === 0 ? 'Now' : this.formatHourlyTime(new Date(item.dt * 1000));
            const temp = Math.round(item.main.temp);
            const iconCode = item.weather[0].icon;
            
            hourElement.innerHTML = `
                <div class="hourly-time">${time}</div>
                <div class="hourly-icon">
                    <img src="${CONFIG.ICON_URL}${iconCode}.png" alt="${item.weather[0].description}">
                </div>
                <div class="hourly-temp">${temp}°</div>
            `;
            
            container.appendChild(hourElement);
        });
    }

    displayDailyForecast(forecastList) {
        const container = elements.dailyForecast;
        if (!container || !forecastList) return;

        container.innerHTML = '';
        
        // Group by days and get daily min/max
        const dailyData = this.groupForecastByDays(forecastList);
        
        dailyData.slice(0, 5).forEach((day, index) => {
            const dayElement = document.createElement('div');
            dayElement.className = 'daily-item';
            
            const date = new Date(day.dt * 1000);
            const dayName = index === 0 ? 'Today' : this.formatDayName(date);
            const minTemp = Math.round(day.temp_min);
            const maxTemp = Math.round(day.temp_max);
            const iconCode = day.icon;
            const description = day.main;
            
            dayElement.innerHTML = `
                <div class="daily-day">${dayName}</div>
                <div class="daily-icon">
                    <img src="${CONFIG.ICON_URL}${iconCode}.png" alt="${day.description}">
                </div>
                <div class="daily-desc">${description}</div>
                <div class="daily-temps">
                    <span class="daily-temp-min">${minTemp}°</span>
                    <span class="daily-temp-max">${maxTemp}°</span>
                </div>
            `;
            
            container.appendChild(dayElement);
        });
    }

    groupForecastByDays(forecastList) {
        const days = {};
        
        forecastList.forEach(item => {
            const date = new Date(item.dt * 1000);
            const dayKey = date.toDateString();
            
            if (!days[dayKey]) {
                days[dayKey] = {
                    dt: item.dt,
                    temp_min: item.main.temp_min,
                    temp_max: item.main.temp_max,
                    main: item.weather[0].main,
                    description: item.weather[0].description,
                    icon: item.weather[0].icon
                };
            } else {
                days[dayKey].temp_min = Math.min(days[dayKey].temp_min, item.main.temp_min);
                days[dayKey].temp_max = Math.max(days[dayKey].temp_max, item.main.temp_max);
            }
        });
        
        return Object.values(days);
    }

    createHourlyChart(forecastList) {
        const canvas = elements.hourlyChart;
        if (!canvas || !forecastList) return;

        // Destroy existing chart
        if (hourlyChart) {
            hourlyChart.destroy();
        }

        const ctx = canvas.getContext('2d');
        const next12Hours = forecastList.slice(0, 8); // 8 items = 24 hours (3-hour intervals)
        
        const labels = next12Hours.map((item, index) => {
            if (index === 0) return 'Now';
            return this.formatHourlyTime(new Date(item.dt * 1000));
        });
        
        const temperatures = next12Hours.map(item => Math.round(item.main.temp));
        
        hourlyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    data: temperatures,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#3b82f6',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        display: false,
                        grid: {
                            display: false
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)',
                            font: {
                                size: 11
                            }
                        }
                    }
                },
                elements: {
                    point: {
                        hoverRadius: 8
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            },
            plugins: [{
                id: 'temperatureLabels',
                afterDatasetsDraw: function(chart) {
                    const ctx = chart.ctx;
                    ctx.save();
                    ctx.font = 'bold 12px Arial';
                    ctx.fillStyle = '#ffffff';
                    ctx.textAlign = 'center';
                    
                    chart.data.datasets.forEach((dataset, i) => {
                        const meta = chart.getDatasetMeta(i);
                        meta.data.forEach((element, index) => {
                            const value = dataset.data[index];
                            ctx.fillText(`${value}°`, element.x, element.y - 15);
                        });
                    });
                    ctx.restore();
                }
            }]
        });
    }

    // Unit toggle functionality
    toggleUnits() {
        isMetricUnits = !elements.unitToggle.checked;
        this.updateUnitLabels();
        
        if (currentWeatherData) {
            // Re-fetch data with new units
            if (currentWeatherData.coord) {
                this.getWeatherByCoords(currentWeatherData.coord.lat, currentWeatherData.coord.lon);
            }
        }
    }

    updateUnitLabels() {
        if (elements.celsiusLabel && elements.fahrenheitLabel) {
            elements.celsiusLabel.classList.toggle('active', isMetricUnits);
            elements.fahrenheitLabel.classList.toggle('active', !isMetricUnits);
        }
    }

    // Background theme updates
    updateBackground(weatherCondition) {
        const body = document.body;
        body.classList.remove('weather-clear', 'weather-clouds', 'weather-rain', 
                            'weather-thunderstorm', 'weather-snow', 'weather-mist');
        
        const weatherClasses = {
            'clear': 'weather-clear',
            'clouds': 'weather-clouds',
            'rain': 'weather-rain',
            'drizzle': 'weather-rain',
            'thunderstorm': 'weather-thunderstorm',
            'snow': 'weather-snow',
            'mist': 'weather-mist',
            'fog': 'weather-mist',
            'haze': 'weather-mist'
        };
        
        const weatherClass = weatherClasses[weatherCondition] || 'weather-clouds';
        body.classList.add(weatherClass);
    }

    // State management
    showLoading() {
        if (elements.loading) elements.loading.style.display = 'block';
        if (elements.error) elements.error.style.display = 'none';
        if (elements.weatherContent) elements.weatherContent.style.display = 'none';
    }

    showWeatherContent() {
        if (elements.loading) elements.loading.style.display = 'none';
        if (elements.error) elements.error.style.display = 'none';
        if (elements.weatherContent) elements.weatherContent.style.display = 'block';
    }

    showError(message) {
        if (elements.loading) elements.loading.style.display = 'none';
        if (elements.weatherContent) elements.weatherContent.style.display = 'none';
        if (elements.error) elements.error.style.display = 'block';
        if (elements.errorMessage) elements.errorMessage.textContent = message;
    }

    async retryLastSearch() {
        if (lastSearchedCity) {
            await this.getWeatherByCity(lastSearchedCity);
        } else {
            await this.loadDefaultWeather();
        }
    }

    async loadDefaultWeather() {
        await this.getWeatherByCity(CONFIG.DEFAULT_CITY);
    }

    // Utility functions
    formatCurrentDateTime() {
        const now = new Date();
        const options = {
            weekday: 'long',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        };
        return now.toLocaleDateString('en-US', options);
    }

    formatTime(date) {
        const options = {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        };
        return date.toLocaleTimeString('en-US', options);
    }

    formatHourlyTime(date) {
        const options = {
            hour: '2-digit',
            hour12: true
        };
        return date.toLocaleTimeString('en-US', options).replace(':00', '');
    }

    formatDayName(date) {
        const options = { weekday: 'short' };
        return date.toLocaleDateString('en-US', options);
    }

    getErrorMessage(statusCode, apiMessage) {
        const errorMessages = {
            400: 'Invalid request. Please check your input.',
            401: 'Invalid API key. Please check your API key configuration.',
            404: 'City not found. Please check the spelling and try again.',
            429: 'Too many requests. Please try again in a moment.',
            500: 'Server error. Please try again later.',
            502: 'Service temporarily unavailable.',
            503: 'Service temporarily unavailable.'
        };

        return errorMessages[statusCode] || apiMessage || 'An unexpected error occurred';
    }

    getGeolocationErrorMessage(errorCode) {
        const geoErrors = {
            1: 'Location access denied. Please allow location access and try again.',
            2: 'Location information unavailable. Please try searching by city name.',
            3: 'Location request timed out. Please try again.'
        };

        return geoErrors[errorCode] || 'Unable to get your location';
    }
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌤️ Enhanced Weather App Starting...');
    console.log('🔑 Using API Key:', CONFIG.WEATHER_API_KEY.substring(0, 8) + '...');
    
    // Initialize the weather app
    window.weatherApp = new EnhancedWeatherApp();
});

// Manual API Key Test Function
window.testAPIKey = async function() {
    console.log('🧪 Manual API Key Test...');
    try {
        const testUrl = `${CONFIG.CURRENT_WEATHER_URL}?q=London&appid=${CONFIG.WEATHER_API_KEY}&units=metric`;
        console.log('Test URL:', testUrl);
        
        const response = await fetch(testUrl);
        const data = await response.json();
        
        console.log('Response Status:', response.status);
        console.log('Response Data:', data);
        
        if (response.ok) {
            console.log('✅ API key is working!');
            alert('✅ API key is working! Weather data received successfully.');
            return true;
        } else {
            console.log('❌ API key failed:', data.message);
            alert(`❌ API key failed: ${data.message}`);
            return false;
        }
    } catch (error) {
        console.error('❌ Test failed:', error);
        alert(`❌ Network error: ${error.message}`);
        return false;
    }
};

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case 'k':
                e.preventDefault();
                elements.cityInput?.focus();
                break;
            case 'l':
                e.preventDefault();
                elements.locationBtn?.click();
                break;
        }
    }
});

// Export for testing purposes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EnhancedWeatherApp, CONFIG };
}