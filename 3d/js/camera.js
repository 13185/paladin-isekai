import * as THREE from "three";
import { resolveCollision } from "./world.js";

export function createCameraRig(camera, getTarget) {
  let yaw = 0.15;
  let pitch = 0.32;
  let dist = 7.4;
  const desired = new THREE.Vector3();
  const look = new THREE.Vector3();
  const tmp = new THREE.Vector3();

  return {
    get yaw() { return yaw; },
    get pitch() { return pitch; },
    setYaw(v) { yaw = v; },
    update(dt, lookDelta, colliders, lockTarget) {
      yaw -= lookDelta.x * 0.0024;
      pitch = THREE.MathUtils.clamp(pitch - lookDelta.y * 0.0020, 0.08, 1.2);
      const target = getTarget();
      look.set(target.x, target.y + 1.55, target.z);
      if (lockTarget) {
        const to = tmp.set(lockTarget.x - target.x, 0, lockTarget.z - target.z);
        if (to.lengthSq() > 0.1) {
          const ty = Math.atan2(to.x, to.z);
          // keep camera somewhat behind player facing target
          const want = ty + Math.PI;
          yaw = THREE.MathUtils.euclideanModulo(yaw + Math.PI, Math.PI * 2) - Math.PI;
          let dw = THREE.MathUtils.euclideanModulo(want - yaw + Math.PI, Math.PI * 2) - Math.PI;
          yaw += dw * Math.min(1, dt * 2.4);
        }
        look.lerp(new THREE.Vector3(lockTarget.x, lockTarget.y + 1.2, lockTarget.z), 0.18);
      }
      const cp = Math.cos(pitch), sp = Math.sin(pitch);
      desired.set(
        look.x + Math.sin(yaw) * cp * dist,
        look.y + sp * dist,
        look.z + Math.cos(yaw) * cp * dist
      );
      // pull in if camera clips a collider (sample along the ray)
      const from = look.clone();
      const dir = desired.clone().sub(from);
      const len = dir.length();
      dir.normalize();
      let ok = len;
      for (let i = 8; i >= 3; i--) {
        const d = (i / 8) * len;
        tmp.copy(from).addScaledVector(dir, d);
        const before = tmp.clone();
        resolveCollision(tmp, 0.35, colliders);
        if (tmp.distanceToSquared(before) > 0.0001) ok = Math.min(ok, d - 0.4);
      }
      ok = Math.max(2.1, ok);
      desired.copy(from).addScaledVector(dir, ok);
      desired.y = Math.max(0.6, desired.y);
      camera.position.lerp(desired, 1 - Math.pow(0.0008, dt));
      camera.lookAt(look);
    },
    setTitleShot(t, focus) {
      const r = 18;
      camera.position.set(Math.sin(t * 0.12) * r, 7.5 + Math.sin(t * 0.2) * 0.6, 12 + Math.cos(t * 0.12) * r * 0.55);
      camera.lookAt(focus.x, focus.y + 2.4, focus.z);
    },
  };
}
