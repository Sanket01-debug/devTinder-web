import { useEffect, useState, useSyncExternalStore } from "react";
import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { createSocketConnection } from "../utils/socket";
import { VideoCall } from "../utils/videoCall";
import { VideoContext } from "../utils/videoContext";
import VideoCallOverlay from "./VideoCallOverlay";

export default function VideoProvider({ user, children }) {
  const [controller] = useState(() => new VideoCall(createSocketConnection(), {
    getConfig: async () => (await axios.get(`${BASE_URL}/video/ice`, { withCredentials: true })).data,
  }));
  const state = useSyncExternalStore(controller.subscribe, controller.snapshot);
  useEffect(() => {
    if (user?._id) return controller.mount();
  }, [controller, user?._id]);
  return <VideoContext.Provider value={{ controller, state, socket: controller.socket }}>
    {children}
    <VideoCallOverlay controller={controller} state={state} />
  </VideoContext.Provider>;
}
