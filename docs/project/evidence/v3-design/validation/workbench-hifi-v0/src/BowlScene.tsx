import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { createBowlGroup, disposeBowlGroup } from './bowl-art';
import './bowl.css';

export const BOWL_TARGETS = [
  { id: 'OBJ_W', label: '整只碗', region: 'whole' },
  { id: 'OBJ_D', label: '纹饰与色差', region: 'decoration' },
  { id: 'OBJ_R', label: '没被改动的特征', region: 'stable' },
  { id: 'SURF', label: '表面', region: 'surface' },
  { id: 'OBJ_F', label: '底足与修足', region: 'base' },
] as const;

export interface BowlSceneProps {
  selectedTargetId: string | null;
  onSelectTarget: (id: string) => void;
  onOrientationChange?: (ids: string[]) => void;
  /** Prevents investigation selection; viewing and rotation remain available. */
  disabled?: boolean;
}
type Hotspot = { id: string; x: number; y: number; visible: boolean };
type Controls = { reset: () => void; zoom: (delta: number) => void };

// Experimental presentation parameters, not game costs or evidence rules.
// Broad entry/exit cones prevent precise-angle hunting and boundary flicker.
const POSE = {
  initial: new THREE.Euler(-0.3, -0.29, -0.105), cameraDistance: 4.35,
  minDistance: 3.55, maxDistance: 6.1, dragRadiansPerPixel: 0.008,
  keyStep: 0.15, enterDot: 0.25, exitDot: 0.08, baseEnterDot: 0.38, baseExitDot: 0.22,
  settleMs: 130, orientationEase: 0.24,
};

