import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { createTextures } from "./textures.js";
import { buildWorld } from "./world.js";
import { createPlayer } from "./player.js";
import { createCameraRig } from "./camera.js";
import { createInput, isTouchDevice } from "./input.js";
import { createAudio } from "./audio.js";
import { createVfx } from "./vfx.js";
import { createCombat } from "./combat.js";
import { createNpcs } from "./npc.js";
import { createDialogue } from "./dialogue.js";
import { createQuest } from "./quest.js";
import { createUI } from "./ui.js";
import { LOAD_TIPS, ENDING_TEXT } from "./content.js";

const canvas = document.getElementById("game-canvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.94;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(54, window.innerWidth / window.innerHeight, 0.12, 900);

let composer = null;
let bloomPass = null;
let quality = localStorage.getItem("pi3d-quality") || "medium";
document.getElementById("quality-select").value = quality;
document.getElementById("quality-ingame").value = quality;

const audio = createAudio();
const input = createInput(canvas);
const quest = createQuest();
const ui = createUI(camera);

let phase = "loading";
let world, player, cam, vfx, combat, npcs, dialogue;
let lockTarget = null;
let clock = new THREE.Clock();
let titleTime = 0;
let paused = false;

function setLoad(p, text) {
  document.getElementById("load-bar").style.width = `${Math.round(p * 100)}%`;
  if (text) document.getElementById("load-text").textContent = text;
}

async function boot() {
  const tips = LOAD_TIPS;
  setLoad(0.08, tips[0]);
  await frame();
  const textures = createTextures();
  setLoad(0.35, tips[1]);
  await frame();
  applyQuality(quality, true);
  world = buildWorld(scene, textures, quality);
  setLoad(0.55, tips[2]);
  await frame();
  player = createPlayer(scene, world.playerSpawn);
  cam = createCameraRig(camera, () => player.state.pos);
  vfx = createVfx(scene);
  npcs = createNpcs(scene, world.npcSpots);
  setLoad(0.72, tips[3]);
  await frame();
  combat = createCombat(scene, world, player, vfx, audio, ui, quest);
  dialogue = createDialogue(ui, quest, audio, {
    onOpen() { phase = "dialogue"; input.setEnabled(false); ui.setPrompt(null); },
    onClose() { if (phase === "dialogue") phase = "play"; input.setEnabled(true); ui.updateQuest(quest); },
    onLevelUp() {
      player.levelUp();
      quest.st.leveled = true;
      vfx.levelColumn(player.state.pos);
      audio.level();
      ui.showLevelUp(player.state.level);
    },
    onHook() {
      world.revealShip();
      dialogue.showHookCg();
      document.getElementById("ending-text").textContent = ENDING_TEXT;
    },
  });
  setLoad(0.88, tips[4]);
  rebuildComposer();
  setLoad(1, tips[5]);
  await sleep(350);
  document.getElementById("loading").classList.add("hidden");
  document.getElementById("title").classList.remove("hidden");
  phase = "title";
  exposeDemo();
}

function applyQuality(q, first = false) {
  quality = q;
  localStorage.setItem("pi3d-quality", q);
  const pr = q === "high" ? Math.min(devicePixelRatio, 1.75) : q === "medium" ? Math.min(devicePixelRatio, 1.25) : 1;
  renderer.setPixelRatio(pr);
  renderer.shadowMap.enabled = q !== "low";
  renderer.toneMappingExposure = q === "high" ? 1.12 : 1.05;
  if (!first && bloomPass) {
    bloomPass.strength = q === "high" ? 0.22 : q === "medium" ? 0.16 : 0;
    bloomPass.enabled = q !== "low";
  }
}

function rebuildComposer() {
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), quality === "high" ? 0.22 : 0.16, 0.32, 0.96);
  bloomPass.enabled = quality !== "low";
  composer.addPass(bloomPass);
  composer.addPass(new OutputPass());
  composer.setSize(window.innerWidth, window.innerHeight);
}

