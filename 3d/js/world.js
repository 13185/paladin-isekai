import * as THREE from "three";

function boxCol(min, max) { return { type: "box", min, max }; }
function cylCol(x, z, r, y0 = 0, y1 = 4) { return { type: "cyl", x, z, r, y0, y1 }; }

export function buildWorld(scene, textures, quality) {
  const colliders = [];
  const cameraMeshes = [];
  const updaters = [];
  const group = new THREE.Group();
  scene.add(group);

  const stoneMat = std(textures.stone, 0xcfc4b0, 0.85, 0.05);
  const marbleMat = std(textures.marble, 0xf0e6d4, 0.45, 0.08);
  const brickMat = std(textures.brick, 0x8a5040, 0.8, 0.04);
  const grassMat = std(textures.grass, 0x5a8a48, 0.95, 0);
  const dirtMat = std(textures.dirt, 0x6b4b32, 0.95, 0);
  const roofMat = std(textures.roof, 0x7a3028, 0.75, 0.05);
  const woodMat = std(textures.wood, 0x6b4426, 0.8, 0.05);
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.35, metalness: 0.75, map: textures.goldTrim });
  const glassMat = new THREE.MeshStandardMaterial({
    map: textures.glass, roughness: 0.25, metalness: 0.1,
    emissive: 0xffcc88, emissiveIntensity: 0.55, emissiveMap: textures.glass,
    transparent: true, opacity: 0.95, side: THREE.DoubleSide,
  });

  // ---- lights & sky ----
  const hemi = new THREE.HemisphereLight(0xffd4a0, 0x4a3424, 0.95);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffe6c0, 2.7);
  sun.position.set(-35, 28, 18);
  sun.castShadow = quality !== "low";
  const ss = quality === "high" ? 80 : 60;
  sun.shadow.camera.left = -ss; sun.shadow.camera.right = ss;
  sun.shadow.camera.top = ss; sun.shadow.camera.bottom = -ss;
  sun.shadow.camera.near = 1; sun.shadow.camera.far = 140;
  sun.shadow.mapSize.set(quality === "high" ? 2048 : 1024, quality === "high" ? 2048 : 1024);
  sun.shadow.bias = -0.00025;
  scene.add(sun);
  scene.add(sun.target);

  const sky = makeGradientSky();
  scene.add(sky);
  const sunPos = new THREE.Vector3(-38, 22, 18).normalize();
  sun.position.copy(sunPos).multiplyScalar(60);
  sun.target.position.set(8, 0, 0);

  scene.fog = new THREE.Fog(0xffb072, quality === "low" ? 70 : 95, quality === "low" ? 280 : 420);
  scene.background = new THREE.Color(0xff9a52);

  // ---- ground ----
  const grass = new THREE.Mesh(new THREE.CircleGeometry(110, 48), grassMat);
  grass.rotation.x = -Math.PI / 2;
  grass.receiveShadow = true;
  group.add(grass);

  const plaza = new THREE.Mesh(new THREE.CircleGeometry(26, 48), stoneMat);
  plaza.rotation.x = -Math.PI / 2;
  plaza.position.y = 0.02;
  plaza.receiveShadow = true;
  group.add(plaza);

  const ring = new THREE.Mesh(new THREE.RingGeometry(18, 19.2, 48), marbleMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.03;
  ring.receiveShadow = true;
  group.add(ring);

  const path = new THREE.Mesh(new THREE.PlaneGeometry(9, 52), dirtMat);
  path.rotation.x = -Math.PI / 2;
  path.position.set(36, 0.03, 5);
  path.receiveShadow = true;
  group.add(path);

  // ---- fountain ----
  const fountain = new THREE.Group();
  fountain.position.set(0, 0, 4);
  group.add(fountain);
  addMesh(fountain, new THREE.CylinderGeometry(3.2, 3.4, 0.35, 24), marbleMat, [0, 0.18, 0], true);
  addMesh(fountain, new THREE.CylinderGeometry(2.4, 2.5, 0.55, 20), marbleMat, [0, 0.55, 0], true);
  addMesh(fountain, new THREE.CylinderGeometry(1.15, 1.25, 0.7, 16), marbleMat, [0, 1.1, 0], true);
  addMesh(fountain, new THREE.CylinderGeometry(0.18, 0.18, 1.6, 10), goldMat, [0, 2.0, 0], true);
  addMesh(fountain, new THREE.SphereGeometry(0.28, 12, 10), goldMat, [0, 2.85, 0], true);
  const water1 = addMesh(fountain, new THREE.CircleGeometry(2.25, 24), waterMat(textures), [0, 0.84, 0]);
  water1.rotation.x = -Math.PI / 2;
  const water2 = addMesh(fountain, new THREE.CircleGeometry(1.05, 20), waterMat(textures), [0, 1.47, 0]);
  water2.rotation.x = -Math.PI / 2;
  const drops = makeFountainParticles();
  fountain.add(drops);
  colliders.push(cylCol(0, 4, 3.15, 0, 1.6));
  const ftnLight = new THREE.PointLight(0x9ad4ff, 1.4, 14);
  ftnLight.position.set(0, 2.4, 4);
  scene.add(ftnLight);
  updaters.push((t) => {
    water1.material.opacity = 0.72 + Math.sin(t * 2) * 0.06;
    drops.rotation.y = t * 0.6;
    drops.position.y = 1.6 + Math.sin(t * 3) * 0.05;
    ftnLight.intensity = 1.2 + Math.sin(t * 2.2) * 0.15;
  });

  // ---- cathedral ----
  const cat = new THREE.Group();
  cat.position.set(0, 0, -30);
  group.add(cat);
  // platform + stairs
  addMesh(cat, new THREE.BoxGeometry(34, 1.2, 22), stoneMat, [0, 0.6, -2], true);
  colliders.push(boxCol({ x: -8.4, z: -43, y: 0 }, { x: 8.4, z: -24.4, y: 14 }));
  for (let i = 0; i < 6; i++) {
    const s = addMesh(cat, new THREE.BoxGeometry(16 - i * 0.4, 0.22, 1.15), stoneMat, [0, 0.12 + i * 0.2, 9.6 - i * 1.05], true);
    s.receiveShadow = true;
  }
  // main hall
  addMesh(cat, new THREE.BoxGeometry(16, 14, 18), brickMat, [0, 8.2, -3], true);
  addMesh(cat, new THREE.BoxGeometry(16.4, 0.5, 18.4), goldMat, [0, 15.3, -3], false);
  // gable roof
  const roof = addMesh(cat, new THREE.ConeGeometry(13, 7, 4), roofMat, [0, 18.8, -3], true);
  roof.rotation.y = Math.PI / 4;
  // towers
  for (const sx of [-10.5, 10.5]) {
    addMesh(cat, new THREE.BoxGeometry(5.2, 20, 5.2), brickMat, [sx, 10.6, 4], true);
    const spire = addMesh(cat, new THREE.ConeGeometry(3.1, 6.5, 4), roofMat, [sx, 23.8, 4], true);
    spire.rotation.y = Math.PI / 4;
    addMesh(cat, new THREE.CylinderGeometry(0.15, 0.15, 2.2, 8), goldMat, [sx, 27.4, 4], false);
    addMesh(cat, new THREE.SphereGeometry(0.28, 10, 8), goldMat, [sx, 28.6, 4], false);
    colliders.push(boxCol({ x: sx - 2.7, z: -28.6, y: 0 }, { x: sx + 2.7, z: -23.4, y: 12 }));
  }
  // facade details
  const door = addMesh(cat, new THREE.BoxGeometry(3.2, 5.4, 0.4), new THREE.MeshStandardMaterial({ color: 0x2a1810, roughness: 0.7 }), [0, 3.9, 8.05], false);
  addMesh(cat, new THREE.BoxGeometry(3.6, 0.25, 0.45), goldMat, [0, 6.7, 8.1], false);
  const rose = addMesh(cat, new THREE.CircleGeometry(2.6, 28), glassMat, [0, 10.6, 8.12], false);
  // side windows
  for (const sx of [-5, 5]) {
    addMesh(cat, new THREE.PlaneGeometry(1.4, 3.2), glassMat, [sx, 7.5, 8.11], false);
  }
  // columns
  for (const sx of [-7, -3.5, 3.5, 7]) {
    addMesh(cat, new THREE.CylinderGeometry(0.32, 0.38, 6.2, 10), marbleMat, [sx, 4.3, 8.6], true);
    addMesh(cat, new THREE.BoxGeometry(0.9, 0.25, 0.9), goldMat, [sx, 7.5, 8.6], false);
  }
  // banners
  for (const sx of [-6, 6]) {
    const b = addMesh(cat, new THREE.PlaneGeometry(1.4, 3.2), new THREE.MeshStandardMaterial({
      map: textures.banner, roughness: 0.7, side: THREE.DoubleSide,
    }), [sx, 9.4, 8.3], false);
    updaters.push((t) => { b.rotation.y = Math.sin(t * 1.6 + sx) * 0.08; });
  }
  const roseLight = new THREE.PointLight(0xffb060, 2.4, 22);
  roseLight.position.set(0, 10, -20);
  scene.add(roseLight);

  // side colonnade
  for (const side of [-1, 1]) {
    for (let i = 0; i < 6; i++) {
      const z = -8 + i * 3.4;
      const x = 16 * side;
      addMesh(group, new THREE.CylinderGeometry(0.28, 0.32, 4.2, 10), marbleMat, [x, 2.1, z], true);
      addMesh(group, new THREE.BoxGeometry(1.6, 0.28, 3.6), stoneMat, [x, 4.3, z], true);
      colliders.push(cylCol(x, z, 0.45, 0, 4));
    }
  }

  // benches, lamps, planters
  const seats = [[8, 10], [-9, 9], [11, -6], [-12, -4], [7, -10]];
  seats.forEach(([x, z], i) => {
    addMesh(group, new THREE.BoxGeometry(1.8, 0.18, 0.55), woodMat, [x, 0.45, z], true);
    addMesh(group, new THREE.BoxGeometry(0.14, 0.45, 0.55), woodMat, [x - 0.8, 0.25, z], true);
    addMesh(group, new THREE.BoxGeometry(0.14, 0.45, 0.55), woodMat, [x + 0.8, 0.25, z], true);
    colliders.push(boxCol({ x: x - 1, z: z - 0.4, y: 0 }, { x: x + 1, z: z + 0.4, y: 1 }));
  });
  for (const [x, z] of [[14, 14], [-14, 14], [20, -2], [-20, -2], [8, 20], [-8, 20]]) {
    addMesh(group, new THREE.CylinderGeometry(0.1, 0.14, 3.4, 8), stoneMat, [x, 1.7, z], true);
    const lamp = addMesh(group, new THREE.SphereGeometry(0.22, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0xffe0a0, emissive: 0xffcc66, emissiveIntensity: 0.9 }),
      [x, 3.5, z], false);
    if (quality !== "low") {
      const pl = new THREE.PointLight(0xffc878, 0.8, 9);
      pl.position.set(x, 3.4, z);
      scene.add(pl);
      updaters.push((t) => { pl.intensity = 0.7 + Math.sin(t * 3 + x) * 0.1; });
    }
    colliders.push(cylCol(x, z, 0.25, 0, 3.5));
  }
  for (const [x, z] of [[6, 16], [-6, 16], [10, 2], [-10, 2]]) {
    addMesh(group, new THREE.CylinderGeometry(0.7, 0.8, 0.4, 12), stoneMat, [x, 0.2, z], true);
    addMesh(group, new THREE.SphereGeometry(0.55, 8, 6), grassMat, [x, 0.7, z], true);
    addMesh(group, new THREE.ConeGeometry(0.35, 0.7, 7), new THREE.MeshStandardMaterial({ color: 0xc45a6a, roughness: 0.7 }), [x, 1.15, z], true);
  }

  // low plaza wall
  for (let a = 0.15; a < Math.PI * 2; a += 0.22) {
    if (a > 1.15 && a < 1.95) continue; // opening toward east path
    if (a > 4.2 && a < 5.15) continue; // opening toward cathedral stairs conceptually southwest? keep north openish
    const x = Math.cos(a) * 25.5;
    const z = Math.sin(a) * 25.5;
    if (z < -16) continue;
    addMesh(group, new THREE.BoxGeometry(1.8, 0.7, 0.35), stoneMat, [x, 0.35, z], true, a);
  }

  // statue
  const statue = new THREE.Group();
  statue.position.set(-11, 0, 1);
  group.add(statue);
  addMesh(statue, new THREE.CylinderGeometry(1.1, 1.2, 0.4, 12), marbleMat, [0, 0.2, 0], true);
  addMesh(statue, new THREE.BoxGeometry(0.5, 1.1, 0.3), marbleMat, [0, 0.95, 0], true);
  addMesh(statue, new THREE.BoxGeometry(0.7, 0.7, 0.35), marbleMat, [0, 1.75, 0], true);
  addMesh(statue, new THREE.SphereGeometry(0.22, 10, 8), marbleMat, [0, 2.28, 0], true);
  colliders.push(cylCol(-11, 1, 1.15, 0, 2.4));

  // ---- forest (instanced) ----
  addForest(group, textures, barkMat(textures), leafMat(textures), colliders, quality);

  // rocks along path
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x6a6560, roughness: 0.9 });
  for (let i = 0; i < 18; i++) {
    const x = 22 + Math.random() * 40;
    const z = 5 + (Math.random() - 0.5) * 16;
    const r = addMesh(group, new THREE.DodecahedronGeometry(0.4 + Math.random() * 0.7, 0), rockMat,
      [x, 0.2, z], true);
    r.rotation.set(Math.random(), Math.random(), Math.random());
    r.scale.y = 0.6 + Math.random() * 0.5;
  }

  // ---- camp ----
  const camp = new THREE.Group();
  camp.position.set(58, 0, 6);
  group.add(camp);
  addMesh(camp, new THREE.CircleGeometry(9, 24), dirtMat, [0, 0.04, 0]).rotation.x = -Math.PI / 2;
  // tents
  const tentMat = new THREE.MeshStandardMaterial({ color: 0x4a3228, roughness: 0.85 });
  for (const [tx, tz] of [[-3.5, -3], [3.2, -2.4], [-1.5, 3.8]]) {
    const tent = addMesh(camp, new THREE.ConeGeometry(1.8, 2.4, 4), tentMat, [tx, 1.2, tz], true);
    tent.rotation.y = Math.PI / 4 + tz * 0.1;
    addMesh(camp, new THREE.BoxGeometry(0.7, 1.1, 0.08), new THREE.MeshStandardMaterial({ color: 0x1a1210 }), [tx, 0.55, tz + 1.15], false);
    colliders.push(cylCol(58 + tx, 6 + tz, 1.5, 0, 2.2));
  }
  // palisade
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI + 0.4;
    const x = Math.cos(a) * 8, z = Math.sin(a) * 8;
    addMesh(camp, new THREE.CylinderGeometry(0.1, 0.13, 1.8, 6), woodMat, [x, 0.9, z], true);
  }
  // excavation pit
  addMesh(camp, new THREE.CylinderGeometry(1.8, 2.1, 0.5, 14), new THREE.MeshStandardMaterial({ color: 0x2a1810, roughness: 1 }), [2.2, -0.05, 1.5], false);
  const glow = addMesh(camp, new THREE.CircleGeometry(1.4, 16),
    new THREE.MeshStandardMaterial({ color: 0xff6622, emissive: 0xff4400, emissiveIntensity: 0.8 }),
    [2.2, 0.22, 1.5], false);
  glow.rotation.x = -Math.PI / 2;
  const pitLight = new THREE.PointLight(0xff5511, 1.6, 10);
  pitLight.position.set(60.2, 1.2, 7.5);
  scene.add(pitLight);

  // campfire
  const logs = addMesh(camp, new THREE.CylinderGeometry(0.08, 0.08, 1.1, 6), woodMat, [0, 0.2, 0], false);
  logs.rotation.z = 1.2;
  addMesh(camp, new THREE.CylinderGeometry(0.08, 0.08, 1.1, 6), woodMat, [0, 0.2, 0], false).rotation.z = -1.0;
  const flame = makeFlame();
  flame.position.set(0, 0.55, 0);
  camp.add(flame);
  const fireLight = new THREE.PointLight(0xff7722, 2.2, 14);
  fireLight.position.set(58, 1.4, 6);
  if (quality !== "low") fireLight.castShadow = false;
  scene.add(fireLight);
  updaters.push((t) => {
    fireLight.intensity = 1.8 + Math.sin(t * 11) * 0.4 + Math.sin(t * 23) * 0.2;
    flame.scale.y = 1 + Math.sin(t * 13) * 0.15;
    flame.rotation.y += 0.04;
    glow.material.emissiveIntensity = 0.7 + Math.sin(t * 3) * 0.2;
  });
  // crates / totem
  addMesh(camp, new THREE.BoxGeometry(0.8, 0.8, 0.8), woodMat, [4, 0.4, 2], true);
  addMesh(camp, new THREE.CylinderGeometry(0.15, 0.2, 2.4, 8), woodMat, [-4.5, 1.2, 2.2], true);
  addMesh(camp, new THREE.SphereGeometry(0.28, 8, 6), new THREE.MeshStandardMaterial({ color: 0x66220f, emissive: 0x441100, emissiveIntensity: 0.4 }), [-4.5, 2.5, 2.2], false);
  colliders.push(cylCol(58, 6, 0.7, 0, 1));

  // ---- crystal ship in the distance ----
  const ship = makeCrystalShip();
  ship.position.set(42, 34, -78);
  ship.scale.setScalar(1.4);
  scene.add(ship);
  updaters.push((t) => {
    ship.position.y = 34 + Math.sin(t * 0.35) * 1.2;
    ship.rotation.y = 0.4 + Math.sin(t * 0.15) * 0.08;
    ship.position.x = 42 + t * 0.02;
    if (ship.userData.boost) {
      ship.position.y -= dtSafe(t) * 0.8;
    }
  });

  // godray planes
  if (quality !== "low") {
    const rayMat = new THREE.MeshBasicMaterial({
      color: 0xffe0a8, transparent: true, opacity: 0.055, depthWrite: false,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    });
    for (let i = 0; i < 7; i++) {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(6 + i, 28), rayMat.clone());
      p.position.set(-8 + i * 3.5, 14, -6 - i * 1.5);
      p.rotation.x = 0.55;
      p.rotation.z = -0.35;
      group.add(p);
      updaters.push((t) => { p.material.opacity = 0.04 + Math.sin(t * 0.6 + i) * 0.015; });
    }
  }

  // dust motes
  const dust = makeDust(quality === "high" ? 280 : 140);
  scene.add(dust);
  updaters.push((t) => { dust.rotation.y = t * 0.02; dust.position.y = Math.sin(t * 0.3) * 0.2; });

  // invisible walls
  const bounds = [
    boxCol({ x: -42, z: -55, y: 0 }, { x: 80, z: -54, y: 8 }),
    boxCol({ x: -42, z: 38, y: 0 }, { x: 80, z: 39, y: 8 }),
    boxCol({ x: -43, z: -55, y: 0 }, { x: -42, z: 39, y: 8 }),
    boxCol({ x: 79, z: -55, y: 0 }, { x: 80, z: 39, y: 8 }),
  ];
  bounds.forEach((b) => colliders.push(b));

  const npcSpots = {
    aurora: new THREE.Vector3(3.6, 0, 6.4),
    lilisika: new THREE.Vector3(8.2, 0, 10.1),
    ailian: new THREE.Vector3(3.6, 0.2, -20.6),
    viola: new THREE.Vector3(-14.2, 0, -7.5),
  };
  const enemySpawns = [
    new THREE.Vector3(55.5, 0, 3.2),
    new THREE.Vector3(61.2, 0, 8.5),
    new THREE.Vector3(54.0, 0, 9.4),
    new THREE.Vector3(62.8, 0, 3.8),
  ];
  const bossSpawn = new THREE.Vector3(58.4, 0, 6.2);
  const playerSpawn = new THREE.Vector3(0, 0, 16.5);

  let lastT = 0;
  function dtSafe(t) { const d = t - lastT; lastT = t; return Math.min(0.05, Math.max(0, d)); }

  cameraMeshes.push(...group.children.filter((c) => c.isMesh));

  return {
    group, colliders, cameraMeshes, npcSpots, enemySpawns, bossSpawn, playerSpawn,
    ship, fireLight, sun, sky,
    getHeight(x, z) {
      // cathedral stairs / platform
      if (x > -8 && x < 8 && z < -20.5 && z > -42) {
        if (z < -23.5) return 1.2;
        const k = (-20.5 - z) / 3;
        return THREE.MathUtils.clamp(k, 0, 1) * 1.2;
      }
      return 0;
    },
    update(t) { updaters.forEach((fn) => fn(t)); },
    revealShip() { ship.userData.boost = true; ship.traverse((o) => {
      if (o.material && o.material.emissive) o.material.emissiveIntensity = (o.material.emissiveIntensity || 0.4) + 0.6;
    }); },
  };
}

