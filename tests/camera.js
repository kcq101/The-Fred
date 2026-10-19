// A stand-in for the game's aiming camera, used by tests and for rendering previews without three.js.
// Mirrors the formulas in aimTarget(): camera back = 0.11*D+5 behind the ball, up = back*0.3+1.2, looking at a point back*1.6 ahead at ball height,
// vertical field of view 56 degrees (new THREE.PerspectiveCamera(56,...)). D is the distance to the target. World: +x is screen-left, +z is the aim direction at yaw 0.
function makeCamera({ vw, vh, D = 200, fov = 56 }) {
  const back = 0.11 * D + 5, up = back * 0.3 + 1.2, ahead = back * 1.6;
  const pos = { x: 0, y: up, z: -back }, look = { x: 0, y: 0, z: ahead };
  const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
  const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
  const norm = a => { const l = Math.hypot(a.x, a.y, a.z); return { x: a.x / l, y: a.y / l, z: a.z / l }; };
  const cross = (a, b) => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });
  const f = norm(sub(look, pos)), right = norm(cross(f, { x: 0, y: 1, z: 0 })), upv = cross(right, f);
  const th = Math.tan(fov * Math.PI / 360), aspect = vw / vh;
  return {
    dist: Math.hypot(back, up),                       // camera-to-ball distance
    toScreen(x, z, y = 0) {                           // ground point -> pixels, or null when behind the camera
      const v = sub({ x, y, z }, pos), zc = dot(v, f);
      if (zc <= 0.1) return null;
      return { x: (dot(v, right) / (zc * th * aspect) + 1) / 2 * vw, y: (1 - dot(v, upv) / (zc * th)) / 2 * vh };
    },
  };
}
if (typeof module !== 'undefined') module.exports = { makeCamera };
