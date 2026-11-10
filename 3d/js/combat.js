import * as THREE from "three";
import { createCultist, tickHumanoid, makeNameplate } from "./characters.js";

export function createCombat(scene, world, player, vfx, audio, ui, quest) {
  const enemies = [];

  function spawnAll() {
    world.enemySpawns.forEach((p, i) => spawnOne(p, false, i));
    spawnOne(world.bossSpawn, true, "boss");
  }

  function spawnOne(pos, isBoss, id) {
    const mesh = createCultist(isBoss);
    mesh.position.copy(pos);
    scene.add(mesh);
    mesh.add(makeNameplate(isBoss ? "执事·焦喉" : "灰烬狂徒", isBoss ? "#ff9966" : "#e8c8b0"));
    const e = {
      id, mesh, isBoss,
      pos: mesh.position,
      hp: isBoss ? 280 : 70,
      maxHp: isBoss ? 280 : 70,
      atk: isBoss ? 18 : 9,
      state: "idle",
      stun: 0,
      vuln: 0,
      cd: 1.5 + Math.random(),
      tele: 0,
      teleMesh: null,
      dead: false,
      walkPhase: Math.random() * 10,
      home: pos.clone(),
    };
    enemies.push(e);
    return e;
  }

  function nearest(from, maxR = 18) {
    let best = null, bd = maxR * maxR;
    for (const e of enemies) {
      if (e.dead) continue;
      const d = e.pos.distanceToSquared(from);
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }

  function inRange(e, r) {
    return e && !e.dead && e.pos.distanceTo(player.state.pos) <= r;
  }

  function faceTo(obj, tx, tz) {
    obj.rotation.y = Math.atan2(tx - obj.position.x, tz - obj.position.z);
  }

  function applyDamage(e, raw, crit = false) {
    if (!e || e.dead) return;
    const mul = e.vuln > 0 ? 1.15 : 1;
    const dmg = Math.max(1, Math.round(raw * mul));
    e.hp -= dmg;
    vfx.hit(e.pos);
    audio.hit();
    ui.floatNum(e.pos, dmg, crit ? "crit" : "dmg");
    if (e.hp <= 0) kill(e);
  }

  function kill(e) {
    e.dead = true;
    e.hp = 0;
    if (e.teleMesh) { scene.remove(e.teleMesh); e.teleMesh = null; }
    ui.floatNum(e.pos, e.isBoss ? "焦喉倒下！" : "驱散", "info");
    quest.onEnemyKilled(e);
    setTimeout(() => { scene.remove(e.mesh); }, 1400);
  }

  function playerAttack(skill, lock) {
    const target = lock || nearest(player.state.pos, skill === "slash" ? 2.6 : 14);
    if (skill === "slash") {
      if (!player.trySkill("slash")) return;
      const dir = player.facing.clone();
      vfx.slash(player.state.pos, dir);
      audio.slash();
      tickHumanoid(player.group, 0.016, { time: 0, moving: false, mag: 0, attacking: true });
      if (inRange(target, 2.6)) {
        faceTo(player.group, target.pos.x, target.pos.z);
        applyDamage(target, player.state.atk * 1.2);
      }
      return;
    }
    if (skill === "heal") {
      if (!player.trySkill("heal")) { ui.hint("圣光还在冷却，或者你的蓝不够浪漫。"); return; }
      const amt = player.healPct(0.32);
      vfx.heal(player.state.pos);
      audio.heal();
      ui.floatNum(player.state.pos, `+${amt}`, "heal");
      return;
    }
    if (skill === "hammer") {
      if (!player.trySkill("hammer")) { ui.hint("圣裁之锤尚未归来。"); return; }
      const dest = target ? target.pos.clone() : player.state.pos.clone().add(player.facing.clone().multiplyScalar(8));
      audio.hammer();
      vfx.hammer(player.state.pos, dest, () => {
        const hit = target && dest.distanceTo(target.pos) < 2.4 ? target : nearest(dest, 2.4);
        if (hit) {
          applyDamage(hit, player.state.atk * 0.9);
          hit.stun = 2.0;
          ui.floatNum(hit.pos, "眩晕", "info");
        }
      });
      return;
    }
    if (skill === "judge") {
      if (!player.trySkill("judge")) { ui.hint("审判之光还在整理措辞。"); return; }
      const dest = target ? target.pos.clone() : player.state.pos.clone().add(player.facing.clone().multiplyScalar(6));
      audio.judge();
      vfx.beam(dest);
      for (const e of enemies) {
        if (!e.dead && e.pos.distanceTo(dest) < 2.8) {
          applyDamage(e, player.state.atk * 1.55, true);
          e.vuln = 3;
        }
      }
    }
  }

  function update(dt) {
    const now = performance.now() / 1000;
    const p = player.state.pos;
    for (const e of enemies) {
      if (e.dead) {
        tickHumanoid(e.mesh, dt, { time: now, moving: false, mag: 0, dead: true });
        continue;
      }
      if (e.stun > 0) e.stun -= dt;
      if (e.vuln > 0) e.vuln -= dt;
      e.cd -= dt;
      const dist = e.pos.distanceTo(p);
      const aggro = dist < (e.isBoss ? 16 : 13) || quest.reachedCamp;

      if (e.stun > 0) {
        tickHumanoid(e.mesh, dt, { time: now, moving: false, mag: 0, stunned: true });
        continue;
      }

      if (e.tele > 0) {
        e.tele -= dt;
        if (e.teleMesh) e.teleMesh.position.set(e.isBoss && e._slamAt ? e._slamAt.x : e.pos.x, 0.06, e.isBoss && e._slamAt ? e._slamAt.z : e.pos.z);
        if (e.tele <= 0) {
          if (e.teleMesh) { scene.remove(e.teleMesh); e.teleMesh = null; }
          const radius = e.isBoss ? 3.4 : 1.7;
          const at = e._slamAt || e.pos;
          if (p.distanceTo(at) < radius + 0.4 && !player.state.dead) {
            const dmg = player.hurt(e.atk);
            if (dmg) { audio.hurt(); ui.floatNum(p, dmg, "crit"); }
          }
          e.cd = e.isBoss ? 2.4 : 1.6;
        }
        tickHumanoid(e.mesh, dt, { time: now, moving: false, mag: 0, attacking: true });
        continue;
      }

      if (aggro && dist > (e.isBoss ? 2.4 : 1.85)) {
        const dirx = (p.x - e.pos.x) / (dist || 1);
        const dirz = (p.z - e.pos.z) / (dist || 1);
        const spd = (e.isBoss ? 3.3 : 3.8) * dt;
        e.pos.x += dirx * spd;
        e.pos.z += dirz * spd;
        faceTo(e.mesh, p.x, p.z);
        tickHumanoid(e.mesh, dt, { time: now, moving: true, mag: 1, sprint: false });
      } else if (aggro && dist <= 2.6 && e.cd <= 0) {
        // telegraph
        e.tele = e.isBoss ? 1.15 : 0.55;
        if (e.isBoss) e._slamAt = p.clone();
        e.teleMesh = vfx.telegraph(e.isBoss ? p : e.pos, e.isBoss ? 3.4 : 1.6, 0xff3333);
        faceTo(e.mesh, p.x, p.z);
        tickHumanoid(e.mesh, dt, { time: now, moving: false, mag: 0 });
      } else {
        // idle wander near home
        e.walkPhase += dt;
        if (!aggro) {
          e.pos.x = e.home.x + Math.sin(e.walkPhase * 0.4) * 1.2;
          e.pos.z = e.home.z + Math.cos(e.walkPhase * 0.35) * 1.2;
        }
        tickHumanoid(e.mesh, dt, { time: now, moving: !aggro, mag: 0.3 });
      }
      e.pos.y = 0;
    }
  }

  function nextLock(cur) {
    const live = enemies.filter((e) => !e.dead);
    if (!live.length) return null;
    if (!cur) return nearest(player.state.pos, 22);
    const i = live.indexOf(cur);
    return live[(i + 1) % live.length];
  }

  spawnAll();
  return { enemies, update, playerAttack, nearest, nextLock };
}
