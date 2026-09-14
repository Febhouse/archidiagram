import { useState } from 'react';
import './DifyChat.css';

export default function DifyChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!hasOpened) setHasOpened(true);
  };

  return (
    <>
      {/* Dify AI Chat Widget */}
      <div 
        id="main-ai-chat-window" 
        className="dify-chat-window"
        style={{ display: isOpen ? 'flex' : 'none' }}
      >
        {/* Header */}
        <div className="dify-chat-header">
          <div className="dify-chat-header-left">
            <div className="dify-chat-header-logo">
              <img src="https://febhouse.com/images/LOGO/LOGO_FEBHOUSE1.svg" alt="Febhouse" />
            </div>
            <div>
              <div className="dify-chat-header-title">Archi AI Assistant</div>
              <div className="dify-chat-header-status">
                <span className="dify-chat-header-status-dot"></span> Online 24/7
              </div>
            </div>
          </div>
          <button type="button" onClick={toggleChat} className="dify-chat-header-close" aria-label="Close AI Chat">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {/* Iframe */}
        <div className="dify-chat-iframe-container">
          <iframe
            id="main-ai-iframe"
            src={hasOpened ? "https://ai.febhouse.com/chat/dB1gGLjY8H80t943" : "about:blank"}
            allow="microphone; clipboard-write"
            title="Archi AI Chat"
          ></iframe>
        </div>
      </div>

      {/* Floating Action Button */}
      <button 
        id="global-ai-floating-btn"
        type="button"
        onClick={toggleChat}
        aria-label="Open AI Chat"
        className="dify-chat-floating-btn"
      >
        <span className="dify-chat-indicator">
          <span className="dify-chat-indicator-ping"></span>
          <span className="dify-chat-indicator-dot"></span>
        </span>
        <svg className="dify-chat-icon" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
        </svg>
        <span>Ask AI</span>
      </button>
    </>
  );
}