function std(map, color, roughness, metalness) {
  return new THREE.MeshStandardMaterial({ map, color, roughness, metalness });
}
function waterMat(textures) {
  return new THREE.MeshStandardMaterial({
    map: textures.water, color: 0x7ec8e3, transparent: true, opacity: 0.75,
    roughness: 0.15, metalness: 0.35, envMapIntensity: 1.2,
  });
}
function barkMat(textures) {
  return new THREE.MeshStandardMaterial({ map: textures.bark, color: 0x5a3a24, roughness: 0.92 });
}
function leafMat(textures) {
  return new THREE.MeshStandardMaterial({ map: textures.leaf, color: 0x4a8a38, roughness: 0.85 });
}

function addMesh(parent, geo, mat, pos, shadow = true, rotY = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(pos[0], pos[1], pos[2]);
  m.rotation.y = rotY;
  m.castShadow = shadow;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

function addForest(group, textures, trunkMat, foliageMat, colliders, quality) {
  const count = quality === "low" ? 46 : quality === "high" ? 90 : 68;
  const trunkGeo = new THREE.CylinderGeometry(0.18, 0.28, 3.2, 6);
  const leafGeo = new THREE.ConeGeometry(1.55, 2.6, 7);
  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, count);
  const leaves = new THREE.InstancedMesh(leafGeo, foliageMat, count);
  trunks.castShadow = leaves.castShadow = true;
  trunks.receiveShadow = leaves.receiveShadow = true;
  const dummy = new THREE.Object3D();
  let i = 0, guard = 0;
  while (i < count && guard < 800) {
    guard++;
    const x = -30 + Math.random() * 110;
    const z = -40 + Math.random() * 85;
    const inPlaza = Math.hypot(x, z) < 28;
    const inCamp = Math.hypot(x - 58, z - 6) < 11;
    const onPath = x > 20 && x < 70 && Math.abs(z - 5) < 5.5;
    const inCat = x > -20 && x < 20 && z < -16 && z > -48;
    if (inPlaza || inCamp || onPath || inCat) continue;
    const s = 0.8 + Math.random() * 1.3;
    dummy.position.set(x, 1.6 * s, z);
    dummy.scale.set(s, s, s);
    dummy.rotation.y = Math.random() * 6;
    dummy.updateMatrix();
    trunks.setMatrixAt(i, dummy.matrix);
    dummy.position.y = 3.6 * s;
    dummy.scale.set(s * 1.35, s * 1.25, s * 1.35);
    dummy.updateMatrix();
    leaves.setMatrixAt(i, dummy.matrix);
    if (Math.hypot(x, z) < 70) colliders.push(cylCol(x, z, 0.45 * s, 0, 3 * s));
    i++;
  }
  group.add(trunks); group.add(leaves);
}


