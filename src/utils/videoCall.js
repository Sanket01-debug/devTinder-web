export const callMessages = {
  forbidden: "Only accepted connections can call each other.", busy: "One of you is already in a call.",
  unavailable: "This developer is offline. Try again later.", timeout: "No answer. Try again later.",
  declined: "Call declined.", disconnected: "The call ended because a participant disconnected.",
  connectionTimeout: "The video connection timed out. Try again or check your network.",
  ended: "Call ended.", durationLimit: "The four-hour call limit was reached.",
  rateLimited: "Please wait a moment before trying again.", stale: "This call is no longer available.",
};
export function mediaError(error) {
  if (["NotAllowedError", "SecurityError"].includes(error.name)) return "Allow camera and microphone access in your browser, then try again.";
  if (error.name === "NotFoundError") return "No camera or microphone was found. Connect both and try again.";
  if (error.name === "NotReadableError") return "Your camera or microphone is in use by another application.";
  return error.message || "Unable to start video. Check your devices and network.";
}
const idle = () => ({ call: null, local: null, remote: null, muted: false, cameraOff: false, notice: "", online: false });

// Browser resources live outside React renders, with injectable APIs for lifecycle tests.
export class VideoCall {
  constructor(socket, { getConfig, getMedia, createPeer } = {}) {
    this.socket = socket;
    this.getConfig = getConfig;
    this.getMedia = getMedia || (() => {
      if (!globalThis.isSecureContext || !navigator.mediaDevices?.getUserMedia) throw new Error("Video calling requires HTTPS (or localhost) and a supported browser.");
      return navigator.mediaDevices.getUserMedia({ audio: true, video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" } });
    });
    this.createPeer = createPeer || ((config) => new RTCPeerConnection(config));
    this.state = idle(); this.listeners = new Set(); this.handlers = [];
  }
  subscribe = (listener) => { this.listeners.add(listener); return () => this.listeners.delete(listener); };
  snapshot = () => this.state;
  update(patch) { this.state = { ...this.state, ...patch }; for (const listener of this.listeners) listener(); }
  status(op, status) { if (this.op === op) this.update({ call: { ...this.state.call, status } }); }
  async request(event, data) {
    if (!this.socket.connected) throw new Error("Connection lost. Reconnect and try again.");
    const result = await this.socket.timeout(8000).emitWithAck(event, data);
    if (!result?.ok) throw new Error(callMessages[result?.error] || "The call could not be completed. Please try again.");
    return result;
  }
  mount() {
    const on = (event, fn) => { this.socket.on(event, fn); this.handlers.push([event, fn]); };
    on("connect", () => this.update({ online: true }));
    on("connect_error", () => this.update({ online: false, notice: "Unable to connect. Check your network or sign in again." }));
    on("disconnect", () => { this.finish("Connection lost. Please reconnect before calling again."); this.update({ online: false }); });
    on("callRinging", ({ callId }) => {
      if (!this.op || this.op.role !== "caller") { this.socket.emit("endCall", { callId }); return; }
      this.op.id = callId; this.status(this.op, "ringing");
    });
    on("incomingCall", ({ callId, caller }) => {
      if (this.op?.role === "caller" && !this.op.id) this.finish("");
      if (this.op) { this.socket.emit("rejectCall", { callId }); return; }
      this.op = { id: callId, role: "receiver", candidates: [], chain: Promise.resolve() };
      this.update({ call: { person: caller, status: "incoming" }, notice: "" });
    });
    on("callAccepted", ({ callId }) => {
      const op = this.op;
      if (op?.id !== callId) return;
      this.status(op, "connecting");
      if (op.role === "caller") this.run(op, async () => {
        await this.prepare(op);
        if (this.op !== op) return;
        const offer = await op.pc.createOffer();
        if (this.op !== op) return;
        await op.pc.setLocalDescription(offer);
        if (this.op === op) await this.request("webrtcOffer", { callId, description: op.pc.localDescription });
      });
    });
    for (const event of ["callEnded", "callDismissed"]) on(event, ({ callId, reason }) => {
      if (this.op?.id === callId) this.finish(event === "callDismissed" ? "Call answered in another tab." : (callMessages[reason] || "Call ended."));
    });
    on("iceCandidate", ({ callId, candidate }) => {
      const op = this.op;
      if (op?.id !== callId) return;
      if (!op.pc?.remoteDescription) op.candidates.push(candidate);
      else this.run(op, () => op.pc.addIceCandidate(candidate));
    });
    for (const event of ["webrtcOffer", "webrtcAnswer"]) on(event, ({ callId, description }) => {
      const op = this.op;
      if (op?.id !== callId) return;
      this.run(op, async () => {
        if (!op.pc) throw new Error("The video connection is not ready. Please try again.");
        await op.pc.setRemoteDescription(description);
        if (this.op !== op) return;
        for (const candidate of op.candidates.splice(0)) await op.pc.addIceCandidate(candidate);
        if (event === "webrtcOffer" && this.op === op) {
          const answer = await op.pc.createAnswer();
          if (this.op !== op) return;
          await op.pc.setLocalDescription(answer);
          if (this.op === op) await this.request("webrtcAnswer", { callId, description: op.pc.localDescription });
        }
      });
    });
    this.socket.connect();
    return () => {
      this.end();
      for (const [event, fn] of this.handlers) this.socket.off(event, fn);
      this.handlers = []; this.socket.disconnect();
    };
  }
  run(op, action) {
    op.chain = op.chain.then(() => this.op === op ? action() : undefined).catch((error) => {
      if (this.op === op) this.end(mediaError(error));
    });
    return op.chain;
  }
  async start(targetUserId, person) {
    if (this.op) return;
    const op = { role: "caller", candidates: [], chain: Promise.resolve() };
    this.op = op;
    this.update({ call: { person, status: "calling" }, notice: "" });
    try {
      const { callId } = await this.request("initiateCall", { targetUserId });
      if (this.op !== op) { this.socket.emit("endCall", { callId }); return; }
      op.id = callId;
    } catch (error) { if (this.op === op) this.end(error.message); }
  }
  async accept() {
    const op = this.op;
    if (!op || this.state.call.status !== "incoming") return;
    this.status(op, "preparing");
    try {
      await this.prepare(op);
      if (this.op === op) await this.request("acceptCall", { callId: op.id });
    } catch (error) { if (this.op === op) this.end(mediaError(error)); }
  }
  async prepare(op) {
    const config = await this.getConfig();
    if (this.op !== op) return;
    const stream = await this.getMedia();
    // Permission prompts cannot be cancelled. Stop late-arriving tracks immediately.
    if (this.op !== op) { stream.getTracks().forEach((track) => track.stop()); return; }
    op.stream = stream;
    const pc = this.createPeer(config); op.pc = pc;
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    this.update({ local: stream });
    pc.onicecandidate = ({ candidate }) => {
      if (candidate && this.op === op) this.request("iceCandidate", { callId: op.id, candidate: candidate.toJSON() })
        .catch((error) => { if (this.op === op) this.end(error.message); });
    };
    pc.ontrack = ({ streams }) => { if (this.op === op && streams[0]) this.update({ remote: streams[0] }); };
    pc.onconnectionstatechange = () => {
      if (this.op !== op) return;
      clearTimeout(op.disconnectTimer);
      if (pc.connectionState === "connected") {
        this.update({ call: { ...this.state.call, status: "connected", startedAt: this.state.call.startedAt || Date.now() } });
        if (!op.reported) {
          op.reported = true;
          this.run(op, () => this.request("callConnected", { callId: op.id }));
        }
      } else if (pc.connectionState === "failed") this.end("Unable to connect video. Check your network or TURN configuration.");
      else if (pc.connectionState === "disconnected") {
        this.status(op, "reconnecting");
        op.disconnectTimer = setTimeout(() => { if (this.op === op) this.end("Video connection lost."); }, 12000);
      }
    };
  }
  toggle(kind) {
    const tracks = this.op?.stream?.getTracks().filter((track) => track.kind === kind) || [];
    if (!tracks.length) return;
    const enabled = !tracks[0].enabled;
    tracks.forEach((track) => { track.enabled = enabled; });
    this.update(kind === "audio" ? { muted: !enabled } : { cameraOff: !enabled });
  }
  decline() { if (this.op?.id) this.socket.emit("rejectCall", { callId: this.op.id }); this.finish("Call declined."); }
  end(notice = "Call ended.") {
    if (this.op?.id && this.socket.connected) this.socket.emit("endCall", { callId: this.op.id });
    this.finish(notice);
  }
  finish(notice) {
    const op = this.op; this.op = null;
    if (op) {
      clearTimeout(op.disconnectTimer);
      if (op.pc) {
        op.pc.ontrack = null; op.pc.onicecandidate = null; op.pc.onconnectionstatechange = null;
        op.pc.close();
      }
      op.stream?.getTracks().forEach((track) => track.stop());
      this.state.remote?.getTracks().forEach((track) => track.stop());
    }
    this.update({ ...idle(), online: this.socket.connected, notice: op ? notice : this.state.notice });
  }
}
