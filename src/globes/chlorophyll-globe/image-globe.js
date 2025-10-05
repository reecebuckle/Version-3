/**
 * Image Globe - PNG Texture-based WebGL Globe for Monthly Chlorophyll Visualization
 * Based on dat.globe by Google Data Arts Team
 * Enhanced for NASA Space Apps Challenge 2025 - Direct PNG Image Display
 */

var DAT = DAT || {};

DAT.ImageGlobe = function(container, opts) {
  opts = opts || {};
  
  var imgDir = opts.imgDir || './';

  var camera, scene, renderer, w, h;
  var mesh, atmosphere;
  var currentTexture = null;
  var currentMaterial = null;

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

  // Enhanced shaders for image texture display
  var Shaders = {
    'earth' : {
      uniforms: {
        'texture': { type: 't', value: null },
        'opacity': { type: 'f', value: 1.0 }
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
        'uniform float opacity;',
        'varying vec3 vNormal;',
        'varying vec2 vUv;',
        'void main() {',
          // Sample the chlorophyll texture
          'vec4 textureColor = texture2D( texture, vUv );',
          
          // Apply atmospheric lighting effect
          'float intensity = 1.05 - dot( vNormal, vec3( 0.0, 0.0, 1.0 ) );',
          'vec3 atmosphere = vec3( 0.2, 0.4, 0.8 ) * pow( intensity, 1.5 );',
          
          // Blend texture with subtle atmosphere
          'vec3 finalColor = textureColor.rgb + atmosphere * 0.2;',
          
          'gl_FragColor = vec4( finalColor, opacity );',
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

    // High-resolution sphere geometry for crisp image display
    var geometry = new THREE.SphereGeometry(200, 128, 64);

    shader = Shaders['earth'];
    uniforms = THREE.UniformsUtils.clone(shader.uniforms);

    // Initialize with a default texture (will be replaced)
    uniforms['texture'].value = new THREE.Texture();

    currentMaterial = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: shader.vertexShader,
      fragmentShader: shader.fragmentShader
    });

    mesh = new THREE.Mesh(geometry, currentMaterial);
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

    atmosphere = new THREE.Mesh(geometry, material);
    atmosphere.scale.set( 1.1, 1.1, 1.1 );
    scene.add(atmosphere);

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

  function loadImage(imagePath, callback) {
    console.log(`🖼️ Loading image: ${imagePath}`);
    
    var loader = new THREE.TextureLoader();
    
    loader.load(
      imagePath,
      function(texture) {
        // Configure texture for optimal display
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        
        // Update material texture
        if (currentMaterial && currentMaterial.uniforms) {
          currentMaterial.uniforms.texture.value = texture;
          currentTexture = texture;
        }
        
        console.log(`✅ Image loaded successfully: ${imagePath}`);
        
        if (callback) callback();
      },
      function(progress) {
        console.log(`📊 Loading progress: ${(progress.loaded / progress.total * 100).toFixed(1)}%`);
      },
      function(error) {
        console.error(`❌ Error loading image: ${imagePath}`, error);
      }
    );
  }

  function setOpacity(opacity) {
    if (currentMaterial && currentMaterial.uniforms) {
      currentMaterial.uniforms.opacity.value = opacity;
      console.log(`🎨 Globe opacity set to ${(opacity * 100).toFixed(0)}%`);
    }
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
  this.loadImage = loadImage;
  this.setOpacity = setOpacity;
  this.renderer = renderer;
  this.scene = scene;

  return this;
};