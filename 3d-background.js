(function () {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;

    // Use requestAnimationFrame to yield to the browser's initial paint 
    // before initializing heavy WebGL stuff.
    requestAnimationFrame(() => {
        // SCENE SETUP
        const scene = new THREE.Scene();

        // CAMERA
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 200;

        // RENDERER
        const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // PARTICLES (Nodes)
        const particleCount = 200; // number of dots
        const particles = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(particleCount * 3);
        const particleVelocities = [];

        const range = 400;

        for (let i = 0; i < particleCount; i++) {
            particlePositions[i * 3] = (Math.random() - 0.5) * range;
            particlePositions[i * 3 + 1] = (Math.random() - 0.5) * range;
            particlePositions[i * 3 + 2] = (Math.random() - 0.5) * range;

            particleVelocities.push({
                x: (Math.random() - 0.5) * 0.4,
                y: (Math.random() - 0.5) * 0.4,
                z: (Math.random() - 0.5) * 0.4
            });
        }

        particles.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

        // Material for dots
        const pMaterial = new THREE.PointsMaterial({
            color: 0xff5c00, // accent orange
            size: 3,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        const particleSystem = new THREE.Points(particles, pMaterial);
        scene.add(particleSystem);

        // LINES (Edges)
        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0xccff00, // accent green
            transparent: true,
            opacity: 0.15,
            blending: THREE.AdditiveBlending
        });

        const lineGeometry = new THREE.BufferGeometry();
        // Max possible lines formula for N particles is N*(N-1)/2, each line has 2 points, each point has 3 floats.
        // We allocate a large array.
        const maxLines = (particleCount * (particleCount - 1)) / 2;
        const linePositions = new Float32Array(maxLines * 6);
        lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

        // LineSegments draws lines between pairs of vertices
        const linesMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
        scene.add(linesMesh);

        // MOUSE INTERACTION
        let mouse = new THREE.Vector2(-9999, -9999);
        let targetMouse = new THREE.Vector2(-9999, -9999);

        document.addEventListener('mousemove', (event) => {
            // Convert to normalized device coordinates (-1 to +1)
            targetMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            targetMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        });

        // Theme listener to update colors
        function updateColors() {
            const theme = document.documentElement.getAttribute('data-theme') || 'dark';
            if (theme === 'light') {
                pMaterial.color.setHex(0xff5c00); // Orange
                lineMaterial.color.setHex(0x8BC34A); // Green
                lineMaterial.opacity = 0.25;
                pMaterial.blending = THREE.NormalBlending;
                lineMaterial.blending = THREE.NormalBlending;
            } else {
                pMaterial.color.setHex(0xff5c00); // Orange
                lineMaterial.color.setHex(0xccff00); // Light Green
                lineMaterial.opacity = 0.15;
                pMaterial.blending = THREE.AdditiveBlending;
                lineMaterial.blending = THREE.AdditiveBlending;
            }
        }

        updateColors();
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                setTimeout(updateColors, 50); // wait for HTML attribute update
            });
        }

        // RESIZE
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // ANIMATION LOOP
        function animate() {
            requestAnimationFrame(animate);

            // Smooth mouse movement for parallax
            mouse.x += (targetMouse.x - mouse.x) * 0.05;
            mouse.y += (targetMouse.y - mouse.y) * 0.05;

            // Slow rotation of entire system
            particleSystem.rotation.y += 0.001;
            particleSystem.rotation.x += 0.0005;

            // Lines should rotate perfectly in sync with points
            linesMesh.rotation.copy(particleSystem.rotation);

            const positions = particleSystem.geometry.attributes.position.array;
            let lineIndex = 0;

            // Animate particles
            for (let i = 0; i < particleCount; i++) {
                const i3 = i * 3;
                positions[i3] += particleVelocities[i].x;
                positions[i3 + 1] += particleVelocities[i].y;
                positions[i3 + 2] += particleVelocities[i].z;

                // Boundary wrap around
                if (positions[i3] > range / 2 || positions[i3] < -range / 2) particleVelocities[i].x *= -1;
                if (positions[i3 + 1] > range / 2 || positions[i3 + 1] < -range / 2) particleVelocities[i].y *= -1;
                if (positions[i3 + 2] > range / 2 || positions[i3 + 2] < -range / 2) particleVelocities[i].z *= -1;

                // Connect nearby particles
                for (let j = i + 1; j < particleCount; j++) {
                    const j3 = j * 3;
                    const dx = positions[i3] - positions[j3];
                    const dy = positions[i3 + 1] - positions[j3 + 1];
                    const dz = positions[i3 + 2] - positions[j3 + 2];
                    const distSq = dx * dx + dy * dy + dz * dz;

                    if (distSq < 2500) { // Connect if distance is short
                        linePositions[lineIndex++] = positions[i3];
                        linePositions[lineIndex++] = positions[i3 + 1];
                        linePositions[lineIndex++] = positions[i3 + 2];

                        linePositions[lineIndex++] = positions[j3];
                        linePositions[lineIndex++] = positions[j3 + 1];
                        linePositions[lineIndex++] = positions[j3 + 2];
                    }
                }
            }

            particleSystem.geometry.attributes.position.needsUpdate = true;

            // Render only the lines that are currently active
            linesMesh.geometry.setDrawRange(0, lineIndex / 3);
            linesMesh.geometry.attributes.position.needsUpdate = true;

            // Camera parallax based on mouse
            camera.position.x += (mouse.x * 30 - camera.position.x) * 0.05;
            camera.position.y += (mouse.y * 30 - camera.position.y) * 0.05;
            camera.lookAt(scene.position);

            renderer.render(scene, camera);
        }

        animate();
    });
})();
