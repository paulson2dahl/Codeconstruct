import React from 'react';
import { Copy, ThumbsUp, ThumbsDown, Flag, RotateCcw, ChevronDown, ChevronUp, Table } from 'lucide-react';
import DOMPurify from 'dompurify';
import { AnomalyCard } from './AnomalyCard';
import { DiffTable } from './DiffTable';
import { ChartWidget } from './ChartWidget';
import { ApprovalRequest } from './ApprovalRequest';
import './MessageBubble.css';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  streaming?: boolean;
  generativeUI?: GenerativeUI[];
  metadata?: {
    tokens?: number;
    model?: string;
    latency?: number;
  };
}

interface GenerativeUI {
  type: 'anomaly_report' | 'diff_table' | 'chart' | 'approval' | 'schema' | 'table';
  title: string;
  data: any;
}

const RenderMarkdown = ({ content }: { content: string }) => {
  const html = React.useMemo(() => {
    // Simple markdown-like rendering without external deps
    return content
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/^\- (.*$)/gm, '<li>$1</li>')
      .replace(/(?:\r\n|\r|\n){2}/g, '<p>')
      .replace(/^(.*?)$/, (match) => {
        if (match.startsWith('<h1>') || match.startsWith('<h2>') || match.startsWith('<h3>') || match.startsWith('<li>') || match.startsWith('<pre>') || match.startsWith('<p>')) return match;
        return match;
      })
      .replace(/\n/g, '<br>');
  }, [content]);
  const sanitized = React.useMemo(() => {
    try {
      return DOMPurify.sanitize(html);
    } catch {
      return html;
    }
  }, [html]);
  return <div className="tf-markdown" dangerouslySetInnerHTML={{ __html: sanitized }} />;
};

export const MessageBubble = ({ message, onRetry, onCopy, onFeedback }: {
  message: Message;
  onRetry?: () => void;
  onCopy?: () => void;
  onFeedback?: (rating: 'up' | 'down') => void;
}) => {
  const [showActions, setShowActions] = React.useState(false);

  if (message.streaming) {
    return (
      <div className="tf-message assistant streaming">
        <div className="tf-message-avatar">
          <div className="tf-avatar-assistant">AI</div>
        </div>
        <div className="tf-message-content">
          <div className="tf-message-bubble">
            <div className="tf-streaming-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isUser = message.role === 'user';
  const generativeUI = message.generativeUI || [];

  return (
    <div
      className={`tf-message ${message.role} ${showActions ? 'hovered' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="tf-message-avatar">
        <div className={isUser ? 'tf-avatar-user' : 'tf-avatar-assistant'}>
          {isUser ? 'U' : 'AI'}
        </div>
      </div>
      <div className="tf-message-content">
        <div className="tf-message-header">
          <span className="tf-message-role">{isUser ? 'You' : 'Agent'}</span>
          {message.metadata && (
            <span className="tf-message-meta">
              {message.metadata.tokens && `${message.metadata.tokens} tokens`}
              {message.metadata.latency && ` • ${message.metadata.latency}ms`}
            </span>
          )}
        </div>
        <div className="tf-message-bubble">
          <RenderMarkdown content={message.content} />
          {generativeUI.map((ui, idx) => (
            <GenerativeUIRenderer key={idx} ui={ui} />
          ))}
        </div>
        <div className={`tf-message-actions ${showActions ? 'visible' : ''}`}>
          {!isUser && (
            <>
              <button className="tf-action-btn" onClick={onFeedback && (() => onFeedback('up'))} title="Helpful">
                <ThumbsUp size={16} />
              </button>
              <button className="tf-action-btn" onClick={onFeedback && (() => onFeedback('down'))} title="Not helpful">
                <ThumbsDown size={16} />
              </button>
              <button className="tf-action-btn" onClick={onRetry} title="Regenerate">
                <RotateCcw size={16} />
              </button>
            </>
          )}
          <button className="tf-action-btn" onClick={onCopy} title="Copy">
            <Copy size={16} />
          </button>
          <button className="tf-action-btn" title="Report">
            <Flag size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

const GenerativeUIRenderer = ({ ui }: { ui: GenerativeUI }) => {
  switch (ui.type) {
    case 'anomaly_report':
      return <AnomalyCard title={ui.title} data={ui.data} />;
    case 'diff_table':
      return <DiffTable title={ui.title} data={ui.data} />;
    case 'chart':
      return <ChartWidget title={ui.title} config={ui.data} />;
    case 'approval':
      return <ApprovalRequest title={ui.title} data={ui.data} />;
    case 'table':
      return <DataTable title={ui.title} data={ui.data} />;
    default:
      return <div className="tf-generative-ui tf-unknown">{ui.title}</div>;
  }
};

const DataTable = ({ title, data }: { title: string; data: any }) => {
  const [expanded, setExpanded] = React.useState(true);
  const rows = data.rows || data;
  const columns = data.columns || (rows.length > 0 ? Object.keys(rows[0]) : []);

  return (
    <div className="tf-generative-ui tf-data-table">
      <div className="tf-ui-header">
        <span className="tf-ui-title">
          <Table size={16} />
          {title}
        </span>
        <button className="tf-ui-toggle" onClick={() => setExpanded(!expanded)}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
      {expanded && (
        <div className="tf-table-wrapper">
          <table>
            <thead>
              <tr>{columns.map((c: string) => <th key={c}>{c}</th>)}</tr>
            </thead>
            <tbody>
              {rows.slice(0, 50).map((row: any, i: number) => (
                <tr key={i}>{columns.map((c: string) => <td key={c}>{row[c] ?? ''}</td>)}</tr>
              ))}
            </tbody>
          </table>
          {rows.length > 50 && <div className="tf-table-footer">Showing 50 of {rows.length} rows</div>}
        </div>
      )}
    </div>
  );
};