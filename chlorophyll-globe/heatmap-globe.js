/**
 * Heatmap Globe - Smooth texture-based WebGL Globe for Ocean Data Visualization
 * Based on dat.globe by Google Data Arts Team
 * Enhanced for NASA Space Apps Challenge 2025 - Smooth Heatmap Rendering
 */

var DAT = DAT || {};

DAT.HeatmapGlobe = function(container, opts) {
  opts = opts || {};
  
  var imgDir = opts.imgDir || './';
  
  // Heatmap-specific properties
  var heatmapResolution = 512; // Texture resolution
  var heatmapCanvas = null;
  var heatmapTexture = null;
  var heatmapMaterial = null;

  var camera, scene, renderer, w, h;
  var mesh, atmosphere;

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

  // Enhanced shaders for heatmap overlay
  var Shaders = {
    'earth' : {
      uniforms: {
        'baseTexture': { type: 't', value: null },
        'heatmapTexture': { type: 't', value: null },
        'heatmapOpacity': { type: 'f', value: 0.8 }
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
        'uniform sampler2D baseTexture;',
        'uniform sampler2D heatmapTexture;',
        'uniform float heatmapOpacity;',
        'varying vec3 vNormal;',
        'varying vec2 vUv;',
        'void main() {',
          // Sample base Earth texture
          'vec3 baseColor = texture2D( baseTexture, vUv ).xyz;',
          
          // Sample heatmap texture
          'vec4 heatmapColor = texture2D( heatmapTexture, vUv );',
          
          // Blend heatmap over base texture
          'vec3 blendedColor = mix( baseColor, heatmapColor.rgb, heatmapColor.a * heatmapOpacity );',
          
          // Apply atmospheric effect
          'float intensity = 1.05 - dot( vNormal, vec3( 0.0, 0.0, 1.0 ) );',
          'vec3 atmosphere = vec3( 0.3, 0.6, 1.0 ) * pow( intensity, 2.0 );',
          
          'gl_FragColor = vec4( blendedColor + atmosphere * 0.3, 1.0 );',
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
          'gl_FragColor = vec4( 0.2, 0.5, 1.0, 1.0 ) * intensity;',
        '}'
      ].join('\n')
    }
  };

  function init() {
    container.style.color = '#fff';
    container.style.font = '13px/20px Arial, sans-serif';

    var shader, uniforms, material;
    w = container.offsetWidth || window.innerWidth;
    h = container.offsetHeight || window.innerHeight;

    camera = new THREE.PerspectiveCamera(30, w / h, 1, 10000);
    camera.position.z = distance;

    scene = new THREE.Scene();

    // Create heatmap canvas and texture
    createHeatmapTexture();

    // Enhanced geometry for better ocean representation
    var geometry = new THREE.SphereGeometry(200, 64, 32);

    shader = Shaders['earth'];
    uniforms = THREE.UniformsUtils.clone(shader.uniforms);

    // Load high-resolution ocean-focused Earth texture
    uniforms['baseTexture'].value = THREE.ImageUtils.loadTexture('globe-sea-8k.jpg');
    uniforms['heatmapTexture'].value = heatmapTexture;

    heatmapMaterial = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: shader.vertexShader,
      fragmentShader: shader.fragmentShader
    });

    mesh = new THREE.Mesh(geometry, heatmapMaterial);
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

    var atmosphereMesh = new THREE.Mesh(geometry, material);
    atmosphereMesh.scale.set( 1.1, 1.1, 1.1 );
    scene.add(atmosphereMesh);

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

  function createHeatmapTexture() {
    // Create canvas for heatmap rendering
    heatmapCanvas = document.createElement('canvas');
    heatmapCanvas.width = heatmapResolution;
    heatmapCanvas.height = heatmapResolution / 2; // 2:1 aspect ratio for world map
    
    var ctx = heatmapCanvas.getContext('2d');
    
    // Initialize with transparent background
    ctx.clearRect(0, 0, heatmapCanvas.width, heatmapCanvas.height);
    
    // Create Three.js texture from canvas
    heatmapTexture = new THREE.Texture(heatmapCanvas);
    heatmapTexture.needsUpdate = true;
    
    console.log(`🎨 Created heatmap texture: ${heatmapCanvas.width}x${heatmapCanvas.height}`);
  }

  function updateHeatmap(rawData, period) {
    console.log(`🖼️ Updating heatmap for ${period.display_name}...`);
    
    var ctx = heatmapCanvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, heatmapCanvas.width, heatmapCanvas.height);
    
    // Convert point data to smooth heatmap
    renderSmoothHeatmap(ctx, rawData);
    
    // Update texture
    heatmapTexture.needsUpdate = true;
    
    console.log(`✅ Heatmap updated for ${period.display_name}`);
  }

  function renderSmoothHeatmap(ctx, rawData) {
    var points = [];
    
    // Parse raw data into points with enhanced filtering
    for (var i = 0; i < rawData.length; i += 3) {
      var lat = rawData[i];
      var lon = rawData[i + 1];
      var magnitude = rawData[i + 2];
      
      // Convert lat/lon to canvas coordinates
      var x = ((lon + 180) / 360) * heatmapCanvas.width;
      var y = ((90 - lat) / 180) * heatmapCanvas.height;
      
      var point = {
        x: x,
        y: y,
        magnitude: magnitude,
        lat: lat,
        lon: lon
      };
      
      // Only include points that pass ocean filtering
      if (magnitude > 0.01 && isOceanPoint(point)) {
        points.push(point);
      }
    }
    
    console.log(`🎯 Rendering ${points.length} ocean-only points to heatmap`);
    
    // Use smaller, more precise rendering to prevent land spillover
    var baseRadius = 2; // Much smaller base radius
    
    for (var i = 0; i < points.length; i++) {
      var point = points[i];
      
      // Adaptive radius based on magnitude and location
      var radius = baseRadius + (point.magnitude * 2);
      radius = Math.min(radius, 4); // Cap maximum radius
      
      // Create precise radial gradient
      var gradient = ctx.createRadialGradient(
        point.x, point.y, 0,
        point.x, point.y, radius
      );
      
      // Enhanced color scheme for better ocean visualization
      var color = getOceanHeatmapColor(point.magnitude);
      var alpha = Math.min(point.magnitude * 2, 0.9); // Higher contrast
      
      gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`);
      gradient.addColorStop(0.7, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * 0.3})`);
      gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
      
      // Draw the gradient with ocean-aware blending
      ctx.globalCompositeOperation = 'screen'; // Better blending for overlapping points
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Reset composite operation
    ctx.globalCompositeOperation = 'source-over';
    
    // Apply minimal smoothing only in ocean areas
    applyOceanBlur(ctx, points);
  }

  function isOceanPoint(point) {
    // Enhanced ocean filtering with better geographic boundaries
    var lat = ((heatmapCanvas.height - point.y) / heatmapCanvas.height) * 180 - 90;
    var lon = (point.x / heatmapCanvas.width) * 360 - 180;
    
    // Exclude polar regions more aggressively
    if (lat < -60) return false; // Antarctica and Southern Ocean edges
    if (lat > 75) return false;  // Arctic Ocean edges
    
    // Exclude major enclosed seas and coastal areas with better precision
    
    // Mediterranean Sea and Black Sea
    if (lat > 30 && lat < 47 && lon > -6 && lon < 42) return false;
    
    // Red Sea and Persian Gulf
    if (lat > 12 && lat < 30 && lon > 32 && lon < 56) return false;
    
    // Baltic Sea and North Sea coastal areas
    if (lat > 53 && lat < 66 && lon > 3 && lon < 31) return false;
    
    // Sea of Japan and East China Sea coastal areas
    if (lat > 30 && lat < 46 && lon > 120 && lon < 142) return false;
    
    // Hudson Bay
    if (lat > 51 && lat < 70 && lon > -95 && lon < -78) return false;
    
    // Great Lakes region (approximate)
    if (lat > 41 && lat < 49 && lon > -93 && lon < -76) return false;
    
    // Caribbean and Gulf of Mexico coastal filtering
    if (lat > 18 && lat < 31 && lon > -98 && lon < -80) return false;
    
    // Exclude very high latitude areas where data quality is poor
    if (Math.abs(lat) > 70) return false;
    
    // Additional filtering for continental shelf areas (simplified)
    // This helps prevent coastal spillover
    return isDeepOceanArea(lat, lon);
  }

  function isDeepOceanArea(lat, lon) {
    // Simplified deep ocean detection - excludes continental shelves
    // This is a basic approximation; real implementation would use bathymetry data
    
    // Pacific Ocean deep areas
    if (lat > -50 && lat < 50 && lon > -180 && lon < -120) return true;  // Eastern Pacific
    if (lat > -50 && lat < 50 && lon > 120 && lon < 180) return true;    // Western Pacific
    
    // Atlantic Ocean deep areas
    if (lat > -50 && lat < 60 && lon > -60 && lon < -10) return true;    // Western Atlantic
    if (lat > -50 && lat < 60 && lon > -30 && lon < 20) return true;     // Eastern Atlantic
    
    // Indian Ocean deep areas
    if (lat > -50 && lat < 30 && lon > 20 && lon < 120) return true;     // Indian Ocean
    
    // Southern Ocean (but not too close to Antarctica)
    if (lat > -55 && lat < -30 && lon > -180 && lon < 180) return true;  // Southern Ocean
    
    // Exclude everything else (coastal areas, shallow seas, etc.)
    return false;
  }

  function getOceanHeatmapColor(magnitude) {
    // Enhanced ocean-specific color scheme with better contrast
    var r, g, b;
    
    if (magnitude < 0.1) {
      // Deep ocean blue to lighter blue (very low chlorophyll)
      var t = magnitude / 0.1;
      r = Math.floor(0 + t * 30);
      g = Math.floor(50 + t * 80);
      b = Math.floor(150 + t * 105);
    } else if (magnitude < 0.3) {
      // Blue to cyan (low to moderate chlorophyll)
      var t = (magnitude - 0.1) / 0.2;
      r = Math.floor(30 + t * 0);
      g = Math.floor(130 + t * 125);
      b = Math.floor(255 - t * 100);
    } else if (magnitude < 0.7) {
      // Cyan to green (moderate to high chlorophyll)
      var t = (magnitude - 0.3) / 0.4;
      r = Math.floor(0 + t * 50);
      g = Math.floor(255 - t * 50);
      b = Math.floor(155 - t * 155);
    } else {
      // Green to yellow/red (very high chlorophyll - blooms)
      var t = (magnitude - 0.7) / 0.3;
      r = Math.floor(50 + t * 205);
      g = Math.floor(205 + t * 50);
      b = Math.floor(0);
    }
    
    return { r: r, g: g, b: b };
  }

  function applyOceanBlur(ctx, points) {
    // Apply selective blur only around ocean data points
    var imageData = ctx.getImageData(0, 0, heatmapCanvas.width, heatmapCanvas.height);
    var blurred = selectiveOceanBlur(imageData, points, heatmapCanvas.width, heatmapCanvas.height);
    ctx.putImageData(blurred, 0, 0);
  }

  function selectiveOceanBlur(imageData, points, width, height) {
    var data = imageData.data;
    var output = new ImageData(width, height);
    var outputData = output.data;
    
    // Create a map of ocean areas for selective blurring
    var oceanMask = new Array(width * height).fill(false);
    
    for (var i = 0; i < points.length; i++) {
      var point = points[i];
      var px = Math.floor(point.x);
      var py = Math.floor(point.y);
      
      // Mark area around each ocean point for blurring
      for (var dy = -3; dy <= 3; dy++) {
        for (var dx = -3; dx <= 3; dx++) {
          var nx = px + dx;
          var ny = py + dy;
          
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            oceanMask[ny * width + nx] = true;
          }
        }
      }
    }
    
    // Apply blur only to ocean areas
    for (var y = 0; y < height; y++) {
      for (var x = 0; x < width; x++) {
        var idx = y * width + x;
        
        if (oceanMask[idx]) {
          // Apply light blur in ocean areas
          var r = 0, g = 0, b = 0, a = 0, count = 0;
          
          for (var dy = -1; dy <= 1; dy++) {
            for (var dx = -1; dx <= 1; dx++) {
              var nx = x + dx;
              var ny = y + dy;
              
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                var srcIdx = (ny * width + nx) * 4;
                r += data[srcIdx];
                g += data[srcIdx + 1];
                b += data[srcIdx + 2];
                a += data[srcIdx + 3];
                count++;
              }
            }
          }
          
          var outIdx = idx * 4;
          outputData[outIdx] = r / count;
          outputData[outIdx + 1] = g / count;
          outputData[outIdx + 2] = b / count;
          outputData[outIdx + 3] = a / count;
        } else {
          // Copy original pixel for non-ocean areas
          var srcIdx = idx * 4;
          var outIdx = idx * 4;
          outputData[outIdx] = data[srcIdx];
          outputData[outIdx + 1] = data[srcIdx + 1];
          outputData[outIdx + 2] = data[srcIdx + 2];
          outputData[outIdx + 3] = data[srcIdx + 3];
        }
      }
    }
    
    return output;
  }

  function applyCanvasBlur(ctx, blurRadius) {
    // Controlled box blur to prevent land spillover
    var imageData = ctx.getImageData(0, 0, heatmapCanvas.width, heatmapCanvas.height);
    var blurred = boxBlur(imageData, heatmapCanvas.width, heatmapCanvas.height, blurRadius || 1);
    ctx.putImageData(blurred, 0, 0);
  }

  function boxBlur(imageData, width, height, radius) {
    var data = imageData.data;
    var output = new ImageData(width, height);
    var outputData = output.data;
    
    for (var y = 0; y < height; y++) {
      for (var x = 0; x < width; x++) {
        var r = 0, g = 0, b = 0, a = 0, count = 0;
        
        for (var dy = -radius; dy <= radius; dy++) {
          for (var dx = -radius; dx <= radius; dx++) {
            var nx = x + dx;
            var ny = y + dy;
            
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              var idx = (ny * width + nx) * 4;
              r += data[idx];
              g += data[idx + 1];
              b += data[idx + 2];
              a += data[idx + 3];
              count++;
            }
          }
        }
        
        var outIdx = (y * width + x) * 4;
        outputData[outIdx] = r / count;
        outputData[outIdx + 1] = g / count;
        outputData[outIdx + 2] = b / count;
        outputData[outIdx + 3] = a / count;
      }
    }
    
    return output;
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

  // Event handlers (same as original)
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

  // Public API for transparency control
  this.setHeatmapOpacity = function(opacity) {
    if (heatmapMaterial && heatmapMaterial.uniforms) {
      heatmapMaterial.uniforms.heatmapOpacity.value = opacity;
      console.log(`🎨 Heatmap opacity set to ${(opacity * 100).toFixed(0)}%`);
    }
  };

  // Public API
  this.updateHeatmap = updateHeatmap;
  this.renderer = renderer;
  this.scene = scene;

  return this;
};