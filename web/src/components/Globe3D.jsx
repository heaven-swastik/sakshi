/**
 * Globe3D.jsx — Interactive 3D network globe showing institution nodes.
 * Pure Three.js, no external assets. Crimson nodes = flagged, green = clean.
 * Mouse-drag to rotate, auto-spins gently.
 */
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const INSTITUTIONS = [
  // [lat, lon, flagged, name]
  [18.5, 73.8, false, 'MIT Pune'],
  [19.0, 72.8, false, 'VJTI Mumbai'],
  [18.5, 73.8, false, 'COEP Pune'],
  [12.9, 77.6, true,  'RV College'],
  [12.9, 77.5, false, 'BMS College'],
  [13.1, 77.6, false, 'NMIT'],
  [12.8, 80.2, true,  'SSN Chennai'],
  [11.0, 76.9, false, 'PSG Tech'],
  [10.9, 76.9, false, 'Amrita'],
  [17.4, 78.4, false, 'CBIT Hyd'],
  [17.3, 78.5, false, 'JNTU Hyd'],
  [17.4, 78.5, false, 'Osmania'],
  [22.7, 73.1, false, 'DDIT Nadiad'],
  [23.2, 72.7, false, 'LDRP GNR'],
  [21.2, 72.8, false, 'GEC Surat'],
];

function latLonToVec3(lat, lon, r) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta)
  );
}

export default function Globe3D({ size = 340 }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const W = size, H = size;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    mountRef.current?.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 100);
    camera.position.set(0, 0, 3.8);

    // — Globe wireframe sphere —
    const sphereGeo = new THREE.SphereGeometry(1, 32, 32);
    const wireframe = new THREE.WireframeGeometry(sphereGeo);
    const wireframeMat = new THREE.LineBasicMaterial({ color: 0xe4e7ec, transparent: true, opacity: 0.35 });
    const globeWire = new THREE.LineSegments(wireframe, wireframeMat);
    scene.add(globeWire);

    // — Solid semi-transparent sphere —
    const solidMat = new THREE.MeshPhongMaterial({
      color: 0xfafafa,
      transparent: true,
      opacity: 0.12,
      shininess: 60,
    });
    const solidMesh = new THREE.Mesh(new THREE.SphereGeometry(0.99, 32, 32), solidMat);
    scene.add(solidMesh);

    // — Light —
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(5, 5, 5);
    scene.add(dir);

    // — Institution nodes —
    const group = new THREE.Group();
    const nodeMeshes = [];
    const R = 1.04;

    INSTITUTIONS.forEach(([lat, lon, flagged]) => {
      const pos = latLonToVec3(lat, lon, R);
      const geo = new THREE.SphereGeometry(flagged ? 0.038 : 0.026, 10, 10);
      const mat = new THREE.MeshPhongMaterial({
        color: flagged ? 0xc0153f : 0x12805c,
        emissive: flagged ? 0x8b0025 : 0x0a4f38,
        emissiveIntensity: 0.5,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      group.add(mesh);
      nodeMeshes.push({ mesh, flagged, baseScale: flagged ? 1 : 1 });
    });

    // — Connection arcs between flagged (R1 rule: dual enrolment) —
    const flagged = INSTITUTIONS.filter(i => i[2]);
    if (flagged.length >= 2) {
      const p1 = latLonToVec3(flagged[0][0], flagged[0][1], R);
      const p2 = latLonToVec3(flagged[1][0], flagged[1][1], R);
      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      mid.normalize().multiplyScalar(R * 1.3); // arc bulge
      const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
      const pts = curve.getPoints(40);
      const arcGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const arcMat = new THREE.LineBasicMaterial({ color: 0xc0153f, transparent: true, opacity: 0.75 });
      group.add(new THREE.Line(arcGeo, arcMat));
    }

    scene.add(group);

    // — Drag rotation —
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };
    let rotVel = { x: 0, y: 0 };

    const el = renderer.domElement;
    const onDown = (e) => { isDragging = true; prevMouse = { x: e.clientX, y: e.clientY }; rotVel = { x: 0, y: 0 }; };
    const onMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;
      rotVel.y = dx * 0.007;
      rotVel.x = dy * 0.007;
      group.rotation.y += rotVel.y;
      group.rotation.x += rotVel.x;
      globeWire.rotation.y += rotVel.y;
      globeWire.rotation.x += rotVel.x;
      solidMesh.rotation.y += rotVel.y;
      solidMesh.rotation.x += rotVel.x;
      prevMouse = { x: e.clientX, y: e.clientY };
    };
    const onUp = () => { isDragging = false; };

    el.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);

    // — Touch support —
    const onTouchStart = (e) => { isDragging = true; prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
    const onTouchMove = (e) => {
      if (!isDragging) return;
      const dx = e.touches[0].clientX - prevMouse.x;
      const dy = e.touches[0].clientY - prevMouse.y;
      rotVel.y = dx * 0.007;
      group.rotation.y += rotVel.y;
      globeWire.rotation.y += rotVel.y;
      solidMesh.rotation.y += rotVel.y;
      prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onUp);

    // — Animate —
    let frame;
    let t = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      t += 0.016;

      if (!isDragging) {
        // Gentle auto-spin
        group.rotation.y += 0.003;
        globeWire.rotation.y += 0.003;
        solidMesh.rotation.y += 0.003;
        // Friction
        rotVel.x *= 0.92;
        rotVel.y *= 0.92;
      }

      // Pulse flagged nodes
      nodeMeshes.forEach(({ mesh, flagged }, i) => {
        if (flagged) {
          const pulse = 1 + 0.25 * Math.sin(t * 3 + i);
          mesh.scale.setScalar(pulse);
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onUp);
      renderer.dispose();
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, [size]);

  return (
    <div
      ref={mountRef}
      style={{ width: size, height: size, cursor: 'grab' }}
      title="Drag to rotate · Crimson = flagged institution"
    />
  );
}
