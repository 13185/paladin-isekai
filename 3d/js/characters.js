import * as THREE from "three";

const geo = {
  head: new THREE.SphereGeometry(0.125, 16, 14),
  neck: new THREE.CylinderGeometry(0.045, 0.05, 0.08, 8),
  chest: new THREE.BoxGeometry(0.38, 0.32, 0.2),
  waist: new THREE.BoxGeometry(0.28, 0.16, 0.16),
  hips: new THREE.BoxGeometry(0.34, 0.14, 0.18),
  arm: new THREE.CapsuleGeometry(0.045, 0.2, 6, 8),
  forearm: new THREE.CapsuleGeometry(0.04, 0.18, 6, 8),
  hand: new THREE.SphereGeometry(0.05, 8, 8),
  thigh: new THREE.CapsuleGeometry(0.065, 0.28, 6, 8),
  shin: new THREE.CapsuleGeometry(0.05, 0.28, 6, 8),
  foot: new THREE.BoxGeometry(0.1, 0.06, 0.2),
  horn: new THREE.ConeGeometry(0.045, 0.2, 8),
  ear: new THREE.ConeGeometry(0.035, 0.16, 6),
};

function mat(color, extras = {}) {
  return new THREE.MeshStandardMaterial({
    color, roughness: extras.roughness ?? 0.65, metalness: extras.metalness ?? 0.05,
    emissive: extras.emissive ?? 0x000000, emissiveIntensity: extras.emissiveIntensity ?? 0,
    map: extras.map ?? null, side: extras.side ?? THREE.FrontSide,
  });
}

function mesh(geometry, material, pos, parent) {
  const m = new THREE.Mesh(geometry, material);
  m.castShadow = true;
  m.receiveShadow = true;
  if (pos) m.position.set(pos[0], pos[1], pos[2]);
  if (parent) parent.add(m);
  return m;
}

