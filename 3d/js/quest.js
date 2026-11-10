export function createQuest() {
  const st = {
    status: "available", // available | accepted | ready | done
    trash: 0,
    trashNeed: 4,
    boss: false,
    reachedCamp: false,
    talked: { aurora: false, lilisika: false, ailian: false, viola: false },
    sawCg: false,
    leveled: false,
  };

  function onEnemyKilled(e) {
    if (st.status !== "accepted" && st.status !== "ready") {
      // still count if they wander in early
    }
    if (e.isBoss) st.boss = true;
    else st.trash = Math.min(st.trashNeed, st.trash + 1);
    if (st.trash >= st.trashNeed && st.boss && st.status === "accepted") st.status = "ready";
  }

  function accept() {
    if (st.status === "available") st.status = "accepted";
  }

  function turnIn() {
    if (st.status === "ready") {
      st.status = "done";
      return true;
    }
    return false;
  }

  function checkCamp(pos) {
    if (Math.hypot(pos.x - 58, pos.z - 6) < 16) st.reachedCamp = true;
  }

  function steps() {
    const items = [];
    const mark = (ok, now, text) => items.push({ ok, now, text });
    if (st.status === "available") {
      mark(false, true, "在喷泉边与奥罗拉交谈并接取委托");
      mark(false, false, "前往东边晨辉林营地");
      mark(false, false, "击败灰烬狂徒与执事·焦喉");
    } else if (st.status === "accepted") {
      mark(true, false, "已接取：驱散林间灰烬");
      mark(st.reachedCamp, !st.reachedCamp, "前往东边晨辉林营地");
      mark(st.trash >= st.trashNeed, st.trash < st.trashNeed, `击败灰烬狂徒 ${st.trash}/${st.trashNeed}`);
      mark(st.boss, st.trash >= st.trashNeed && !st.boss, "击败执事·焦喉");
      mark(false, false, "回报奥罗拉");
    } else if (st.status === "ready") {
      mark(true, false, "营地已肃清");
      mark(false, true, "回到喷泉边回报奥罗拉");
    } else {
      mark(true, false, "委托完成：驱散林间灰烬");
      mark(true, false, "线索：第 37 页残页 · 水晶方舟");
    }
    return items;
  }

  function title() {
    if (st.status === "available") return "晨誓广场";
    if (st.status === "done") return "新的钩子";
    return "驱散林间灰烬";
  }

  function dialogueKey(id) {
    if (id === "aurora") {
      if (st.status === "available") return "aurora_intro";
      if (st.status === "accepted") return "aurora_progress";
      if (st.status === "ready") return "aurora_turnin";
      return "aurora_done";
    }
    if (id === "lilisika") return st.sawCg ? "lilisika_again" : "lilisika";
    if (id === "ailian") return st.status === "done" ? "ailian_after" : "ailian";
    if (id === "viola") return st.status === "done" ? "viola_after" : "viola";
    return "aurora_later";
  }

  return { st, onEnemyKilled, accept, turnIn, checkCamp, steps, title, dialogueKey };
}
