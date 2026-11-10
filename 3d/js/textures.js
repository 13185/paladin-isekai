import * as THREE from "three";

function canvas(size = 512) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  return { c, ctx, size };
}

function rand(a, b) { return a + Math.random() * (b - a); }

function toTex(c, repeat = 4) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

function onceTex(c) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

export function createTextures() {
  const stone = makeStone();
  const marble = makeMarble();
  const brick = makeBrick();
  const grass = makeGrass();
  const dirt = makeDirt();
  const roof = makeRoof();
  const wood = makeWood();
  const banner = makeBanner();
  const glass = makeStainedGlass();
  const water = makeWater();
  const goldTrim = makeGold();
  const bark = makeBark();
  const leaf = makeLeaf();
  return { stone, marble, brick, grass, dirt, roof, wood, banner, glass, water, goldTrim, bark, leaf };
}

function makeStone() {
  const { c, ctx, size } = canvas(512);
  ctx.fillStyle = "#8a8174";
  ctx.fillRect(0, 0, size, size);
  const tiles = 8, tw = size / tiles;
  for (let y = 0; y < tiles; y++) for (let x = 0; x < tiles; x++) {
    const n = rand(0.78, 1.08);
    ctx.fillStyle = `rgb(${(140*n)|0},${(128*n)|0},${(108*n)|0})`;
    ctx.fillRect(x * tw + 2, y * tw + 2, tw - 4, tw - 4);
    ctx.strokeStyle = "rgba(40,32,24,0.45)";
    ctx.lineWidth = 3;
    ctx.strokeRect(x * tw + 1.5, y * tw + 1.5, tw - 3, tw - 3);
    for (let i = 0; i < 18; i++) {
      ctx.fillStyle = `rgba(30,24,18,${rand(0.04,0.14)})`;
      ctx.fillRect(x * tw + rand(4, tw - 6), y * tw + rand(4, tw - 6), rand(1, 3), rand(1, 3));
    }
  }
  return toTex(c, 6);
}

function makeMarble() {
  const { c, ctx, size } = canvas(512);
  const g = ctx.createLinearGradient(0, 0, size, size);
  g.addColorStop(0, "#f3ecdf");
  g.addColorStop(1, "#d9cbb3");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 18; i++) {
    ctx.beginPath();
    ctx.strokeStyle = `rgba(160,140,110,${rand(0.15,0.4)})`;
    ctx.lineWidth = rand(1, 3);
    let x = rand(0, size), y = rand(0, size);
    ctx.moveTo(x, y);
    for (let k = 0; k < 8; k++) {
      x += rand(-40, 80); y += rand(-20, 60);
      ctx.quadraticCurveTo(x + rand(-30, 30), y + rand(-30, 30), x, y);
    }
    ctx.stroke();
  }
  const t = toTex(c, 3);
  return t;
}

function makeBrick() {
  const { c, ctx, size } = canvas(512);
  ctx.fillStyle = "#4a342c";
  ctx.fillRect(0, 0, size, size);
  const bh = 32, bw = 64;
  for (let y = 0, row = 0; y < size; y += bh, row++) {
    const off = row % 2 ? bw / 2 : 0;
    for (let x = -bw; x < size; x += bw) {
      const n = rand(0.85, 1.1);
      ctx.fillStyle = `rgb(${(130*n)|0},${(72*n)|0},${(52*n)|0})`;
      ctx.fillRect(x + off + 2, y + 2, bw - 4, bh - 4);
    }
  }
  return toTex(c, 4);
}

function makeGrass() {
  const { c, ctx, size } = canvas(512);
  ctx.fillStyle = "#3d6a32";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 5000; i++) {
    ctx.fillStyle = `rgba(${20+rand(0,50)|0},${80+rand(0,90)|0},${20+rand(0,30)|0},${rand(0.3,0.8)})`;
    ctx.fillRect(rand(0, size), rand(0, size), rand(1, 3), rand(3, 8));
  }
  return toTex(c, 8);
}

function makeDirt() {
  const { c, ctx, size } = canvas(256);
  ctx.fillStyle = "#6b4b32";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 800; i++) {
    ctx.fillStyle = `rgba(${80+rand(0,50)|0},${50+rand(0,30)|0},${30+rand(0,20)|0},${rand(0.2,0.6)})`;
    ctx.beginPath(); ctx.arc(rand(0,size), rand(0,size), rand(1,4), 0, Math.PI*2); ctx.fill();
  }
  return toTex(c, 4);
}

function makeRoof() {
  const { c, ctx, size } = canvas(256);
  ctx.fillStyle = "#6a2a22";
  ctx.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y += 14) {
    ctx.fillStyle = y % 28 ? "#7c3228" : "#5a221c";
    ctx.fillRect(0, y, size, 12);
    ctx.strokeStyle = "rgba(30,10,8,0.4)";
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(size, y); ctx.stroke();
  }
  return toTex(c, 3);
}

