# Surf forecast app server

App that allows users to select a surf spot from the world map or search for it,
and add a public or secret surf spot to the DB. I scraped existing surf websites for the surf spots info
and I used a 3rd party API for the forecast data that is processed in NodeJS, and then I used ChartJS to visualize it. 

## Technology used

This app is written in NodeJs and Express, and I decided to use mongoDB as a database.
I used [StormglassAPI](https://stormglass.io) as a weather API then I simply get the data from the different sources, 
I calculate the average and I serve it through my API.

## Features

- Users can signup 
- Users can add surfspot, deciding if is public or secret
- Users can remove single or multiple surfspot
- Users can modify their own surfspots
- Users save a surfspot

## Installation

In the project directory, you can run:

### `npm dev`

Runs the server in the development mode.<br />

The server will reload if you make edits.<br />
You will also see any lint errors in the console.

### `npm test`

Launches the test runner.<br />

### `npm start`

Runs the compiled version of the app.<br />
