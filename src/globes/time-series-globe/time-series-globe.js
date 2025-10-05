/**
 * Chlorophyll Globe - Specialized WebGL Globe for Ocean Data Visualization
 * Based on dat.globe by Google Data Arts Team
 * Enhanced for NASA Space Apps Challenge 2025 - Shark Habitat Prediction
 */

var DAT = DAT || {};

DAT.Globe = function(container, opts) {
  opts = opts || {};
  
  // Ocean-specific color function
  var colorFn = opts.colorFn || function(x) {
    var c = new THREE.Color();
    // Enhanced ocean color scheme for chlorophyll
    if (x < 0.1) {
      // Very low chlorophyll - deep ocean blue
      c.setHSL(0.67, 1.0, 0.15 + x * 2);
    } else if (x < 0.3) {
      // Low chlorophyll - blue to cyan
      c.setHSL(0.55, 1.0, 0.3 + x * 1.5);
    } else if (x < 0.7) {
      // Medium chlorophyll - cyan to green
      c.setHSL(0.4, 1.0, 0.4 + x * 0.8);
    } else {
      // High chlorophyll - green to yellow/orange
      c.setHSL(0.15 - x * 0.1, 1.0, 0.5 + x * 0.5);
    }
    return c;
  };
  
  var imgDir = opts.imgDir || './';
  var oceanMode = opts.oceanMode || false;

  // Enhanced shaders for ocean visualization
  var Shaders = {
    'earth' : {
      uniforms: {
        'texture': { type: 't', value: null }
      },
      vertexShader: [
        'varying vec3 vNormal;',
        'varying vec2 vUv;',
        'void main() {',
          'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
          'vNormal = normalize( normalMatrix * normal );',
          'vUv = uv;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform sampler2D texture;',
        'varying vec3 vNormal;',
        'varying vec2 vUv;',
        'void main() {',
          'vec3 diffuse = texture2D( texture, vUv ).xyz;',
          // Enhanced ocean atmosphere effect
          'float intensity = 1.05 - dot( vNormal, vec3( 0.0, 0.0, 1.0 ) );',
          'vec3 atmosphere = vec3( 0.3, 0.6, 1.0 ) * pow( intensity, 2.0 );',
          'gl_FragColor = vec4( diffuse + atmosphere, 1.0 );',
        '}'
      ].join('\n')
    },
    'atmosphere' : {
      uniforms: {},
      vertexShader: [
        'varying vec3 vNormal;',
        'void main() {',
          'vNormal = normalize( normalMatrix * normal );',
          'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
        '}'
      ].join('\n'),
      fragmentShader: [
        'varying vec3 vNormal;',
        'void main() {',
          'float intensity = pow( 0.8 - dot( vNormal, vec3( 0, 0, 1.0 ) ), 12.0 );',
          // Ocean-themed atmosphere
          'gl_FragColor = vec4( 0.2, 0.5, 1.0, 1.0 ) * intensity;',
        '}'
      ].join('\n')
    }
  };

  var camera, scene, renderer, w, h;
  var mesh, atmosphere, point;

  var overRenderer;

  var curZoomSpeed = 0;
  var zoomSpeed = 50;

  var mouse = { x: 0, y: 0 }, mouseOnDown = { x: 0, y: 0 };
  var rotation = { x: 0, y: 0 },
      target = { x: Math.PI*3/2, y: Math.PI / 6.0 },
      targetOnDown = { x: 0, y: 0 };

  var distance = 100000, distanceTarget = 100000;
  var padding = 40;
  var PI_HALF = Math.PI / 2;

  // Ocean-specific properties
  var dataPoints = [];
  var currentIntensityMultiplier = 1.0;
  var sharkZoneThreshold = 0.3; // Chlorophyll threshold for shark zones

  function init() {

    container.style.color = '#fff';
    container.style.font = '13px/20px Arial, sans-serif';

    var shader, uniforms, material;
    w = container.offsetWidth || window.innerWidth;
    h = container.offsetHeight || window.innerHeight;

    camera = new THREE.PerspectiveCamera(30, w / h, 1, 10000);
    camera.position.z = distance;

    scene = new THREE.Scene();

    // Enhanced geometry for better ocean representation
    var geometry = new THREE.SphereGeometry(200, 64, 32);

    shader = Shaders['earth'];
    uniforms = THREE.UniformsUtils.clone(shader.uniforms);

    // Load high-resolution ocean-focused Earth texture
    uniforms['texture'].value = THREE.ImageUtils.loadTexture('../../assets/globe/globe-sea-8k.jpg');

    material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: shader.vertexShader,
      fragmentShader: shader.fragmentShader
    });

    mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.y = Math.PI;
    scene.add(mesh);

    // Enhanced atmosphere for ocean visualization
    shader = Shaders['atmosphere'];
    uniforms = THREE.UniformsUtils.clone(shader.uniforms);

    material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: shader.vertexShader,
      fragmentShader: shader.fragmentShader,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true
    });

    mesh = new THREE.Mesh(geometry, material);
    mesh.scale.set( 1.1, 1.1, 1.1 );
    scene.add(mesh);

    // Create variable-height cubes for data points
    geometry = new THREE.CubeGeometry(1.0, 1.0, 1.0); // Base cube size
    geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, 0, 0.5)); // Offset so base sits on surface

    point = new THREE.Mesh(geometry);

    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(w, h);

    renderer.domElement.style.position = 'absolute';

    container.appendChild(renderer.domElement);

    container.addEventListener('mousedown', onMouseDown, false);

    container.addEventListener('mousewheel', onMouseWheel, false);

    document.addEventListener('keydown', onDocumentKeyDown, false);

    window.addEventListener('resize', onWindowResize, false);

    container.addEventListener( 'mouseover', function () {
      overRenderer = true;
    }, false );

    container.addEventListener( 'mouseout', function () {
      overRenderer = false;
    }, false );
  }

  // Enhanced addData function for chlorophyll data
  function addData(data, opts) {
    var lat, lng, size, color, i, step, colorFnWrapper;

    opts.animated = opts.animated || false;
    this.is_animated = opts.animated;
    opts.format = opts.format || 'magnitude';

    console.log('🌊 Processing chlorophyll data:', data.length / 3, 'points');

    if (opts.format === 'magnitude') {
      step = 3;
      colorFnWrapper = function(data, i) { 
        var magnitude = data[i + 2];
        // Enhanced magnitude processing for chlorophyll
        magnitude = Math.max(0, Math.min(1, magnitude * currentIntensityMultiplier));
        return colorFn(magnitude); 
      };
    } else if (opts.format === 'legend') {
      step = 4;
      colorFnWrapper = function(data, i) { return colorFn(data[i + 3]); };
    } else {
      throw('error: format not supported: '+opts.format);
    }

    if (opts.animated) {
      if (this._baseGeometry === undefined) {
        this._baseGeometry = new THREE.Geometry();
        for (i = 0; i < data.length; i += step) {
          lat = data[i];
          lng = data[i + 1];
          color = colorFnWrapper(data,i);
          size = data[i + 2];
          // For animated mode, keep original scaling for now
          size = Math.max(0.1, size * (window.heightMultiplier || 45));  // Dynamic height scaling
          addPoint(lat, lng, size, color, this._baseGeometry);
        }
      }
      if(this._morphTargetId === undefined) {
        this._morphTargetId = 0;
      } else {
        this._morphTargetId += 1;
      }
      opts.name = opts.name || 'morphTarget'+this._morphTargetId;
    }
    
    var subgeo = new THREE.Geometry();
    for (i = 0; i < data.length; i += step) {
      lat = data[i];
      lng = data[i + 1];
      color = colorFnWrapper(data,i);
      size = data[i + 2];
      
      // Variable height based on chlorophyll concentration
      // Scale the height based on the data value (0-1 range)
      var originalSize = size;
      size = Math.max(0.1, size * (window.heightMultiplier || 45));  // Dynamic height scaling
      
      // Debug logging for first few points
      if (i < 15) {
        console.log(`Point ${i/3}: Original=${originalSize.toFixed(4)}, Scaled=${size.toFixed(2)}`);
      }
      
      // Store data point for analysis
      dataPoints.push({
        lat: lat,
        lng: lng,
        magnitude: data[i + 2],
        size: size,
        color: color
      });
      
      addPoint(lat, lng, size, color, subgeo);
    }
    
    if (opts.animated) {
      this._baseGeometry.morphTargets.push({'name': opts.name, vertices: subgeo.vertices});
    } else {
      this._baseGeometry = subgeo;
    }

    console.log('✅ Added', dataPoints.length, 'chlorophyll data points');
  };

  function createPoints() {
    if (this._baseGeometry !== undefined) {
      if (this.is_animated === false) {
        this.points = new THREE.Mesh(this._baseGeometry, new THREE.MeshBasicMaterial({
              color: 0xffffff,
              vertexColors: THREE.FaceColors,
              morphTargets: false
            }));
      } else {
        if (this._baseGeometry.morphTargets.length < 8) {
          console.log('t l',this._baseGeometry.morphTargets.length);
          var padding = 8-this._baseGeometry.morphTargets.length;
          console.log('padding', padding);
          for(var i=0; i<=padding; i++) {
            console.log('padding',i);
            this._baseGeometry.morphTargets.push({'name': 'morphPadding'+i, vertices: this._baseGeometry.vertices});
          }
        }
        this.points = new THREE.Mesh(this._baseGeometry, new THREE.MeshBasicMaterial({
              color: 0xffffff,
              vertexColors: THREE.FaceColors,
              morphTargets: true
            }));
      }
      scene.add(this.points);
    }
  }

  // Enhanced addPoint function for better ocean visualization
  function addPoint(lat, lng, size, color, subgeo) {
    var phi = (90 - lat) * Math.PI / 180;
    var theta = (180 - lng) * Math.PI / 180;

    // Ensure minimum height and calculate proper surface positioning
    var scaledHeight = Math.max(size, 0.1);
    
    // Position at Earth's surface (radius 200) plus half the scaled height to ensure base is on surface
    var radius = 200 + (scaledHeight * 0.5);
    point.position.x = radius * Math.sin(phi) * Math.cos(theta);
    point.position.y = radius * Math.cos(phi);
    point.position.z = radius * Math.sin(phi) * Math.sin(theta);

    point.lookAt(mesh.position);

    point.scale.x = 1.0; // Width
    point.scale.y = 1.0; // Depth  
    point.scale.z = scaledHeight; // Height varies with concentration - Z is the height!
    point.updateMatrix();

    for (var i = 0; i < point.geometry.faces.length; i++) {
      point.geometry.faces[i].color = color;
    }
    if(point.matrixAutoUpdate){
      point.updateMatrix();
    }
    subgeo.merge(point.geometry, point.matrix);
  }

  // Update color intensity for heatmap
  function updateIntensity(multiplier) {
    currentIntensityMultiplier = multiplier;
    console.log('🎨 Color intensity updated:', multiplier);
    
    // Update colors based on intensity multiplier
    if (this.points && this.points.geometry && this.points.geometry.faces) {
      for (let i = 0; i < this.points.geometry.faces.length; i++) {
        const face = this.points.geometry.faces[i];
        const originalColor = face.color.clone();
        
        // Adjust color intensity
        face.color.r = Math.min(1, originalColor.r * multiplier);
        face.color.g = Math.min(1, originalColor.g * multiplier);
        face.color.b = Math.min(1, originalColor.b * multiplier);
      }
      this.points.geometry.colorsNeedUpdate = true;
    }
  }

  // New function to update color scheme
  function updateColorScheme(newColorFn) {
    colorFn = newColorFn;
    console.log('🎨 Color scheme updated');
    
    // Regenerate points with new colors
    if (this.points) {
      scene.remove(this.points);
      this._baseGeometry = undefined;
      dataPoints = [];
      
      // Re-add data with new colors
      // This would need to be called from the main application
    }
  }

  // Enhanced analysis functions for shark habitat prediction
  function getSharkZones() {
    return dataPoints.filter(point => point.magnitude > sharkZoneThreshold);
  }

  function getProductivityStats() {
    if (dataPoints.length === 0) return null;
    
    var magnitudes = dataPoints.map(p => p.magnitude);
    var sorted = magnitudes.sort((a, b) => a - b);
    
    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      median: sorted[Math.floor(sorted.length / 2)],
      mean: magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length,
      sharkZones: getSharkZones().length,
      totalPoints: dataPoints.length
    };
  }

  function animate() {
    requestAnimationFrame(animate);
    render();
  }

  function render() {
    zoom(curZoomSpeed);

    rotation.x += (target.x - rotation.x) * 0.1;
    rotation.y += (target.y - rotation.y) * 0.1;
    distance += (distanceTarget - distance) * 0.3;

    camera.position.x = distance * Math.sin(rotation.x) * Math.cos(rotation.y);
    camera.position.y = distance * Math.sin(rotation.y);
    camera.position.z = distance * Math.cos(rotation.x) * Math.cos(rotation.y);

    camera.lookAt(mesh.position);

    renderer.render(scene, camera);
  }

  function zoom(delta) {
    distanceTarget -= delta;
    distanceTarget = distanceTarget > 1000 ? 1000 : distanceTarget;
    distanceTarget = distanceTarget < 350 ? 350 : distanceTarget;
  }

  // Event handlers
  function onMouseDown(event) {
    event.preventDefault();

    container.addEventListener('mousemove', onMouseMove, false);
    container.addEventListener('mouseup', onMouseUp, false);
    container.addEventListener('mouseout', onMouseOut, false);

    mouseOnDown.x = - event.clientX;
    mouseOnDown.y = event.clientY;

    targetOnDown.x = target.x;
    targetOnDown.y = target.y;

    container.style.cursor = 'move';
  }

  function onMouseMove(event) {
    mouse.x = - event.clientX;
    mouse.y = event.clientY;

    var zoomDamp = distance/1000;

    target.x = targetOnDown.x + (mouse.x - mouseOnDown.x) * 0.005 * zoomDamp;
    target.y = targetOnDown.y + (mouse.y - mouseOnDown.y) * 0.005 * zoomDamp;

    target.y = target.y > PI_HALF ? PI_HALF : target.y;
    target.y = target.y < - PI_HALF ? - PI_HALF : target.y;
  }

  function onMouseUp(event) {
    container.removeEventListener('mousemove', onMouseMove, false);
    container.removeEventListener('mouseup', onMouseUp, false);
    container.removeEventListener('mouseout', onMouseOut, false);
    container.style.cursor = 'auto';
  }

  function onMouseOut(event) {
    container.removeEventListener('mousemove', onMouseMove, false);
    container.removeEventListener('mouseup', onMouseUp, false);
    container.removeEventListener('mouseout', onMouseOut, false);
  }

  function onMouseWheel(event) {
    event.preventDefault();
    if (overRenderer) {
      zoom(event.wheelDeltaY * 0.3);
    }
    return false;
  }

  function onDocumentKeyDown(event) {
    switch( event.keyCode ) {
      case 38:
        zoom(100);
        event.preventDefault();
        break;
      case 40:
        zoom(-100);
        event.preventDefault();
        break;
    }
  }

  function onWindowResize( event ) {
    camera.aspect = container.offsetWidth / container.offsetHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( container.offsetWidth, container.offsetHeight );
  }

  init();
  this.animate = animate;

  // Public API
  this.__defineGetter__('time', function() {
    return this._time || 0;
  });

  this.__defineSetter__('time', function(t) {
    var validMorphs = [];
    var morphDict = this.points.morphTargetDictionary;
    for(var k in morphDict) {
      if(k.indexOf('morphPadding') < 0) {
        validMorphs.push(morphDict[k]);
      }
    }
    validMorphs.sort();
    var l = validMorphs.length-1;
    var scaledt = t*l+1;
    var index = Math.floor(scaledt);
    for (i=0;i<validMorphs.length;i++) {
      this.points.morphTargetInfluences[validMorphs[i]] = 0;
    }
    var lastIndex = index - 1;
    var leftover = scaledt - index;
    if (lastIndex >= 0) {
      this.points.morphTargetInfluences[lastIndex] = 1 - leftover;
    }
    this.points.morphTargetInfluences[index] = leftover;
    this._time = t;
  });

  this.addData = addData;
  this.createPoints = createPoints;
  this.renderer = renderer;
  this.scene = scene;
  // Removed problematic update methods to prevent data disappearing
  this.getSharkZones = getSharkZones;
  this.getProductivityStats = getProductivityStats;
  this.rotation = rotation;

  return this;
};