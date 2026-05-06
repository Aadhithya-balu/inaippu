import React, { useState } from 'react';
import { Send, Bot, Minimize2, MessageSquare } from 'lucide-react';
import api from '../services/api';

const AIChat = () => {
  const [messages, setMessages] = useState([{ role: 'bot', text: 'Hi! I am your Inaippu AI Guide. How can I help you navigate citizen services today?' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await api.post('/ai/chat', { prompt: input });
      setMessages(prev => [...prev, { role: 'bot', text: data.response }]);
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: "Sorry, I'm having trouble connecting right now." }]);
    } finally {
      setLoading(false);
    }
  };

  if (isMinimized) {
    return (
      <button 
        onClick={() => setIsMinimized(false)}
        className="bg-blue-600 p-4 rounded-full text-white shadow-2xl hover:scale-110 transition group"
      >
        <MessageSquare size={24} />
        <span className="absolute right-full mr-4 bg-slate-900 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition whitespace-nowrap">Chat with AI</span>
      </button>
    );
  }

  return (
    <div className="bg-white w-80 h-112.5 shadow-2xl rounded-2xl flex flex-col border border-slate-200 overflow-hidden transition-all duration-300 ease-in-out">
      <div className="bg-blue-600 p-4 text-white font-bold flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot size={20} />
          <span>Inaippu AI Guide</span>
        </div>
        <button onClick={() => setIsMinimized(true)} className="hover:bg-white/20 p-1 rounded transition">
          <Minimize2 size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && <div className="text-gray-400 text-xs italic p-2">AI is thinking...</div>}
      </div>

      <form onSubmit={handleSend} className="p-4 border-t border-slate-100 flex gap-2">
        <input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          className="flex-1 text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
        <button 
          type="submit" 
          disabled={loading || !input.trim()}
          className="bg-blue-600 p-2 rounded-xl text-white hover:bg-blue-700 transition disabled:opacity-50"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};

export default AIChat;