// Test host only: run the actual web-worker entry on a real Node worker thread.
import { parentPort } from 'node:worker_threads';
const waiting=[];
globalThis.self={onmessage:null,postMessage:value=>parentPort.postMessage(value)};
parentPort.on('message',data=>self.onmessage?self.onmessage({data}):waiting.push(data));
await import('../src/engine.worker.ts');
for(const data of waiting)self.onmessage({data});
