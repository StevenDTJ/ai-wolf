import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Save, Sparkles, Scale, MessageCircle, Target } from 'lucide-react';
import { AgentConfig, Stance, STANCE_INFO, DEFAULT_MODELS } from '@/types';

// 预设辩论风格提示词
const PRESET_PROMPTS = {
  pro: [
    {
      id: 'aggressive',
      name: '激进进攻型',
      icon: <Target className="w-3 h-3" />,
      prompt: `你是一位犀利的辩论选手，持有正方立场。辩论风格：

1. 观点鲜明，立场坚定，必要时主动发起进攻
2. 善于抓住对方逻辑漏洞进行反驳
3. 论据充分，逻辑严密，论证有力
4. 适当使用类比和比喻增强说服力
5. 发言控制在200-400字，简洁有力`,
    },
    {
      id: 'logical',
      name: '逻辑严谨型',
      icon: <Scale className="w-3 h-3" />,
      prompt: `你是一位逻辑严密的辩论选手，持有正方立场。辩论风格：

1. 注重逻辑推理，每句话都有理有据
2. 善于构建完整的论证体系
3. 用数据和事实说话，客观理性
4. 不轻易使用情感化表达
5. 发言控制在250-350字，条理清晰`,
    },
    {
      id: 'eloquent',
      name: '儒雅辩手型',
      icon: <MessageCircle className="w-3 h-3" />,
      prompt: `你是一位儒雅的辩论选手，持有正方立场。辩论风格：

1. 语气温和但立场坚定
2. 善于用故事和案例阐释观点
3. 尊重对手，不进行人身攻击
4. 注重与对方建立共识
5. 发言控制在300-400字，富有文采`,
    },
  ],
  con: [
    {
      id: 'aggressive',
      name: '激进进攻型',
      icon: <Target className="w-3 h-3" />,
      prompt: `你是一位犀利的辩论选手，持有反方立场。辩论风格：

1. 观点鲜明，立场坚定，必要时主动发起进攻
2. 善于抓住对方逻辑漏洞进行反驳
3. 论据充分，逻辑严密，论证有力
4. 适当使用类比和比喻增强说服力
5. 发言控制在200-400字，简洁有力`,
    },
    {
      id: 'logical',
      name: '逻辑严谨型',
      icon: <Scale className="w-3 h-3" />,
      prompt: `你是一位逻辑严密的辩论选手，持有反方立场。辩论风格：

1. 注重逻辑推理，每句话都有理有据
2. 善于构建完整的论证体系
3. 用数据和事实说话，客观理性
4. 不轻易使用情感化表达
5. 发言控制在250-350字，条理清晰`,
    },
    {
      id: 'eloquent',
      name: '儒雅辩手型',
      icon: <MessageCircle className="w-3 h-3" />,
      prompt: `你是一位儒雅的辩论选手，持有反方立场。辩论风格：

1. 语气温和但立场坚定
2. 善于用故事和案例阐释观点
3. 尊重对手，不进行人身攻击
4. 注重与对方建立共识
5. 发言控制在300-400字，富有文采`,
    },
  ],
  judge: [
    {
      id: 'strict',
      name: '严格评判型',
      icon: <Scale className="w-3 h-3" />,
      prompt: `你是一位严格公正的裁判。评判标准：

1. 严格按照逻辑和事实评判双方表现
2. 指出双方论证的优缺点
3. 给出明确的评分和理由
4. 适当给出改进建议
5. 发言控制在150-250字，简洁专业`,
    },
    {
      id: 'gentle',
      name: '温和指导型',
      icon: <MessageCircle className="w-3 h-3" />,
      prompt: `你是一位温和的裁判，注重指导性。评判风格：

1. 以鼓励为主，温和指出问题
2. 强调双方的进步空间
3. 提供建设性的改进建议
4. 平衡双方观点，避免偏袒
5. 发言控制在200-300字，温和亲切`,
    },
  ],
};

interface AgentFormProps {
  agent: AgentConfig;
  onSave: (agent: AgentConfig) => void;
  onCancel: () => void;
}

