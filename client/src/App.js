import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import "./App.css";

const socket = io("https://chat-app-04n0.onrender.com");

function App() {
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const [typingUser, setTypingUser] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [joined, setJoined] = useState(false);

  const messagesEndRef = useRef(null);

  const joinUser = () => {
    if (username.trim() !== "") {
      socket.emit("join", username);
      setJoined(true);
    }
  };

  const sendMessage = () => {
    if (message.trim() === "") return;

    const msgData = {
      id: Date.now(),
      username,
      message,
      time: new Date().toLocaleTimeString(),
      sender: username,
      status: "sent",
    };

    socket.emit("send_message", msgData);
    setMessage("");
  };

  useEffect(() => {
    socket.off("receive_message");
    socket.off("seen_update");

    socket.on("receive_message", (data) => {
      setMessageList((list) => {
        if (list.find((msg) => msg.id === data.id)) return list;
        return [...list, data];
      });

      // ✅ only receiver send seen
      if (data.username !== username) {
        socket.emit("seen", {
          msgId: data.id,
          sender: data.username,
        });
      }
    });

    socket.on("seen_update", (msgId) => {
      setMessageList((list) =>
        list.map((msg) =>
          msg.id === msgId ? { ...msg, status: "seen" } : msg
        )
      );
    });

    socket.on("online_users", (users) => {
      setOnlineUsers(users);
    });

    socket.on("typing", (user) => setTypingUser(user));
    socket.on("stop_typing", () => setTypingUser(""));

  }, [username]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messageList]);

  const handleTyping = (e) => {
    setMessage(e.target.value);

    socket.emit("typing", username);

    setTimeout(() => {
      socket.emit("stop_typing");
    }, 1000);
  };

  return (
    <div className="app">
      <h2>💬 Chat App</h2>

      <div className="join-box">
        <input
          placeholder="Enter username"
          value={username}
          disabled={joined}
          onChange={(e) => setUsername(e.target.value)}
        />
        <button onClick={joinUser}>Join</button>
      </div>

      <div className="users">
        🟢 Online: {onlineUsers.join(", ")}
      </div>

      <div className="chat-box">
        {messageList.map((msg) => (
          <div
            key={msg.id}
            className={
              msg.username === username ? "message own" : "message"
            }
          >
            <div className="bubble">
              <span className="name">{msg.username}</span>
              <p>{msg.message}</p>

              <div className="meta">
                <span>{msg.time}</span>

                {msg.username === username && (
                  <span
                    className={
                      msg.status === "seen"
                        ? "tick seen"
                        : "tick"
                    }
                  >
                    {msg.status === "seen" ? "✔✔" : "✔"}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {typingUser && typingUser !== username && (
          <div className="typing">{typingUser} typing...</div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="input-box">
        <input
          placeholder="Type message..."
          value={message}
          onChange={handleTyping}
          onKeyPress={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

export default App;