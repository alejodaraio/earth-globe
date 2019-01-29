//
// Configuration
//

// ms to wait after dragging before auto-rotating
// scale of the globe (not the canvas element)
const scaleFactor = 0.9;
// autorotation speed
const degPerSec = 20;
// start angles
const angles = {x: -10, y: 0, z: 0};
// colors
const colorWater = '#fff';
const colorLand = '#C0C1C1';
const colorGraticule = '#ccc';
const colorMarker = '#066594';

//
// Variables
//
let canvas = d3.select('#globe');
const context = canvas.node().getContext('2d');
const water = {type: 'Sphere'};
const projection = d3.geoOrthographic().precision(0.1);
const graticule = d3.geoGraticule10();
const path = d3.geoPath(projection).context(context);
let lastTime = d3.now();
const degPerMs = degPerSec / 1000;
let width, height;
let land, countries;
let autorotate, now, diff;

//
// Functions
//
function setAngles() {
  let rotation = projection.rotate();
  rotation[0] = angles.y;
  rotation[1] = angles.x;
  rotation[2] = angles.z;
  projection.rotate(rotation)
}

function scale() {
  width = document.documentElement.clientWidth;
  height = document.documentElement.clientHeight;
  canvas.attr('width', width).attr('height', height);
  projection
      .scale((scaleFactor * Math.min(width, height)) / 2)
      .translate([width / 2, height / 2])
  render()
}

function render() {
  context.clearRect(0, 0, width, height);
  fill(water, colorWater);
  stroke(graticule, colorGraticule);
  fill(land, colorLand);

  Object.values(markers).map((marker) => {
    const point = {
      type: "Point",
      coordinates: [marker.longitude, marker.latitude]
    };
    fill(point, colorMarker);
  });
}

function fill(obj, color) {
  context.beginPath();
  path(obj);
  context.fillStyle = color;
  context.fill()
}

function stroke(obj, color) {
  context.beginPath();
  path(obj);
  context.strokeStyle = color;
  context.stroke()
}

function rotate(elapsed) {
  now = d3.now();
  diff = now - lastTime;
  if (diff < elapsed) {
    let rotation = projection.rotate();
    rotation[0] += diff * degPerMs;
    projection.rotate(rotation);
    render()
  }
  lastTime = now
}

function loadWorld(cb) {
  d3.json('https://unpkg.com/world-atlas@1/world/110m.json', function (error, world) {
    if (error) {
      throw error
    }
    cb(world);
  })
}

//
// Initialization
//
setAngles();


loadWorld(function (world) {
  land = topojson.feature(world, world.objects.land);
  countries = topojson.feature(world, world.objects.countries);
  window.addEventListener('resize', scale);
  scale();
  autorotate = d3.timer(rotate)
});