import { createEngineRuntime } from './engine-runtime.mjs';

const runtime = createEngineRuntime();
const completed = new Map<number, any>();
let newestRequest = 0;
self.onmessage = (event: MessageEvent) => {
  const { id, command, payload } = event.data;
  // A resent request ID returns its first response; it cannot charge twice.
  if (completed.has(id)) { self.postMessage(completed.get(id)); return; }
  if (!Number.isInteger(id) || id <= newestRequest) {
    self.postMessage({ id, ok: false, error: '这项后台请求已经过期。' }); return;
  }
  newestRequest = id;
  let response;
  try { response = { id, ok: true, value: runtime.dispatch(command, payload) }; }
  catch (error) { response = { id, ok: false, error: error instanceof Error ? error.message : String(error) }; }
  completed.set(id, response);
  // Bound historical snapshot retention; an evicted old ID is rejected above.
  if (completed.size > 32) completed.delete(completed.keys().next().value!);
  self.postMessage(response);
};
