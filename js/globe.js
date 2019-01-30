//
// Configuration
//

class EarthGlobe3D {

  constructor(settings = {}) {

    // Overridable settings.
    this.scaleFactor = settings.scaleFactor || 0.9;
    this.degPerSec = settings.degPerSec || 20; // Rotation Speed
    this.markers = settings.markers || []; // Markers list
    this.canvas = d3.select(settings.container || '#globe'); // Canvas container

    // Colors
    this.colorWater = settings.colorWater || '#fff';
    this.colorLand = settings.colorLand || '#C0C1C1';
    this.colorGraticule = settings.colorGraticule || '#ccc';
    this.colorMarker = settings.colorMarker || '#066594';

    this.angles = {x: -10, y: 0, z: 0};
    this.context = this.canvas.node().getContext('2d');
    this.water = {type: 'Sphere'};
    this.projection = d3.geoOrthographic().precision(0.1);
    this.graticule = d3.geoGraticule10();
    this.path = d3.geoPath(this.projection).context(this.context);
    this.lastTime = Date.now();
    this.degPerMs = this.degPerSec / 1000;
    this.width = 0;
    this.height = 0;
    this.land = null;
    this.countries = null;
    this.autorotate = null;
    this.now = null;
    this.diff = null;

    this.rotate = this.rotate.bind(this);
    this.scale = this.scale.bind(this);

    this.init();
  }

  init() {

    this.setAngles();

    this.loadWorld((world) => {
      this.land = topojson.feature(world, world.objects.land);
      this.countries = topojson.feature(world, world.objects.countries);
      window.addEventListener('resize', this.scale);
      this.scale();
      this.autorotate = d3.timer(this.rotate)
    });
  };

  setAngles() {
    let rotation = this.projection.rotate();
    rotation[0] = this.angles.y;
    rotation[1] = this.angles.x;
    rotation[2] = this.angles.z;
    this.projection.rotate(rotation)
  }

  scale() {
    this.width = document.documentElement.clientWidth;
    this.height = document.documentElement.clientHeight;
    this.canvas.attr('width', this.width).attr('height', this.height);
    this.projection
        .scale((this.scaleFactor * Math.min(this.width, this.height)) / 2)
        .translate([this.width / 2, this.height / 2]);
    this.render();
  }

  render() {
    this.context.clearRect(0, 0, this.width, this.height);
    this.fill(this.water, this.colorWater);
    this.stroke(this.graticule, this.colorGraticule);
    this.fill(this.land, this.colorLand);
    this.renderMarkers();
  }

  renderMarkers () {
    this.markers.map((marker) => {
      const point = {
        type: "Point",
        coordinates: [marker.latlng[1], marker.latlng[0]],
        name: marker.name
      };
      this.fill(point, this.colorMarker);
    });
  }

  fill(obj, color) {
    this.context.beginPath();
    this.path(obj);
    this.context.fillStyle = color;
    this.context.fill()
  }

  stroke (obj, color) {
    this.context.beginPath();
    this.path(obj);
    this.context.strokeStyle = color;
    this.context.stroke()
  }

  rotate(elapsed) {
    this.now = Date.now();
    this.diff = this.now - this.lastTime;
    if (this.diff < elapsed) {
      let rotation = this.projection.rotate();
      rotation[0] += this.diff * this.degPerMs;
      this.projection.rotate(rotation);
      this.render();
    }
    this.lastTime = this.now;
  };

  loadWorld(cb) {
    d3.json('https://unpkg.com/world-atlas@1/world/110m.json', function (error, world) {
      if (error) {
        throw error
      }
      cb(world);
    })
  }
}

new EarthGlobe3D({markers: markers});