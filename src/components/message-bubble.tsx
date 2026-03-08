import { DebateMessage, STANCE_INFO, CrossExamGroup, SpeechType } from '@/types';
import { Copy, Check, Download, Sword, HelpCircle } from 'lucide-react';
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

  // Wolf-style stance colors
  const getStanceStyles = () => {
    switch (message.stance) {
      case 'pro':
        return {
          avatarBg: '#6fc2ff',
          badgeBg: '#6fc2ff',
          badgeText: '#3e3d3c',
          textColor: '#3e3d3c',
        };
      case 'con':
        return {
          avatarBg: '#ff7169',
          badgeBg: '#ff7169',
          badgeText: '#3e3d3c',
          textColor: '#3e3d3c',
        };
      case 'judge':
        return {
          avatarBg: '#ffde00',
          badgeBg: '#ffde00',
          badgeText: '#3e3d3c',
          textColor: '#3e3d3c',
        };
      default:
        return {
          avatarBg: '#ede7e1',
          badgeBg: '#ede7e1',
          badgeText: '#3e3d3c',
          textColor: '#3e3d3c',
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

  return (
    <div
      className="group transition-all"
      style={{ opacity: isStreaming ? 0.9 : 1 }}
    >
      {/* 攻辩标识 - Wolf Style */}
      {isCrossExam && (
        <div className="flex items-center gap-1 text-[0.62rem] font-mono uppercase tracking-wider mb-2" style={{ color: '#ff9538' }}>
          <Sword className="w-3 h-3" />
          <span>攻辩环节</span>
        </div>
      )}

      {/* 观众提问标识 - Wolf Style */}
      {isAudienceQA && (
        <div className="flex items-center gap-1 text-[0.62rem] font-mono uppercase tracking-wider mb-2" style={{ color: '#5f5b57' }}>
          <HelpCircle className="w-3 h-3" />
          <span>观众提问</span>
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Avatar - Wolf Style */}
        <div className="relative shrink-0">
          <div
            className="w-10 h-10 flex items-center justify-center text-sm font-bold"
            style={{
              backgroundColor: styles.avatarBg,
              color: styles.badgeText,
              border: '2px solid #454341',
            }}
          >
            {message.agentName.charAt(0).toUpperCase()}
          </div>
          {isStreaming && (
            <div
              className="absolute -bottom-1 -right-1 w-3 h-3 flex items-center justify-center"
              style={{
                backgroundColor: styles.avatarBg,
                border: '2px solid #454341',
                borderRadius: '50%',
              }}
            >
              <div className="w-1.5 h-1.5" style={{ backgroundColor: styles.badgeText, borderRadius: '50%' }} />
            </div>
          )}
        </div>

        {/* Content - Wolf Style */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="font-medium text-sm" style={{ color: '#3e3d3c' }}>
              {message.agentName}
            </span>
            <span
              className="text-[0.54rem] font-mono uppercase tracking-wider px-1.5 py-0.5"
              style={{
                backgroundColor: styles.badgeBg,
                color: styles.badgeText,
                border: '1px solid #454341',
              }}
            >
              {getStanceLabel()}
            </span>
            {isCrossExam && (
              <span
                className="text-[0.54rem] font-mono uppercase px-1.5 py-0.5"
                style={{
                  backgroundColor: '#ff9538',
                  color: '#3e3d3c',
                  border: '1px solid #454341',
                }}
              >
                攻辩
              </span>
            )}
            <span className="text-[0.54rem] font-mono" style={{ color: '#5f5b57' }}>
              {formatTime(message.timestamp)}
            </span>
            {isStreaming && (
              <span
                className="text-[0.54rem] font-mono flex items-center gap-1"
                style={{ color: styles.avatarBg }}
              >
                <span
                  className="w-1.5 h-1.5"
                  style={{ backgroundColor: styles.avatarBg, borderRadius: '50%' }}
                />
                思考中...
              </span>
            )}
          </div>

          {/* Message body with Markdown - Wolf Style */}
          <div
            className="p-3 text-sm leading-relaxed overflow-hidden"
            style={{
              backgroundColor: '#f4efea',
              border: '2px solid #454341',
              color: '#3e3d3c',
            }}
          >
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0" style={{ color: '#3e3d3c' }}>{children}</p>,
                  ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                  li: ({ children }) => <li style={{ color: '#3e3d3c' }}>{children}</li>,
                  strong: ({ children }) => <strong style={{ color: '#3e3d3c', fontWeight: 600 }}>{children}</strong>,
                  em: ({ children }) => <em style={{ color: '#5f5b57' }}>{children}</em>,
                  code: ({ children }) => (
                    <code
                      className="px-1.5 py-0.5 text-xs font-mono"
                      style={{ backgroundColor: '#ede7e1', color: '#3e3d3c', border: '1px solid #454341' }}
                    >
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre
                      className="p-3 overflow-x-auto mb-2 text-xs"
                      style={{ backgroundColor: '#ede7e1', color: '#3e3d3c', border: '1px solid #454341' }}
                    >
                      {children}
                    </pre>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote
                      className="pl-3 italic"
                      style={{ borderLeft: '2px solid #454341', color: '#5f5b57' }}
                    >
                      {children}
                    </blockquote>
                  ),
                  h1: ({ children }) => <h1 className="text-lg font-bold mb-2" style={{ color: '#3e3d3c' }}>{children}</h1>,
                  h2: ({ children }) => <h2 className="text-base font-semibold mb-2" style={{ color: '#3e3d3c' }}>{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-medium mb-2" style={{ color: '#3e3d3c' }}>{children}</h3>,
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
            {isStreaming && (
              <span
                className="inline-block w-0.5 h-4 ml-0.5 align-middle"
                style={{ backgroundColor: styles.avatarBg }}
              />
            )}
          </div>

          {/* Actions - Wolf Style */}
          <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-6 text-[0.54rem] font-mono uppercase"
              style={{ color: '#5f5b57' }}
            >
              {copied ? (
                <Check className="w-3 h-3 mr-1" style={{ color: '#53dbc9' }} />
              ) : (
                <Copy className="w-3 h-3 mr-1" />
              )}
              {copied ? '已复制' : '复制'}
            </Button>
            {onExport && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExport}
                className="h-6 text-[0.54rem] font-mono uppercase"
                style={{ color: '#5f5b57' }}
              >
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
