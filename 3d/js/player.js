import * as THREE from "three";
import { createRoland, tickHumanoid } from "./characters.js";
import { resolveCollision } from "./world.js";
import { PLAYER_BASE, SKILLS } from "./content.js";

export function createPlayer(scene, spawn) {
  const group = createRoland();
  group.position.copy(spawn);
  scene.add(group);

  const state = {
    pos: group.position,
    velY: 0,
    onGround: true,
    yaw: Math.PI, // face cathedral (-Z)
    hp: PLAYER_BASE.maxHp,
    maxHp: PLAYER_BASE.maxHp,
    mp: PLAYER_BASE.maxMp,
    maxMp: PLAYER_BASE.maxMp,
    atk: PLAYER_BASE.atk,
    level: PLAYER_BASE.level,
    rolling: 0,
    invuln: 0,
    stun: 0,
    dead: false,
    cds: { slash: 0, heal: 0, hammer: 0, judge: 0 },
  };

  const facing = new THREE.Vector3(0, 0, -1);

  function update(dt, input, cameraYaw, world, locked) {
    if (state.dead) {
      tickHumanoid(group, dt, { time: performance.now() / 1000, moving: false, mag: 0, dead: true });
      return { moving: false, sprint: false };
    }
    for (const k of Object.keys(state.cds)) state.cds[k] = Math.max(0, state.cds[k] - dt);
    state.mp = Math.min(state.maxMp, state.mp + dt * 3.6);
    if (state.invuln > 0) state.invuln -= dt;
    if (state.stun > 0) state.stun -= dt;
    if (state.rolling > 0) state.rolling -= dt;

    const vec = input.movingVector(cameraYaw);
    const sprint = !!(input.keys.ShiftLeft || input.keys.ShiftRight) && vec.mag > 0.1;
    let speed = sprint ? PLAYER_BASE.sprint : PLAYER_BASE.speed;
    if (state.rolling > 0) speed = 11.5;
    if (state.stun > 0) { vec.x = 0; vec.z = 0; vec.mag = 0; }

    if (input.consume("jump") || input.keys.Space && consumeEdge(input, "Space")) {
      if (state.onGround && state.rolling <= 0) {
        state.velY = 6.4;
        state.onGround = false;
        input._audio && input._audio.jump();
      }
    }
    if (input.consume("roll") || consumeEdge(input, "KeyC")) {
      if (state.rolling <= 0 && state.onGround) {
        state.rolling = 0.38;
        state.invuln = 0.38;
      }
    }

    const mvx = vec.x * speed * dt;
    const mvz = vec.z * speed * dt;
    state.pos.x += mvx;
    state.pos.z += mvz;
    resolveCollision(state.pos, 0.38, world.colliders);
    // bounds soft clamp
    state.pos.x = THREE.MathUtils.clamp(state.pos.x, -40, 76);
    state.pos.z = THREE.MathUtils.clamp(state.pos.z, -40, 36);

    state.velY -= 18 * dt;
    state.pos.y += state.velY * dt;
    const gy = world.getHeight(state.pos.x, state.pos.z);
    if (state.pos.y <= gy) {
      state.pos.y = gy;
      state.velY = 0;
      state.onGround = true;
    }

    if (vec.mag > 0.12) {
      state.yaw = Math.atan2(vec.x, vec.z);
    } else if (locked) {
      state.yaw = Math.atan2(locked.position.x - state.pos.x, locked.position.z - state.pos.z);
    }
    group.rotation.y = state.yaw;
    facing.set(Math.sin(state.yaw), 0, Math.cos(state.yaw));

    tickHumanoid(group, dt, {
      time: performance.now() / 1000,
      moving: vec.mag > 0.12,
      mag: vec.mag,
      sprint,
    });
    return { moving: vec.mag > 0.12, sprint, facing };
  }

  const edges = Object.create(null);
  function consumeEdge(input, code) {
    const down = !!input.keys[code];
    const was = edges[code];
    edges[code] = down;
    return down && !was;
  }

  function trySkill(id) {
    if (state.dead) return false;
    const sk = SKILLS[id];
    if (!sk) return false;
    if (state.cds[id] > 0) return false;
    if (state.mp < sk.mp) return false;
    state.mp -= sk.mp;
    state.cds[id] = sk.cd;
    return true;
  }

  function hurt(n) {
    if (state.invuln > 0 || state.dead) return 0;
    state.hp -= n;
    state.invuln = 0.25;
    if (state.hp <= 0) {
      state.hp = 0;
      state.dead = true;
    }
    return n;
  }

  function healPct(p) {
    const amt = Math.round(state.maxHp * p);
    state.hp = Math.min(state.maxHp, state.hp + amt);
    return amt;
  }

  function revive(at) {
    state.dead = false;
    state.hp = Math.round(state.maxHp * 0.55);
    state.mp = state.maxMp;
    state.pos.copy(at);
    state.pos.y = 0;
    group.rotation.x = 0;
  }

  function levelUp() {
    state.level += 1;
    state.maxHp = Math.round(state.maxHp * 1.08);
    state.maxMp = Math.round(state.maxMp * 1.06);
    state.atk = Math.round(state.atk * 1.06 + 1);
    state.hp = state.maxHp;
    state.mp = state.maxMp;
  }

  return {
    group, state, facing,
    update, trySkill, hurt, healPct, revive, levelUp, consumeEdge,
    headPos() { return new THREE.Vector3(state.pos.x, state.pos.y + 1.55, state.pos.z); },
  };
}
