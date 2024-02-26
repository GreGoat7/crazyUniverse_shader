// script.js

// Setup der Szene, Kamera und des Renderers
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Erstellen eines Shader-Materials mit Ihrem GLSL-Code
const shaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
        u_time: { value: 0.0 },
        u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        u_mouse: { value: new THREE.Vector2() }
    },
    vertexShader: `...`, // Ihr Vertex Shader Code
    fragmentShader: `...` // Ihr Fragment Shader Code
});

// Erstellen eines Meshes mit dem Shader-Material
const geometry = new THREE.PlaneGeometry(2, 2);
const mesh = new THREE.Mesh(geometry, shaderMaterial);
scene.add(mesh);

// Die Kamera so positionieren, dass der Plane sichtbar ist
camera.position.z = 1;

// Render-Loop
const animate = function () {
    requestAnimationFrame(animate);

    // Zeit-Uniform aktualisieren
    shaderMaterial.uniforms.u_time.value += 0.05;

    renderer.render(scene, camera);
};

animate();
