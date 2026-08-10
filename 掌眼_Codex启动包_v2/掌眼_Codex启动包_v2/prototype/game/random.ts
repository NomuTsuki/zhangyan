import { round1 } from "./numeric.ts";
import { DEFAULT_RULESET_CONFIG } from "./ruleset.ts";

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function seededUnit(seed: number, turn: number, key: string) {
  let value = (seed ^ hashString(key) ^ Math.imul(turn + 1, 2654435761)) >>> 0;
  value = (value ^ (value >>> 16)) >>> 0;
  value = Math.imul(value, 2246822507) >>> 0;
  value = (value ^ (value >>> 13)) >>> 0;
  value = Math.imul(value, 3266489909) >>> 0;
  value = (value ^ (value >>> 16)) >>> 0;
  return value / 4294967296;
}

export function behaviorJitter(seed: number, turn: number, key: string) {
  const span = DEFAULT_RULESET_CONFIG.behaviorJitterSpan;
  return round1((seededUnit(seed, turn, `behavior:${key}`) - 0.5) * span);
}
