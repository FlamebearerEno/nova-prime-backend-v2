// src/Chat.js
import React, { useState } from 'react';
import { auth } from './firebase';

const backendUrl = 'http://localhost:3000'; // Your backend endpoint

function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const sendMessage = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        alert('Not logged in!');
        return;
      }

      const token = await user.getIdToken();

      const response = await fetch(`${backendUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt: input }),
      });

      const data = await response.json();
      const newMessage = { user: input, ai: data.response };
      setMessages([...messages, newMessage]);
      setInput('');
    } catch (err) {
      console.error('Chat error:', err);
      alert('Failed to send message.');
    }
  };

  return (
    <div className="chat-container">
      <h2>NovaPrime AI Chat</h2>
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className="chat-message">
            <p><strong>You:</strong> {msg.user}</p>
            <p><strong>Nova:</strong> {msg.ai}</p>
          </div>
        ))}
      </div>
      <input
        type="text"
        placeholder="Type your message..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default Chat;
