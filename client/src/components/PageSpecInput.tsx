import React, { useState, useCallback, useEffect } from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';
import { PDFInfo, ValidationResult } from '../types';

interface PageSpecInputProps {
  pageSpec: string;
  onPageSpecChange: (spec: string) => void;
  pdfInfo: PDFInfo | null;
  onValidation: (result: ValidationResult) => void;
  isValidating: boolean;
}

const HELP_EXAMPLES = [
  { spec: '1,3,5', description: '特定のページ（1, 3, 5ページ）' },
  { spec: '1-10', description: 'ページ範囲（1〜10ページ）' },
  { spec: 'odd', description: '奇数ページのみ' },
  { spec: 'even', description: '偶数ページのみ' },
  { spec: 'all', description: 'すべてのページ' },
  { spec: '1-10,!5', description: '1〜10ページから5ページを除外' },
  { spec: '9,1-3', description: '指定順序（9ページ、1〜3ページの順）' },
  { spec: 'first', description: '最初のページ' },
  { spec: 'last', description: '最後のページ' },
];

export const PageSpecInput: React.FC<PageSpecInputProps> = ({
  pageSpec,
  onPageSpecChange,
  pdfInfo,
  onValidation,
  isValidating
}) => {
  const [showHelp, setShowHelp] = useState(false);
  const [validationResult] = useState<ValidationResult | null>(null);

  const handlePresetClick = useCallback((preset: string) => {
    onPageSpecChange(preset);
  }, [onPageSpecChange]);

  useEffect(() => {
    if (validationResult) {
      onValidation(validationResult);
    }
  }, [validationResult, onValidation]);

  const presets = pdfInfo?.presets || {};

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center space-x-2 mb-2">
          <label htmlFor="pageSpec" className="block text-sm font-medium text-gray-700">
            ページ指定
          </label>
          <button
            type="button"
            onClick={() => setShowHelp(!showHelp)}
            className="text-gray-400 hover:text-gray-600"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </div>
        
        <div className="relative">
          <input
            id="pageSpec"
            type="text"
            value={pageSpec}
            onChange={(e) => onPageSpecChange(e.target.value)}
            placeholder="例: 1,3,5-10,!7"
            className={`block w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm
              ${validationResult?.valid === false ? 'border-red-300' : 'border-gray-300'}
            `}
          />
          {isValidating && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>

        {validationResult?.valid === false && (
          <div className="mt-1 text-sm text-red-600">
            <p>{validationResult.error}</p>
            {validationResult.suggestion && (
              <p className="text-gray-500 mt-1">{validationResult.suggestion}</p>
            )}
          </div>
        )}

        {validationResult?.valid === true && (
          <div className="mt-1 text-sm text-green-600">
            {validationResult.count}ページが選択されています
          </div>
        )}
      </div>

      {Object.keys(presets).length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">プリセット</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(presets).map(([key, preset]) => (
              preset && (
                <button
                  key={key}
                  type="button"
                  onClick={() => handlePresetClick(preset)}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300 transition-colors"
                >
                  {getPresetLabel(key)}
                </button>
              )
            ))}
          </div>
        </div>
      )}

      {showHelp && (
        <div className="bg-gray-50 rounded-lg p-4 border">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-900">ページ指定の記法</h4>
            <button
              onClick={() => setShowHelp(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-2">
            {HELP_EXAMPLES.map((example, index) => (
              <div key={index} className="flex justify-between items-center">
                <code className="text-sm bg-white px-2 py-1 rounded border">
                  {example.spec}
                </code>
                <span className="text-sm text-gray-600 ml-3">
                  {example.description}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

function getPresetLabel(key: string): string {
  const labels: Record<string, string> = {
    all: 'すべて',
    odd: '奇数ページ',
    even: '偶数ページ',
    first10: '最初の10ページ',
    excludeFirst: '表紙を除く',
    excludeLast: '最終ページを除く',
    middle: '表紙・最終ページを除く'
  };
  return labels[key] || key;
}