export function createHumanoid(spec) {
  const g = new THREE.Group();
  g.name = spec.id;
  const scale = spec.scale || 1;
  const skin = mat(spec.skin || 0xe8c4a0, { roughness: 0.72 });
  const hairM = mat(spec.hair || 0xd4a017, { roughness: 0.45 });
  const cloth = mat(spec.cloth || 0x8b1e2d, { roughness: 0.8 });
  const cloth2 = mat(spec.cloth2 || 0x2a1a14, { roughness: 0.75 });
  const armor = mat(spec.armor || 0xc5cdd6, { roughness: 0.32, metalness: 0.78 });
  const gold = mat(spec.trim || 0xd4af37, { roughness: 0.35, metalness: 0.7 });
  const dark = mat(0x1a1210, { roughness: 0.7 });

  const hips = new THREE.Group();
  hips.position.y = 0.95 * scale;
  g.add(hips);

  const hipMesh = mesh(geo.hips, spec.armorLower ? armor : cloth, [0, 0, 0], hips);
  hipMesh.scale.set(spec.hipScale || 1, 1, spec.depthScale || 1);

  const waist = new THREE.Group();
  waist.position.y = 0.14;
  hips.add(waist);
  mesh(geo.waist, cloth2, [0, 0.02, 0], waist).scale.set(spec.waistScale || 0.95, 1, 1);

  const chest = new THREE.Group();
  chest.position.y = 0.2;
  waist.add(chest);
  const chestMesh = mesh(geo.chest, spec.useArmor !== false ? armor : cloth, [0, 0.08, 0], chest);
  chestMesh.scale.set(spec.bustScale || 1, spec.chestH || 1, spec.depthScale || 1);
  if (spec.openArmor) {
    // dark undershirt visible in a V
    const v = mesh(new THREE.BoxGeometry(0.14, 0.22, 0.06), cloth2, [0, 0.06, 0.08], chest);
    v.scale.set(1, 1, 1);
  }
  if (spec.bustScale && spec.bustScale > 1.05) {
    const bm = mat(spec.cloth || spec.armor || 0xc5cdd6, { roughness: 0.7, metalness: spec.useArmor === false ? 0.05 : 0.3 });
    mesh(new THREE.SphereGeometry(0.09 * spec.bustScale, 12, 10), bm, [-0.09, 0.1, 0.09], chest);
    mesh(new THREE.SphereGeometry(0.09 * spec.bustScale, 12, 10), bm, [0.09, 0.1, 0.09], chest);
  }

  const neck = mesh(geo.neck, skin, [0, 0.28, 0], chest);
  const head = new THREE.Group();
  head.position.set(0, 0.4, 0);
  chest.add(head);
  mesh(geo.head, skin, [0, 0, 0], head);
  // hair cap
  const hair = mesh(new THREE.SphereGeometry(0.132, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.58), hairM, [0, 0.03, 0], head);
  hair.rotation.x = -0.15;
  if (spec.hairLong) {
    const back = mesh(new THREE.CapsuleGeometry(0.09, spec.hairLong, 6, 8), hairM, [0, -spec.hairLong * 0.35, -0.08], head);
    back.rotation.x = 0.35;
  }
  if (spec.twinTails) {
    mesh(new THREE.CapsuleGeometry(0.04, 0.28, 6, 8), hairM, [-0.12, -0.08, -0.04], head).rotation.z = 0.5;
    mesh(new THREE.CapsuleGeometry(0.04, 0.28, 6, 8), hairM, [0.12, -0.08, -0.04], head).rotation.z = -0.5;
  }
  // simple face
  const eyeM = mat(spec.eye || 0x223344, { roughness: 0.3 });
  mesh(new THREE.SphereGeometry(0.018, 8, 8), eyeM, [-0.04, 0.01, 0.11], head);
  mesh(new THREE.SphereGeometry(0.018, 8, 8), eyeM, [0.04, 0.01, 0.11], head);
  if (spec.eyepatch) {
    mesh(new THREE.BoxGeometry(0.07, 0.035, 0.03), dark, [-0.045, 0.015, 0.12], head);
  }

  if (spec.elfEars) {
    const e1 = mesh(geo.ear, skin, [-0.13, 0.04, 0], head); e1.rotation.z = 0.9; e1.rotation.y = 0.4;
    const e2 = mesh(geo.ear, skin, [0.13, 0.04, 0], head); e2.rotation.z = -0.9; e2.rotation.y = -0.4;
  }
  if (spec.cowHorns) {
    const h1 = mesh(geo.horn, mat(0x4a3728, { roughness: 0.55 }), [-0.12, 0.16, 0], head);
    h1.rotation.z = 0.7; h1.rotation.x = -0.4;
    const h2 = mesh(geo.horn, mat(0x4a3728, { roughness: 0.55 }), [0.12, 0.16, 0], head);
    h2.rotation.z = -0.7; h2.rotation.x = -0.4;
    const earM = mat(spec.skin || 0xc48a5a, { roughness: 0.7 });
    mesh(new THREE.SphereGeometry(0.045, 8, 8), earM, [-0.14, 0.04, 0], head);
    mesh(new THREE.SphereGeometry(0.045, 8, 8), earM, [0.14, 0.04, 0], head);
  }
  if (spec.succubusHorns) {
    const hm = mat(0x2a1020, { roughness: 0.4 });
    const h1 = mesh(geo.horn, hm, [-0.09, 0.14, 0.02], head); h1.rotation.z = 0.35; h1.rotation.x = -0.6;
    const h2 = mesh(geo.horn, hm, [0.09, 0.14, 0.02], head); h2.rotation.z = -0.35; h2.rotation.x = -0.6;
  }
  if (spec.crown) {
    mesh(new THREE.TorusGeometry(0.11, 0.012, 8, 16), gold, [0, 0.1, 0], head).rotation.x = Math.PI / 2;
  }

  function makeArm(side) {
    const root = new THREE.Group();
    root.position.set(0.24 * side, 0.18, 0);
    chest.add(root);
    const upper = mesh(geo.arm, spec.bareArms ? skin : (spec.useArmor !== false ? armor : cloth), [0, -0.14, 0], root);
    const fore = new THREE.Group();
    fore.position.set(0, -0.28, 0);
    root.add(fore);
    mesh(geo.forearm, spec.bareArms ? skin : cloth, [0, -0.12, 0], fore);
    const hand = mesh(geo.hand, skin, [0, -0.26, 0], fore);
    root.userData.fore = fore;
    root.userData.hand = hand;
    return root;
  }
  const armL = makeArm(-1);
  const armR = makeArm(1);

  function makeLeg(side) {
    const root = new THREE.Group();
    root.position.set(0.1 * side, -0.06, 0);
    hips.add(root);
    mesh(geo.thigh, spec.bareLegs ? skin : cloth, [0, -0.2, 0], root);
    const shin = new THREE.Group();
    shin.position.set(0, -0.38, 0);
    root.add(shin);
    mesh(geo.shin, spec.bareLegs ? skin : dark, [0, -0.18, 0], shin);
    mesh(geo.foot, dark, [0, -0.34, 0.04], shin);
    root.userData.shin = shin;
    return root;
  }
  const legL = makeLeg(-1);
  const legR = makeLeg(1);

  let cape = null;
  if (spec.cape) {
    cape = mesh(new THREE.PlaneGeometry(0.7, 1.05, 6, 8), mat(spec.cape, { roughness: 0.85, side: THREE.DoubleSide }), [0, -0.15, -0.14], chest);
    cape.geometry.translate(0, -0.45, 0);
  }
  let tail = null;
  if (spec.tail) {
    tail = new THREE.Group();
    tail.position.set(0, 0.02, -0.1);
    hips.add(tail);
    mesh(new THREE.CapsuleGeometry(0.03, 0.45, 5, 8), mat(spec.tail, { roughness: 0.5 }), [0, -0.15, -0.2], tail).rotation.x = 0.9;
    if (spec.heartTip) {
      mesh(new THREE.SphereGeometry(0.045, 8, 8), mat(0xd44a6a), [0, -0.38, -0.38], tail);
    }
  }
  let wings = null;
  if (spec.wings) {
    wings = new THREE.Group();
    wings.position.set(0, 0.15, -0.1);
    chest.add(wings);
    const wm = mat(spec.wings, { roughness: 0.65, side: THREE.DoubleSide });
    const w1 = mesh(new THREE.PlaneGeometry(0.35, 0.28), wm, [-0.22, 0.05, -0.05], wings); w1.rotation.y = 0.5; w1.rotation.z = 0.3;
    const w2 = mesh(new THREE.PlaneGeometry(0.35, 0.28), wm, [0.22, 0.05, -0.05], wings); w2.rotation.y = -0.5; w2.rotation.z = -0.3;
  }

  let weapon = null;
  if (spec.weapon === "hammer") {
    weapon = new THREE.Group();
    armR.userData.hand.add(weapon);
    weapon.position.set(0, -0.05, 0.02);
    mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.7, 8), mat(0x5a3a22, { roughness: 0.6 }), [0, -0.15, 0], weapon);
    const headH = mesh(new THREE.BoxGeometry(0.22, 0.14, 0.14), gold, [0, 0.22, 0], weapon);
    headH.material.emissive = new THREE.Color(0x553300);
    headH.material.emissiveIntensity = 0.25;
  } else if (spec.weapon === "staff") {
    weapon = new THREE.Group();
    armR.userData.hand.add(weapon);
    mesh(new THREE.CylinderGeometry(0.016, 0.02, 1.15, 8), gold, [0, 0.2, 0], weapon);
    mesh(new THREE.SphereGeometry(0.07, 10, 10), mat(0xa8e6ff, { roughness: 0.2, metalness: 0.3, emissive: 0x3377aa, emissiveIntensity: 0.6 }), [0, 0.78, 0], weapon);
  } else if (spec.weapon === "daggers") {
    weapon = new THREE.Group();
    armR.userData.hand.add(weapon);
    mesh(new THREE.BoxGeometry(0.03, 0.28, 0.02), armor, [0, -0.1, 0], weapon);
  } else if (spec.weapon === "axe") {
    weapon = new THREE.Group();
    armR.userData.hand.add(weapon);
    mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.8, 8), dark, [0, 0.1, 0], weapon);
    mesh(new THREE.BoxGeometry(0.28, 0.18, 0.04), armor, [0.12, 0.4, 0], weapon);
  } else if (spec.weapon === "mace") {
    weapon = new THREE.Group();
    armR.userData.hand.add(weapon);
    mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.85, 8), dark, [0, 0.15, 0], weapon);
    const ball = mesh(new THREE.SphereGeometry(0.12, 10, 8), mat(0x44221a, { roughness: 0.4, metalness: 0.5, emissive: 0xff4400, emissiveIntensity: 0.5 }), [0, 0.55, 0], weapon);
    weapon.userData.glow = ball;
  }

  // belt / trim
  mesh(new THREE.BoxGeometry(0.36, 0.04, 0.2), gold, [0, 0.06, 0], hips);

  g.scale.setScalar(scale);
  g.userData.parts = { hips, waist, chest, head, armL, armR, legL, legR, cape, tail, wings, weapon };
  g.userData.spec = spec;
  g.userData.walkPhase = Math.random() * Math.PI * 2;
  g.userData.anim = "idle";
  g.userData.attackT = 0;
  return g;
}

