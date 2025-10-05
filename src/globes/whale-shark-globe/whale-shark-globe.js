/**
 * Whale Shark Globe - Specialized WebGL Globe for Marine Animal Tracking
 * Based on dat.globe by Google Data Arts Team
 * Enhanced for NASA Space Apps Challenge 2025 - Whale Shark Movement Visualization
 */

var DAT = DAT || {};

DAT.WhaleSharkGlobe = function(container, opts) {
  opts = opts || {};
  
  // Whale shark tracking specific color function
  var colorFn = opts.colorFn || function(sharkId, intensity) {
    var c = new THREE.Color();
    // Use predefined shark colors or generate based on ID
    if (opts.sharkColors && opts.sharkColors[sharkId]) {
      var rgb = opts.sharkColors[sharkId];
      c.setRGB(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255);
      // Adjust intensity for trail effects
      c.multiplyScalar(intensity || 1.0);
    } else {
      // Fallback color generation
      var hue = (parseInt(sharkId) * 0.618033988749895) % 1; // Golden ratio for distribution
      c.setHSL(hue, 0.8, 0.6);
      c.multiplyScalar(intensity || 1.0);
    }
    return c;
  };
  
  var imgDir = opts.imgDir || './';

  // Enhanced shaders for marine visualization
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
          // Enhanced marine atmosphere effect
          'float intensity = 1.05 - dot( vNormal, vec3( 0.0, 0.0, 1.0 ) );',
          'vec3 atmosphere = vec3( 0.2, 0.5, 0.8 ) * pow( intensity, 1.5 );',
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
          'gl_FragColor = vec4( 0.1, 0.4, 0.8, 1.0 ) * intensity;',
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

  // Whale shark tracking specific properties
  var sharkTracks = {};
  var currentTimeFilter = null;
  var trackLines = [];
  var sharkMarkers = [];
  var visibleSharks = new Set();
  var tooltip = null;

  function init() {
    container.style.color = '#fff';
    container.style.font = '13px/20px Arial, sans-serif';

    var shader, uniforms, material;
    w = container.offsetWidth || window.innerWidth;
    h = container.offsetHeight || window.innerHeight;

    camera = new THREE.PerspectiveCamera(30, w / h, 1, 10000);
    camera.position.z = distance;

    scene = new THREE.Scene();

    // Enhanced geometry for better marine representation
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

    // Enhanced atmosphere for marine visualization
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

    // Create shark marker geometry (small spheres for now)
    var markerGeometry = new THREE.SphereGeometry(2, 8, 6);
    point = new THREE.Mesh(markerGeometry);

    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(w, h);

    renderer.domElement.style.position = 'absolute';

    container.appendChild(renderer.domElement);

    container.addEventListener('mousedown', onMouseDown, false);
    container.addEventListener('mousewheel', onMouseWheel, false);
    container.addEventListener('mousemove', onMouseMove, false);
    
    // Touch events for mobile
    container.addEventListener('touchstart', onTouchStart, false);
    container.addEventListener('touchmove', onTouchMove, false);
    container.addEventListener('touchend', onTouchEnd, false);
    
    document.addEventListener('keydown', onDocumentKeyDown, false);
    window.addEventListener('resize', onWindowResize, false);

    container.addEventListener( 'mouseover', function () {
      overRenderer = true;
    }, false );

    container.addEventListener( 'mouseout', function () {
      overRenderer = false;
    }, false );

    // Focus on Gulf of Mexico region initially
    target.x = Math.PI * 1.25; // Longitude ~-90°
    target.y = Math.PI * 0.15;  // Latitude ~27°
    distanceTarget = 800; // Closer zoom for regional focus
    
    // Create tooltip element
    createTooltip();
  }

  // Load whale shark tracking data
  function loadSharkData(sharkData, opts) {
    opts = opts || {};
    console.log('🦈 Loading whale shark data:', sharkData.sharks.length, 'sharks');

    // Store shark data
    sharkTracks = {};
    sharkData.sharks.forEach(shark => {
      sharkTracks[shark.id] = {
        id: shark.id,
        name: shark.name,
        color: shark.color,
        tracks: shark.tracks,
        visible: true
      };
      visibleSharks.add(shark.id);
    });

    // Store colors for color function
    opts.sharkColors = {};
    sharkData.sharks.forEach(shark => {
      opts.sharkColors[shark.id] = shark.color;
    });

    console.log('✅ Loaded tracking data for', Object.keys(sharkTracks).length, 'sharks');
    
    // Create initial visualization
    createTrackLines();
    createSharkMarkers();
  }

  // Create track lines for whale shark paths with performance optimization
  function createTrackLines() {
    // Clear existing track lines
    trackLines.forEach(line => scene.remove(line));
    trackLines = [];

    // Performance optimization: limit number of visible tracks
    const maxVisibleTracks = 20;
    let visibleTrackCount = 0;

    Object.values(sharkTracks).forEach(shark => {
      if (!shark.visible || !visibleSharks.has(shark.id)) return;
      if (visibleTrackCount >= maxVisibleTracks) return;

      var points = [];
      var trackCount = 0;
      
      // Performance optimization: subsample points for long tracks
      const maxPointsPerTrack = 100;
      const step = Math.max(1, Math.floor(shark.tracks.length / maxPointsPerTrack));
      
      for (let i = 0; i < shark.tracks.length; i += step) {
        const track = shark.tracks[i];
        if (currentTimeFilter && !isWithinTimeFilter(track[3])) continue;

        var lat = track[1];
        var lng = track[0];
        var phi = (90 - lat) * Math.PI / 180;
        var theta = (180 - lng) * Math.PI / 180;

        var x = 202 * Math.sin(phi) * Math.cos(theta); // Slightly above surface
        var y = 202 * Math.cos(phi);
        var z = 202 * Math.sin(phi) * Math.sin(theta);

        points.push(new THREE.Vector3(x, y, z));
        trackCount++;
      }

      if (points.length > 1) {
        var geometry = new THREE.Geometry();
        geometry.vertices = points;

        var material = new THREE.LineBasicMaterial({
          color: new THREE.Color(shark.color[0] / 255, shark.color[1] / 255, shark.color[2] / 255),
          linewidth: 2,
          transparent: true,
          opacity: 0.8
        });

        var line = new THREE.Line(geometry, material);
        scene.add(line);
        trackLines.push(line);
        visibleTrackCount++;
      }
    });

    console.log('🛤️ Created', trackLines.length, 'track lines (optimized)');
  }

  // Create shark position markers with instanced rendering for performance
  function createSharkMarkers() {
    // Clear existing markers
    sharkMarkers.forEach(marker => scene.remove(marker));
    sharkMarkers = [];

    // Performance optimization: use shared geometry and materials
    var sharedGeometry = new THREE.SphereGeometry(3, 8, 6);
    var materials = {}; // Cache materials by color

    Object.values(sharkTracks).forEach(shark => {
      if (!shark.visible || !visibleSharks.has(shark.id)) return;

      // Get current position (latest track point within time filter)
      var currentTrack = getCurrentSharkPosition(shark);
      if (!currentTrack) return;

      var lat = currentTrack[1];
      var lng = currentTrack[0];
      var phi = (90 - lat) * Math.PI / 180;
      var theta = (180 - lng) * Math.PI / 180;

      var x = 205 * Math.sin(phi) * Math.cos(theta); // Above track line
      var y = 205 * Math.cos(phi);
      var z = 205 * Math.sin(phi) * Math.sin(theta);

      // Reuse materials for same colors
      var colorKey = shark.color.join(',');
      if (!materials[colorKey]) {
        materials[colorKey] = new THREE.MeshBasicMaterial({
          color: new THREE.Color(shark.color[0] / 255, shark.color[1] / 255, shark.color[2] / 255),
          transparent: true,
          opacity: 0.9
        });
      }

      var marker = new THREE.Mesh(sharedGeometry, materials[colorKey]);
      marker.position.set(x, y, z);
      marker.userData = { sharkId: shark.id, sharkName: shark.name };

      scene.add(marker);
      sharkMarkers.push(marker);
    });

    console.log('📍 Created', sharkMarkers.length, 'shark markers (optimized)');
  }

  // Get current shark position based on time filter
  function getCurrentSharkPosition(shark) {
    if (!currentTimeFilter) {
      return shark.tracks[shark.tracks.length - 1]; // Latest position
    }

    // Find latest position within time filter
    var validTracks = shark.tracks.filter(track => isWithinTimeFilter(track[3]));
    return validTracks.length > 0 ? validTracks[validTracks.length - 1] : null;
  }

  // Check if timestamp is within current time filter
  function isWithinTimeFilter(timestamp) {
    if (!currentTimeFilter) return true;
    return timestamp >= currentTimeFilter.start && timestamp <= currentTimeFilter.end;
  }

  // Set time filter for animation
  function setTimeFilter(startTimestamp, endTimestamp) {
    if (startTimestamp === null || endTimestamp === null) {
      currentTimeFilter = null;
      console.log('⏰ Time filter cleared - showing all data');
    } else {
      currentTimeFilter = {
        start: startTimestamp,
        end: endTimestamp
      };
      console.log('⏰ Time filter updated:', new Date(startTimestamp * 1000), 'to', new Date(endTimestamp * 1000));
      
      // Debug: Check how many points are in this time range
      let totalPointsInRange = 0;
      Object.values(sharkTracks).forEach(shark => {
        let pointsInRange = 0;
        shark.tracks.forEach(track => {
          if (isWithinTimeFilter(track[3])) {
            pointsInRange++;
          }
        });
        if (pointsInRange > 0) {
          console.log(`🦈 ${shark.name}: ${pointsInRange} points in time range`);
        }
        totalPointsInRange += pointsInRange;
      });
      console.log(`📊 Total points in time range: ${totalPointsInRange}`);
    }
    
    // Recreate visualization with new time filter
    createTrackLines();
    createSharkMarkers();
  }

  // Toggle shark visibility
  function toggleShark(sharkId, visible) {
    if (sharkTracks[sharkId]) {
      sharkTracks[sharkId].visible = visible;
      if (visible) {
        visibleSharks.add(sharkId);
      } else {
        visibleSharks.delete(sharkId);
      }
      
      // Recreate visualization
      createTrackLines();
      createSharkMarkers();
      
      console.log('👁️ Shark', sharkId, visible ? 'shown' : 'hidden');
    }
  }

  // Get shark statistics
  function getSharkStats() {
    var stats = {
      totalSharks: Object.keys(sharkTracks).length,
      visibleSharks: visibleSharks.size,
      totalTracks: 0,
      dateRange: { start: null, end: null }
    };

    Object.values(sharkTracks).forEach(shark => {
      stats.totalTracks += shark.tracks.length;
      
      shark.tracks.forEach(track => {
        var date = new Date(track[3] * 1000);
        if (!stats.dateRange.start || date < stats.dateRange.start) {
          stats.dateRange.start = date;
        }
        if (!stats.dateRange.end || date > stats.dateRange.end) {
          stats.dateRange.end = date;
        }
      });
    });

    return stats;
  }

  // Create tooltip element
  function createTooltip() {
    tooltip = document.createElement('div');
    tooltip.style.position = 'absolute';
    tooltip.style.background = 'rgba(0, 20, 40, 0.95)';
    tooltip.style.border = '1px solid rgba(0, 150, 200, 0.5)';
    tooltip.style.borderRadius = '6px';
    tooltip.style.padding = '8px 12px';
    tooltip.style.color = '#ffffff';
    tooltip.style.fontSize = '12px';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.zIndex = '1000';
    tooltip.style.display = 'none';
    tooltip.style.backdropFilter = 'blur(10px)';
    tooltip.style.maxWidth = '200px';
    container.appendChild(tooltip);
  }

  // Handle mouse movement for tooltips (disabled for compatibility)
  function onMouseMoveTooltip(event) {
    // Temporarily disabled due to Three.js version compatibility
    // The main visualization functionality works without tooltips
    return;
  }

  function showTooltip(event, shark) {
    const currentTrack = getCurrentSharkPosition(shark);
    const trackDate = currentTrack ? new Date(currentTrack[3] * 1000) : null;
    
    tooltip.innerHTML = `
      <div style="font-weight: bold; color: #00ccff; margin-bottom: 4px;">
        ${shark.name}
      </div>
      <div style="font-size: 11px; color: #cccccc;">
        ID: ${shark.id}<br>
        Total Points: ${shark.tracks.length}<br>
        ${trackDate ? `Current: ${trackDate.toLocaleDateString()}` : 'No current position'}
      </div>
    `;
    
    tooltip.style.left = (event.clientX + 10) + 'px';
    tooltip.style.top = (event.clientY - 10) + 'px';
    tooltip.style.display = 'block';
  }

  function hideTooltip() {
    tooltip.style.display = 'none';
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
    distanceTarget = distanceTarget > 2000 ? 2000 : distanceTarget;
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
    // Handle tooltip functionality (only when not dragging)
    if (mouseOnDown.x === 0 && mouseOnDown.y === 0) {
      onMouseMoveTooltip(event);
    }
    
    // Only handle rotation if mouse is down
    if (mouseOnDown.x !== 0 || mouseOnDown.y !== 0) {
      mouse.x = - event.clientX;
      mouse.y = event.clientY;

      var zoomDamp = distance/1000;

      target.x = targetOnDown.x + (mouse.x - mouseOnDown.x) * 0.005 * zoomDamp;
      target.y = targetOnDown.y + (mouse.y - mouseOnDown.y) * 0.005 * zoomDamp;

      target.y = target.y > PI_HALF ? PI_HALF : target.y;
      target.y = target.y < - PI_HALF ? - PI_HALF : target.y;
    }
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

  // Touch event handlers for mobile support
  var touchStartX = 0, touchStartY = 0;
  var touchTargetOnDown = { x: 0, y: 0 };

  function onTouchStart(event) {
    event.preventDefault();
    
    if (event.touches.length === 1) {
      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
      
      touchTargetOnDown.x = target.x;
      touchTargetOnDown.y = target.y;
    }
  }

  function onTouchMove(event) {
    event.preventDefault();
    
    if (event.touches.length === 1) {
      var touchX = event.touches[0].clientX;
      var touchY = event.touches[0].clientY;
      
      var deltaX = touchX - touchStartX;
      var deltaY = touchY - touchStartY;
      
      var zoomDamp = distance / 1000;
      
      target.x = touchTargetOnDown.x - deltaX * 0.005 * zoomDamp;
      target.y = touchTargetOnDown.y + deltaY * 0.005 * zoomDamp;
      
      target.y = target.y > PI_HALF ? PI_HALF : target.y;
      target.y = target.y < -PI_HALF ? -PI_HALF : target.y;
    } else if (event.touches.length === 2) {
      // Pinch to zoom
      var touch1 = event.touches[0];
      var touch2 = event.touches[1];
      var distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      if (this.lastTouchDistance) {
        var delta = distance - this.lastTouchDistance;
        zoom(delta * 2);
      }
      this.lastTouchDistance = distance;
    }
  }

  function onTouchEnd(event) {
    event.preventDefault();
    this.lastTouchDistance = null;
  }

  init();
  this.animate = animate;

  // Public API
  this.loadSharkData = loadSharkData;
  this.setTimeFilter = setTimeFilter;
  this.toggleShark = toggleShark;
  this.getSharkStats = getSharkStats;
  this.renderer = renderer;
  this.scene = scene;
  this.rotation = rotation;

  return this;
};