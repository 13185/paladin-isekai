import { SKILLS } from "./content.js";

export function createUI(camera) {
  const hpFill = document.getElementById("hp-fill");
  const mpFill = document.getElementById("mp-fill");
  const hpText = document.getElementById("hp-text");
  const mpText = document.getElementById("mp-text");
  const lvEl = document.getElementById("hud-level");
  const qTitle = document.getElementById("quest-title");
  const qSteps = document.getElementById("quest-steps");
  const prompt = document.getElementById("interact-prompt");
  const promptName = document.getElementById("interact-name");
  const hintEl = document.getElementById("hint-toast");
  const nums = document.getElementById("nums");
  const mmap = document.getElementById("minimap");
  const mctx = mmap.getContext("2d");
  const skillBtns = [...document.querySelectorAll("#skill-bar .sk")];
  let hintT = 0;

  function setHudVisible(v) {
    document.getElementById("hud").classList.toggle("hidden", !v);
  }

  function updatePlayer(p) {
    const hs = p.hp / p.maxHp, ms = p.mp / p.maxMp;
    hpFill.style.transform = `scaleX(${Math.max(0, hs)})`;
    mpFill.style.transform = `scaleX(${Math.max(0, ms)})`;
    hpText.textContent = `${Math.round(p.hp)}/${p.maxHp}`;
    mpText.textContent = `${Math.round(p.mp)}/${p.maxMp}`;
    lvEl.textContent = `Lv.${p.level} 圣骑士`;
    skillBtns.forEach((btn) => {
      const id = btn.dataset.skill;
      const sk = SKILLS[id];
      const cd = p.cds[id] || 0;
      const ratio = sk.cd ? cd / sk.cd : 0;
      btn.classList.toggle("cd", ratio > 0);
      btn.style.setProperty("--cd", ratio);
      btn.querySelector("s").style.transform = `scaleY(${ratio})`;
    });
  }

  function updateQuest(quest) {
    qTitle.textContent = quest.title();
    qSteps.innerHTML = "";
    quest.steps().forEach((s) => {
      const li = document.createElement("li");
      li.textContent = s.text;
      if (s.ok) li.className = "done";
      else if (s.now) li.className = "now";
      qSteps.appendChild(li);
    });
  }

  function setPrompt(name) {
    if (!name) prompt.classList.add("hidden");
    else {
      prompt.classList.remove("hidden");
      promptName.textContent = `与${name}交谈`;
    }
  }

  function hint(text, ms = 2800) {
    hintEl.textContent = text;
    hintEl.classList.add("show");
    hintT = performance.now() + ms;
  }

  function tick() {
    if (hintT && performance.now() > hintT) {
      hintEl.classList.remove("show");
      hintT = 0;
    }
  }

  function floatNum(worldPos, text, kind) {
    const v = worldPos.clone();
    v.y += 1.6;
    v.project(camera);
    const el = document.createElement("div");
    el.className = `dnum ${kind}`;
    el.textContent = text;
    el.style.left = `${(v.x * 0.5 + 0.5) * window.innerWidth}px`;
    el.style.top = `${(-v.y * 0.5 + 0.5) * window.innerHeight}px`;
    nums.appendChild(el);
    setTimeout(() => el.remove(), 900);
  }

  function drawMap(player, npcs, enemies, yaw) {
    const w = mmap.width, h = mmap.height;
    mctx.clearRect(0, 0, w, h);
    mctx.save();
    mctx.translate(w / 2, h / 2);
    mctx.rotate(yaw);
    const scale = 1.7;
    const wx = (x, z) => [(x - player.x) * scale, (z - player.z) * scale];
    // grass
    mctx.fillStyle = "#2d4a28";
    mctx.beginPath(); mctx.arc(0, 0, 90, 0, Math.PI * 2); mctx.fill();
    // plaza
    let [px, pz] = wx(0, 4);
    mctx.fillStyle = "#8a8170";
    mctx.beginPath(); mctx.arc(px, pz, 26 * scale, 0, Math.PI * 2); mctx.fill();
    // path
    mctx.strokeStyle = "#6b4b32";
    mctx.lineWidth = 8;
    mctx.beginPath();
    const a = wx(18, 5), b = wx(58, 6);
    mctx.moveTo(a[0], a[1]); mctx.lineTo(b[0], b[1]); mctx.stroke();
    // camp
    const c = wx(58, 6);
    mctx.fillStyle = "#5a3020";
    mctx.beginPath(); mctx.arc(c[0], c[1], 9 * scale, 0, Math.PI * 2); mctx.fill();
    // cathedral
    const cat = wx(0, -30);
    mctx.fillStyle = "#7a4038";
    mctx.fillRect(cat[0] - 12, cat[1] - 10, 24, 20);
    npcs.forEach((n) => {
      const p = wx(n.pos.x, n.pos.z);
      mctx.fillStyle = "#ffb6d9";
      mctx.beginPath(); mctx.arc(p[0], p[1], 3, 0, Math.PI * 2); mctx.fill();
    });
    enemies.forEach((e) => {
      if (e.dead) return;
      const p = wx(e.pos.x, e.pos.z);
      mctx.fillStyle = e.isBoss ? "#ff5522" : "#cc3333";
      mctx.beginPath(); mctx.arc(p[0], p[1], e.isBoss ? 4 : 2.5, 0, Math.PI * 2); mctx.fill();
    });
    mctx.restore();
    // player marker unrotated
    mctx.fillStyle = "#ffe08a";
    mctx.beginPath(); mctx.arc(w / 2, h / 2, 4, 0, Math.PI * 2); mctx.fill();
    mctx.strokeStyle = "#fff6d2";
    mctx.beginPath();
    mctx.moveTo(w / 2, h / 2);
    mctx.lineTo(w / 2, h / 2 - 10);
    mctx.stroke();
  }

  function showCg(src, cap) {
    const el = document.getElementById("cg");
    document.getElementById("cg-img").src = src;
    document.getElementById("cg-cap").textContent = cap;
    el.classList.remove("hidden");
  }
  function hideCg() { document.getElementById("cg").classList.add("hidden"); }

  function showLevelUp(lv) {
    const el = document.getElementById("levelup");
    document.getElementById("lu-text").textContent = `升级！Lv.${lv}`;
    document.getElementById("lu-sub").textContent = "您的腰力评级提升至：广场级合格。圣光滤镜稍微亮了一点。";
    el.classList.remove("hidden");
    setTimeout(() => el.classList.add("hidden"), 2800);
  }

  document.getElementById("cg-close").addEventListener("click", hideCg);

  return {
    setHudVisible, updatePlayer, updateQuest, setPrompt, hint, tick, floatNum, drawMap,
    showCg, hideCg, showLevelUp,
  };
}