function startGame() {
  audio.resume();
  document.getElementById("title").classList.add("hidden");
  document.getElementById("ending").classList.add("hidden");
  document.getElementById("pause").classList.add("hidden");
  document.getElementById("death").classList.add("hidden");
  ui.setHudVisible(true);
  if (isTouchDevice()) document.getElementById("mobile").classList.remove("hidden");
  player.group.position.copy(world.playerSpawn);
  player.state.pos.copy(world.playerSpawn);
  phase = "play";
  paused = false;
  input.setEnabled(true);
  ui.updateQuest(quest);
  ui.hint("晨誓广场 · 去喷泉边找奥罗拉接委托。WASD 移动，E 交谈。");
}

function pause(v) {
  if (phase !== "play" && phase !== "pause") return;
  paused = v;
  phase = v ? "pause" : "play";
  document.getElementById("pause").classList.toggle("hidden", !v);
  input.setEnabled(!v);
}

function talkTo(npc) {
  if (!npc || dialogue.active) return;
  const key = quest.dialogueKey(npc.id);
  quest.st.talked[npc.id] = true;
  faceEachOther(player.group, npc.mesh);
  dialogue.open(key);
}

function faceEachOther(a, b) {
  const ay = Math.atan2(b.position.x - a.position.x, b.position.z - a.position.z);
  a.rotation.y = ay;
  b.rotation.y = ay + Math.PI;
}

function handlePlayInput(dt) {
  // skills / attack
  if (input.consume("heal") || player.consumeEdge(input, "Digit1")) combat.playerAttack("heal", lockTarget);
  if (input.consume("hammer") || player.consumeEdge(input, "Digit2")) combat.playerAttack("hammer", lockTarget);
  if (input.consume("judge") || player.consumeEdge(input, "Digit3")) combat.playerAttack("judge", lockTarget);
  if (input.consume("slash") || input.consume("attack") || player.consumeEdge(input, "KeyJ")) {
    combat.playerAttack("slash", lockTarget);
  }
  // auto-attack when close
  const near = combat.nearest(player.state.pos, 2.55);
  if (near && player.state.cds.slash <= 0 && (lockTarget || near.pos.distanceTo(player.state.pos) < 2.4)) {
    if (quest.reachedCamp || quest.st.reachedCamp || near.pos.distanceTo(player.state.pos) < 2.4) {
      combat.playerAttack("slash", lockTarget || near);
    }
  }
  if (player.consumeEdge(input, "Tab") || input.consume("lockon")) {
    lockTarget = combat.nextLock(lockTarget);
    ui.hint(lockTarget ? `锁定：${lockTarget.isBoss ? "执事·焦喉" : "灰烬狂徒"}` : "解除锁定");
  }
  if (lockTarget && lockTarget.dead) lockTarget = null;

  if (input.consume("interact") || player.consumeEdge(input, "KeyE")) {
    const npc = npcs.nearest(player.state.pos);
    if (npc) talkTo(npc);
  }
  if (player.consumeEdge(input, "Escape") || player.consumeEdge(input, "KeyP")) pause(true);
}

function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(0.033, clock.getDelta());
  const t = clock.elapsedTime;
  ui.tick();

  if (phase === "title" || phase === "loading") {
    titleTime += dt;
    cam ? cam.setTitleShot(titleTime, new THREE.Vector3(0, 0, -8)) : camera.position.set(14, 8, 22);
    if (world) world.update(t);
    render();
    return;
  }

  if (paused || phase === "dialogue") {
    if (phase === "dialogue" && player.consumeEdge(input, "KeyE")) dialogue.advance();
    if (world) world.update(t);
    if (npcs) npcs.update(dt);
    render();
    return;
  }

  if (phase === "play") {
    const look = input.consumeLook();
    const moveInfo = player.update(dt, input, cam.yaw, world, lockTarget);
    audio.step(dt, moveInfo.moving, moveInfo.sprint);
    cam.update(dt, look, world.colliders, lockTarget && !lockTarget.dead ? lockTarget.pos : null);
    world.update(t);
    npcs.update(dt);
    combat.update(dt);
    vfx.update(dt);
    quest.checkCamp(player.state.pos);
    handlePlayInput(dt);

    const npc = npcs.nearest(player.state.pos);
    ui.setPrompt(npc ? npc.name : null);
    ui.updatePlayer(player.state);
    ui.updateQuest(quest);
    ui.drawMap(player.state.pos, npcs.list, combat.enemies, cam.yaw);

    if (player.state.dead) {
      audio.death();
      phase = "dead";
      document.getElementById("death").classList.remove("hidden");
      input.setEnabled(false);
    }
  }

  render();
}

