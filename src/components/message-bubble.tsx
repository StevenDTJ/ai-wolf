import { DebateMessage, STANCE_INFO, CrossExamGroup, SpeechType } from '@/types';
import { Copy, Check, Download, ArrowRight, Sword, HelpCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';
import ReactMarkdown from 'react-markdown';

interface MessageBubbleProps {
  message: DebateMessage;
  isStreaming?: boolean;
  onExport?: (content: string) => void;
  isCrossExamStage?: boolean;
  crossExamGroup?: CrossExamGroup | null;
  isAudienceQAStage?: boolean;
}

// 检查是否是攻辩环节的消息
const isCrossExamMessage = (speechType?: SpeechType): boolean => {
  return speechType === 'argumentation';
};

// 检查是否是观众提问环节的消息
const isAudienceQuestionMessage = (speechType?: SpeechType): boolean => {
  return speechType === 'audience_question';
};

export function MessageBubble({
  message,
  isStreaming = false,
  onExport,
  isCrossExamStage = false,
  crossExamGroup,
  isAudienceQAStage = false,
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const stanceInfo = STANCE_INFO[message.stance];
  const isCrossExam = isCrossExamStage || isCrossExamMessage(message.speechType);
  const isAudienceQA = isAudienceQAStage || isAudienceQuestionMessage(message.speechType);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    onExport?.(message.content);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // 立场颜色 - 亮色背景配黑字
  const getStanceStyles = () => {
    switch (message.stance) {
      case 'pro':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-300',
          badge: 'bg-blue-100 text-blue-700 border-blue-300',
          avatar: 'bg-blue-100 border-blue-300 text-blue-700',
          accent: 'text-blue-600',
        };
      case 'con':
        return {
          bg: 'bg-red-50',
          border: 'border-red-300',
          badge: 'bg-red-100 text-red-700 border-red-300',
          avatar: 'bg-red-100 border-red-300 text-red-700',
          accent: 'text-red-600',
        };
      case 'judge':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-300',
          badge: 'bg-amber-100 text-amber-700 border-amber-300',
          avatar: 'bg-amber-100 border-amber-300 text-amber-700',
          accent: 'text-amber-600',
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-300',
          badge: 'bg-gray-100 text-gray-700 border-gray-300',
          avatar: 'bg-gray-100 border-gray-300 text-gray-700',
          accent: 'text-gray-600',
        };
    }
  };

  const styles = getStanceStyles();

  // 获取立场标签
  const getStanceLabel = () => {
    switch (message.stance) {
      case 'pro': return '正方';
      case 'con': return '反方';
      case 'judge': return '裁判';
      default: return '未知';
    }
  };

  // 获取攻辩样式
  // Note: Using inline styles for cross-exam messages

  return (
    <div className={`group transition-all ${isStreaming ? 'opacity-90' : ''} ${isCrossExam ? 'rounded-lg ring-1 ring-purple-300 p-1' : ''} ${isAudienceQA ? 'rounded-lg ring-1 ring-gray-400 p-1' : ''}`}>
      {/* 攻辩标识 */}
      {isCrossExam && (
        <div className="flex items-center gap-1 text-xs text-purple-600 mb-2 px-1">
          <Sword className="w-3 h-3" />
          <span className="font-medium">攻辩环节</span>
        </div>
      )}

      {/* 观众提问标识 */}
      {isAudienceQA && (
        <div className="flex items-center gap-1 text-xs text-gray-600 mb-2 px-1">
          <HelpCircle className="w-3 h-3" />
          <span className="font-medium">观众提问</span>
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Avatar with animation */}
        <div className="relative shrink-0">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold border-2 ${styles.avatar} ${
              isStreaming ? 'animate-pulse ring-2 ring-offset-2 ring-offset-background' : ''
            } ${isCrossExam ? 'ring-2 ring-purple-300' : ''}`}
          >
            {message.agentName.charAt(0).toUpperCase()}
          </div>
          {isStreaming && (
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${styles.accent} rounded-full border-2 border-background flex items-center justify-center`}>
              <div className="w-1.5 h-1.5 bg-current rounded-full animate-ping" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="font-semibold text-foreground">
              {message.agentName}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${styles.badge}`}>
              {getStanceLabel()}
            </span>
            {isCrossExam && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-300 font-medium">
                攻辩
              </span>
            )}
            <span className="text-xs text-gray-500">
              {formatTime(message.timestamp)}
            </span>
            {isStreaming && (
              <span className={`text-xs ${styles.accent} animate-pulse flex items-center gap-1`}>
                <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" />
                思考中...
              </span>
            )}
          </div>

          {/* Message body with Markdown */}
          <div
            className={`p-4 rounded-xl border text-sm leading-relaxed overflow-hidden ${styles.bg} ${styles.border} ${isCrossExam ? 'bg-purple-50 border-purple-300' : ''} ${isAudienceQA ? 'bg-gray-100 border-gray-400' : ''}`}
          >
            <div className="prose prose-sm max-w-none text-foreground">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0 text-foreground">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                  li: ({ children }) => <li className="text-foreground">{children}</li>,
                  strong: ({ children }) => <strong className="text-foreground font-semibold">{children}</strong>,
                  em: ({ children }) => <em className="text-foreground/80">{children}</em>,
                  code: ({ children }) => <code className="bg-black/10 px-1.5 py-0.5 rounded text-xs font-mono text-foreground">{children}</code>,
                  pre: ({ children }) => <pre className="bg-black/5 p-3 rounded-lg overflow-x-auto mb-2 text-foreground">{children}</pre>,
                  blockquote: ({ children }) => <blockquote className="border-l-2 border-current pl-3 italic text-foreground/80">{children}</blockquote>,
                  h1: ({ children }) => <h1 className="text-xl font-bold text-foreground mb-2">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-lg font-bold text-foreground mb-2">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-base font-semibold text-foreground mb-2">{children}</h3>,
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
            {isStreaming && (
              <span className={`inline-block w-0.5 h-5 ${styles.accent} animate-pulse ml-0.5 align-middle`} />
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 text-xs">
              {copied ? (
                <Check className="w-3 h-3 mr-1 text-green-500" />
              ) : (
                <Copy className="w-3 h-3 mr-1" />
              )}
              {copied ? '已复制' : '复制'}
            </Button>
            {onExport && (
              <Button variant="ghost" size="sm" onClick={handleExport} className="h-7 text-xs">
                <Download className="w-3 h-3 mr-1" />
                导出
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
