import { test } from "node:test";
import assert from "node:assert/strict";
import { VideoCall, mediaError } from "../src/utils/videoCall.js";
class Socket {
  connected = true; handlers = new Map(); sent = [];
  on(event, fn) { this.handlers.set(event, fn); }
  off(event) { this.handlers.delete(event); }
  connect() { this.connected = true; }
  disconnect() { this.connected = false; }
  emit(event, data) { this.sent.push([event, data]); }
  timeout() { return this; }
  async emitWithAck(event, data) { this.emit(event, data); return { ok: true, callId: "call-1" }; }
  receive(event, data) { this.handlers.get(event)?.(data); }
}
function fixture(options = {}) {
  const tracks = ["audio", "video"].map((kind) => ({ kind, enabled: true, stopped: false, stop() { this.stopped = true; } }));
  const stream = { getTracks: () => tracks };
  const pc = { candidates: [], addTrack() {}, close() { this.closed = true; },
    async createOffer() { return { type: "offer", sdp: "offer" }; }, async createAnswer() { return { type: "answer", sdp: "answer" }; },
    async setLocalDescription(d) { this.localDescription = d; }, async setRemoteDescription(d) { this.remoteDescription = d; },
    async addIceCandidate(c) { this.candidates.push(c); } };
  const socket = new Socket();
  const call = new VideoCall(socket, { getConfig: async () => ({ iceServers: [] }), getMedia: async () => stream, createPeer: () => pc, ...options });
  const dispose = call.mount();
  const incoming = () => socket.receive("incomingCall", { callId: "call-1", caller: { firstName: "Alice" } });
  return { call, socket, tracks, stream, pc, incoming, dispose };
}
test("permission denial ends the call and reports a useful error", async () => {
  const f = fixture({ getMedia: async () => { throw Object.assign(new Error(), { name: "NotAllowedError" }); } });
  f.incoming(); await f.call.accept();
  assert.equal(f.call.state.call, null); assert.match(f.call.state.notice, /Allow camera/);
  assert.ok(f.socket.sent.some(([event]) => event === "endCall")); f.dispose();
});
test("late media after cancelling a permission prompt is immediately stopped", async () => {
  let resolveMedia; const f = fixture({ getMedia: () => new Promise((resolve) => { resolveMedia = resolve; }) });
  f.incoming(); const accepting = f.call.accept(); await Promise.resolve();
  f.call.end(); resolveMedia(f.stream); await accepting;
  assert.ok(f.tracks.every((track) => track.stopped)); assert.equal(f.call.state.local, null);
  assert.equal(f.socket.sent.some(([event]) => event === "acceptCall"), false); f.dispose();
});
test("ICE arriving before remote SDP is buffered and applied after the offer", async () => {
  const f = fixture(); f.incoming();
  f.socket.receive("iceCandidate", { callId: "call-1", candidate: { candidate: "early" } });
  await f.call.accept();
  f.socket.receive("webrtcOffer", { callId: "call-1", description: { type: "offer", sdp: "offer" } });
  await f.call.op.chain;
  assert.equal(f.pc.candidates[0].candidate, "early");
  assert.ok(f.socket.sent.some(([event]) => event === "webrtcAnswer")); f.dispose();
});
test("mute, camera off, hangup and unmount release tracks, peer and listeners", async () => {
  const f = fixture(); f.incoming(); await f.call.accept();
  f.call.toggle("audio"); f.call.toggle("video");
  assert.ok(f.tracks.every((track) => !track.enabled));
  f.call.toggle("audio"); assert.equal(f.tracks[0].enabled, true);
  f.dispose(); assert.ok(f.tracks.every((track) => track.stopped));
  assert.equal(f.pc.closed, true); assert.equal(f.socket.handlers.size, 0); assert.equal(f.socket.connected, false);
});
test("caller creates an offer only after the receiver accepts", async () => {
  const f = fixture(); await f.call.start("target", { firstName: "Bob" });
  assert.equal(f.call.state.local, null);
  f.socket.receive("callAccepted", { callId: "call-1" }); await f.call.op.chain;
  assert.ok(f.socket.sent.some(([event]) => event === "webrtcOffer")); f.dispose();
});
test("server timeout and socket disconnect clean up active media", async () => {
  for (const event of ["callEnded", "disconnect"]) {
    const f = fixture(); f.incoming(); await f.call.accept();
    f.socket.receive(event, { callId: "call-1", reason: "timeout" });
    assert.ok(f.tracks.every((track) => track.stopped)); assert.equal(f.call.state.call, null); f.dispose();
  }
});
test("decline requests no media and late call creation is cancelled", async () => {
  const f = fixture(); f.incoming(); f.call.decline();
  assert.equal(f.call.state.local, null); assert.equal(f.socket.sent[0][0], "rejectCall");
  f.socket.receive("callRinging", { callId: "late-call" });
  assert.ok(f.socket.sent.some(([event, data]) => event === "endCall" && data.callId === "late-call")); f.dispose();
});
test("device errors distinguish missing and occupied hardware", () => {
  assert.match(mediaError({ name: "NotFoundError" }), /No camera/);
  assert.match(mediaError({ name: "NotReadableError" }), /another application/);
});
