import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Role & Team Info */}
      <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
        <span className="text-sm font-medium">
          {teamLabel} - {roleLabel}
        </span>
      </div>

      {/* Name */}
      <div className="space-y-2">
        <label className="text-sm font-medium">辩手名称</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={`例如：${defaultName}`}
          required
        />
      </div>

      {/* Model */}
      <div className="space-y-2">
        <label className="text-sm font-medium">模型</label>
        <Input
          value={model}
          onChange={(e) => updateModel(e.target.value)}
          placeholder="gpt-4o-mini"
        />
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs text-muted-foreground py-1">快速选择:</span>
          {DEFAULT_MODELS.slice(0, 6).map((m) => (
            <Button
              key={m}
              type="button"
              size="sm"
              className={`text-xs h-7 px-2.5 py-0 transition-all duration-200 border-2 ${
                model === m
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white border-blue-500 shadow-lg scale-105 font-bold'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-gray-700 hover:border-blue-300'
              }`}
              onClick={() => updateModel(m)}
            >
              {m}
            </Button>
          ))}
        </div>
      </div>

      {/* API Config */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Base URL</label>
          <Input
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder={MODEL_BASE_URLS[model] || 'https://api.openai.com/v1'}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">API Key</label>
          <Input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
          />
        </div>
      </div>

      {/* System Prompt */}
      <div className="space-y-2">
        <label className="text-sm font-medium">系统提示词</label>
        <Textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          placeholder="输入系统提示词..."
          rows={6}
        />
        <p className="text-xs text-muted-foreground">
          提示：根据辩手角色不同，系统会自动调整发言风格。一辩负责开篇立论，二辩补充论证，三辩负责攻辩，四辩总结陈词。
        </p>
      </div>

      {/* Advanced Settings */}
      <details className="group">
        <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
          高级设置
        </summary>
        <div className="mt-2 space-y-4">
          {/* Thinking Mode */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium">思考模式</label>
              <p className="text-xs text-muted-foreground">
                启用深度思考，提升推理能力（部分模型支持）
              </p>
            </div>
            <input
              type="checkbox"
              checked={thinkingMode}
              onChange={(e) => setThinkingMode(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Temperature: {temperature}</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Max Tokens: {maxTokens}</label>
              <input
                type="range"
                min="100"
                max="4000"
                step="100"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </details>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit">
          保存
        </Button>
      </div>
    </form>
  );
}