export function tickHumanoid(obj, dt, info) {
  const p = obj.userData.parts;
  if (!p) return;
  const t = info.time;
  if (info.attacking) obj.userData.attackT = 0.28;
  if (obj.userData.attackT > 0) obj.userData.attackT -= dt;

  if (info.dead) {
    obj.rotation.x = THREE.MathUtils.lerp(obj.rotation.x, -Math.PI / 2, 0.15);
    return;
  } else {
    obj.rotation.x = THREE.MathUtils.lerp(obj.rotation.x, 0, 0.2);
  }

  if (info.moving && info.mag > 0.1) {
    obj.userData.walkPhase += dt * (6 + info.mag * 6) * (info.sprint ? 1.25 : 1);
    const s = Math.sin(obj.userData.walkPhase);
    p.legL.rotation.x = s * 0.75 * info.mag;
    p.legR.rotation.x = -s * 0.75 * info.mag;
    if (p.legL.userData.shin) p.legL.userData.shin.rotation.x = Math.max(0, -s) * 0.4;
    if (p.legR.userData.shin) p.legR.userData.shin.rotation.x = Math.max(0, s) * 0.4;
    if (obj.userData.attackT <= 0) {
      p.armL.rotation.x = -s * 0.55 * info.mag;
      p.armR.rotation.x = s * 0.55 * info.mag;
    }
    p.waist.rotation.y = s * 0.08;
    p.chest.rotation.x = -0.05 * info.mag;
  } else {
    const damp = 1 - Math.pow(0.001, dt);
    p.legL.rotation.x = THREE.MathUtils.lerp(p.legL.rotation.x, 0.05, damp);
    p.legR.rotation.x = THREE.MathUtils.lerp(p.legR.rotation.x, 0.05, damp);
    if (obj.userData.attackT <= 0) {
      p.armL.rotation.x = THREE.MathUtils.lerp(p.armL.rotation.x, 0.12, damp);
      p.armR.rotation.x = THREE.MathUtils.lerp(p.armR.rotation.x, 0.12, damp);
    }
    p.waist.position.y = 0.14 + Math.sin(t * 2.1) * 0.012;
    p.chest.rotation.x = Math.sin(t * 2.1) * 0.02;
  }

  if (obj.userData.attackT > 0) {
    const k = obj.userData.attackT / 0.28;
    p.armR.rotation.x = -1.4 * Math.sin((1 - k) * Math.PI);
    p.armR.rotation.z = 0.4 * Math.sin((1 - k) * Math.PI);
  } else {
    p.armR.rotation.z = THREE.MathUtils.lerp(p.armR.rotation.z, 0.08, 0.2);
    p.armL.rotation.z = THREE.MathUtils.lerp(p.armL.rotation.z, -0.08, 0.2);
  }

  if (p.cape) {
    const w = Math.sin(t * 3 + obj.userData.walkPhase) * 0.12 + (info.moving ? 0.25 : 0.08);
    p.cape.rotation.x = w;
  }
  if (p.tail) {
    p.tail.rotation.y = Math.sin(t * 2.4) * 0.35;
    p.tail.rotation.x = 0.2 + Math.sin(t * 3.1) * 0.08;
  }
  if (p.wings) {
    const flap = 0.25 + Math.sin(t * 4) * 0.15;
    p.wings.rotation.y = Math.sin(t * 2) * 0.08;
    p.wings.children.forEach((w, i) => { w.rotation.z = (i === 0 ? 1 : -1) * flap; });
  }
  if (info.stunned) {
    p.head.rotation.y = Math.sin(t * 20) * 0.15;
  }
}