export function AgentForm({ agent, onSave, onCancel }: AgentFormProps) {
  const [formData, setFormData] = useState<AgentConfig>(agent);
  const [presetTab, setPresetTab] = useState<'pro' | 'con' | 'judge'>(agent.stance);

  const handleChange = (field: keyof AgentConfig, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePresetSelect = (prompt: string) => {
    setFormData((prev) => ({ ...prev, systemPrompt: prompt }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      return;
    }
    onSave(formData);
  };

  const currentPresets = PRESET_PROMPTS[presetTab] || [];

  // Wolf style helpers
  const getStanceStyle = (stance: Stance) => {
    switch (stance) {
      case 'pro': return { bg: '#6fc2ff', text: '#3e3d3c' };
      case 'con': return { bg: '#ff7169', text: '#3e3d3c' };
      case 'judge': return { bg: '#ffde00', text: '#3e3d3c' };
      default: return { bg: '#ede7e1', text: '#3e3d3c' };
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      {/* Name - Wolf Style */}
      <div className="space-y-2">
        <label className="text-xs font-mono uppercase tracking-wider" style={{ color: '#3e3d3c' }}>
          名称 *
        </label>
        <input
          type="text"
          id="name"
          placeholder="例如：正方一辩"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          required
          className="wolf-debate-input w-full h-9 px-3 text-sm"
        />
      </div>

      {/* Stance - Wolf Style */}
      <div className="space-y-2">
        <label className="text-xs font-mono uppercase tracking-wider" style={{ color: '#3e3d3c' }}>
          立场
        </label>
        <div className="flex gap-2">
          {(['pro', 'con', 'judge'] as Stance[]).map((stance) => {
            const style = getStanceStyle(stance);
            const isSelected = formData.stance === stance;
            return (
              <button
                key={stance}
                type="button"
                onClick={() => handleChange('stance', stance)}
                className="wolf-hard-shadow-button flex-1 h-8 text-[0.54rem] font-mono uppercase"
                style={{
                  backgroundColor: isSelected ? style.bg : '#fbf7f2',
                  color: '#3e3d3c',
                  border: '2px solid #454341',
                  borderRadius: 0,
                }}
              >
                {STANCE_INFO[stance].label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Model - Wolf Style */}
      <div className="space-y-2">
        <label className="text-xs font-mono uppercase tracking-wider" style={{ color: '#3e3d3c' }}>
          模型名称
        </label>
        <input
          type="text"
          id="model"
          placeholder="例如：gpt-4o, qwen-max, claude-3-sonnet"
          value={formData.model}
          onChange={(e) => handleChange('model', e.target.value)}
          className="wolf-debate-input w-full h-9 px-3 text-sm font-mono"
        />
        <div className="flex flex-wrap gap-1.5 pt-1">
          <span className="text-[0.54rem] font-mono uppercase" style={{ color: '#5f5b57' }}>快速选择:</span>
          {DEFAULT_MODELS.slice(0, 6).map((model) => (
            <button
              key={model}
              type="button"
              onClick={() => handleChange('model', model)}
              className="text-[0.5rem] font-mono h-6 px-2 transition-all duration-200"
              style={{
                backgroundColor: formData.model === model ? '#6fc2ff' : '#fbf7f2',
                color: '#3e3d3c',
                border: '1px solid #454341',
              }}
            >
              {model}
            </button>
          ))}
        </div>
      </div>

      {/* Base URL - Wolf Style */}
      <div className="space-y-2">
        <label className="text-xs font-mono uppercase tracking-wider" style={{ color: '#3e3d3c' }}>
          API Base URL
        </label>
        <input
          type="text"
          id="baseUrl"
          placeholder="https://api.openai.com/v1"
          value={formData.baseUrl}
          onChange={(e) => handleChange('baseUrl', e.target.value)}
          className="wolf-debate-input w-full h-9 px-3 text-sm font-mono"
        />
      </div>

      {/* API Key - Wolf Style */}
      <div className="space-y-2">
        <label className="text-xs font-mono uppercase tracking-wider" style={{ color: '#3e3d3c' }}>
          API Key *
        </label>
        <input
          type="password"
          id="apiKey"
          placeholder="sk-..."
          value={formData.apiKey}
          onChange={(e) => handleChange('apiKey', e.target.value)}
          required
          className="wolf-debate-input w-full h-9 px-3 text-sm font-mono"
        />
        <p className="text-[0.54rem]" style={{ color: '#5f5b57' }}>
          API Key 仅存储在浏览器本地，不会上传
        </p>
      </div>

      {/* System Prompt - with Presets - Wolf Style */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-mono uppercase tracking-wider" style={{ color: '#3e3d3c' }}>
            系统提示词
          </label>
          <button
            type="button"
            onClick={() => setPresetTab(formData.stance)}
            className="wolf-inline-action text-[0.54rem] font-mono uppercase flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3" />
            选择预设风格
          </button>
        </div>

        {/* Preset Tabs - Wolf Style */}
        <div className="flex border-2" style={{ borderColor: '#454341' }}>
          {(['pro', 'con', 'judge'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setPresetTab(tab)}
              className="flex-1 py-1.5 text-[0.5rem] font-mono uppercase"
              style={{
                backgroundColor: presetTab === tab ? '#6fc2ff' : '#fbf7f2',
                color: '#3e3d3c',
                borderRight: tab !== 'judge' ? '1px solid #454341' : 'none',
              }}
            >
              {tab === 'pro' ? '正方风格' : tab === 'con' ? '反方风格' : '裁判风格'}
            </button>
          ))}
        </div>

        {/* Preset Buttons - Wolf Style */}
        <div className="flex flex-wrap gap-2">
          {currentPresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handlePresetSelect(preset.prompt)}
              className="wolf-hard-shadow-button text-[0.5rem] font-mono uppercase h-7 px-2"
              style={{
                backgroundColor: formData.systemPrompt === preset.prompt ? '#6fc2ff' : '#fbf7f2',
                color: '#3e3d3c',
                border: '2px solid #454341',
                borderRadius: 0,
              }}
            >
              {preset.icon}
              <span className="ml-1">{preset.name}</span>
            </button>
          ))}
        </div>

        {/* Custom Prompt Textarea - Wolf Style */}
        <textarea
          id="systemPrompt"
          placeholder="自定义系统提示词..."
          value={formData.systemPrompt}
          onChange={(e) => handleChange('systemPrompt', e.target.value)}
          rows={4}
          className="wolf-debate-input w-full p-3 text-sm font-mono resize-none"
        />
      </div>

      {/* Temperature - Wolf Style */}
      <div className="space-y-2">
        <label className="text-xs font-mono uppercase tracking-wider" style={{ color: '#3e3d3c' }}>
          Temperature: {formData.temperature}
        </label>
        <Slider
          value={[formData.temperature ?? 0.7]}
          min={0}
          max={2}
          step={0.1}
          onValueChange={([v]) => handleChange('temperature', v)}
          className="py-2"
        />
      </div>

      {/* Thinking Mode - Wolf Style */}
      <div
        className="flex items-center justify-between py-2"
        style={{ borderTop: '1px solid rgba(69,67,65,0.18)' }}
      >
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
          checked={formData.thinkingMode ?? false}
          onChange={(e) => handleChange('thinkingMode', e.target.checked)}
          className="h-4 w-4"
          style={{ accentColor: '#6fc2ff' }}
        />
      </div>

      {/* Actions - Wolf Style */}
      <div className="flex gap-2 pt-4" style={{ borderTop: '2px solid #454341' }}>
        <button
          type="submit"
          className="wolf-hard-shadow-button wolf-debate-control-primary flex-1 h-9 text-[0.58rem] font-mono uppercase flex items-center justify-center gap-2"
        >
          <Save className="w-3 h-3" />
          保存
        </button>
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
          <X className="w-3 h-3" />
          取消
        </button>
      </div>
    </form>
  );
}
