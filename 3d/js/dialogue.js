import { dialogueOf, PORTRAITS, CGS, HOOK_CAPTION } from "./content.js";

export function createDialogue(ui, quest, audio, hooks) {
  let queue = [];
  let index = 0;
  let active = false;
  let waitingChoice = false;

  const root = document.getElementById("dialogue");
  const nameEl = document.getElementById("dlg-name");
  const textEl = document.getElementById("dlg-text");
  const choicesEl = document.getElementById("dlg-choices");
  const nextEl = document.getElementById("dlg-next");
  const left = document.getElementById("dlg-left");
  const right = document.getElementById("dlg-right");

  function showNode() {
    if (index >= queue.length) {
      close();
      return;
    }
    const node = queue[index];
    nameEl.textContent = node.speaker;
    textEl.textContent = node.text;
    choicesEl.innerHTML = "";
    waitingChoice = false;
    const side = node.side || "right";
    const src = PORTRAITS[node.portrait] || PORTRAITS.roland;
    if (side === "left") {
      left.src = src; left.classList.remove("hidden"); left.classList.remove("dim");
      right.classList.add("dim");
    } else {
      right.src = src; right.classList.remove("hidden"); right.classList.remove("dim");
      left.classList.add("dim");
    }
    if (node.effect) applyEffect(node.effect);

    if (node.choices) {
      waitingChoice = true;
      nextEl.classList.add("hidden");
      node.choices.forEach((ch) => {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = ch.text;
        b.addEventListener("click", (e) => {
          e.stopPropagation();
          jump(ch.next);
        });
        choicesEl.appendChild(b);
      });
    } else {
      nextEl.classList.remove("hidden");
    }
  }

  function applyEffect(effect) {
    if (effect === "acceptQuest") quest.accept();
    if (effect === "turnIn") {
      if (quest.turnIn()) {
        /* level-up triggered by later node */
      }
    }
    if (effect === "levelUp") hooks.onLevelUp();
    if (effect === "showHook") hooks.onHook();
    if (effect === "cgLilisika") {
      quest.st.sawCg = true;
      ui.showCg(CGS.lilisika, "圣堂侧廊的烛火摇了摇。至于中间核对了哪些条款，系统选择拉灯。次日……好吧，其实只过了几分钟。罗兰的圣光值略微下降。");
    }
  }

  function jump(id) {
    queue = dialogueOf(id).slice();
    index = 0;
    showNode();
  }

  function open(id) {
    queue = dialogueOf(id).slice();
    index = 0;
    active = true;
    root.classList.remove("hidden");
    left.classList.add("hidden");
    right.classList.add("hidden");
    // preload both common portraits
    left.src = PORTRAITS.roland;
    left.classList.remove("hidden");
    audio.ui();
    showNode();
    hooks.onOpen();
  }

  function advance() {
    if (!active || waitingChoice) return;
    index += 1;
    showNode();
  }

  function close() {
    active = false;
    root.classList.add("hidden");
    hooks.onClose();
  }

  root.addEventListener("click", (e) => {
    if (e.target.closest("#dlg-choices")) return;
    advance();
  });

  return {
    get active() { return active; },
    open, advance, close,
    showHookCg() { ui.showCg(CGS.hook, HOOK_CAPTION); },
  };
}