export function createRoland() {
  return createHumanoid({
    id: "roland",
    skin: 0xe8c4a0,
    hair: 0xd4a017,
    cloth: 0x6b1a22,
    cloth2: 0x2a1a14,
    armor: 0xcfd5dc,
    trim: 0xd4af37,
    cape: 0x8b1e2d,
    openArmor: true,
    useArmor: true,
    weapon: "hammer",
    scale: 1.02,
  });
}

export function createAurora() {
  return createHumanoid({
    id: "aurora",
    skin: 0xc48a5a,
    hair: 0xf4f0e6,
    hairLong: 0.55,
    cloth: 0xf0d4a0,
    cloth2: 0xb8860b,
    armor: 0xe8d2a4,
    useArmor: false,
    bareArms: true,
    cowHorns: true,
    bustScale: 1.28,
    hipScale: 1.18,
    waistScale: 0.88,
    scale: 1.08,
    eye: 0x5a3a18,
    weapon: "staff",
  });
}

export function createLilisika() {
  return createHumanoid({
    id: "lilisika",
    skin: 0xebb6c4,
    hair: 0xc45ad4,
    hairLong: 0.5,
    cloth: 0x1a0a12,
    cloth2: 0x4a1020,
    armor: 0x2a0810,
    useArmor: false,
    succubusHorns: true,
    tail: 0x6a2040,
    heartTip: true,
    wings: 0x3a1530,
    bustScale: 1.22,
    hipScale: 1.12,
    scale: 0.98,
    eye: 0x882266,
    weapon: null,
  });
}

