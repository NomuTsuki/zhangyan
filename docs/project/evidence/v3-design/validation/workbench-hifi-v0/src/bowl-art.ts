import * as THREE from 'three';
import bowlHarborArtworkUrl from './assets/bowl-harbor-enamel-v1.png';

export type BowlPeriod = 'current' | 'early';
export interface BowlModelOptions { period?: BowlPeriod; mode?: 'normal' | 'xray' }

let decodedBowlArtwork: HTMLImageElement | null = null;
let artworkLoadPromise: Promise<void> | null = null;
let warnedArtworkFallback = false;

function warnArtworkFallback(reason: unknown) {
  if (warnedArtworkFallback) return;
  warnedArtworkFallback = true;
  console.warn('[bowl-art] Harbor enamel artwork is unavailable; using the procedural ceramic artwork fallback.', reason);
}

/** Decode once before mounting the live scene or preparing material captures.
 * A missing asset must not stop a playable page, but the fallback is reported.
 * Current and early-period factories use the same immutable decoded image.
 */
export function preloadBowlArtwork(): Promise<void> {
  if (artworkLoadPromise) return artworkLoadPromise;
  artworkLoadPromise = (async () => {
    try {
      if (typeof Image === 'undefined') throw new Error('Image decoding requires a browser document.');
      const image = new Image();
      image.decoding = 'async';
      image.src = bowlHarborArtworkUrl;
      await image.decode();
      if (!image.naturalWidth || !image.naturalHeight) throw new Error('The enamel artwork decoded without image dimensions.');
      decodedBowlArtwork = image;
    } catch (error) {
      warnArtworkFallback(error);
    }
  })();
  return artworkLoadPromise;
}

/** Experimental art instances only: a fictional export bowl, not new facts,
 * dates or proof conditions. Both periods share the same kiln blemish, painted
 * motifs and old staple repair. New seams are a visual interpretation of the
 * existing reconstruction case; they must not independently settle a claim. */
export const BOWL_ART_ANCHORS = {
  oldStapleAngle: 0.64,
  kilnBlemishAngle: -0.48,
  palette: { cobalt: '#294b66', ironRed: '#9b4935', green: '#62765b', gold: '#ad8a4b', glaze: '#e8e2d0' },
} as const;

