/**
 * ============================================================================
 * CRYPTOVERSE – 3D INTERACTIVE THREE.JS SCENE MODULE (threeScene.js)
 * ============================================================================
 * This script builds an immersive 3D cryptocurrency visualization inside the
 * Hero section using pure Three.js.
 * 
 * Includes:
 * 1. Hyper-realistic rotating metallic Bitcoin coin with custom canvas textures.
 * 2. Rotating digital globe with glowing cybernetic grid and orbital rings.
 * 3. Deep space floating particle system.
 * 4. Dynamic studio lighting (Ambient, Directional, and Neon Point Lights).
 * 5. Interactive mouse parallax response and smooth requestAnimationFrame loop.
 * 
 * Written with detailed comments for beginners and internship evaluation.
 * ============================================================================
 */

// Global variables for Three.js core objects
let scene, camera, renderer;
let bitcoinGroup, globeGroup, particles;
let mouseX = 0, mouseY = 0;
let targetX = 0, targetY = 0;
let clock;
let isInitialized = false;

/**
 * ============================================================================
 * 1. INITIALIZE SCENE ON DOCUMENT READY
 * ============================================================================
 */
document.addEventListener('DOMContentLoaded', () => {
    // Check if Three.js library is loaded
    if (typeof THREE === 'undefined') {
        console.error('❌ Three.js library not found. 3D Scene cannot be initialized.');
        return;
    }

    const container = document.getElementById('three-hero-container');
    const canvas = document.getElementById('three-canvas');

    if (container && canvas) {
        initThreeScene(container, canvas);
    }
});

/**
 * Main initialization function
 */
function initThreeScene(container, canvas) {
    console.log('🌌 Initializing Three.js 3D Quantum Core...');

    clock = new THREE.Clock();

    // 1. Setup Scene
    scene = new THREE.Scene();

    // 2. Setup Camera
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 480;
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 16);

    // 3. Setup Renderer with transparent background & pixel optimization
    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,         // Allows CSS gradient background to show through
        antialias: true,     // Smooths jagged polygon edges
        powerPreference: "high-performance"
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 4. Setup Lighting
    setupLighting();

    // 5. Create 3D Objects
    createDigitalGlobe();
    createMetallicBitcoin();
    createFloatingParticles();

    // 6. Setup Event Listeners (Mouse parallax & Window Resize)
    setupEventListeners(container);

    // 7. Start Animation Loop
    isInitialized = true;
    animateScene();
}

/**
 * ============================================================================
 * 2. STUDIO LIGHTING SETUP
 * ============================================================================
 */
function setupLighting() {
    // Ambient light gives base illumination to all surfaces
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // Key Directional Light (creates crisp shadows and metallic sheen)
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(10, 15, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // Neon Cyan Point Light (bottom left cyber glow)
    const cyanLight = new THREE.PointLight(0x00E5FF, 3, 25);
    cyanLight.position.set(-8, -6, 5);
    scene.add(cyanLight);

    // Purple / Gold Point Light (top right highlight)
    const goldLight = new THREE.PointLight(0xFFD700, 2.5, 25);
    goldLight.position.set(8, 6, 5);
    scene.add(goldLight);
}

/**
 * ============================================================================
 * 3. CREATE HYPER-REALISTIC METALLIC BITCOIN
 * ============================================================================
 * Creates a high-detail cylinder with custom generated textures.
 */
function createMetallicBitcoin() {
    bitcoinGroup = new THREE.Group();

    // A. Generate high-resolution canvas textures for face and edge
    const faceTexture = generateBitcoinFaceTexture();
    const edgeTexture = generateBitcoinEdgeTexture();

    // B. Create metallic materials
    const faceMaterial = new THREE.MeshStandardMaterial({
        map: faceTexture,
        bumpMap: faceTexture,
        bumpScale: 0.08,
        metalness: 0.9,
        roughness: 0.15,
        color: 0xffe066
    });

    const edgeMaterial = new THREE.MeshStandardMaterial({
        map: edgeTexture,
        metalness: 0.85,
        roughness: 0.25,
        color: 0xf39c12
    });

    // C. Create coin geometry (radiusTop, radiusBottom, height, radialSegments)
    const coinGeometry = new THREE.CylinderGeometry(2.6, 2.6, 0.4, 64);
    
    // Assign materials: index 0 is side edge, index 1 is top face, index 2 is bottom face
    const materials = [edgeMaterial, faceMaterial, faceMaterial];
    const coinMesh = new THREE.Mesh(coinGeometry, materials);
    coinMesh.castShadow = true;
    coinMesh.receiveShadow = true;

    // Rotate coin so flat faces point forward initially
    coinMesh.rotation.x = Math.PI / 2;
    coinMesh.rotation.z = 0.2;
    bitcoinGroup.add(coinMesh);

    // D. Add outer glowing halo ring around the coin
    const ringGeometry = new THREE.TorusGeometry(3.1, 0.04, 16, 100);
    const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0x00E5FF,
        transparent: true,
        opacity: 0.6
    });
    const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
    ringMesh.rotation.x = Math.PI / 2;
    bitcoinGroup.add(ringMesh);

    // Position Bitcoin slightly forward and centered
    bitcoinGroup.position.set(-1.2, 0.5, 2);
    scene.add(bitcoinGroup);
}

