import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Debater, DEFAULT_MODELS, DEBATER_PROMPTS, DebaterRole, TeamSide } from '@/types';

// 模型对应的默认Base URL
const MODEL_BASE_URLS: Record<string, string> = {
  'gpt-4o': 'https://api.openai.com/v1',
  'gpt-4o-mini': 'https://api.openai.com/v1',
  'gpt-4-turbo': 'https://api.openai.com/v1',
  'gpt-3.5-turbo': 'https://api.openai.com/v1',
  'claude-3-5-sonnet-20241022': 'https://api.anthropic.com',
  'claude-3-haiku-20240307': 'https://api.anthropic.com',
  'moonshot-v1-8k': 'https://api.moonshot.cn/v1',
  'moonshot-v1-32k': 'https://api.moonshot.cn/v1',
  'qwen-plus': 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  'qwen-turbo': 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  'qwen3.5-plus': 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  'deepseek-chat': 'https://api.deepseek.com/v1',
  'deepseek-reasoner': 'https://api.deepseek.com',
};

interface DebaterFormProps {
  debater: Debater;
  onSave: (debater: Debater) => void;
  onCancel: () => void;
}

export function DebaterForm({ debater, onSave, onCancel }: DebaterFormProps) {
  const roleLabel = {
    first: '一辩',
    second: '二辩',
    third: '三辩',
    fourth: '四辩',
  }[debater.role];

  const teamLabel = debater.team === 'pro' ? '正方' : '反方';
  const teamColor = debater.team === 'pro' ? '#6fc2ff' : '#ff7169';
  const defaultName = `${teamLabel}${roleLabel}`;

  // 默认Base URL根据模型自动匹配
  const getDefaultBaseUrl = (modelName: string, currentUrl: string) => {
    if (currentUrl && currentUrl !== '') return currentUrl;
    return MODEL_BASE_URLS[modelName] || 'https://api.openai.com/v1';
  };

  const [name, setName] = useState(debater.name || defaultName);
  const [model, setModel] = useState(debater.model || 'gpt-4o-mini');
  const [baseUrl, setBaseUrl] = useState(() => getDefaultBaseUrl(debater.model || 'gpt-4o-mini', debater.baseUrl));
  const [apiKey, setApiKey] = useState(debater.apiKey);
  const [systemPrompt, setSystemPrompt] = useState(debater.systemPrompt || getDefaultPrompt(debater.role, debater.team));
  const [temperature, setTemperature] = useState(debater.temperature ?? 0.7);
  const [maxTokens, setMaxTokens] = useState(debater.maxTokens ?? 1000);
  const [thinkingMode, setThinkingMode] = useState(debater.thinkingMode ?? false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateModel = (nextModel: string) => {
    setModel(nextModel);
    const defaultUrl = MODEL_BASE_URLS[nextModel] || 'https://api.openai.com/v1';
    const isDefaultUrl = !baseUrl || Object.values(MODEL_BASE_URLS).includes(baseUrl) || baseUrl === 'https://api.openai.com/v1';
    if (isDefaultUrl) {
      setBaseUrl(defaultUrl);
    }
  };

  function getDefaultPrompt(role: DebaterRole, team: TeamSide): string {
    return DEBATER_PROMPTS[role][team];
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...debater,
      name,
      model,
      baseUrl,
      apiKey,
      systemPrompt,
      temperature,
      maxTokens,
      thinkingMode,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      {/* Role & Team Info - Wolf Style */}
      <div
        className="flex items-center gap-2 p-3"
        style={{
          backgroundColor: '#ede7e1',
          border: '2px solid #454341',
        }}
      >
        <span
          className="font-mono text-sm uppercase tracking-wider"
          style={{ color: '#3e3d3c' }}
        >
          {teamLabel} - {roleLabel}
        </span>
      </div>

      {/* Name - Wolf Style */}
      <div className="space-y-2">
        <label className="text-xs font-mono uppercase tracking-wider" style={{ color: '#3e3d3c' }}>
          辩手名称
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={`例如：${defaultName}`}
          required
          className="wolf-debate-input w-full h-9 px-3 text-sm"
        />
      </div>

      {/* Model - Wolf Style */}
      <div className="space-y-2">
        <label className="text-xs font-mono uppercase tracking-wider" style={{ color: '#3e3d3c' }}>
          模型
        </label>
        <input
          type="text"
          value={model}
          onChange={(e) => updateModel(e.target.value)}
          placeholder="gpt-4o-mini"
          className="wolf-debate-input w-full h-9 px-3 text-sm font-mono"
        />
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[0.54rem] font-mono uppercase" style={{ color: '#5f5b57' }}>快速选择:</span>
          {DEFAULT_MODELS.slice(0, 6).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => updateModel(m)}
              className="text-[0.5rem] font-mono h-6 px-2 transition-all duration-200"
              style={{
                backgroundColor: model === m ? '#6fc2ff' : '#fbf7f2',
                color: '#3e3d3c',
                border: '1px solid #454341',
              }}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* API Config - Wolf Style */}
      <div className="grid grid-cols-1 gap-3">
        <div className="space-y-2">
          <label className="text-xs font-mono uppercase tracking-wider" style={{ color: '#3e3d3c' }}>
            Base URL
          </label>
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder={MODEL_BASE_URLS[model] || 'https://api.openai.com/v1'}
            className="wolf-debate-input w-full h-9 px-3 text-sm font-mono"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-mono uppercase tracking-wider" style={{ color: '#3e3d3c' }}>
            API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            className="wolf-debate-input w-full h-9 px-3 text-sm font-mono"
          />
        </div>
      </div>

      {/* System Prompt - Wolf Style */}
      <div className="space-y-2">
        <label className="text-xs font-mono uppercase tracking-wider" style={{ color: '#3e3d3c' }}>
          系统提示词
        </label>
        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          placeholder="输入系统提示词..."
          rows={6}
          className="wolf-debate-input w-full p-3 text-sm font-mono resize-none"
        />
        <p className="text-[0.54rem]" style={{ color: '#5f5b57' }}>
          提示：根据辩手角色不同，系统会自动调整发言风格。一辩负责开篇立论，二辩补充论证，三辩负责攻辩，四辩总结陈词。
        </p>
      </div>

      {/* Advanced Settings Toggle - Wolf Style */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="w-full text-left text-xs font-mono uppercase tracking-wider py-2"
        style={{ color: '#5f5b57', borderTop: '1px solid rgba(69,67,65,0.18)' }}
      >
        {showAdvanced ? '▼' : '▶'} 高级设置
      </button>

      {/* Advanced Settings - Wolf Style */}
      {showAdvanced && (
        <div className="space-y-4 p-3" style={{ backgroundColor: '#ede7e1', border: '1px solid rgba(69,67,65,0.18)' }}>
          {/* Thinking Mode */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-xs font-mono uppercase tracking-wider" style={{ color: '#3e3d3c' }}>
                思考模式
              </label>
              <p className="text-[0.54rem]" style={{ color: '#5f5b57' }}>
                启用深度思考，提升推理能力（部分模型支持）
              </p>
            </div>
            <input
              type="checkbox"
              checked={thinkingMode}
              onChange={(e) => setThinkingMode(e.target.checked)}
              style={{ accentColor: '#6fc2ff', width: '18px', height: '18px' }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Temperature */}
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-wider" style={{ color: '#3e3d3c' }}>
                Temperature: {temperature}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full"
                style={{ accentColor: '#6fc2ff' }}
              />
            </div>
            {/* Max Tokens */}
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-wider" style={{ color: '#3e3d3c' }}>
                Max Tokens: {maxTokens}
              </label>
              <input
                type="range"
                min="100"
                max="4000"
                step="100"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                className="w-full"
                style={{ accentColor: '#6fc2ff' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Actions - Wolf Style */}
      <div className="flex justify-end gap-2 pt-3" style={{ borderTop: '2px solid #454341' }}>
        <button
          type="button"
          onClick={onCancel}
          className="wolf-hard-shadow-button h-9 px-4 text-[0.58rem] font-mono uppercase"
          style={{
            backgroundColor: '#fbf7f2',
            color: '#3e3d3c',
            border: '2px solid #454341',
            borderRadius: 0,
          }}
        >
          取消
        </button>
        <button
          type="submit"
          className="wolf-hard-shadow-button wolf-debate-control-primary h-9 px-6 text-[0.58rem] font-mono uppercase"
        >
          保存
        </button>
      </div>
    </form>
  );
}
