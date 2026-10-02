import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { createSocketConnection } from "../utils/socket";
import { useSelector } from "react-redux";
import axios from "axios";
import { BASE_URL } from "../utils/constants";

const Chat = () => {
  const { targetUserId } = useParams();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  const socketRef = useRef(null);

  const user = useSelector((store) => store.user);
  const userId = user?._id;
  const firstName = user?.firstName;
  const lastName = user?.lastName;

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
      })
      .catch((error) => {
        if (!ignore) {
          console.error("Failed to fetch messages:", error);
        }
      });

    return () => {
      ignore = true;
    };
  }, [userId, targetUserId]);

  // Connect to the chat room and receive messages.
  useEffect(() => {
    if (!userId || !targetUserId) return;

    const socket = createSocketConnection();
    socketRef.current = socket;

    const joinChat = () => {
      socket.emit("joinChat", {
        firstName,
        userId,
        targetUserId,
      });
    };

    const receiveMessage = ({
      senderId,
      firstName,
      lastName,
      text,
    }) => {
      setMessages((previousMessages) => [
        ...previousMessages,
        { senderId, firstName, lastName, text },
      ]);
    };

    socket.on("connect", joinChat);
    socket.on("messageReceived", receiveMessage);

    if (socket.connected) {
      joinChat();
    }

    return () => {
      socket.off("connect", joinChat);
      socket.off("messageReceived", receiveMessage);
      socket.disconnect();

      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [userId, targetUserId, firstName]);

  const sendMessage = (event) => {
    event.preventDefault();

    const text = newMessage.trim();
    const socket = socketRef.current;

    if (!text || !userId || !socket?.connected) return;

    socket.emit("sendMessage", {
      firstName,
      lastName,
      userId,
      targetUserId,
      text,
    });

    setNewMessage("");
  };

  if (!userId) {
    return <p className="p-5 text-center">Loading user...</p>;
  }

  return (
    <div className="w-3/4 mx-auto border border-gray-600 m-5 h-[70vh] flex flex-col">
      <h1 className="p-5 border-b border-gray-600">Chat</h1>

      <div className="flex-1 overflow-y-auto p-5">
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
      </div>

      <form
        onSubmit={sendMessage}
        className="p-5 border-t border-gray-600 flex items-center gap-2"
      >
        <input
          type="text"
          value={newMessage}
          onChange={(event) => setNewMessage(event.target.value)}
          placeholder="Type a message..."
          aria-label="Message"
          className="flex-1 min-w-0 border border-gray-500 text-white rounded p-2"
        />

        <button
          type="submit"
          disabled={!newMessage.trim()}
          className="btn btn-secondary"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default Chat;