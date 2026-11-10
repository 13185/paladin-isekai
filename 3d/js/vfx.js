import * as THREE from "three";

export function createVfx(scene) {
  const items = [];

  function slash(at, dir) {
    const g = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.9, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
    const a = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.18), mat);
    const b = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.18), mat.clone());
    b.rotation.z = Math.PI / 2;
    g.add(a); g.add(b);
    g.position.copy(at);
    g.position.y += 1.1;
    g.lookAt(at.x + dir.x, at.y + 1.1, at.z + dir.z);
    scene.add(g);
    items.push({ obj: g, life: 0.28, max: 0.28, kind: "fade" });
  }

  function beam(at) {
    const mat = new THREE.MeshBasicMaterial({ color: 0xffe6a0, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false });
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.7, 18, 16, 1, true), mat);
    m.position.set(at.x, 9, at.z);
    scene.add(m);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.4, 1.8, 24), new THREE.MeshBasicMaterial({ color: 0xffd36a, transparent: true, opacity: 0.7, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(at.x, 0.08, at.z);
    scene.add(ring);
    items.push({ obj: m, life: 0.55, max: 0.55, kind: "fade" });
    items.push({ obj: ring, life: 0.55, max: 0.55, kind: "ring" });
  }

  function hammer(from, to, onHit) {
    const mat = new THREE.MeshStandardMaterial({ color: 0xffd36a, emissive: 0xaa7700, emissiveIntensity: 0.7, metalness: 0.6, roughness: 0.3 });
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.2, 0.2), mat);
    m.position.copy(from);
    m.position.y += 1.4;
    scene.add(m);
    items.push({ obj: m, life: 0.38, max: 0.38, kind: "fly", from: from.clone(), to: to.clone(), onHit });
  }

  function heal(at) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.3, 1.1, 20), new THREE.MeshBasicMaterial({ color: 0xa8ffc8, transparent: true, opacity: 0.8, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(at.x, 0.1, at.z);
    scene.add(ring);
    items.push({ obj: ring, life: 0.7, max: 0.7, kind: "ring" });
    for (let i = 0; i < 12; i++) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), new THREE.MeshBasicMaterial({ color: 0xd4ff9a, transparent: true, opacity: 0.9 }));
      p.position.set(at.x + Math.cos(i) * 0.3, 0.4, at.z + Math.sin(i) * 0.3);
      scene.add(p);
      items.push({ obj: p, life: 0.7, max: 0.7, kind: "rise" });
    }
  }

  function hit(at) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), new THREE.MeshBasicMaterial({ color: 0xfff2c0, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending }));
    m.position.set(at.x, at.y + 1.1, at.z);
    scene.add(m);
    items.push({ obj: m, life: 0.18, max: 0.18, kind: "pop" });
  }

  function telegraph(at, r, color = 0xff3333) {
    const m = new THREE.Mesh(new THREE.RingGeometry(r * 0.75, r, 28), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, side: THREE.DoubleSide }));
    m.rotation.x = -Math.PI / 2;
    m.position.set(at.x, 0.06, at.z);
    scene.add(m);
    return m;
  }

  function levelColumn(at) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.1, 16, 20, 1, true), new THREE.MeshBasicMaterial({ color: 0xffe6a0, transparent: true, opacity: 0.65, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    m.position.set(at.x, 8, at.z);
    scene.add(m);
    items.push({ obj: m, life: 1.6, max: 1.6, kind: "fade" });
  }

  function update(dt) {
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      it.life -= dt;
      const k = Math.max(0, it.life / it.max);
      if (it.kind === "fade" && it.obj.material) it.obj.material.opacity = k * 0.8;
      if (it.kind === "ring") {
        it.obj.scale.setScalar(2 - k);
        if (it.obj.material) it.obj.material.opacity = k * 0.7;
      }
      if (it.kind === "rise") it.obj.position.y += dt * 1.8;
      if (it.kind === "pop") it.obj.scale.setScalar(1.8 - k);
      if (it.kind === "fly") {
        const p = 1 - k;
        it.obj.position.lerpVectors(it.from, it.to, p);
        it.obj.position.y = THREE.MathUtils.lerp(it.from.y + 1.4, it.to.y + 1.1, p) + Math.sin(p * Math.PI) * 1.8;
        it.obj.rotation.x += dt * 12;
        if (it.life <= 0 && it.onHit) it.onHit();
      }
      if (it.life <= 0) {
        scene.remove(it.obj);
        items.splice(i, 1);
      }
    }
  }

  return { slash, beam, hammer, heal, hit, telegraph, levelColumn, update };
}
