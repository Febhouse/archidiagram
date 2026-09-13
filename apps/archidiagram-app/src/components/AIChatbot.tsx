import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Loader2, Sparkles, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';
import ReactMarkdown from 'react-markdown';
import './AIChatbot.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! I'm the ArchiDiagram AI assistant. Do you need help with the sunpath, shadow analysis, or exporting your diagrams?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // 1. Initialize Gemini
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Missing VITE_GEMINI_API_KEY in .env.local");
      }
      const genAI = new GoogleGenerativeAI(apiKey);
      
      // 2. Embed user question
      const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-2" });
      const embedResult = await embeddingModel.embedContent(userMessage);
      const query_embedding = embedResult.embedding.values;

      // 3. Search Supabase for context
      const { data: documents, error } = await supabase.rpc('match_documents', {
        query_embedding,
        match_count: 3
      });

      if (error) throw error;

      // 4. Construct context
      const context = documents?.map((d: any) => d.content).join('\n\n') || "Không tìm thấy thông tin phù hợp trong tài liệu.";

      // 5. Call Gemini Chat
      const chatModel = genAI.getGenerativeModel({ 
        model: "gemini-3.8-flash",
        systemInstruction: `You are the official AI virtual assistant for the ArchiDiagram Web App. Your name is "ArchiBot". You are friendly, professional, and helpful.
        Below is some extracted information from the application's Knowledge Base:
        
        <KNOWLEDGE>
        ${context}
        </KNOWLEDGE>
        
        Use the KNOWLEDGE above to answer the user's question. If the information is not in the KNOWLEDGE, politely decline or say you are not sure. ALWAYS reply in the SAME LANGUAGE that the user used to ask the question (e.g., if they ask in Vietnamese, reply in Vietnamese; if they ask in English, reply in English).`
      });

      // Prepare chat history (convert our state to Gemini format)
      const history = messages.slice(1).map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      const chat = chatModel.startChat({ history });

      // Add empty message for streaming
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      const result = await chat.sendMessageStream(userMessage);
      
      let fullText = '';
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullText += chunkText;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content = fullText;
          return newMessages;
        });
      }

    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `An error occurred: ${err.message || 'Cannot connect to AI'}. (Please check if you have added VITE_GEMINI_API_KEY to .env.local).` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ai-chatbot-container">
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`ai-chatbot-trigger ${isOpen ? 'hidden' : ''}`}
        aria-label="Open AI Assistant"
      >
        <Sparkles className="ai-chatbot-trigger-icon" size={24} />
        <span className="ai-chatbot-trigger-text">Ask AI</span>
      </button>

      {/* Chat Window */}
      <div className={`ai-chatbot-window ${!isOpen ? 'hidden' : ''}`}>
        {/* Header */}
        <div className="ai-chatbot-header">
          <div className="ai-chatbot-header-left">
            <div className="ai-chatbot-avatar">
              <Bot size={20} />
            </div>
            <div>
              <h3 className="ai-chatbot-title">ArchiBot AI</h3>
              <p className="ai-chatbot-status">Ready to help</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="ai-chatbot-close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="ai-chatbot-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`ai-message-row ${msg.role}`}>
              <div className={`ai-message-avatar ${msg.role}`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`ai-message-bubble ${msg.role}`}>
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="ai-message-row assistant">
              <div className="ai-message-avatar assistant">
                <Bot size={16} />
              </div>
              <div className="ai-message-bubble assistant">
                <Loader2 size={16} className="ai-spinner" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="ai-chatbot-input-area">
          <div className="ai-chatbot-input-wrapper">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about sunpath, shadows, exports..."
              className="ai-chatbot-input"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="ai-chatbot-send"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
