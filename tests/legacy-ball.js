// The ball physics exactly as they were BEFORE Phase 2 (commit 6b8053b), kept only so tests/ball-report.js can show real before/after numbers.
// Nothing in the game or in the pass/fail tests uses this. `physStep` below is a verbatim copy of the old function.
const OLD_PHYS_STEP = `function physStep(b,dt){
  b.t+=dt;
  if(!b.rolling){
    const vx=b.v.x-wind.x,vy=b.v.y,vz=b.v.z-wind.z;const s=Math.hypot(vx,vy,vz);
    b.v.x-=K*s*vx*dt;b.v.y-=(G+K*s*vy)*dt;b.v.z-=K*s*vz*dt;
    if(b.spin){const hv=Math.hypot(b.v.x,b.v.z);if(hv>1){const ux=-b.v.z/hv,uz=b.v.x/hv;b.v.x+=ux*b.spin*dt;b.v.z+=uz*b.spin*dt;}}
    b.p.addScaledVector(b.v,dt);
    for(const t of TREES){
      const dx=b.p.x-t.x;if(dx>t.r||dx<-t.r)continue;const dz=b.p.z-t.z;if(dz>t.r||dz<-t.r)continue;
      const dy=b.p.y-t.cy;const d2=dx*dx+dy*dy+dz*dz;
      if(d2<t.r*t.r){const d=Math.sqrt(d2)||1;const nx=dx/d,ny=dy/d,nz=dz/d;const vn=b.v.x*nx+b.v.y*ny+b.v.z*nz;
        if(vn<0){b.v.x-=1.5*vn*nx;b.v.y-=1.5*vn*ny;b.v.z-=1.5*vn*nz;b.v.multiplyScalar(0.4);onEv('tree');}
        b.p.set(t.x+nx*(t.r+0.02),t.cy+ny*(t.r+0.02),t.z+nz*(t.r+0.02));}
    }
    const h=H(b.p.x,b.p.z);
    if(b.p.y-R<=h){
      const n=normal(b.p.x,b.p.z).clone();const surf=S(b.p.x,b.p.z);const sp=SP[surf];
      b.p.y=h+R;const vn=b.v.dot(n);
      if(vn<0){
        const vt=b.v.clone().addScaledVector(n,-vn);let keep=1-sp.mu*(b.landed?clamp(-vn/8,0,1):1);if(!b.landed&&b.club.roll)keep*=b.club.roll;vt.multiplyScalar(keep);
        if(vn<-1.5)b.v.copy(vt).addScaledVector(n,-vn*sp.e);else{b.v.copy(vt);b.rolling=true;}
      }
      if(!b.landed){b.landed=true;b.spin=0;b.landAt=b.p.clone();onEv('land',surf);}
    }
  }else{
    const n=normal(b.p.x,b.p.z);
    const gx=n.x*G*n.y,gy=-G+n.y*G*n.y,gz=n.z*G*n.y;
    b.v.x+=gx*dt;b.v.y+=gy*dt;b.v.z+=gz*dt;
    const dec=SP[S(b.p.x,b.p.z)].dec;const sp=b.v.length();
    if(sp>0)b.v.multiplyScalar(Math.max(0,sp-dec*dt)/sp);
    b.p.addScaledVector(b.v,dt);
    const h=H(b.p.x,b.p.z);
    if(b.p.y-R>h+0.06)b.rolling=false;
    else{b.p.y=h+R;const n2=normal(b.p.x,b.p.z);const vn=b.v.dot(n2);b.v.addScaledVector(n2,-vn);}
    if(b.v.length()<0.07&&Math.hypot(gx,gy,gz)<1.6){b.v.set(0,0,0);b.resting=true;}
  }
}
`;

// the old surface table (e: bounce, mu: grab, dec: rolling resistance) and the old per-club first-bounce factor
const OLD_ROLL = { 'Hammer': 0.34, '3-Wood': 0.32, 'Iron': 0.14, 'Wedge': 0.12 };
const OLD_SP = {
  0: { e: .30, mu: .22, dec: 6.5 }, 1: { e: .30, mu: .22, dec: 6.5 }, 2: { e: .15, mu: .45, dec: 13 },
  3: { e: .26, mu: .20, dec: 4 },   4: { e: .24, mu: .16, dec: 3.2 }, 5: { e: .05, mu: .90, dec: 30 }, 6: { e: 0, mu: 1, dec: 99 },
};

class V3 {
  constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
  set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
  copy(o) { this.x = o.x; this.y = o.y; this.z = o.z; return this; }
  clone() { return new V3(this.x, this.y, this.z); }
  dot(o) { return this.x * o.x + this.y * o.y + this.z * o.z; }
  length() { return Math.hypot(this.x, this.y, this.z); }
  multiplyScalar(s) { this.x *= s; this.y *= s; this.z *= s; return this; }
  addScaledVector(o, s) { this.x += o.x * s; this.y += o.y * s; this.z += o.z * s; return this; }
}

// Run one shot through the OLD physics. terrain: {H, normal, S} (normal must return an object with x,y,z). Returns the same shape as the new runner's summary.
function legacyShot(game, terrain, club, speed, yaw = 0, wind = { x: 0, z: 0 }, maxT = 40) {
  const { G, K, R } = game, clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const SP = {}; for (const k of Object.keys(OLD_SP)) SP[k] = OLD_SP[k];
  const norm = (x, z) => { const n = terrain.normal(x, z); return new V3(n.x, n.y, n.z); };
  const physStep = new Function('V3', 'H', 'normal', 'S', 'SP', 'G', 'K', 'R', 'wind', 'TREES', 'onEv', 'clamp', OLD_PHYS_STEP + '\nreturn physStep;')(V3, terrain.H, norm, terrain.S, SP, G, K, R, wind, [], () => {}, clamp);
  const oldClub = Object.assign({}, club, { roll: OLD_ROLL[club.name] });
  const b = { p: new V3(0, terrain.H(0, 0) + R + 0.02, 0), v: new V3(Math.sin(yaw) * Math.cos(club.ang) * speed, Math.sin(club.ang) * speed, Math.cos(yaw) * Math.cos(club.ang) * speed), rolling: false, landed: false, t: 0, lipT: -9, club: oldClub, resting: false, spin: 0 };
  const dt = 1 / 240; let carry = null, bounces = 0, airborne = true;
  while (b.t < maxT && !b.resting) {
    const was = b.landed; physStep(b, dt);
    if (!was && b.landed) carry = Math.hypot(b.p.x, b.p.z);
    if (b.landed) { const air = !b.rolling && b.p.y - terrain.H(b.p.x, b.p.z) - R > 0.02; if (air && !airborne) bounces++; airborne = air; }
  }
  const total = Math.hypot(b.p.x, b.p.z);
  return { carry, total, roll: total - (carry ?? 0), bounces, resting: b.resting, t: b.t, lateral: b.p.x };
}

module.exports = { legacyShot, OLD_PHYS_STEP };
