import {
  createAurora, createLilisika, createAilian, createViola,
  tickHumanoid, makeNameplate,
} from "./characters.js";

const FACTORY = {
  aurora: createAurora,
  lilisika: createLilisika,
  ailian: createAilian,
  viola: createViola,
};

const NAMES = {
  aurora: "奥罗拉·苍角",
  lilisika: "莉莉丝卡",
  ailian: "艾莉安·月歌",
  viola: "薇欧拉·夜纱",
};

const COLORS = {
  aurora: "#f3e0a0",
  lilisika: "#e59ad4",
  ailian: "#c8f0d8",
  viola: "#c0c4e0",
};

export function createNpcs(scene, spots) {
  const list = [];
  for (const id of Object.keys(FACTORY)) {
    const mesh = FACTORY[id]();
    mesh.position.copy(spots[id]);
    // face roughly toward plaza center / player spawn
    mesh.rotation.y = Math.atan2(-mesh.position.x, 16 - mesh.position.z);
    if (id === "ailian") mesh.rotation.y = 0; // look south toward plaza
    if (id === "lilisika") mesh.rotation.y = -0.6;
    if (id === "viola") mesh.rotation.y = 1.1;
    mesh.add(makeNameplate(NAMES[id], COLORS[id]));
    scene.add(mesh);
    list.push({
      id, name: NAMES[id], mesh, pos: mesh.position, radius: 2.35,
    });
  }
  return {
    list,
    nearest(pos) {
      let best = null, bd = 1e9;
      for (const n of list) {
        const d = n.pos.distanceTo(pos);
        if (d < bd) { bd = d; best = n; }
      }
      return bd <= (best ? best.radius : 0) ? best : null;
    },
    update(dt) {
      const t = performance.now() / 1000;
      for (const n of list) {
        tickHumanoid(n.mesh, dt, { time: t + n.pos.x, moving: false, mag: 0 });
      }
    },
    byId(id) { return list.find((n) => n.id === id); },
  };
}