export default function BowlScene({ selectedTargetId, onSelectTarget, onOrientationChange, disabled = false }: BowlSceneProps) {
  const host = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ onOrientationChange, onSelectTarget, disabled });
  callbacks.current = { onOrientationChange, onSelectTarget, disabled };
  const controls = useRef<Controls | null>(null);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [visibleIds, setVisibleIds] = useState<string[]>(['OBJ_W']);
  const [magnification, setMagnification] = useState(100);

  useEffect(() => {
    const container = host.current;
    if (!container) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch {
      setError('此浏览器暂时无法启用 3D 器物。请启用硬件加速后重新打开页面。');
      return;
    }
    setError(null);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.18;
    const element = renderer.domElement;
    element.className = 'bowl-webgl'; element.tabIndex = 0;
    element.setAttribute('role', 'img'); element.setAttribute('aria-label', '可旋转的外销瓷碗。拖动旋转，方向键转动，滚轮缩放，Home 键复位。');
    container.prepend(element);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(39, 1, 0.1, 30);
    const model = createBowlGroup(); scene.add(model);
    const targetQuaternion = new THREE.Quaternion().setFromEuler(POSE.initial);
    model.quaternion.copy(targetQuaternion);
    const hemi = new THREE.HemisphereLight(0xf3eddf, 0x333a3c, 2.05); scene.add(hemi);
    const key = new THREE.DirectionalLight(0xffefda, 3.8); key.position.set(-3.5, 4.2, 5); scene.add(key);
    const fill = new THREE.DirectionalLight(0xcbdce3, 1.25); fill.position.set(4, 1, 2); scene.add(fill);
    const rimLight = new THREE.DirectionalLight(0xffe7bd, 2.1); rimLight.position.set(1.8, 3, -4); scene.add(rimLight);
    // A small generated studio environment provides reflections in actual PBR
    // glaze, without an image background, a floor plane or a visible table.
    const studio = new THREE.Scene(); studio.background = new THREE.Color(0x24292b);
    const panels: THREE.Mesh[] = [];
    for (const [x, y, z, width, height, color] of [[-3, 3, 2, 3, 5, 0xc8c4b9], [4, 1, 2, 2, 4, 0x9babb2], [0, 5, -1, 4, 2, 0xf0dcc1]]) {
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }));
      panel.position.set(x, y, z); panel.lookAt(0, 0, 0); studio.add(panel); panels.push(panel);
    }
    const pmrem = new THREE.PMREMGenerator(renderer);
    const environment = pmrem.fromScene(studio, 0.08); scene.environment = environment.texture;
    panels.forEach(panel => { panel.geometry.dispose(); (panel.material as THREE.Material).dispose(); }); pmrem.dispose();
    let width = 360, height = 340, distance = POSE.cameraDistance, disposed = false, contextLost = false, raf = 0;
    let pointer: { id: number; x: number; y: number } | null = null;
    let lastPaint = 0, lastHotspotString = '', lastVisibleString = '';
    const active = new Map(BOWL_TARGETS.map(target => [target.id as string, target.id === 'OBJ_W']));
    const pending = new Map<string, { visible: boolean; since: number }>();
    const vector = new THREE.Vector3(), normal = new THREE.Vector3(), localView = new THREE.Vector3(), inverse = new THREE.Quaternion();
    const updateCamera = () => {
      camera.position.set(0, 0.24, distance); camera.lookAt(0, -0.07, 0);
      setMagnification(Math.round(POSE.cameraDistance / distance * 100));
    };
    const resize = () => {
      width = Math.max(1, container.clientWidth); height = Math.max(1, container.clientHeight);
      camera.aspect = width / height; camera.updateProjectionMatrix(); renderer.setSize(width, height, false);
    };
    const rotate = (dx: number, dy: number) => {
      const delta = new THREE.Quaternion().setFromEuler(new THREE.Euler(dy, dx, 0, 'XYZ'));
      targetQuaternion.premultiply(delta).normalize();
    };
    const zoom = (delta: number) => { distance = THREE.MathUtils.clamp(distance + delta, POSE.minDistance, POSE.maxDistance); updateCamera(); };
    const reset = () => { targetQuaternion.setFromEuler(POSE.initial); distance = POSE.cameraDistance; updateCamera(); };
    controls.current = { reset, zoom };
    updateCamera(); resize();
    const observer = new ResizeObserver(resize); observer.observe(container);
    const down = (event: PointerEvent) => {
      if (event.button !== 0) return;
      element.focus({ preventScroll: true }); pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
      element.setPointerCapture(event.pointerId); setDragging(true);
    };
    const move = (event: PointerEvent) => {
      if (!pointer || pointer.id !== event.pointerId) return;
      rotate((event.clientX - pointer.x) * POSE.dragRadiansPerPixel, (event.clientY - pointer.y) * POSE.dragRadiansPerPixel);
      pointer.x = event.clientX; pointer.y = event.clientY;
    };
    const up = (event: PointerEvent) => {
      if (!pointer || pointer.id !== event.pointerId) return;
      if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId);
      pointer = null; setDragging(false);
    };
    const wheel = (event: WheelEvent) => { event.preventDefault(); zoom(Math.sign(event.deltaY) * 0.18); };
    const keydown = (event: KeyboardEvent) => {
      const step = POSE.keyStep * (event.shiftKey ? 2 : 1);
      const actions: Record<string, () => void> = { ArrowLeft: () => rotate(-step, 0), ArrowRight: () => rotate(step, 0),
        ArrowUp: () => rotate(0, -step), ArrowDown: () => rotate(0, step), Home: reset,
        '+': () => zoom(-0.2), '=': () => zoom(-0.2), '-': () => zoom(0.2) };
      if (actions[event.key]) { event.preventDefault(); actions[event.key](); }
    };
    const lost = (event: Event) => { event.preventDefault(); contextLost = true; setError('3D 画面暂时中断，正在等待浏览器恢复。'); };
    const restored = () => { contextLost = false; setError(null); resize(); };
    element.addEventListener('pointerdown', down); element.addEventListener('pointermove', move);
    element.addEventListener('pointerup', up); element.addEventListener('pointercancel', up);
    element.addEventListener('wheel', wheel, { passive: false }); element.addEventListener('keydown', keydown);
    element.addEventListener('webglcontextlost', lost); element.addEventListener('webglcontextrestored', restored);

    function updateHotspots(now: number) {
      inverse.copy(model.quaternion).invert(); localView.copy(camera.position).applyQuaternion(inverse).normalize();
      const facingAngle = Math.atan2(localView.x, localView.z);
      const decorPoint = new THREE.Vector3(Math.sin(facingAngle) * 1.13, -0.015, Math.cos(facingAngle) * 1.13);
      const definitions = [
        { id: 'OBJ_W', point: new THREE.Vector3(0, 0.1, 0), normal: new THREE.Vector3(), always: true },
        { id: 'OBJ_D', point: decorPoint, normal: new THREE.Vector3(Math.sin(facingAngle), -0.37, Math.cos(facingAngle)).normalize() },
        { id: 'OBJ_R', point: new THREE.Vector3(0.405, -0.52, 0.58), normal: new THREE.Vector3(0.57, -0.28, 0.82).normalize() },
        { id: 'SURF', point: new THREE.Vector3(-0.79, 0.14, 0.92), normal: new THREE.Vector3(-0.61, -0.24, 0.79).normalize() },
        { id: 'OBJ_F', point: new THREE.Vector3(0, -0.79, 0), normal: new THREE.Vector3(0, -1, 0) },
      ];
      const next: Hotspot[] = [];
      for (const definition of definitions) {
        vector.copy(definition.point).applyQuaternion(model.quaternion);
        normal.copy(definition.normal).applyQuaternion(model.quaternion);
        const towardCamera = camera.position.clone().sub(vector).normalize();
        const dot = normal.dot(towardCamera), was = active.get(definition.id) || false;
        const entry = definition.id === 'OBJ_F' ? POSE.baseEnterDot : POSE.enterDot;
        const exit = definition.id === 'OBJ_F' ? POSE.baseExitDot : POSE.exitDot;
        const visible = definition.always || dot > (was ? exit : entry);
        if (visible !== was) {
          const candidate = pending.get(definition.id);
          if (!candidate || candidate.visible !== visible) pending.set(definition.id, { visible, since: now });
          else if (now - candidate.since >= POSE.settleMs) { active.set(definition.id, visible); pending.delete(definition.id); }
        } else pending.delete(definition.id);
        vector.project(camera);
        next.push({ id: definition.id, visible: active.get(definition.id) || false,
          x: Math.round((vector.x * 0.5 + 0.5) * width * 10) / 10,
          y: Math.round((-vector.y * 0.5 + 0.5) * height * 10) / 10 });
      }
      const visible = BOWL_TARGETS.filter(target => active.get(target.id)).map(target => target.id as string);
      const visibility = visible.join('|');
      if (visibility !== lastVisibleString) {
        lastVisibleString = visibility; setVisibleIds(visible); callbacks.current.onOrientationChange?.(visible);
      }
      const serial = JSON.stringify(next);
      if (serial !== lastHotspotString) { lastHotspotString = serial; setHotspots(next); }
    }
    function paint(now: number) {
      if (disposed) return;
      raf = requestAnimationFrame(paint);
      if (contextLost) return;
      const elapsed = Math.min((now - lastPaint) / 16.67 || 1, 3); lastPaint = now;
      model.quaternion.slerp(targetQuaternion, 1 - Math.pow(1 - POSE.orientationEase, elapsed));
      renderer.render(scene, camera); updateHotspots(now);
    }
    raf = requestAnimationFrame(paint);
    return () => {
      disposed = true; cancelAnimationFrame(raf); observer.disconnect(); controls.current = null;
      element.removeEventListener('pointerdown', down); element.removeEventListener('pointermove', move);
      element.removeEventListener('pointerup', up); element.removeEventListener('pointercancel', up);
      element.removeEventListener('wheel', wheel); element.removeEventListener('keydown', keydown);
      element.removeEventListener('webglcontextlost', lost); element.removeEventListener('webglcontextrestored', restored);
      disposeBowlGroup(model); environment.dispose(); scene.clear(); renderer.dispose(); element.remove();
    };
  }, []);

  const select = (id: string) => { if (!disabled) onSelectTarget(id); };
  return <div className={`bowl-scene${dragging ? ' is-dragging' : ''}`}>
    <div className="bowl-stage" ref={host}>
      <div className="bowl-stage-guide" aria-hidden="true"><span>拖动器物，自由把玩</span><span>滚轮拉近</span></div>
      {!error && hotspots.filter(point => point.visible && point.id !== 'OBJ_W').map(point => {
        const target = BOWL_TARGETS.find(item => item.id === point.id)!;
        return <button key={point.id} type="button" className={`bowl-hotspot${selectedTargetId === point.id ? ' is-selected' : ''}`}
          style={{ left: point.x, top: point.y }} aria-label={`调查${target.label}`} title={target.label}
          aria-pressed={selectedTargetId === point.id} disabled={disabled} onClick={() => select(point.id)}>
          <span className="bowl-hotspot-ring" /><span className="bowl-hotspot-label">{target.label}</span>
        </button>;
      })}
      {error && <div className="bowl-render-error" role="alert">{error}</div>}
      <div className="bowl-view-controls">
        <button type="button" onClick={() => controls.current?.reset()} aria-label="复位器物视角">↺ <span>复位</span></button>
        <div><button type="button" onClick={() => controls.current?.zoom(0.25)} aria-label="拉远器物">−</button>
          <span className="bowl-magnification">{magnification}%</span>
          <button type="button" onClick={() => controls.current?.zoom(-0.25)} aria-label="拉近器物">＋</button></div>
      </div>
    </div>
    <div className="bowl-visible-targets" aria-label="当前角度可观察的部位">
      <span className="bowl-target-caption">此刻看得见</span>
      <div className="bowl-target-list">
        {BOWL_TARGETS.filter(target => visibleIds.includes(target.id)).map(target => <button type="button" key={target.id}
          className={selectedTargetId === target.id ? 'is-selected' : ''} aria-pressed={selectedTargetId === target.id}
          disabled={disabled} onClick={() => select(target.id)}>{target.label}<span aria-hidden="true">↗</span></button>)}
      </div>
      <p className="bowl-orientation-help">转到底部，可以查看底足。选部位不消耗调查机会。</p>
    </div>
  </div>;
}
