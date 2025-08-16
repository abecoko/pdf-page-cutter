import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X } from 'lucide-react';

interface UploadAreaProps {
  onFileSelect: (file: File) => void;
  file: File | null;
  isUploading: boolean;
}

export const UploadArea: React.FC<UploadAreaProps> = ({
  onFileSelect,
  file,
  isUploading
}) => {
  const [dragError, setDragError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setDragError(null);
    
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors.some((e: any) => e.code === 'file-invalid-type')) {
        setDragError('PDFファイルのみアップロード可能です');
      } else if (rejection.errors.some((e: any) => e.code === 'file-too-large')) {
        setDragError('ファイルサイズが大きすぎます（最大200MB）');
      } else {
        setDragError('無効なファイルです');
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false,
    maxSize: 200 * 1024 * 1024, // 200MB
    disabled: isUploading
  });

  const clearFile = () => {
    setDragError(null);
    onFileSelect(null as any);
  };

  if (file) {
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <File className="h-8 w-8 text-blue-500" />
            <div>
              <p className="font-medium text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-500">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>
          {!isUploading && (
            <button
              onClick={clearFile}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        {isUploading && (
          <div className="mt-3">
            <div className="bg-blue-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse w-full"></div>
            </div>
            <p className="text-sm text-gray-500 mt-1">アップロード中...</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
        ${isDragActive 
          ? 'border-blue-400 bg-blue-50' 
          : dragError 
            ? 'border-red-400 bg-red-50'
            : 'border-gray-300 hover:border-gray-400'
        }
        ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input {...getInputProps()} />
      <Upload className={`mx-auto h-12 w-12 ${dragError ? 'text-red-400' : 'text-gray-400'}`} />
      <p className={`mt-2 text-lg font-medium ${dragError ? 'text-red-600' : 'text-gray-900'}`}>
        {dragError || (isDragActive ? 'ここにドロップ' : 'PDFファイルをドラッグ＆ドロップ')}
      </p>
      <p className="text-sm text-gray-500">
        または<span className="text-blue-600 underline">クリックしてファイルを選択</span>
      </p>
      <p className="text-xs text-gray-400 mt-2">最大200MB、PDFファイルのみ</p>
    </div>
  );
};