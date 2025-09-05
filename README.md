# Enhanced Weather App

A modern, responsive, and feature-rich weather application that provides current weather conditions and a multi-day forecast for any city worldwide. This app is built using vanilla JavaScript, HTML, and CSS, leveraging the free OpenWeatherMap API.

---

## Features

* **Current Weather**: Displays real-time weather information including temperature, a weather icon, a description, and "feels like" temperature.
* **Detailed Metrics**: Provides additional weather details such as humidity, wind speed, pressure, and visibility.
* **5-Day Forecast**: Shows a detailed hourly and daily forecast for the upcoming days.
* **Search Functionality**: Allows users to search for weather by city name with a convenient autocomplete feature powered by the OpenWeatherMap Geocoding API.
* **Geolocation Support**: Enables fetching weather data for the user's current location with a single click.
* **Unit Toggle**: Easily switch between Celsius (°C) and Fahrenheit (°F) units.
* **Dynamic Backgrounds**: The application's background changes dynamically based on the current weather condition.
* **Hourly Temperature Chart**: Visualizes the upcoming temperature trend using a Chart.js graph.

---

## How to Use

1.  **Obtain an API Key**:
    * Go to the [OpenWeatherMap API keys page](https://home.openweathermap.org/api_keys) and sign up for a free account.
    * Copy your API key.

2.  **Configure the Application**:
    * Open the `js/script.js` file.
    * Find the line `WEATHER_API_KEY: 'd7acb6a9e15d1fa39d97b98a048fa4e5',`
    * Replace the placeholder key with your own API key.
    * Note: It may take 10-60 minutes for your new API key to become active.

3.  **Run the App**:
    * Simply open the `index.html` file in your web browser.
    * The app will automatically load the weather for the default city (London) or your current location if you grant permission.

---

## File Structure

* `index.html`: The main HTML file that provides the structure for the weather application.
* `css/style.css`: The stylesheet that controls the look and feel of the app, including the weather-based themes.
* `js/script.js`: The core JavaScript file that handles all the logic, API calls, and DOM manipulation.

---

## Technologies Used

* **HTML5**
* **CSS3**
* **JavaScript (ES6+)**
* **OpenWeatherMap API**: For all weather and geocoding data.
* **Chart.js**: For visualizing the hourly temperature data.
* **Font Awesome**: For icons.

---

## Attribution

This application is powered by weather data from the [OpenWeatherMap API](https://openweathermap.org/).
