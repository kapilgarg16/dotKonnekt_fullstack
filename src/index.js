require("dotenv").config();
const express = require('express');
const axios = require('axios');
const mysql = require('mysql');
const app = express();
const current_query = 'SELECT * FROM APIMapperTbl WHERE APIType = "current"';
const forecast_query = 'SELECT * FROM APIMapperTbl WHERE APIType = "forecast"';

app.use(express.static(__dirname + '/public'));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
}
);

//port
const port = 8886;

//create connection for SQL server
let connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'kapil@123',
  database: 'weatherapi'
});

//connect with Mysql server
connection.connect(function (err) {
  if (err) throw err;
  console.log("Database is Connected!");
});

//currentWeather function, mapping with data base values
function currentWeather(city, cb) {
  //fetching row from database for CURRENT weather
  connection.query(current_query, function (error, results, fields) {
    if (error)
      throw error;
    const currentAPI = results[0].APIUrl;
    const currentMapper = JSON.parse(results[0].APIMapper);
    const APIKey = results[0].APIKey;
    const currentUrl = `${currentAPI}?key=${APIKey}&q=${city}&aqi=no`;
    cb(currentMapper, currentUrl);
  });
}

//foreCast weather function, mapping with data base values
function forecastWeather(city, cb) {
  //fetching row from database for Forecast weather
  connection.query(forecast_query, function (error, results, fields) {
    if (error)
      throw error;
    const forecastAPI = results[0].APIUrl;
    const forecastMapper = JSON.parse(results[0].APIMapper);
    const APIKey = results[0].APIKey;
    const forecastUrl = `${forecastAPI}?key=${APIKey}&q=${city}&days=1&aqi=no&alerts=no`;
    cb(forecastMapper, forecastUrl);
  });
}

//body
app.get('/weather', async (req, res) => {

  const { type, city } = req.query;

  let mappedData = {};

  if (type === 'current') {
    currentWeather(city, async (currentMapper, currentUrl) => {
      const response = await axios.get(currentUrl);
      const data = response.data;
      Object.keys(currentMapper).forEach((key) => {
        mappedData[currentMapper[key]] = data['location'][key];
      });
      res.send(mappedData);
    });

  } else if (type === 'forecast') {
    forecastWeather(city, async (forecastMapper, forecastUrl) => {
      const response = await axios.get(forecastUrl);
      const data = response.data;
      Object.keys(forecastMapper).forEach((key) => {
        mappedData[forecastMapper[key]] = data['forecast']['forecastday'][0]['astro'][key];
      });
      res.send(mappedData);
    });
  } else {
    return res.status(400).send({ error: 'Invalid type. Only current or forecast is allowed.' });
  }

});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