function makeGradientSky() {
  const geo = new THREE.SphereGeometry(480, 48, 32);
  const colors = [];
  const pos = geo.attributes.position;
  const cHorizon = new THREE.Color(0xff8a3a);
  const cLow = new THREE.Color(0xffc078);
  const cZenith = new THREE.Color(0x5a6e9a);
  const cSun = new THREE.Color(0xfff1c2);
  const tmp = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) / 480;
    const y = pos.getY(i) / 480;
    const z = pos.getZ(i) / 480;
    if (y < 0.02) tmp.copy(cHorizon).lerp(cLow, Math.max(0, (y + 0.15) / 0.17));
    else tmp.copy(cLow).lerp(cZenith, Math.pow(Math.min(1, y), 0.75));
    const sunDot = x * -0.55 + y * 0.28 + z * 0.35;
    if (sunDot > 0.55) tmp.lerp(cSun, Math.min(1, (sunDot - 0.55) / 0.45));
    colors.push(tmp.r, tmp.g, tmp.b);
  }
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  const mat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  return mesh;
}

function makeFountainParticles() {
  const n = 80;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * 0.3;
    pos[i * 3] = Math.cos(a) * r;
    pos[i * 3 + 1] = Math.random() * 1.6;
    pos[i * 3 + 2] = Math.sin(a) * r;
  }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  return new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xc8eefe, size: 0.07, transparent: true, opacity: 0.75 }));
}

