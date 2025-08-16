import React from 'react';
import { FileText, User, Hash } from 'lucide-react';
import { PDFInfo as PDFInfoType } from '../types';

interface PDFInfoProps {
  pdfInfo: PDFInfoType;
}

export const PDFInfo: React.FC<PDFInfoProps> = ({ pdfInfo }) => {
  const formatFileSize = (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 border">
      <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
        <FileText className="h-5 w-5 mr-2" />
        PDF情報
      </h3>
      
      <div className="space-y-3">
        <div>
          <div className="flex items-center text-sm text-gray-600 mb-1">
            <FileText className="h-4 w-4 mr-1" />
            ファイル名
          </div>
          <div className="text-sm font-medium text-gray-900 truncate">
            {pdfInfo.filename}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center text-sm text-gray-600 mb-1">
              <Hash className="h-4 w-4 mr-1" />
              ページ数
            </div>
            <div className="text-sm font-medium text-gray-900">
              {pdfInfo.pageCount}ページ
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-600 mb-1">ファイルサイズ</div>
            <div className="text-sm font-medium text-gray-900">
              {formatFileSize(pdfInfo.size)}
            </div>
          </div>
        </div>

        {(pdfInfo.title || pdfInfo.author) && (
          <div className="pt-2 border-t border-gray-200">
            {pdfInfo.title && (
              <div className="mb-2">
                <div className="text-sm text-gray-600 mb-1">タイトル</div>
                <div className="text-sm font-medium text-gray-900 truncate">
                  {pdfInfo.title}
                </div>
              </div>
            )}

            {pdfInfo.author && (
              <div>
                <div className="flex items-center text-sm text-gray-600 mb-1">
                  <User className="h-4 w-4 mr-1" />
                  作成者
                </div>
                <div className="text-sm font-medium text-gray-900 truncate">
                  {pdfInfo.author}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};