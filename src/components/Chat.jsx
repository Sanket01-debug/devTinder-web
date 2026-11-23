import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useVideoCall } from "../utils/videoContext";
import { useSelector } from "react-redux";
import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { Avatar, Loading } from "./UI";
import { errorMessage } from "../utils/errorMessage";

const Chat = () => {
  const { targetUserId } = useParams();
  const location = useLocation();
  const person = location.state?.person;

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const bottomRef = useRef(null);

  const { socket, controller, state: callState } = useVideoCall();

  const user = useSelector((store) => store.user);
  const userId = user?._id;

  // Fetch saved messages.
  useEffect(() => {
    if (!userId || !targetUserId) return;

    let ignore = false;

    axios
      .get(`${BASE_URL}/chat/${targetUserId}`, {
        withCredentials: true,
      })
      .then(({ data }) => {
        if (ignore) return;

        const chatMessages = (data.messages ?? []).map((msg) => ({
          senderId: msg.senderId?._id ?? msg.senderId,
          firstName: msg.senderId?.firstName,
          lastName: msg.senderId?.lastName,
          text: msg.text,
        }));

        setMessages(chatMessages);
        setLoaded(true);
      })
      .catch((error) => {
        if (!ignore) {
          console.error("Failed to fetch messages:", error);
          setError(errorMessage(error));
        }
      });

    return () => {
      ignore = true;
    };
  }, [userId, targetUserId]);

  // Connect to the chat room and receive messages.
  useEffect(() => {
    if (!userId || !targetUserId) return;

    let active = true;
    const joinChat = () => {
      socket.timeout(8000).emit("joinChat", { targetUserId }, (err, result) => {
        if (!active) return;
        setConnected(!err && Boolean(result?.ok));
        if (err || !result?.ok) setError(result?.error || "Unable to join chat.");
      });
    };

    const receiveMessage = ({ senderId, firstName, lastName, text }) => {
      setMessages((previousMessages) => [
        ...previousMessages,
        { senderId, firstName, lastName, text },
      ]);
    };

    socket.on("connect", joinChat);
    const disconnected = () => setConnected(false);
    socket.on("disconnect", disconnected);
    socket.on("connect_error", disconnected);
    socket.on("messageReceived", receiveMessage);

    if (socket.connected) {
      joinChat();
    }

    return () => {
      active = false;
      socket.off("connect", joinChat);
      socket.off("disconnect", disconnected);
      socket.off("connect_error", disconnected);
      socket.off("messageReceived", receiveMessage);
      if (socket.connected) socket.emit("leaveChat");
    };
  }, [userId, targetUserId, socket]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
  }, [messages]);

  const sendMessage = (event) => {
    event.preventDefault();

    const text = newMessage.trim();

    if (!text || !userId || !socket?.connected) return;

    socket.timeout(8000).emit("sendMessage", { targetUserId, text }, (err, result) => {
      if (err || !result?.ok) setError(result?.error || "Message delivery could not be confirmed. Check the conversation before retrying.");
      else { setError(""); setNewMessage((current) => current.trim() === text ? "" : current); }
    });
  };

  if (!userId) {
    return <Loading />;
  }

  return (
    <div className="page-container chat-page">
      <div className="chat-panel">
        <header className="chat-top">
          <Link
            className="chat-back"
            to="/connections"
            aria-label="Back to connections"
          >
            ←
          </Link>
          <Avatar user={person} />
          <div>
            <h2>
              {person
                ? person.firstName + " " + (person.lastName || "")
                : "Your conversation"}
            </h2>
            <p className="muted">
              {connected ? "Connected to chat" : "Connecting to chat…"}
            </p>
          </div>
          <button className="btn btn-primary chat-video-button" disabled={!connected || !callState.online || Boolean(callState.call)}
            onClick={() => controller.start(targetUserId, person)} aria-label="Start video call">Video call</button>
        </header>
        {error && (
          <p className="chat-notice" role="alert">
            {error}
          </p>
        )}

        <div className="chat-messages" role="log" aria-label="Conversation">
          {!loaded && !error && <Loading />}
          {loaded && !messages.length && (
            <div className="empty-state">
              <h2>Start with a hello.</h2>
              <p className="muted">
                Ask what they’re building, share an idea, or simply introduce
                yourself.
              </p>
            </div>
          )}
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`chat ${
                msg.senderId === userId ? "chat-end" : "chat-start"
              }`}
            >
              <div className="chat-header">
                {`${msg.firstName ?? ""} ${msg.lastName ?? ""}`}
              </div>

              <div className="chat-bubble">{msg.text}</div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={sendMessage} className="chat-compose">
          <input
            type="text"
            value={newMessage}
            onChange={(event) => setNewMessage(event.target.value)}
            placeholder="Type a message..."
            aria-label="Message"
            className="message-input"
          />

          <button
            type="submit"
            disabled={!newMessage.trim() || !connected}
            className="btn btn-primary"
          >
            Send ↗
          </button>
        </form>
      </div>
    </div>
  );
};

export default function ChatRoute() {
  const { targetUserId } = useParams();
  return <Chat key={targetUserId} />;
}
