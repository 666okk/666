document.getElementById('searchBtn').addEventListener('click', fetchWeather);
document.getElementById('locationBtn').addEventListener('click', fetchWeatherByLocation);
document.getElementById('favoriteBtn').addEventListener('click', addToFavorites);
document.getElementById('unitSelect').addEventListener('change', changeTemperatureUnit);

let map = L.map('map').setView([60.1699, 24.9384], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

map.on('click', onMapClick);

let forecastChart; 
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let currentLat, currentLon, currentCityName;
let currentUnit = 'metric'; 

async function onMapClick(e) {
    const lat = e.latlng.lat;
    const lon = e.latlng.lng;
    await fetchWeatherByCoordinates(lat, lon);
}

async function fetchWeatherByCoordinates(lat, lon) {
    const apiKey = '6b9e14b19557bbcdabc7dfbef898977e';
    const geoUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`;
    const oneCallUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,alerts&appid=${apiKey}&units=${currentUnit === 'kelvin' ? 'metric' : currentUnit}`;
    const secondaryApiKey = 'e19db86f76214490b4e104011242010';
    const secondaryApiUrl = `https://api.weatherapi.com/v1/forecast.json?key=${secondaryApiKey}&q=${lat},${lon}&days=1`;
    const thirdaryApiKey = 'HHDSK3H3W6GT2TJT8TQKUSDEG';
    const weatherUrl = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${lat},${lon}?unitGroup=metric&key=${thirdaryApiKey}`;

    try {
        
        const geoResponse = await fetch(geoUrl);
        if (!geoResponse.ok) throw new Error('Error fetching location data from OpenWeatherMap');
        const geoData = await geoResponse.json();
        currentCityName = geoData.name || 'Selected Location';

        
        const weatherResponse = await fetch(weatherUrl);
        if (!weatherResponse.ok) throw new Error('Error fetching weather data from Visual Crossing');
        

       
        const oneCallResponse = await fetch(oneCallUrl);
        if (!oneCallResponse.ok) throw new Error('Error fetching forecast data from OpenWeatherMap');
        const oneCallData = await oneCallResponse.json();

        // Fetch data from WeatherAPI for comparison
        const secondaryResponse = await fetch(secondaryApiUrl);
        if (!secondaryResponse.ok) throw new Error('Error fetching forecast data from WeatherAPI');
        const secondaryData = await secondaryResponse.json();

        displayCurrentWeather(oneCallData.current);
        displayHourlyForecast(oneCallData);
        displayDailyForecast(oneCallData);
        updateForecastChart(oneCallData, secondaryData);

        currentLat = lat;
        currentLon = lon;
    } catch (error) {
        alert(error.message);
    }
}


function changeTemperatureUnit() {
    currentUnit = document.getElementById('unitSelect').value;
    if (currentLat && currentLon) {
        fetchWeatherByCoordinates(currentLat, currentLon);
    }
}


function convertTemperature(temp, unit) {
    if (unit === 'imperial') {
        return `${temp}°F`;
    } else if (unit === 'kelvin') {
        return `${(temp + 273.15).toFixed(2)} K`;
    } else {
        return `${temp}°C`;
    }
}



async function fetchWeather() {
    const city = document.getElementById('cityInput').value;
    const apiKey = '6b9e14b19557bbcdabc7dfbef898977e';
    const geocodeUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

    try {
        const geocodeResponse = await fetch(geocodeUrl);
        if (!geocodeResponse.ok) throw new Error('City not found');
        const geocodeData = await geocodeResponse.json();
        const lat = geocodeData.coord.lat;
        const lon = geocodeData.coord.lon;

        currentCityName = geocodeData.name || 'Selected Location';
        await fetchWeatherByCoordinates(lat, lon);
    } catch (error) {
        alert(error.message);
    }
}

async function fetchWeatherByLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            await fetchWeatherByCoordinates(lat, lon);
        }, () => {
            alert('Unable to retrieve your location');
        });
    } else {
        alert('Geolocation is not supported by your browser');
    }
}

function addToFavorites() {
    if (currentLat && currentLon) {
        const favorite = {
            name: currentCityName,
            lat: currentLat,
            lon: currentLon
        };
        favorites.push(favorite);
        localStorage.setItem('favorites', JSON.stringify(favorites));
        initializeFavorites();
    }
}

function removeFavorite(index) {
    favorites.splice(index, 1);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    initializeFavorites();
}

function initializeFavorites() {
    const favoritesList = document.getElementById('favoritesList');
    favoritesList.innerHTML = '';

    favorites.forEach((favorite, index) => {
        const listItem = document.createElement('li');
        listItem.textContent = favorite.name;

        const showBtn = document.createElement('button');
        showBtn.textContent = 'Show';
        showBtn.addEventListener('click', () => {
            fetchWeatherByCoordinates(favorite.lat, favorite.lon);
        });

        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Remove';
        removeBtn.addEventListener('click', () => {
            removeFavorite(index);
        });

        listItem.appendChild(showBtn);
        listItem.appendChild(removeBtn);
        favoritesList.appendChild(listItem);
    });
}


initializeFavorites();

function displayCurrentWeather(data) {
    const cityName = currentCityName;
    const temperature = convertTemperature(data.temp, currentUnit);
    const description = data.weather[0].description;
    const feelsLike = convertTemperature(data.feels_like, currentUnit);
    const humidity = data.humidity;
    const windSpeed = data.wind_speed;
    const iconCode = data.weather[0].icon;

    document.getElementById('cityName').textContent = cityName;
    document.getElementById('temperature').textContent = `Temperature: ${temperature}`;
    document.getElementById('description').textContent = `Description: ${description}`;
    document.getElementById('feelsLike').textContent = `Feels like: ${feelsLike}`;
    document.getElementById('humidity').textContent = `Humidity: ${humidity}%`;
    document.getElementById('windSpeed').textContent = `Wind Speed: ${windSpeed} m/s`;
    document.getElementById('weatherIcon').src = `http://openweathermap.org/img/wn/${iconCode}@2x.png`;

    setDynamicBackground(parseFloat(data.temp), description);
}



function displayHourlyForecast(data) {
    const forecastContainer = document.getElementById('hourlyForecastDetails');
    forecastContainer.innerHTML = '';

    data.hourly.slice(0, 24).forEach((forecast) => {
        const time = new Date(forecast.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const temperature = convertTemperature(forecast.temp, currentUnit);
        const iconCode = forecast.weather[0].icon;
        const description = forecast.weather[0].description;

        const forecastElement = document.createElement('div');
        forecastElement.classList.add('forecast-item');
        forecastElement.innerHTML = `
            <p>${time}</p>
            <img src="http://openweathermap.org/img/wn/${iconCode}@2x.png" alt="Icon">
            <p>${temperature}</p>
            <p>${description}</p>
        `;
        forecastContainer.appendChild(forecastElement);
    });
}


function displayDailyForecast(data) {
    const forecastContainer = document.getElementById('dailyForecastDetails');
    forecastContainer.innerHTML = '';

    data.daily.slice(1, 8).forEach((forecast) => {
        const date = new Date(forecast.dt * 1000).toLocaleDateString();
        const tempDay = convertTemperature(forecast.temp.day, currentUnit);
        const tempNight = convertTemperature(forecast.temp.night, currentUnit);
        const iconCode = forecast.weather[0].icon;
        const description = forecast.weather[0].description;

        const forecastElement = document.createElement('div');
        forecastElement.classList.add('forecast-item');
        forecastElement.innerHTML = `
            <p>${date}</p>
            <img src="http://openweathermap.org/img/wn/${iconCode}@2x.png" alt="Weather Icon">
            <p>Day: ${tempDay}</p>
            <p>Night: ${tempNight}</p>
            <p>${description}</p>
        `;
        forecastContainer.appendChild(forecastElement);
    });
}

function updateForecastChart(data1, data2) {
    const ctx = document.getElementById('forecastChart').getContext('2d');

    const temperatures1 = data1.hourly.slice(0, 24).map(forecast => forecast.temp);
    const times = data1.hourly.slice(0, 24).map(forecast => new Date(forecast.dt * 1000).toLocaleTimeString([], { hour: '2-digit' }));

    const temperatures2 = data2.forecast.forecastday[0].hour.map(forecast => forecast.temp_c).slice(0, 24);

    if (forecastChart) {
        forecastChart.destroy();
    }

    forecastChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: times,
            datasets: [
                {
                    label: 'OpenWeatherMap Temperature (°C)',
                    data: temperatures1,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    fill: false,
                    tension: 0.1
                },
                {
                    label: 'WeatherAPI Temperature (°C)',
                    data: temperatures2,
                    borderColor: 'rgba(255, 99, 132, 1)',
                    fill: false,
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    enabled: true
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Time'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Temperature (°C)'
                    }
                }
            }
        }
    });
}

function setDynamicBackground(temperature, description) {
    const body = document.body;
    const hour = new Date().getHours();
    let backgroundColor = '';

    if (temperature <= 10) {
        backgroundColor = 'linear-gradient(to bottom, #1e3c72, #2a5298)';
    } else if (temperature >= 30) {
        backgroundColor = 'linear-gradient(to bottom, #f12711, #f5af19)';
    } else {
        backgroundColor = 'linear-gradient(to bottom, #87ceeb, #ffffff)';
    }

    if (hour >= 18 || hour < 6) {
        backgroundColor = 'linear-gradient(to bottom, #2c3e50, #4ca1af)';
    }

    if (description.includes('rain')) {
        backgroundColor = 'linear-gradient(to bottom, #5f9ea0, #7f8c8d)';
    } else if (description.includes('snow')) {
        backgroundColor = 'linear-gradient(to bottom, #b3e5fc, #e1f5fe)';
    }

    body.style.background = backgroundColor;
}