/**
 * Generates an HTML5 Canvas texture for the Bitcoin front face with ₿ symbol
 */
function generateBitcoinFaceTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Background gradient gold
    const grad = ctx.createRadialGradient(256, 256, 20, 256, 256, 250);
    grad.addColorStop(0, '#FFF68F');
    grad.addColorStop(0.7, '#FFD700');
    grad.addColorStop(1, '#B8860B');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Outer concentric rings
    ctx.strokeStyle = '#8B6508';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(256, 256, 230, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#FFF8DC';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(256, 256, 210, 0, Math.PI * 2);
    ctx.stroke();

    // Draw embossed Bitcoin ₿ symbol
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;
    ctx.font = '800 280px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('₿', 256, 260);

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 16;
    return texture;
}

/**
 * Generates edge ridge ridges texture
 */
function generateBitcoinEdgeTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#D4AF37';
    ctx.fillRect(0, 0, 512, 64);

    ctx.fillStyle = '#8B6508';
    for (let i = 0; i < 512; i += 16) {
        ctx.fillRect(i, 0, 8, 64);
    }

    return new THREE.CanvasTexture(canvas);
}

/**
 * ============================================================================
 * 4. CREATE ROTATING DIGITAL GLOBE & NETWORK RINGS
 * ============================================================================
 */
