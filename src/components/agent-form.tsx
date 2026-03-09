import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { X, Save, Sparkles, Scale, MessageCircle, Target, FolderOpen, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { AgentConfig, Stance, STANCE_INFO, DEFAULT_MODELS } from '@/types';
import { toast } from 'sonner';

// Debate player preset interface (matching wolf game style)
interface DebatePlayerPreset {
  id: string;
  name: string;
  model: string;
  baseUrl: string;
  apiKey: string;
  temperature: number;
  thinkingMode: boolean;
}

// Storage key for debate presets
const DEBATE_PRESETS_KEY = 'debate-player-presets';

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
  /** When false, hides the stance selector (used in 2-person mode) */
  showStance?: boolean;
}

export function AgentForm({ agent, onSave, onCancel, showStance = true }: AgentFormProps) {
  const [formData, setFormData] = useState<AgentConfig>(agent);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Preset management state
  const [presets, setPresets] = useState<DebatePlayerPreset[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem(DEBATE_PRESETS_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [presetDialogOpen, setPresetDialogOpen] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presetMode, setPresetMode] = useState<'save' | 'load'>('save');

  // Save presets to localStorage
  const savePresets = (newPresets: DebatePlayerPreset[]) => {
    setPresets(newPresets);
    localStorage.setItem(DEBATE_PRESETS_KEY, JSON.stringify(newPresets));
  };

  // Handle save preset
  const handleSavePreset = () => {
    if (!presetName.trim()) {
      toast.error('请输入预设名称');
      return;
    }
    const newPreset: DebatePlayerPreset = {
      id: `preset-${Date.now()}`,
      name: presetName.trim(),
      model: formData.model,
      baseUrl: formData.baseUrl,
      apiKey: formData.apiKey,
      temperature: formData.temperature ?? 0.7,
      thinkingMode: formData.thinkingMode ?? false,
    };
    const newPresets = [...presets, newPreset];
    savePresets(newPresets);
    toast.success(`已保存预设 "${presetName}"`);
    setPresetName('');
    setPresetDialogOpen(false);
  };

  // Handle apply preset
  const handleApplyPreset = (preset: DebatePlayerPreset) => {
    setFormData((prev) => ({
      ...prev,
      model: preset.model,
      baseUrl: preset.baseUrl,
      apiKey: preset.apiKey,
      temperature: preset.temperature,
      thinkingMode: preset.thinkingMode,
    }));
    toast.success(`已应用预设 "${preset.name}"`);
    setPresetDialogOpen(false);
  };

  // Handle delete preset
  const handleDeletePreset = (presetId: string) => {
    const newPresets = presets.filter((p) => p.id !== presetId);
    savePresets(newPresets);
    toast.success('已删除预设');
  };

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

  const currentPresets = PRESET_PROMPTS[formData.stance] || [];

  // Wolf style helpers
  const getStanceStyle = (stance: Stance) => {
    switch (stance) {
      case 'pro': return { bg: '#53dbc9', text: '#3e3d3c' };
      case 'con': return { bg: '#ff7169', text: '#3e3d3c' };
      case 'judge': return { bg: '#ff9538', text: '#3e3d3c' };
      default: return { bg: '#ede7e1', text: '#3e3d3c' };
    }
  };

  // Get current stance color for dynamic styling
  const currentStanceStyle = getStanceStyle(formData.stance);

  return (
    <form onSubmit={handleSubmit} className="agent-form-scroll space-y-4 p-4">
      {/* Name - Wolf Style */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#3e3d3c' }}>
          名称 *
        </label>
        <input
          type="text"
          id="name"
          placeholder="例如：正方一辩"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          required
          className="wolf-debate-input w-full h-10 px-3 text-sm"
        />
      </div>

      {/* Stance - Wolf Style - only show when enabled */}
      {showStance && (
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#3e3d3c' }}>
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
                  className="wolf-hard-shadow-button flex-1 h-9 text-[0.6rem] font-semibold uppercase"
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
      )}

      {/* Model - Wolf Style */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#3e3d3c' }}>
          模型名称
        </label>
        <input
          type="text"
          id="model"
          placeholder="例如：gpt-4o, qwen-max, claude-3-sonnet"
          value={formData.model}
          onChange={(e) => handleChange('model', e.target.value)}
          className="wolf-debate-input w-full h-10 px-3 text-sm font-mono"
        />
        <div className="flex flex-wrap gap-1.5 pt-1">
          <span className="text-[0.6rem] font-mono uppercase" style={{ color: '#5f5b57' }}>快速选择:</span>
          {DEFAULT_MODELS.slice(0, 6).map((model) => (
            <button
              key={model}
              type="button"
              onClick={() => handleChange('model', model)}
              className="wolf-hard-shadow-button text-[0.55rem] font-mono h-7 px-2.5 transition-all duration-200"
              style={{
                backgroundColor: formData.model === model ? currentStanceStyle.bg : '#fbf7f2',
                color: '#3e3d3c',
                border: '1px solid #454341',
                borderRadius: 0,
              }}
            >
              {model}
            </button>
          ))}
        </div>
      </div>

      {/* Base URL - Wolf Style */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#3e3d3c' }}>
          API Base URL
        </label>
        <input
          type="text"
          id="baseUrl"
          placeholder="https://api.openai.com/v1"
          value={formData.baseUrl}
          onChange={(e) => handleChange('baseUrl', e.target.value)}
          className="wolf-debate-input w-full h-10 px-3 text-sm font-mono"
        />
      </div>

      {/* API Key - Wolf Style */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#3e3d3c' }}>
          API Key *
        </label>
        <input
          type="password"
          id="apiKey"
          placeholder="sk-..."
          value={formData.apiKey}
          onChange={(e) => handleChange('apiKey', e.target.value)}
          required
          className="wolf-debate-input w-full h-10 px-3 text-sm font-mono"
        />
        <p className="text-[0.6rem]" style={{ color: '#5f5b57' }}>
          API Key 仅存储在浏览器本地，不会上传
        </p>
      </div>

      {/* Advanced Settings Toggle - Wolf Style */}
      <div className="border-2" style={{ borderColor: '#454341' }}>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors"
          style={{
            backgroundColor: showAdvanced ? '#ede7e1' : '#fbf7f2',
            color: '#3e3d3c',
          }}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" style={{ color: showAdvanced ? '#53dbc9' : '#5f5b57' }} />
            高级设置
          </div>
          {showAdvanced ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>

        {/* Advanced Settings Content - Collapsible */}
      <div className={`${showAdvanced ? 'block' : 'hidden'} p-4 space-y-4`} style={{ backgroundColor: '#f4efea' }}>
      {/* System Prompt - with Presets - Wolf Style */}
      <div className="space-y-3">
        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#3e3d3c' }}>
          系统提示词
        </label>

        {/* Preset Buttons - Wolf Style */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {currentPresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handlePresetSelect(preset.prompt)}
              className="wolf-hard-shadow-button flex items-center gap-2 px-3 py-2 text-left"
              style={{
                backgroundColor: formData.systemPrompt === preset.prompt ? currentStanceStyle.bg : '#fbf7f2',
                color: '#3e3d3c',
                border: '2px solid #454341',
                borderRadius: 0,
              }}
            >
              <span className="shrink-0">{preset.icon}</span>
              <span className="font-mono text-[0.68rem] uppercase leading-tight">{preset.name}</span>
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
        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#3e3d3c' }}>
          Temperature: {formData.temperature}
        </label>
        <Slider
          value={[formData.temperature ?? 0.7]}
          min={0}
          max={2}
          step={0.1}
          onValueChange={([v]) => handleChange('temperature', v)}
          className="wolf-debate-slider py-2"
          style={{ ['--debate-slider-accent' as string]: currentStanceStyle.bg }}
        />
      </div>

      {/* Thinking Mode - Wolf Style */}
      <div
        className="flex items-center justify-between py-2"
        style={{ borderTop: '1px solid rgba(69,67,65,0.18)' }}
      >
        <div className="space-y-0.5">
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#3e3d3c' }}>
            思考模式
          </label>
          <p className="text-[0.65rem]" style={{ color: '#5f5b57' }}>
            启用深度思考，提升推理能力（部分模型支持）
          </p>
        </div>
        {/* Custom Wolf-style checkbox - Using stance color background when selected */}
        <button
          type="button"
          onClick={() => handleChange('thinkingMode', !formData.thinkingMode)}
          className="wolf-hard-shadow-button w-9 h-9 flex items-center justify-center transition-all"
          style={{
            backgroundColor: formData.thinkingMode ? currentStanceStyle.bg : '#fbf7f2',
            border: '2px solid #454341',
            borderRadius: 0,
          }}
        >
          {formData.thinkingMode && (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#3e3d3c" strokeWidth={3}>
              <path strokeLinecap="square" strokeLinejoin="miter" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      </div>
        </div>{/* End of Advanced Settings */}
      </div>{/* End of Advanced Settings Toggle */}

      {/* Actions - Wolf Style */}
      <div className="space-y-3 pt-4" style={{ borderTop: '2px solid #454341' }}>
        {/* Preset Buttons - Save/Load - Moved above Save button */}
        <div className="flex gap-4">
          <Dialog open={presetDialogOpen} onOpenChange={setPresetDialogOpen}>
            <DialogTrigger asChild>
              <button
                type="button"
                className="utility-link text-[0.6rem] font-mono uppercase inline-flex items-center gap-1"
                style={{ color: '#5f5b57' }}
                onClick={() => setPresetMode('save')}
              >
                <Save className="w-3 h-3" />
                保存预设
              </button>
            </DialogTrigger>
            <DialogContent style={{ backgroundColor: '#fbf7f2', border: '2px solid #454341', borderRadius: 0 }}>
              <DialogHeader>
                <DialogTitle className="font-mono text-sm" style={{ color: '#3e3d3c' }}>
                  {presetMode === 'save' ? '保存为预设' : '应用预设'}
                </DialogTitle>
              </DialogHeader>
              {presetMode === 'save' ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase" style={{ color: '#3e3d3c' }}>预设名称</label>
                    <Input
                      id="preset-name"
                      value={presetName}
                      onChange={(e) => setPresetName(e.target.value)}
                      placeholder="请输入预设名称，如：我的 GPT 配置"
                      className="font-mono"
                      style={{ border: '2px solid #454341', borderRadius: 0 }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSavePreset}
                      className="flex-1 h-8 text-[0.5rem] font-mono uppercase"
                      style={{ backgroundColor: '#53dbc9', color: '#3e3d3c', border: '2px solid #454341', borderRadius: 0 }}
                    >
                      <Save className="w-3 h-3 mr-1" />
                      保存
                    </Button>
                    <Button
                      onClick={() => { setPresetMode('load'); setPresetName(''); }}
                      className="flex-1 h-8 text-[0.5rem] font-mono uppercase"
                      style={{ backgroundColor: '#fbf7f2', color: '#3e3d3c', border: '2px solid #454341', borderRadius: 0 }}
                    >
                      <FolderOpen className="w-3 h-3 mr-1" />
                      加载
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {presets.length === 0 ? (
                    <p className="text-sm text-center py-4" style={{ color: '#5f5b57' }}>
                      暂无保存的预设
                    </p>
                  ) : (
                    <div className="max-h-[200px] overflow-y-auto space-y-2">
                      {presets.map((preset) => (
                        <div
                          key={preset.id}
                          className="flex items-center justify-between p-2 cursor-pointer"
                          style={{ border: '2px solid #454341', backgroundColor: '#f4efea' }}
                          onClick={() => handleApplyPreset(preset)}
                        >
                          <div className="flex-1">
                            <div className="text-xs font-mono" style={{ color: '#3e3d3c' }}>{preset.name}</div>
                            <div className="text-[0.5rem] font-mono" style={{ color: '#5f5b57' }}>{preset.model}</div>
                          </div>
                          <button
                            type="button"
                            className="p-1"
                            style={{ color: '#ff7169' }}
                            onClick={(e) => { e.stopPropagation(); handleDeletePreset(preset.id); }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button
                    onClick={() => { setPresetMode('save'); setPresetDialogOpen(true); }}
                    className="w-full h-8 text-[0.5rem] font-mono uppercase"
                    style={{ backgroundColor: '#fbf7f2', color: '#3e3d3c', border: '2px solid #454341', borderRadius: 0 }}
                  >
                    <Save className="w-3 h-3 mr-1" />
                    返回保存
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
          <button
            type="button"
            className="utility-link text-[0.6rem] font-mono uppercase inline-flex items-center gap-1"
            style={{ color: '#5f5b57' }}
            onClick={() => { setPresetMode('load'); setPresetDialogOpen(true); }}
            disabled={presets.length === 0}
          >
            <FolderOpen className="w-3 h-3" />
            应用预设
          </button>
        </div>

        {/* Main Save Button - Now using utility blue color */}
        <div className="flex gap-2">
          <button
            type="submit"
            className="wolf-hard-shadow-button wolf-debate-control-primary flex-1 h-10 text-sm font-semibold uppercase flex items-center justify-center gap-2"
            style={{
              backgroundColor: '#53dbc9',
              color: '#3e3d3c',
              border: '2px solid #454341',
              borderRadius: 0,
            }}
          >
            <Save className="w-3.5 h-3.5" />
            保存
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="wolf-hard-shadow-button h-10 px-5 text-sm font-semibold uppercase"
            style={{
              backgroundColor: '#fbf7f2',
              color: '#3e3d3c',
              border: '2px solid #454341',
              borderRadius: 0,
            }}
          >
            <X className="w-3.5 h-3.5" />
            取消
          </button>
        </div>
      </div>
    </form>
  );
}