function canvas(width: number, height: number) {
  const element = document.createElement('canvas'); element.width = width; element.height = height;
  const context = element.getContext('2d');
  if (!context) throw new Error('Cannot create the ceramic painting canvas.');
  return { element, context };
}
function random(seed = 1267) {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}
function stroke(ctx: CanvasRenderingContext2D, points: number[][], color: string, width: number) {
  if (!points.length) return;
  ctx.beginPath(); ctx.moveTo(points[0][0], points[0][1]);
  points.slice(1).forEach(([x, y]) => ctx.lineTo(x, y));
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
}
function ceramicGround(ctx: CanvasRenderingContext2D, width: number, height: number, seed: number) {
  const r = random(seed);
  ctx.fillStyle = '#eae4d2'; ctx.fillRect(0, 0, width, height);
  const wash = ctx.createLinearGradient(0, 0, 0, height);
  wash.addColorStop(0, '#f1ecdc'); wash.addColorStop(0.53, '#e9e4d3'); wash.addColorStop(1, '#d4cbb5');
  ctx.fillStyle = wash; ctx.fillRect(0, 0, width, height);
  for (let i = 0; i < width * height / 290; i++) {
    ctx.fillStyle = `rgba(104,88,62,${0.022 + r() * 0.038})`;
    ctx.beginPath(); ctx.ellipse(r() * width, r() * height, 0.4 + r() * 1.8, 0.3 + r(), 0, 0, Math.PI * 2); ctx.fill();
  }
}
function floralBorder(ctx: CanvasRenderingContext2D, width: number, y: number, height: number) {
  const { cobalt, ironRed, green, gold } = BOWL_ART_ANCHORS.palette;
  ctx.fillStyle = cobalt; ctx.fillRect(0, y, width, 5); ctx.fillRect(0, y + height - 5, width, 4);
  ctx.fillStyle = gold; ctx.fillRect(0, y + 9, width, 3); ctx.fillRect(0, y + height - 13, width, 3);
  for (let x = -30; x < width + 70; x += 108) {
    ctx.save(); ctx.translate(x, y + height / 2);
    ctx.strokeStyle = green; ctx.lineWidth = 3; ctx.beginPath();
    ctx.moveTo(-50, 5); ctx.bezierCurveTo(-15, -28, 12, 28, 53, -4); ctx.stroke();
    for (const [lx, ly, angle] of [[-26, -9, -0.5], [31, 12, 0.5]]) {
      ctx.save(); ctx.translate(lx, ly); ctx.rotate(angle); ctx.fillStyle = green;
      ctx.beginPath(); ctx.ellipse(0, 0, 16, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    for (let petal = 0; petal < 5; petal++) {
      ctx.save(); ctx.rotate(petal * Math.PI * 2 / 5); ctx.fillStyle = ironRed;
      ctx.beginPath(); ctx.ellipse(0, -10, 5, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    ctx.fillStyle = gold; ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}
function building(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, index: number) {
  const { cobalt, ironRed, green, gold } = BOWL_ART_ANCHORS.palette;
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = index % 3 === 0 ? '#cba77b' : index % 3 === 1 ? '#dad2af' : '#b4bdac';
  ctx.strokeStyle = cobalt; ctx.lineWidth = 3;
  ctx.fillRect(0, 0, w, h); ctx.strokeRect(0, 0, w, h);
  ctx.fillStyle = ironRed; ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(w / 2, -h * 0.22);
  ctx.lineTo(w + 12, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  stroke(ctx, [[-9, 8], [w + 9, 8]], cobalt, 4);
  const cols = Math.max(3, Math.floor(w / 34));
  for (let row = 0; row < 2; row++) for (let col = 0; col < cols; col++) {
    const wx = (col + 0.5) * w / cols, wy = 21 + row * h * 0.33;
    ctx.fillStyle = cobalt; ctx.fillRect(wx - 6, wy, 12, 22);
    stroke(ctx, [[wx, wy], [wx, wy + 22]], '#ceccb3', 1.4);
  }
  const ay = h * 0.76;
  for (let col = 0; col < cols; col++) {
    const wx = (col + 0.5) * w / cols;
    ctx.fillStyle = '#597176'; ctx.beginPath(); ctx.moveTo(wx - 10, h);
    ctx.lineTo(wx - 10, ay); ctx.arc(wx, ay, 10, Math.PI, 0); ctx.lineTo(wx + 10, h); ctx.fill();
  }
  stroke(ctx, [[0, h * 0.7], [w, h * 0.7]], cobalt, 3);
  for (let k = 0; k <= cols; k++) stroke(ctx, [[k * w / cols, h * 0.72], [k * w / cols, h]], '#e8dfc8', 4);
  const pole = w * 0.73;
  stroke(ctx, [[pole, -h * 0.12], [pole, -h * 0.58]], cobalt, 2);
  ctx.fillStyle = index % 2 ? green : gold; ctx.beginPath(); ctx.moveTo(pole, -h * 0.56);
  ctx.lineTo(pole + 34, -h * 0.52); ctx.lineTo(pole + 29, -h * 0.36); ctx.lineTo(pole, -h * 0.4); ctx.fill();
  ctx.restore();
}
function ship(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, reflected = false) {
  const { cobalt, ironRed } = BOWL_ART_ANCHORS.palette;
  ctx.save(); ctx.translate(x, y); ctx.scale(reflected ? -scale : scale, scale);
  ctx.strokeStyle = cobalt; ctx.lineWidth = 3;
  ctx.fillStyle = '#8b604c'; ctx.beginPath(); ctx.moveTo(-122, -14); ctx.lineTo(110, -8);
  ctx.lineTo(84, 26); ctx.bezierCurveTo(32, 38, -67, 35, -99, 17); ctx.closePath(); ctx.fill(); ctx.stroke();
  stroke(ctx, [[-122, -16], [-89, -28], [97, -23], [117, -7]], cobalt, 4);
  for (const [mx, mh] of [[-52, 186], [15, 223], [69, 166]]) {
    stroke(ctx, [[mx, -15], [mx, -mh]], cobalt, 3);
    for (let sail = 0; sail < 3; sail++) {
      const sy = -mh + 25 + sail * 43, sw = 35 + sail * 4;
      ctx.fillStyle = '#f1e8cb'; ctx.beginPath(); ctx.moveTo(mx - sw, sy);
      ctx.quadraticCurveTo(mx + 1, sy + 5, mx + sw, sy - 1);
      ctx.quadraticCurveTo(mx + sw + 11, sy + 34, mx + sw - 6, sy + 39);
      ctx.quadraticCurveTo(mx, sy + 48, mx - sw + 2, sy + 35); ctx.closePath(); ctx.fill(); ctx.stroke();
      stroke(ctx, [[mx - sw, sy], [mx + sw, sy - 1]], cobalt, 3);
      stroke(ctx, [[mx - sw + 7, sy + 9], [mx + sw - 8, sy + 14]], '#acb2a0', 1.3);
    }
    stroke(ctx, [[mx, -mh], [-101, -15]], '#4f666b', 1.2);
    stroke(ctx, [[mx, -mh], [92, -15]], '#4f666b', 1.2);
  }
  ctx.fillStyle = ironRed; ctx.beginPath(); ctx.moveTo(15, -226); ctx.lineTo(51, -218); ctx.lineTo(17, -205); ctx.fill();
  for (let i = 0; i < 9; i++) ctx.fillRect(-75 + i * 19, -2, 6, 5);
  for (let i = 0; i < 5; i++) stroke(ctx, [[-150 + i * 10, 46 + i * 8], [130 - i * 10, 44 + i * 8]], '#829195', 1.8);
  ctx.restore();
}
function exteriorTexture(period: BowlPeriod) {
  const { element, context: ctx } = canvas(4096, 2048);
  const w = element.width, h = element.height;
  ceramicGround(ctx, w, h, 4102);
  if (decodedBowlArtwork) {
    // The outer lathe runs from underside (v=0) to lip (v=1). CanvasTexture's
    // default flipY already maps the image top to the lip, so do not mirror it.
    // The whole flat panorama, including both borders, occupies the visible
    // wall above the underside; keep its source aspect ratio on the canvas.
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    const paintedHeight = w * decodedBowlArtwork.naturalHeight / decodedBowlArtwork.naturalWidth;
    ctx.drawImage(decodedBowlArtwork, 0, 60, w, paintedHeight);
  } else {
  warnArtworkFallback('Call and await preloadBowlArtwork() before creating a normal bowl.');
  floralBorder(ctx, w, 60, 110);
  floralBorder(ctx, w, 1640, 72);
  // Lathe UV space includes the underside. Lift the panorama into the broad
  // visible wall instead of letting the harbour disappear under the belly.
  ctx.save(); ctx.beginPath(); ctx.rect(0, 190, w, 1430); ctx.clip();
  ctx.translate(0, -430); ctx.scale(1, 0.8);
  ctx.fillStyle = '#aab9b4'; ctx.globalAlpha = 0.5;
  ctx.beginPath(); ctx.moveTo(0, 945);
  for (let x = 0; x <= w; x += 85) ctx.lineTo(x, 670 + Math.sin(x / 520) * 110 + Math.sin(x / 233) * 48);
  ctx.lineTo(w, 1090); ctx.lineTo(0, 1090); ctx.fill(); ctx.globalAlpha = 1;
  for (let i = 0; i < 16; i++) building(ctx, i * 268 - 50, 898 + Math.sin(i * 2.4) * 19, 225, 182 + i % 3 * 17, i);
  stroke(ctx, [[0, 1100], [w, 1100]], '#657d7b', 6);
  const r = random(3001);
  for (let i = 0; i < 170; i++) {
    const x = r() * w, y = 1120 + r() * 402;
    stroke(ctx, [[x, y], [x + 24 + r() * 88, y + r() * 4]], i % 4 ? '#7e9292' : '#b9b69d', i % 4 ? 1.7 : 3);
  }
  ship(ctx, 370, 1330, 1.67); ship(ctx, 1670, 1415, 1.84, true); ship(ctx, 2860, 1310, 1.72);
  ship(ctx, 3680, 1450, 0.65, true);
  ctx.restore();
  }
  // The old staple line is shared by both periods and agrees with the 3D staples.
  const oldX = BOWL_ART_ANCHORS.oldStapleAngle / (Math.PI * 2) * w;
  stroke(ctx, [[oldX + 11, 490], [oldX - 4, 665], [oldX + 5, 826], [oldX - 10, 1024], [oldX + 2, 1264], [oldX - 6, 1480]], '#938372', 3.5);
  if (period === 'current') {
    for (const [start, drift] of [[0.43, 22], [0.73, -38]]) {
      const px = w * start;
      stroke(ctx, [[px, 205], [px + 13, 447], [px - 10, 696], [px + drift, 933], [px + 8, 1150], [px + 33, 1498]], '#b7a78e', 8);
      stroke(ctx, [[px + 1, 205], [px + 14, 447], [px - 9, 696], [px + drift + 1, 933], [px + 9, 1150], [px + 34, 1498]], '#ded5c1', 4);
    }
  }
  return element;
}
function interiorTexture() {
  const { element, context: ctx } = canvas(2048, 1024);
  ceramicGround(ctx, 2048, 1024, 1501);
  // The inner profile travels from lip to well, the reverse of the exterior.
  floralBorder(ctx, 2048, 861, 75);
  ctx.strokeStyle = '#385a73'; ctx.lineWidth = 5;
  for (const y of [849, 951, 982]) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(2048, y); ctx.stroke(); }
  return element;
}
function wellTexture() {
  const { element, context: ctx } = canvas(1024, 1024);
  ceramicGround(ctx, 1024, 1024, 1519);
  ctx.save(); ctx.translate(512, 512);
  for (const radius of [382, 402]) {
    ctx.strokeStyle = '#355a72'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.save(); ctx.scale(0.88, 0.88); ship(ctx, 0, 126, 1.55); ctx.restore();
  ctx.restore(); return element;
}
function baseTexture() {
  const { element, context: ctx } = canvas(1024, 1024);
  ceramicGround(ctx, 1024, 1024, 988);
  const r = random(219);
  for (let i = 0; i < 140; i++) {
    const angle = r() * Math.PI * 2, radius = 330 + r() * 88;
    ctx.fillStyle = `rgba(109,88,58,${0.07 + r() * 0.23})`;
    ctx.beginPath(); ctx.ellipse(512 + Math.sin(angle) * radius, 512 + Math.cos(angle) * radius, 3 + r() * 10, 2 + r() * 7, angle, 0, Math.PI * 2); ctx.fill();
  }
  // Fixed firing blemish, no invented inscription or maker's mark.
  ctx.fillStyle = '#927b58'; ctx.beginPath(); ctx.ellipse(354, 767, 37, 16, -0.55, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#b8a282'; ctx.beginPath(); ctx.ellipse(358, 768, 28, 10, -0.55, 0, Math.PI * 2); ctx.fill();
  return element;
}
function texture(element: HTMLCanvasElement) {
  const map = new THREE.CanvasTexture(element); map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8; return map;
}
function profile(points: number[][], samples = 64) {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, y]) => new THREE.Vector3(x, y, 0)));
  return curve.getPoints(samples).map(p => new THREE.Vector2(Math.max(0.001, p.x), p.y));
}
function outerRadius(y: number) {
  const points = [[-0.63, 0.53], [-0.53, 0.72], [-0.32, 0.97], [-0.05, 1.16], [0.22, 1.28], [0.5, 1.34]];
  for (let i = 1; i < points.length; i++) if (y <= points[i][0]) {
    const t = (y - points[i - 1][0]) / (points[i][0] - points[i - 1][0]);
    return THREE.MathUtils.lerp(points[i - 1][1], points[i][1], t);
  }
  return 1.34;
}
function polar(angle: number, y: number, offset = 0) {
  const r = outerRadius(y) + offset;
  return new THREE.Vector3(Math.sin(angle) * r, y, Math.cos(angle) * r);
}

/** Browser factory, reusable in offscreen scene captures. X-ray mode is a
 * schematic structural view of the same mesh, never a scientific radiograph. */
export function createBowlGroup({ period = 'current', mode = 'normal' }: BowlModelOptions = {}) {
  const group = new THREE.Group(); group.name = 'fictional-export-porcelain-bowl';
  group.userData = { period, mode, experimentalArtwork: true, anchors: BOWL_ART_ANCHORS,
    artworkSource: decodedBowlArtwork ? 'imagegen-harbor-enamel-v1' : 'procedural-fallback',
    scope: 'Fictional art instance; geometry and marks do not introduce claim requirements.' };
  const xray = mode === 'xray';
  const glaze = (map?: THREE.Texture, color = '#efeadb') => xray
    ? new THREE.MeshBasicMaterial({ color: '#b8cccd', transparent: true, opacity: 0.13, depthWrite: false, side: THREE.DoubleSide })
    : new THREE.MeshPhysicalMaterial({ ...(map ? { map } : {}), color, roughness: 0.3, metalness: 0, clearcoat: 0.7, clearcoatRoughness: 0.2 });
  const outer = new THREE.Mesh(new THREE.LatheGeometry(profile([[0.002, -0.635], [0.39, -0.635], [0.56, -0.617],
    [0.74, -0.5], [0.98, -0.29], [1.16, -0.03], [1.28, 0.23], [1.34, 0.5]]), 144),
    glaze(xray ? undefined : texture(exteriorTexture(period)), '#f7f3e8'));
  outer.name = 'outer-wall-and-solid-underside'; group.add(outer);
  const inner = new THREE.Mesh(new THREE.LatheGeometry(profile([[1.301, 0.501], [1.27, 0.31], [1.17, 0.08],
    [1.0, -0.15], [0.78, -0.33], [0.5, -0.425], [0.002, -0.429]]), 144),
    glaze(xray ? undefined : texture(interiorTexture()), '#f7f3e8'));
  inner.name = 'open-inner-wall'; group.add(inner);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.32, 0.022, 12, 160), glaze(undefined, '#d1bb91'));
  rim.rotation.x = Math.PI / 2; rim.position.y = 0.5; rim.name = 'thick-glazed-lip'; group.add(rim);
  const foot = new THREE.Mesh(new THREE.LatheGeometry(profile([[0.35, -0.625], [0.435, -0.65], [0.456, -0.752],
    [0.439, -0.814], [0.359, -0.814], [0.342, -0.758], [0.35, -0.625]], 36), 100),
    xray ? glaze() : new THREE.MeshStandardMaterial({ color: '#c5b795', roughness: 0.8 }));
  foot.name = 'unglazed-foot-ring'; group.add(foot);
  const base = new THREE.Mesh(new THREE.CircleGeometry(0.355, 96), glaze(xray ? undefined : texture(baseTexture()), '#f0e8d4'));
  base.rotation.x = Math.PI / 2; base.position.y = -0.645; base.name = 'underside-firing-blemish'; group.add(base);
  if (!xray) {
    const well = new THREE.Mesh(new THREE.CircleGeometry(0.465, 96), glaze(texture(wellTexture()), '#f7f3e8'));
    well.rotation.x = -Math.PI / 2; well.position.y = -0.418; well.name = 'interior-painted-well'; group.add(well);
  }
  const iron = new THREE.MeshStandardMaterial({ color: xray ? '#ecf2ea' : '#574b3f', roughness: 0.62, metalness: xray ? 0 : 0.52 });
  for (const y of [-0.28, -0.09, 0.1, 0.29]) {
    const a = BOWL_ART_ANCHORS.oldStapleAngle;
    const c = new THREE.CatmullRomCurve3([polar(a - 0.065, y, 0.009), polar(a - 0.06, y, 0.041),
      polar(a + 0.06, y + 0.009, 0.041), polar(a + 0.065, y + 0.009, 0.009)]);
    const staple = new THREE.Mesh(new THREE.TubeGeometry(c, 20, 0.009, 7, false), iron);
    staple.name = 'shared-old-staple-repair'; group.add(staple);
    for (const side of [-1, 1]) {
      const rivet = new THREE.Mesh(new THREE.SphereGeometry(0.013, 8, 6), iron);
      rivet.position.copy(polar(a + side * 0.065, y + (side > 0 ? 0.009 : 0), 0.012)); group.add(rivet);
    }
  }
  if (xray && period === 'current') {
    const jointMaterial = new THREE.MeshBasicMaterial({ color: '#dee9de', transparent: true, opacity: 0.76 });
    for (const angle of [0.64, 2.7, 4.57]) {
      const curve = new THREE.CatmullRomCurve3([-0.51, -0.31, -0.06, 0.22, 0.48].map((y, i) => polar(angle + Math.sin(i * 2.4) * 0.025, y, -0.017)));
      const joint = new THREE.Mesh(new THREE.TubeGeometry(curve, 36, 0.012, 7, false), jointMaterial);
      joint.name = 'schematic-current-structural-joint'; group.add(joint);
    }
  }
  group.traverse(object => { if (object instanceof THREE.Mesh) { object.castShadow = true; object.receiveShadow = true; } });
  return group;
}

export function disposeBowlGroup(group: THREE.Group) {
  const geometries = new Set<THREE.BufferGeometry>(); const materials = new Set<THREE.Material>(); const textures = new Set<THREE.Texture>();
  group.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    geometries.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(material);
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
    }
  });
  textures.forEach(item => item.dispose()); materials.forEach(item => item.dispose()); geometries.forEach(item => item.dispose());
}
