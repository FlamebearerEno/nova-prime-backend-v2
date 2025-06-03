// src/Chat.js
import React, { useState } from 'react';
import { auth } from './firebase';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://nova-prime-backend-v2.onrender.com';

function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const sendMessage = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        alert('Not logged in!');
        return;
      }

      const token = await user.getIdToken();

      // ✅ Fetch from the backend /chat endpoint
      const response = await fetch(`${BACKEND_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt: input }),
      });

      if (!response.ok) {
        const errorText = await response.text(); // Plain text fallback for HTML errors
        throw new Error(`Backend Error: ${errorText}`);
      }

      const data = await response.json();
      if (!data || !data.response) {
        throw new Error('Invalid response from backend.');
      }

      const newMessage = { user: input, ai: data.response };
      setMessages((prev) => [...prev, newMessage]);
      setInput('');
      setError('');
    } catch (err) {
      console.error('Chat error:', err);
      setError(err.message || 'Failed to send message.');
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

      {error && <p className="error-message">{error}</p>}
    </div>
  );
}

export default Chat;
