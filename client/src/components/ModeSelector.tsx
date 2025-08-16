import React from 'react';
import { ProcessingMode } from '../types';
import { Scissors, Download, Trash2 } from 'lucide-react';

interface ModeSelectorProps {
  mode: ProcessingMode;
  onModeChange: (mode: ProcessingMode) => void;
  disabled?: boolean;
}

const modes = [
  {
    id: 'extract' as ProcessingMode,
    label: '抽出',
    description: '指定ページを新しいPDFとして取り出す',
    icon: Download,
  },
  {
    id: 'split' as ProcessingMode,
    label: '分割',
    description: '指定ページを個別のPDFファイルに分割',
    icon: Scissors,
  },
  {
    id: 'delete' as ProcessingMode,
    label: '削除',
    description: '指定ページを除いた新しいPDFを作成',
    icon: Trash2,
  },
];

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  mode,
  onModeChange,
  disabled = false
}) => {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        処理モード
      </label>
      <div className="space-y-2">
        {modes.map((modeOption) => {
          const Icon = modeOption.icon;
          return (
            <label
              key={modeOption.id}
              className={`flex items-start space-x-3 p-3 border rounded-lg cursor-pointer transition-colors
                ${mode === modeOption.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <input
                type="radio"
                name="mode"
                value={modeOption.id}
                checked={mode === modeOption.id}
                onChange={() => !disabled && onModeChange(modeOption.id)}
                disabled={disabled}
                className="mt-1"
              />
              <Icon className={`h-5 w-5 mt-0.5 ${
                mode === modeOption.id ? 'text-blue-600' : 'text-gray-400'
              }`} />
              <div className="flex-1">
                <div className={`text-sm font-medium ${
                  mode === modeOption.id ? 'text-blue-900' : 'text-gray-900'
                }`}>
                  {modeOption.label}
                </div>
                <div className={`text-sm ${
                  mode === modeOption.id ? 'text-blue-700' : 'text-gray-500'
                }`}>
                  {modeOption.description}
                </div>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
};