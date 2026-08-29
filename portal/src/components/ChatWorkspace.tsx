import React from 'react';
import { Send, Paperclip, Image, Mic, Search, RotateCcw, FileText } from 'lucide-react';
import { useSession } from '../hooks/useSession';
import { MessageBubble } from './MessageBubble';
import { useMultimodal } from '../hooks/useMultimodal';
import './ChatWorkspace.css';

export const ChatWorkspace = () => {
  const { sendMessage, messages, isStreaming, setMessages } = useSession();
  const [input, setInput] = React.useState('');
  const [attachments, setAttachments] = React.useState<File[]>([]);
  const [_showAttachments, setShowAttachments] = React.useState(false);
  const [selectedModel, setSelectedModel] = React.useState('llama-4-maverick');
  const { handleFileUpload, handleImagePaste, supportedTypes } = useMultimodal();

  const models = [
    { id: 'llama-4-maverick', name: 'Llama 4 Maverick' },
    { id: 'claude-sonnet-4', name: 'Claude Sonnet 4' },
    { id: 'gpt-4o', name: 'GPT-4o' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && attachments.length === 0) return;

    const content = input.trim();
    const files = [...attachments];
    setInput('');
    setAttachments([]);
    setShowAttachments(false);

    await sendMessage({ content, files, model: selectedModel });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      handleFileUpload(newFiles);
      setAttachments(prev => [...prev, ...newFiles]);
      setShowAttachments(true);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          handleImagePaste(file);
          setAttachments(prev => [...prev, file]);
          setShowAttachments(true);
        }
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="tf-chat-workspace" onPaste={handlePaste}>
      <div className="tf-chat-header">
        <h2>Data Operations Agent</h2>
        <div className="tf-chat-controls">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="tf-model-select"
          >
            {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <button className="tf-chat-btn" title="New conversation" onClick={() => setMessages([])}>
            <RotateCcw size={18} />
          </button>
        </div>
      </div>

      <div className="tf-chat-messages" role="log" aria-live="polite">
        {messages.map((msg, idx) => (
          <MessageBubble
            key={`${msg.id}-${idx}`}
            message={msg}
            onRetry={() => sendMessage({ content: msg.content, model: selectedModel }, msg.id)}
            onCopy={() => navigator.clipboard.writeText(msg.content)}
            onFeedback={(rating) => console.log('Feedback:', rating)}
          />
        ))}
        {isStreaming && <MessageBubble message={{ id: 'streaming', role: 'assistant', content: '', streaming: true }} />}
      </div>

      {attachments.length > 0 && (
        <div className="tf-attachments-preview">
          {attachments.map((file, idx) => (
            <div key={idx} className="tf-attachment-item">
              <span className="tf-attachment-icon">
                {file.type.startsWith('image/') ? <Image size={16} /> : file.type.startsWith('text/') ? <FileText size={16} /> : <Paperclip size={16} />}
              </span>
              <span className="tf-attachment-name">{file.name}</span>
              <span className="tf-attachment-size">{(file.size / 1024).toFixed(1)} KB</span>
              <button className="tf-attachment-remove" onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}>
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="tf-chat-input-area">
        <div className="tf-input-wrapper">
          <div className="tf-input-tools">
            <label className="tf-tool-btn" title="Attach file">
              <Paperclip size={20} />
              <input type="file" multiple accept={supportedTypes.join(',')} onChange={handleFileSelect} style={{ display: 'none' }} />
            </label>
            <label className="tf-tool-btn" title="Attach image">
              <Image size={20} />
              <input type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
            </label>
            <button type="button" className="tf-tool-btn" title="Web search" onClick={() => setInput(input + ' @web ')}>
              <Search size={20} />
            </button>
            <button type="button" className="tf-tool-btn" title="Voice input">
              <Mic size={20} />
            </button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your data, upload files, search the web..."
            className="tf-chat-input"
            rows={1}
            disabled={isStreaming}
          />
        </div>
        <button type="submit" className="tf-send-btn" disabled={!input.trim() && attachments.length === 0 || isStreaming}>
          <Send size={20} />
        </button>
      </form>

      <div className="tf-chat-footer">
        <span>Powered by TrueForge • {selectedModel}</span>
        <span>Press Enter to send, Shift+Enter for new line</span>
      </div>
    </div>
  );
};