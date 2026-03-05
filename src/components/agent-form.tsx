import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
      icon: <Target className="w-4 h-4" />,
      prompt: `你是一位犀利的辩论选手，持有正方立场。辩论风格：\n\n1. 观点鲜明，立场坚定，必要时主动发起进攻\n2. 善于抓住对方逻辑漏洞进行反驳\n3. 论据充分，逻辑严密，论证有力\n4. 适当使用类比和比喻增强说服力\n5. 发言控制在200-400字，简洁有力`,
    },
    {
      id: 'logical',
      name: '逻辑严谨型',
      icon: <Scale className="w-4 h-4" />,
      prompt: `你是一位逻辑严密的辩论选手，持有正方立场。辩论风格：\n\n1. 注重逻辑推理，每句话都有理有据\n2. 善于构建完整的论证体系\n3. 用数据和事实说话，客观理性\n4. 不轻易使用情感化表达\n5. 发言控制在250-350字，条理清晰`,
    },
    {
      id: 'eloquent',
      name: '儒雅辩手型',
      icon: <MessageCircle className="w-4 h-4" />,
      prompt: `你是一位儒雅的辩论选手，持有正方立场。辩论风格：\n\n1. 语气温和但立场坚定\n2. 善于用故事和案例阐释观点\n3. 尊重对手，不进行人身攻击\n4. 注重与对方建立共识\n5. 发言控制在300-400字，富有文采`,
    },
  ],
  con: [
    {
      id: 'aggressive',
      name: '激进进攻型',
      icon: <Target className="w-4 h-4" />,
      prompt: `你是一位犀利的辩论选手，持有反方立场。辩论风格：\n\n1. 观点鲜明，立场坚定，必要时主动发起进攻\n2. 善于抓住对方逻辑漏洞进行反驳\n3. 论据充分，逻辑严密，论证有力\n4. 适当使用类比和比喻增强说服力\n5. 发言控制在200-400字，简洁有力`,
    },
    {
      id: 'logical',
      name: '逻辑严谨型',
      icon: <Scale className="w-4 h-4" />,
      prompt: `你是一位逻辑严密的辩论选手，持有反方立场。辩论风格：\n\n1. 注重逻辑推理，每句话都有理有据\n2. 善于构建完整的论证体系\n3. 用数据和事实说话，客观理性\n4. 不轻易使用情感化表达\n5. 发言控制在250-350字，条理清晰`,
    },
    {
      id: 'eloquent',
      name: '儒雅辩手型',
      icon: <MessageCircle className="w-4 h-4" />,
      prompt: `你是一位儒雅的辩论选手，持有反方立场。辩论风格：\n\n1. 语气温和但立场坚定\n2. 善于用故事和案例阐释观点\n3. 尊重对手，不进行人身攻击\n4. 注重与对方建立共识\n5. 发言控制在300-400字，富有文采`,
    },
  ],
  judge: [
    {
      id: 'strict',
      name: '严格评判型',
      icon: <Scale className="w-4 h-4" />,
      prompt: `你是一位严格公正的裁判。评判标准：\n\n1. 严格按照逻辑和事实评判双方表现\n2. 指出双方论证的优缺点\n3. 给出明确的评分和理由\n4. 适当给出改进建议\n5. 发言控制在150-250字，简洁专业`,
    },
    {
      id: 'gentle',
      name: '温和指导型',
      icon: <MessageCircle className="w-4 h-4" />,
      prompt: `你是一位温和的裁判，注重指导性。评判风格：\n\n1. 以鼓励为主，温和指出问题\n2. 强调双方的进步空间\n3. 提供建设性的改进建议\n4. 平衡双方观点，避免偏袒\n5. 发言控制在200-300字，温和亲切`,
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">名称 *</Label>
        <Input
          id="name"
          placeholder="例如：正方一辩"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          required
        />
      </div>

      {/* Stance */}
      <div className="space-y-2">
        <Label>立场</Label>
        <div className="flex gap-2">
          {(['pro', 'con', 'judge'] as Stance[]).map((stance) => (
            <Button
              key={stance}
              type="button"
              variant={formData.stance === stance ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleChange('stance', stance)}
              className={formData.stance === stance ? '' : 'opacity-60'}
            >
              <Badge
                variant="outline"
                className={formData.stance === stance ? STANCE_INFO[stance].bgColor : ''}
              >
                {STANCE_INFO[stance].label}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      {/* Model - editable with quick select */}
      <div className="space-y-2">
        <Label htmlFor="model">模型名称</Label>
        <Input
          id="model"
          placeholder="例如：gpt-4o, qwen-max, claude-3-sonnet"
          value={formData.model}
          onChange={(e) => handleChange('model', e.target.value)}
          className="font-mono text-sm"
        />
        <div className="flex flex-wrap gap-1.5 pt-1">
          <span className="text-xs text-muted-foreground py-1">快速选择:</span>
          {DEFAULT_MODELS.slice(0, 6).map((model) => (
            <Button
              key={model}
              type="button"
              size="sm"
              className={`text-xs h-7 px-2.5 py-0 transition-all duration-200 border-2 ${
                formData.model === model
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white border-blue-500 shadow-lg scale-105 font-bold'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-gray-700 hover:border-blue-300'
              }`}
              onClick={() => handleChange('model', model)}
            >
              {model}
            </Button>
          ))}
        </div>
      </div>

      {/* Base URL */}
      <div className="space-y-2">
        <Label htmlFor="baseUrl">API Base URL</Label>
        <Input
          id="baseUrl"
          placeholder="https://api.openai.com/v1"
          value={formData.baseUrl}
          onChange={(e) => handleChange('baseUrl', e.target.value)}
        />
      </div>

      {/* API Key */}
      <div className="space-y-2">
        <Label htmlFor="apiKey">API Key *</Label>
        <Input
          id="apiKey"
          type="password"
          placeholder="sk-..."
          value={formData.apiKey}
          onChange={(e) => handleChange('apiKey', e.target.value)}
          required
        />
        <p className="text-xs text-muted-foreground">
          API Key 仅存储在浏览器本地，不会上传
        </p>
      </div>

      {/* System Prompt - with Presets */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>系统提示词</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 text-xs"
            onClick={() => setPresetTab(formData.stance)}
          >
            <Sparkles className="w-3 h-3 mr-1" />
            选择预设风格
          </Button>
        </div>

        {/* Preset Tabs */}
        <Tabs value={presetTab} onValueChange={(v) => setPresetTab(v as 'pro' | 'con' | 'judge')}>
          <TabsList className="w-full grid grid-cols-3 h-8">
            <TabsTrigger value="pro" className="text-xs">正方风格</TabsTrigger>
            <TabsTrigger value="con" className="text-xs">反方风格</TabsTrigger>
            <TabsTrigger value="judge" className="text-xs">裁判风格</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Preset Buttons */}
        <div className="flex flex-wrap gap-2">
          {currentPresets.map((preset) => (
            <Button
              key={preset.id}
              type="button"
              variant={formData.systemPrompt === preset.prompt ? 'default' : 'outline'}
              size="sm"
              className="text-xs h-7"
              onClick={() => handlePresetSelect(preset.prompt)}
            >
              {preset.icon}
              <span className="ml-1">{preset.name}</span>
            </Button>
          ))}
        </div>

        {/* Custom Prompt Textarea */}
        <Textarea
          id="systemPrompt"
          placeholder="自定义系统提示词..."
          value={formData.systemPrompt}
          onChange={(e) => handleChange('systemPrompt', e.target.value)}
          rows={4}
          className="font-mono text-sm"
        />
      </div>

      {/* Temperature */}
      <div className="space-y-2">
        <Label>Temperature: {formData.temperature}</Label>
        <Slider
          value={[formData.temperature ?? 0.7]}
          min={0}
          max={2}
          step={0.1}
          onValueChange={([v]) => handleChange('temperature', v)}
        />
      </div>

      {/* Thinking Mode */}
      <div className="flex items-center justify-between py-2 border-t">
        <div className="space-y-0.5">
          <Label>思考模式</Label>
          <p className="text-xs text-muted-foreground">
            启用深度思考，提升推理能力（部分模型支持）
          </p>
        </div>
        <input
          type="checkbox"
          checked={formData.thinkingMode ?? false}
          onChange={(e) => handleChange('thinkingMode', e.target.checked)}
          className="h-4 w-4 rounded border-gray-300"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1">
          <Save className="w-4 h-4 mr-2" />
          保存
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" />
          取消
        </Button>
      </div>
    </form>
  );
}