function makeWood() {
  const { c, ctx, size } = canvas(256);
  ctx.fillStyle = "#6b4426";
  ctx.fillRect(0, 0, size, size);
  for (let x = 0; x < size; x += 32) {
    ctx.fillStyle = `rgb(${90+rand(0,30)|0},${55+rand(0,20)|0},${28+rand(0,12)|0})`;
    ctx.fillRect(x + 1, 0, 30, size);
    ctx.strokeStyle = "rgba(30,16,8,0.5)";
    ctx.strokeRect(x + 1, 0, 30, size);
  }
  return toTex(c, 2);
}

function makeBark() {
  const { c, ctx, size } = canvas(256);
  ctx.fillStyle = "#4a3424";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 40; i++) {
    ctx.strokeStyle = `rgba(20,12,8,${rand(0.3,0.7)})`;
    ctx.lineWidth = rand(1, 3);
    ctx.beginPath();
    ctx.moveTo(rand(0, size), 0);
    ctx.bezierCurveTo(rand(0,size), size*0.3, rand(0,size), size*0.6, rand(0,size), size);
    ctx.stroke();
  }
  return toTex(c, 2);
}

function makeLeaf() {
  const { c, ctx, size } = canvas(256);
  ctx.fillStyle = "#2f6a28";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 80; i++) {
    ctx.fillStyle = `rgba(${30+rand(0,40)|0},${90+rand(0,80)|0},${20+rand(0,30)|0},0.55)`;
    ctx.beginPath();
    ctx.ellipse(rand(0,size), rand(0,size), rand(8,22), rand(12,28), rand(0,6), 0, Math.PI*2);
    ctx.fill();
  }
  return toTex(c, 2);
}

function makeGold() {
  const { c, ctx, size } = canvas(128);
  const g = ctx.createLinearGradient(0, 0, size, size);
  g.addColorStop(0, "#fff1b0");
  g.addColorStop(0.4, "#e4c36a");
  g.addColorStop(1, "#8a5a18");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return toTex(c, 1);
}

function makeBanner() {
  const { c, ctx, size } = canvas(256);
  ctx.fillStyle = "#7a1820";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#c49232";
  ctx.fillRect(16, 16, size - 32, size - 32);
  ctx.fillStyle = "#7a1820";
  ctx.fillRect(28, 28, size - 56, size - 56);
  // original dawn-vow crest: sunburst + chevron (not a Blizzard lion)
  ctx.save();
  ctx.translate(size/2, size/2 - 10);
  ctx.fillStyle = "#f3e0a0";
  ctx.beginPath();
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2;
    const r = i % 2 ? 34 : 18;
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#e4c36a";
  ctx.beginPath();
  ctx.moveTo(0, 28); ctx.lineTo(-22, 50); ctx.lineTo(0, 40); ctx.lineTo(22, 50);
  ctx.closePath(); ctx.fill();
  ctx.restore();
  return onceTex(c);
}

function makeStainedGlass() {
  const { c, ctx, size } = canvas(512);
  ctx.fillStyle = "#140808";
  ctx.fillRect(0, 0, size, size);
  const colors = ["#c45a3a", "#e4c36a", "#3a6ab4", "#5aaa6a", "#8a3a8a", "#d47838"];
  const cx = size/2, cy = size/2;
  for (let ring = 0; ring < 5; ring++) {
    const segs = 8 + ring * 4;
    const r0 = 30 + ring * 42, r1 = r0 + 42;
    for (let i = 0; i < segs; i++) {
      const a0 = (i / segs) * Math.PI * 2;
      const a1 = ((i + 1) / segs) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r1, a0, a1);
      ctx.arc(cx, cy, r0, a1, a0, true);
      ctx.closePath();
      ctx.fillStyle = colors[(i + ring) % colors.length];
      ctx.fill();
      ctx.strokeStyle = "#d4af37";
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }
  ctx.beginPath();
  ctx.arc(cx, cy, 28, 0, Math.PI * 2);
  ctx.fillStyle = "#f8e7a4";
  ctx.fill();
  return onceTex(c);
}

function makeWater() {
  const { c, ctx, size } = canvas(256);
  const g = ctx.createLinearGradient(0, 0, size, size);
  g.addColorStop(0, "#7ec8e3");
  g.addColorStop(0.5, "#3a8aaa");
  g.addColorStop(1, "#1e5a78");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  for (let i = 0; i < 10; i++) {
    ctx.beginPath();
    ctx.ellipse(size/2, size/2, 20 + i * 10, 12 + i * 6, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  const t = toTex(c, 1);
  t.repeat.set(1, 1);
  return t;
}
