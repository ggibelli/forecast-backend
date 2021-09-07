# Surf forecast app server

The app allows users to select a surf spot from the world map or look for it in the database, and add a public or secret surf spot to the DB. I scraped existing surf websites for the surf spots info, such best wind direction, best swell direction, dangers.. For the actual forecast I used a 3rd party API (https://stormglass.io), but first the data is processed on my server and served through a REST API, and then I used ChartJS to visualize it.

## Technology used

This app is written in NodeJs and Express, and I decided to use mongoDB as a database using Mongoose as an ODM. For the user authorization I used JWT token.
I used [StormglassAPI](https://stormglass.io) as a weather API, I get the data for 5 days and from several weather institutes around the world, and I make the average on the most important parameters for surfing, such as swell period, swell heights... and then I serve it through my API.
The app is tested using jest and supertest.

## Features

- Users can signup 
- Users can add surfspot, deciding if is public or secret
- Users can remove single or multiple surfspot
- Users can modify their own surfspots
- Users can save a surfspot

## Installation

In the project directory, you can run:

### `npm run dev`

Runs the server in the development mode.<br />

The server will reload if you make edits.<br />
You will also see any lint errors in the console.

### `npm test`

Launches the test runner.<br />

### `npm start`

Runs the compiled version of the app.<br />