export function createAilian() {
  return createHumanoid({
    id: "ailian",
    skin: 0xf0d5c4,
    hair: 0xe8e8f0,
    hairLong: 0.7,
    cloth: 0xf5f2e8,
    cloth2: 0xc5d5e0,
    armor: 0xeef2f6,
    useArmor: false,
    elfEars: true,
    crown: true,
    bustScale: 1.12,
    scale: 1.04,
    eye: 0x2d8a4a,
    weapon: "staff",
    bareArms: true,
  });
}

export function createViola() {
  return createHumanoid({
    id: "viola",
    skin: 0xc5c8d0,
    hair: 0x8a7a9a,
    cloth: 0x1a1a22,
    cloth2: 0x0d0d12,
    armor: 0x2a2a33,
    useArmor: false,
    eyepatch: true,
    bustScale: 1.1,
    scale: 0.99,
    eye: 0x88aacc,
    weapon: "daggers",
  });
}

export function createCultist(isBoss = false) {
  const c = createHumanoid({
    id: isBoss ? "boss" : "cultist",
    skin: 0x6a5348,
    hair: 0x1a1210,
    cloth: isBoss ? 0x4a1810 : 0x3a322c,
    cloth2: 0x1a1210,
    armor: isBoss ? 0x5a2a18 : 0x3a322c,
    useArmor: isBoss,
    scale: isBoss ? 1.28 : 1.0 + Math.random() * 0.08,
    eye: 0xff3300,
    weapon: isBoss ? "mace" : "axe",
  });
  // hood
  const hood = new THREE.Mesh(
    new THREE.ConeGeometry(0.22, 0.32, 10),
    new THREE.MeshStandardMaterial({ color: isBoss ? 0x5a1810 : 0x2a2420, roughness: 0.85 })
  );
  hood.position.set(0, 0.12, 0);
  hood.castShadow = true;
  c.userData.parts.head.add(hood);
  if (isBoss) {
    const cracks = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0xff5500, emissive: 0xff3300, emissiveIntensity: 0.8, transparent: true, opacity: 0.35 })
    );
    c.userData.parts.chest.add(cracks);
    cracks.position.set(0, 0.08, 0.1);
  }
  return c;
}

export function makeNameplate(text, color = "#f6ead0") {
  const c = document.createElement("canvas");
  c.width = 256; c.height = 64;
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, 256, 64);
  ctx.font = "bold 28px sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(12,6,8,0.55)";
  const w = ctx.measureText(text).width + 24;
  ctx.fillRect(128 - w / 2, 14, w, 38);
  ctx.fillStyle = color;
  ctx.fillText(text, 128, 42);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  spr.scale.set(1.6, 0.4, 1);
  spr.position.y = 2.15;
  return spr;
}