function render() {
  if (composer && quality !== "low") composer.render();
  else renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  if (composer) composer.setSize(window.innerWidth, window.innerHeight);
});

document.getElementById("btn-start").addEventListener("click", () => {
  audio.resume();
  startGame();
});
document.getElementById("btn-resume").addEventListener("click", () => pause(false));
document.getElementById("btn-to-title").addEventListener("click", () => {
  document.getElementById("pause").classList.add("hidden");
  document.getElementById("ending").classList.add("hidden");
  ui.setHudVisible(false);
  document.getElementById("mobile").classList.add("hidden");
  document.getElementById("title").classList.remove("hidden");
  phase = "title";
  input.setEnabled(false);
});
document.getElementById("btn-end-title").addEventListener("click", () => {
  document.getElementById("ending").classList.add("hidden");
  document.getElementById("title").classList.remove("hidden");
  ui.setHudVisible(false);
  phase = "title";
});
document.getElementById("btn-continue").addEventListener("click", () => {
  document.getElementById("ending").classList.add("hidden");
  if (phase !== "play") phase = "play";
  input.setEnabled(true);
});
document.getElementById("btn-revive").addEventListener("click", () => {
  player.revive(new THREE.Vector3(0, 0, 12));
  document.getElementById("death").classList.add("hidden");
  phase = "play";
  input.setEnabled(true);
  ui.hint("圣泉赊了一笔账。去把灰烬狂徒的账讨回来。");
});

function bindMute(id) {
  document.getElementById(id).addEventListener("click", () => {
    const m = audio.toggle();
    document.getElementById("btn-mute").textContent = m ? "声音：关" : "声音：开";
    document.getElementById("btn-mute-title").textContent = m ? "声音：关" : "声音：开";
  });
}
bindMute("btn-mute");
bindMute("btn-mute-title");

document.getElementById("quality-select").addEventListener("change", (e) => applyQuality(e.target.value));
document.getElementById("quality-ingame").addEventListener("change", (e) => applyQuality(e.target.value));

document.getElementById("cg-close").addEventListener("click", () => {
  if (quest.st.status === "done") {
    document.getElementById("ending").classList.remove("hidden");
  }
});

function frame() { return new Promise((r) => requestAnimationFrame(() => r())); }
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function exposeDemo() {
  window.__DEMO = {
    get phase() { return phase; },
    get ready() { return !!player; },
    start: startGame,
    closeTalk() { if (dialogue.active) dialogue.close(); },
    teleport(x, y, z) {
      if (dialogue.active) dialogue.close();
      player.state.pos.set(x, y, z);
      player.group.position.set(x, y, z);
      camera.position.set(x + Math.sin(cam.yaw) * 7.2, y + 4.8, z + Math.cos(cam.yaw) * 7.2);
      camera.lookAt(x, y + 1.4, z);
    },
    setYaw(v) { cam.setYaw(v); },
    talk(id) { const n = npcs.byId(id); if (n) { if (dialogue.active) dialogue.close(); talkTo(n); } },
    quest: quest.st,
    player: player.state,
    enemies() { return combat.enemies.map((e) => ({ hp: e.hp, dead: e.dead, boss: e.isBoss, x: e.pos.x, z: e.pos.z })); },
    attack(skill = "slash") { combat.playerAttack(skill, lockTarget); },
    npcNear() { const n = npcs.nearest(player.state.pos); return n && n.id; },
  };
}

boot();
loop();