function makeFlame() {
  const g = new THREE.Group();
  const m = new THREE.MeshStandardMaterial({ color: 0xff6611, emissive: 0xff4400, emissiveIntensity: 1.2, transparent: true, opacity: 0.85 });
  const a = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.7, 8), m);
  const b = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.45, 8), new THREE.MeshStandardMaterial({ color: 0xffee88, emissive: 0xffaa33, emissiveIntensity: 1 }));
  b.position.y = 0.2;
  g.add(a); g.add(b);
  return g;
}

function makeDust(n) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    pos[i * 3] = (Math.random() - 0.4) * 80;
    pos[i * 3 + 1] = 1 + Math.random() * 10;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 70;
  }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  return new THREE.Points(geo, new THREE.PointsMaterial({
    color: 0xffe6b0, size: 0.08, transparent: true, opacity: 0.35, depthWrite: false,
    blending: THREE.AdditiveBlending,
  }));
}

function makeCrystalShip() {
  const g = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.OctahedronGeometry(3.2, 1), new THREE.MeshStandardMaterial({
    color: 0xa8e0ff, roughness: 0.15, metalness: 0.35, transparent: true, opacity: 0.75,
    emissive: 0x3377aa, emissiveIntensity: 0.45,
  }));
  hull.scale.set(1.8, 0.45, 0.7);
  g.add(hull);
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.7, 12, 10), new THREE.MeshStandardMaterial({
    color: 0xffffff, emissive: 0x88ddff, emissiveIntensity: 1.2,
  }));
  g.add(core);
  for (const sx of [-2.4, 2.4]) {
    const wing = new THREE.Mesh(new THREE.ConeGeometry(0.8, 3.4, 5), new THREE.MeshStandardMaterial({
      color: 0xc8f0ff, transparent: true, opacity: 0.55, emissive: 0x66aadd, emissiveIntensity: 0.35,
    }));
    wing.rotation.z = sx > 0 ? -1.2 : 1.2;
    wing.position.set(sx, 0, 0);
    g.add(wing);
  }
  return g;
}

export function resolveCollision(pos, radius, colliders) {
  for (const c of colliders) {
    if (c.type === "cyl") {
      const dx = pos.x - c.x, dz = pos.z - c.z;
      const d = Math.hypot(dx, dz);
      const min = radius + c.r;
      if (d < min && d > 1e-5 && pos.y < c.y1 && pos.y + 1.6 > c.y0) {
        const k = (min - d) / d;
        pos.x += dx * k;
        pos.z += dz * k;
      }
    } else {
      const minx = c.min.x - radius, maxx = c.max.x + radius;
      const minz = c.min.z - radius, maxz = c.max.z + radius;
      if (pos.x > minx && pos.x < maxx && pos.z > minz && pos.z < maxz && pos.y < c.max.y && pos.y + 1.6 > c.min.y) {
        const l = pos.x - minx, r = maxx - pos.x, t = pos.z - minz, b = maxz - pos.z;
        const m = Math.min(l, r, t, b);
        if (m === l) pos.x = minx;
        else if (m === r) pos.x = maxx;
        else if (m === t) pos.z = minz;
        else pos.z = maxz;
      }
    }
  }
  return pos;
}