function createDigitalGlobe() {
    globeGroup = new THREE.Group();

    // A. Inner dark sphere
    const sphereGeo = new THREE.SphereGeometry(3.6, 32, 32);
    const sphereMat = new THREE.MeshStandardMaterial({
        color: 0x050816,
        roughness: 0.7,
        metalness: 0.3,
        transparent: true,
        opacity: 0.85
    });
    const innerSphere = new THREE.Mesh(sphereGeo, sphereMat);
    globeGroup.add(innerSphere);

    // B. Cybernetic wireframe cage
    const wireGeo = new THREE.SphereGeometry(3.65, 24, 24);
    const wireMat = new THREE.MeshBasicMaterial({
        color: 0x00E5FF,
        wireframe: true,
        transparent: true,
        opacity: 0.25
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    globeGroup.add(wireMesh);

    // C. Orbital connection rings representing global crypto transactions
    const ringGeo1 = new THREE.TorusGeometry(4.4, 0.02, 16, 100);
    const ringMat1 = new THREE.MeshBasicMaterial({ color: 0x7B61FF, transparent: true, opacity: 0.5 });
    const orbitRing1 = new THREE.Mesh(ringGeo1, ringMat1);
    orbitRing1.rotation.x = Math.PI / 3;
    orbitRing1.rotation.y = Math.PI / 6;
    globeGroup.add(orbitRing1);

    const ringGeo2 = new THREE.TorusGeometry(4.8, 0.02, 16, 100);
    const ringMat2 = new THREE.MeshBasicMaterial({ color: 0x00FF95, transparent: true, opacity: 0.4 });
    const orbitRing2 = new THREE.Mesh(ringGeo2, ringMat2);
    orbitRing2.rotation.x = -Math.PI / 4;
    orbitRing2.rotation.z = Math.PI / 4;
    globeGroup.add(orbitRing2);

    // Position Globe slightly behind and to the right
    globeGroup.position.set(2.2, -0.8, -3);
    scene.add(globeGroup);
}

/**
 * ============================================================================
 * 5. CREATE FLOATING DEEP SPACE PARTICLES
 * ============================================================================
 */
function createFloatingParticles() {
    const particleCount = 250;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const color1 = new THREE.Color(0x00E5FF); // Cyan
    const color2 = new THREE.Color(0x7B61FF); // Purple
    const color3 = new THREE.Color(0xFFD700); // Gold

    for (let i = 0; i < particleCount * 3; i += 3) {
        // Random positions distributed around the scene
        positions[i] = (Math.random() - 0.5) * 30;
        positions[i + 1] = (Math.random() - 0.5) * 30;
        positions[i + 2] = (Math.random() - 0.5) * 20 - 5;

        // Assign random colors
        const rand = Math.random();
        let selectedColor = color1;
        if (rand > 0.66) selectedColor = color2;
        else if (rand > 0.33) selectedColor = color3;

        colors[i] = selectedColor.r;
        colors[i + 1] = selectedColor.g;
        colors[i + 2] = selectedColor.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.15,
        vertexColors: true,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending
    });

    particles = new THREE.Points(geometry, material);
    scene.add(particles);
}

/**
 * ============================================================================
 * 6. EVENT LISTENERS (MOUSE PARALLAX & RESIZE)
 * ============================================================================
 */
function setupEventListeners(container) {
    // Track mouse movement inside window for parallax tilt
    window.addEventListener('mousemove', (event) => {
        // Normalize mouse coordinates between -1 and 1
        mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    });

    // Handle container resizing
    const resizeObserver = new ResizeObserver(() => {
        if (!camera || !renderer) return;
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;
        if (newWidth > 0 && newHeight > 0) {
            camera.aspect = newWidth / newHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(newWidth, newHeight);
        }
    });
    resizeObserver.observe(container);
}

/**
 * ============================================================================
 * 7. ANIMATION LOOP (requestAnimationFrame)
 * ============================================================================
 * Animate coin rotation, gentle floating, globe rotation, and particles.
 */
function animateScene() {
    if (!isInitialized) return;
    requestAnimationFrame(animateScene);

    const elapsedTime = clock.getElapsedTime();

    // Smooth lerp mouse parallax targets
    targetX = targetX + (mouseX - targetX) * 0.05;
    targetY = targetY + (mouseY - targetY) * 0.05;

    // A. Animate Bitcoin Coin
    if (bitcoinGroup) {
        // Continuous smooth rotation around Y and Z axis
        bitcoinGroup.rotation.y = elapsedTime * 0.8;
        bitcoinGroup.rotation.z = Math.sin(elapsedTime * 0.5) * 0.15;

        // Sine wave vertical floating animation
        bitcoinGroup.position.y = 0.5 + Math.sin(elapsedTime * 1.5) * 0.3;

        // Apply mouse tilt response
        bitcoinGroup.rotation.x = (Math.PI / 2) + (targetY * 0.3);
        bitcoinGroup.position.x = -1.2 + (targetX * 0.5);
    }

    // B. Animate Digital Globe
    if (globeGroup) {
        // Slow continuous rotation
        globeGroup.rotation.y = elapsedTime * 0.25;
        globeGroup.rotation.x = Math.sin(elapsedTime * 0.3) * 0.1;

        // Counter-rotate inner cyber rings
        if (globeGroup.children[2]) globeGroup.children[2].rotation.z += 0.005;
        if (globeGroup.children[3]) globeGroup.children[3].rotation.y -= 0.008;
    }

    // C. Animate Floating Particles
    if (particles) {
        particles.rotation.y = elapsedTime * 0.03;
        particles.rotation.x = elapsedTime * 0.02;
    }

    // D. Subtle camera parallax drift
    camera.position.x = targetX * 1.5;
    camera.position.y = targetY * 1.5;
    camera.lookAt(scene.position);

    // E. Render Scene
    renderer.render(scene, camera);
}
