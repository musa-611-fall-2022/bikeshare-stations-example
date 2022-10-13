// Indego Bikeshare Availability Map
// =================================
// This module will create a map, and add data loaded from Indego's site. The
// following URL is from the Indego Bikeshare Data page under the Station Status
// header. https://www.rideindego.com/about/data/

const bikeshareURL = 'https://kiosks.bicycletransit.workers.dev/phl';



// Initializing the map
// --------------------

// Create the map and add a base tile layer.
let map = L.map('map', { zoomSnap: 0 }).setView([39, -75], 13);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

// Create a variable to represent the maximal number of bikes available at
// any station, so that we can scale the opacity of each station marker
// accordingly. Initialize it with a guess of 30 bikes.
let maxBikesAvailable = 30;

// Create a new layer of circle markers based on the downloaded data. It will
// get populated once we have downloaded data. Initialize with null (i.e., no
// data). Provide a style function that will style the markers according to the
// number of bikes available and the current zoom level.
let bikeshareLayer = L.geoJSON(null, {
  pointToLayer: (geoJsonPoint, latlng) => L.circleMarker(latlng),
  style: feature => ({
    stroke: 1,
    opacity: (map.getZoom() > 11) ? 1 : 0.5,
    color: '#000000',
    weight: 1,

    fillColor: '#0080e0',
    fillOpacity: feature.properties.bikesAvailable / maxBikesAvailable,

    radius: (map.getZoom() >= 16) ? 8 :
            (map.getZoom() <= 10) ? 2 :
                                    map.getZoom() - 8,
  }),
}).addTo(map);



// Updating the data on the map
// ----------------------------

// Create a function that we can call to download the bikeshare data.
function updateBikeshareData() {

  // Start an asynchronous call to download the data. Once the data is ready,
  // the browser will add the provided callback function to the task queue.
  fetch(bikeshareURL)
  .then(resp => resp.json())
  .then(data => {

    // Re-calculate the maximal number of bikes available at any station.
    const arrBikesAvailable = data.features.map(f => f.properties.bikesAvailable);
    maxBikesAvailable = Math.max(...arrBikesAvailable);

    // Remove the existing data from the bikeshareLayer.
    bikeshareLayer.clearLayers();

    // Add the newly downloaded data to the bikeshareLayer. When we do this,
    // Leaflet will create a new circle marker for each of the features in the
    // feature collection, and style that marker according to the
    // bikeshareLayer's style function.
    bikeshareLayer.addData(data);

    // Finally, now that we've updated the bikeshare layer, make sure it's
    // entirely visible in the map.
    map.flyToBounds(bikeshareLayer.getBounds());
  });
}



// Setting up asynchronous events
// ------------------------------

// When the map zooms, re-apply the layer's style function to each of the
// GeoJSON features. The resetStyle function on the GeoJSONLayer will take
// care of this: https://leafletjs.com/reference.html#geojson-resetstyle
map.addEventListener('zoomend', () => {
  bikeshareLayer.resetStyle();
});

// Update the map data every 60 seconds (60,000 milliseconds).
setInterval(() => {
  updateBikeshareData();
  console.log('Updated the map data.');
}, 60000);



// Kicking off the application
// ---------------------------

// Finally, when the module first loads, update the data.
updateBikeshareData();



// Make the map available on the window (for debugging).
Object.assign(window, { map });
