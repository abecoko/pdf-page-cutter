import { useState, useCallback, useEffect, useMemo } from 'react';
import { UploadArea } from './components/UploadArea';
import { PageSpecInput } from './components/PageSpecInput';
import { ModeSelector } from './components/ModeSelector';
import { PDFInfo } from './components/PDFInfo';
import { ToastContainer } from './components/Toast';
import { useToast } from './hooks/useToast';
import { api, downloadBlob, APIError } from './utils/api';
import { PDFInfo as PDFInfoType, ProcessingMode, ValidationResult } from './types';
import { Settings, Download } from 'lucide-react';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfInfo, setPdfInfo] = useState<PDFInfoType | null>(null);
  const [pageSpec, setPageSpec] = useState('');
  const [mode, setMode] = useState<ProcessingMode>('extract');
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  const { toasts, removeToast, success, error, warning } = useToast();

  const handleFileSelect = useCallback(async (selectedFile: File | null) => {
    if (!selectedFile) {
      setFile(null);
      setPdfInfo(null);
      setPageSpec('');
      setValidationResult(null);
      return;
    }

    setFile(selectedFile);
    setIsUploading(true);
    
    try {
      const info = await api.uploadPDF(selectedFile);
      setPdfInfo(info);
      setPageSpec('all');
      success('PDFを読み込みました');
    } catch (err) {
      if (err instanceof APIError) {
        error(`アップロードエラー: ${err.message}`);
      } else {
        error('アップロードに失敗しました');
      }
      setFile(null);
      setPdfInfo(null);
    } finally {
      setIsUploading(false);
    }
  }, [success, error]);

  const validatePages = useCallback(async (spec: string) => {
    if (!file || !spec.trim()) {
      setValidationResult(null);
      return;
    }

    setIsValidating(true);
    try {
      const result = await api.validatePages(file, spec);
      setValidationResult(result);
    } catch (err) {
      setValidationResult({
        valid: false,
        error: 'ページ検証に失敗しました'
      });
    } finally {
      setIsValidating(false);
    }
  }, [file]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (pageSpec && file) {
        validatePages(pageSpec);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [pageSpec, file, validatePages]);

  const handleProcess = useCallback(async () => {
    if (!file || !pageSpec || !validationResult?.valid) {
      warning('PDFファイルと有効なページ指定が必要です');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await api.processPDF(file, {
        pageSpec,
        mode,
        engine: 'auto'
      });

      const baseFilename = file.name.replace(/\.pdf$/i, '');
      
      if ('files' in result) {
        // Multiple files - download each separately
        const filesWithNames = result.files.map((blob, index) => ({
          blob,
          filename: `${baseFilename}_page_${index + 1}.pdf`
        }));
        
        for (let i = 0; i < filesWithNames.length; i++) {
          const { blob, filename } = filesWithNames[i];
          downloadBlob(blob, filename);
          if (i < filesWithNames.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        success(`${filesWithNames.length}個のファイルをダウンロードしました`);
      } else {
        // Single file
        let filename;
        switch (mode) {
          case 'extract':
            filename = `${baseFilename}_extracted.pdf`;
            break;
          case 'split':
            filename = `${baseFilename}_page.pdf`;
            break;
          case 'delete':
            filename = `${baseFilename}_deleted.pdf`;
            break;
        }
        
        downloadBlob(result as Blob, filename);
        success(`${getModeLabel(mode)}が完了しました`);
      }
    } catch (err) {
      if (err instanceof APIError) {
        if (err.type === 'password_required') {
          error('パスワード保護されたPDFです。対応していません。');
        } else {
          error(`処理エラー: ${err.message}`);
        }
      } else {
        error('処理に失敗しました');
      }
    } finally {
      setIsProcessing(false);
    }
  }, [file, pageSpec, mode, validationResult, success, error, warning]);

  const canProcess = useMemo(() => {
    return file && 
           pdfInfo && 
           pageSpec.trim() && 
           validationResult?.valid === true && 
           !isProcessing && 
           !isUploading;
  }, [file, pdfInfo, pageSpec, validationResult, isProcessing, isUploading]);

  return (
    <div className="min-h-screen bg-gray-100">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              PDF Page Cutter
            </h1>
            <p className="text-gray-600">
              PDFから任意のページを抽出・分割・削除するツール
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  1. PDFファイルをアップロード
                </h2>
                <UploadArea
                  onFileSelect={handleFileSelect}
                  file={file}
                  isUploading={isUploading}
                />
              </div>

              {pdfInfo && (
                <>
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      2. ページを指定
                    </h2>
                    <PageSpecInput
                      pageSpec={pageSpec}
                      onPageSpecChange={setPageSpec}
                      pdfInfo={pdfInfo}
                      onValidation={setValidationResult}
                      isValidating={isValidating}
                    />
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      3. 処理モードを選択
                    </h2>
                    <ModeSelector
                      mode={mode}
                      onModeChange={setMode}
                      disabled={isProcessing}
                    />
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      4. 処理を実行
                    </h2>
                    <button
                      onClick={handleProcess}
                      disabled={!canProcess}
                      className={`w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm
                        ${canProcess
                          ? 'text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                          : 'text-gray-300 bg-gray-400 cursor-not-allowed'
                        }
                      `}
                    >
                      {isProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          処理中...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          {getModeLabel(mode)}を実行
                        </>
                      )}
                    </button>
                    
                    {validationResult?.valid && (
                      <p className="mt-2 text-sm text-gray-600 text-center">
                        {validationResult.count}ページの{getModeLabel(mode)}を行います
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="space-y-6">
              {pdfInfo && <PDFInfo pdfInfo={pdfInfo} />}
              
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  使い方
                </h3>
                <div className="space-y-3 text-sm text-gray-600">
                  <div>
                    <h4 className="font-medium text-gray-700">抽出モード</h4>
                    <p>指定したページだけを含む新しいPDFを作成します。</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700">分割モード</h4>
                    <p>指定したページを個別のPDFファイルに分割し、ZIPで一括ダウンロードします。</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700">削除モード</h4>
                    <p>指定したページを除いた新しいPDFを作成します。</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getModeLabel(mode: ProcessingMode): string {
  const labels: Record<ProcessingMode, string> = {
    extract: '抽出',
    split: '分割',
    delete: '削除'
  };
  return labels[mode];
}

export default App;