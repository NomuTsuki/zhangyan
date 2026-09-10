/** Transport-only client: this module imports no solver or session code.
 * A reset terminates the old computation, rejects its promises, and starts a
 * new generation. Late events from that worker cannot address new requests.
 */
export class BackgroundEngine {
  constructor(createWorker) {
    this.createWorker = createWorker; this.worker = null; this.generation = 0;
    this.serial = 0; this.pending = new Map(); this.failed = null;
  }
  supersede() {
    this.generation++; this.worker?.terminate(); this.worker = null;
    for (const task of this.pending.values()) task.reject(Object.assign(new Error('Background request superseded'), { name: 'AbortError' }));
    this.pending.clear(); this.failed = null;
  }
  reset(budget = 22) {
    this.supersede(); const generation = this.generation;
    const worker = this.createWorker(); this.worker = worker;
    worker.onmessage = event => {
      if (generation !== this.generation) return;
      const reply = event.data, task = this.pending.get(reply.id);
      if (!task) return;
      this.pending.delete(reply.id);
      if (reply.ok) task.resolve(reply.value); else task.reject(new Error(reply.error));
    };
    worker.onerror = event => {
      if (generation !== this.generation) return;
      this.failed = new Error(event.message || '后台计算未能完成。');
      for (const task of this.pending.values()) task.reject(this.failed);
      this.pending.clear();
    };
    return this.request('init', { budget });
  }
  request(command, payload = {}) {
    if (this.failed) return Promise.reject(this.failed);
    if (!this.worker) return Promise.reject(new Error('后台计算尚未准备好。'));
    const id = ++this.serial;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      try { this.worker.postMessage({ id, command, payload }); }
      catch (error) { this.pending.delete(id); reject(error); }
    });
  }
  dispose() { this.supersede(); }
}
