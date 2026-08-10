import { DEFAULT_RULESET_CONFIG } from "./ruleset.ts";

export function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

export function round1(value: number) {
  return Math.round(value * 10) / 10;
}

export function roundToTick(value: number, tick = DEFAULT_RULESET_CONFIG.priceTick) {
  return Math.max(tick, Math.round(value / tick) * tick);
}

export function ceilToTick(value: number, tick = DEFAULT_RULESET_CONFIG.priceTick) {
  return Math.max(tick, Math.ceil(value / tick) * tick);
}

export function floorToTick(value: number, tick = DEFAULT_RULESET_CONFIG.priceTick) {
  return Math.max(tick, Math.floor(value / tick) * tick);
}

export function assertFiniteNumber(value: number, label: string) {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be finite`);
  }
  return value;
}
