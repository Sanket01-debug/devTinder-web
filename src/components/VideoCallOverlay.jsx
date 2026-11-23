import { useEffect, useRef, useState } from "react";
import { Avatar } from "./UI";
import "./videoCall.css";

function Video({ stream, muted = false, label, className = "" }) {
  const ref = useRef(null);
  const [blocked, setBlocked] = useState(false);
  useEffect(() => {
    const video = ref.current;
    video.srcObject = stream;
    if (stream) video.play().catch(() => setBlocked(true));
    return () => { video.srcObject = null; };
  }, [stream]);
  return <div className={className}>
    <video ref={ref} autoPlay playsInline muted={muted} aria-label={label} />
    <span className="video-label">{label}</span>
    {blocked && <button className="btn btn-sm" onClick={() => ref.current.play().then(() => setBlocked(false)).catch(() => {})}>Play video and audio</button>}
  </div>;
}
const labels = { incoming: "Incoming video call", calling: "Calling…", ringing: "Ringing…", preparing: "Waiting for camera and microphone…", connecting: "Connecting securely…", connected: "Connected", reconnecting: "Reconnecting…" };
function Duration({ startedAt }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const seconds = Math.max(0, Math.floor((now - startedAt) / 1000));
  return <time aria-label="Call duration">{Math.floor(seconds / 60).toString().padStart(2, "0")}:{(seconds % 60).toString().padStart(2, "0")}</time>;
}
export default function VideoCallOverlay({ controller, state }) {
  const dialog = useRef(null);
  const active = Boolean(state.call);
  useEffect(() => {
    if (active || !state.notice) return;
    const routine = ["Call ended.", "Call declined.", "No answer. Try again later.", "Call answered in another tab."].includes(state.notice);
    const timer = setTimeout(() => controller.update({ notice: "" }), routine ? 1000 : 8000);
    return () => clearTimeout(timer);
  }, [active, state.notice, controller]);
  useEffect(() => {
    if (!active) return;
    const previous = document.activeElement;
    dialog.current?.showModal();
    return () => previous?.focus?.();
  }, [active]);
  if (!state.call) return state.notice ? <div className="video-toast" role="status">
    <span>{state.notice}</span><button aria-label="Dismiss call message" onClick={() => controller.update({ notice: "" })}>×</button>
  </div> : null;
  const { person, status, startedAt } = state.call;
  return <dialog ref={dialog} className="video-dialog" aria-labelledby="video-title" onCancel={(event) => event.preventDefault()}>
    <header className="video-heading">
      <Avatar user={person} />
      <div><h2 id="video-title">{person ? `${person.firstName} ${person.lastName || ""}` : "Your connection"}</h2>
        <p role="status">{labels[status]} {startedAt && <> · <Duration startedAt={startedAt} /></>}</p>
      </div>
      <span className="video-private">1-to-1 video</span>
    </header>
    <div className="video-stage">
      <Video stream={state.remote} label="Your connection" className="video-remote" />
      {!state.remote && <div className="video-placeholder"><Avatar user={person} /><p>{labels[status]}</p></div>}
      {state.local && <Video stream={state.local} muted label={state.cameraOff ? "You · camera off" : "You"} className={`video-local ${state.cameraOff ? "camera-off" : ""}`} />}
    </div>
    <footer className="video-controls">
      {status === "incoming" ? <>
        <button className="btn btn-primary" onClick={() => controller.accept()}>Accept call</button>
        <button className="btn video-end" onClick={() => controller.decline()}>Decline</button>
      </> : <>
        <button className="btn" disabled={!state.local} aria-pressed={state.muted} onClick={() => controller.toggle("audio")}>{state.muted ? "Unmute" : "Mute"}</button>
        <button className="btn" disabled={!state.local} aria-pressed={state.cameraOff} onClick={() => controller.toggle("video")}>{state.cameraOff ? "Camera on" : "Camera off"}</button>
        <button className="btn video-end" onClick={() => controller.end()}>End call</button>
      </>}
    </footer>
    <p className="video-hint">{status === "incoming" ? "Your camera and microphone stay off until you accept." : "Use headphones for clearer audio. You can end the call at any time."}</p>
  </dialog>;
}
