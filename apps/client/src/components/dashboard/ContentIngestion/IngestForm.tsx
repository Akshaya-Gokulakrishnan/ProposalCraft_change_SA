/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { BiTrash } from 'react-icons/bi';
import { FiLoader } from 'react-icons/fi';
import { useSources } from '../../../hooks/useSources';

type IngestFormProps = {
  onContentUploaded: (results: any[]) => void;
  onProcessingStart: (type: 'file' | 'url') => void;
  onProcessingEnd: (type: 'file' | 'url') => void;
  isProcessing: boolean;
  defaultType: 'file' | 'url';
};

const IngestForm: React.FC<IngestFormProps> = ({
  onContentUploaded,
  onProcessingStart,
  isProcessing,
  onProcessingEnd,
  defaultType,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [webLinks, setWebLinks] = useState<string>('');
  const [errors, setErrors] = useState<{ file?: string; url?: string }>({});
  const { uploadSources } = useSources();

  const validateFile = (file: File) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    return allowedTypes.includes(file.type);
  };

  const handleFileChange = (files: FileList) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(validateFile);

    setSelectedFiles((prev) => [...prev, ...validFiles]);
    setErrors((prev) => ({
      ...prev,
      file:
        validFiles.length !== fileArray.length ? 'Only PDF and DOCX files are allowed' : undefined,
    }));
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setWebLinks(e.target.value);
    setErrors((prev) => ({ ...prev, url: undefined }));
  };

  // Listen for file selection events from parent component
  React.useEffect(() => {
    const handleFileSelected = (e: CustomEvent<{ files: FileList }>) => {
      if (e.detail?.files) {
        handleFileChange(e.detail.files);
      }
    };

    const formElement = document.getElementById('fileIngestForm');
    if (formElement) {
      formElement.addEventListener('fileSelected', handleFileSelected as EventListener);
      return () => {
        formElement.removeEventListener('fileSelected', handleFileSelected as EventListener);
      };
    }
  }, []);

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();

    try {
      onProcessingStart(defaultType);
      let results: any[] = [];

      if (defaultType === 'file' && selectedFiles.length > 0) {
        results = await uploadSources({ files: selectedFiles });
      } else if (defaultType === 'url' && webLinks.trim()) {
        const urls = webLinks
          .split(/[\n,]+/)
          .map((u) => u.trim())
          .filter(Boolean);
        results = await uploadSources({ urls });
      }

      if (results.length > 0) {
        const successfulResults = results.filter((r) => r.success);
        const failedResults = results.filter((r) => !r.success);

        if (successfulResults.length > 0) {
          toast.success(`Successfully processed ${successfulResults.length} source(s)`);
          onContentUploaded(results);
          setSelectedFiles([]);
          setWebLinks('');
          setErrors({});
        }

        if (failedResults.length > 0) {
          failedResults.forEach((r) => {
            toast.error(`Failed: ${r.error}`);
          });
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to process content. Please try again.');
    } finally {
      onProcessingEnd(defaultType);
    }
  };

  const canSubmit = () => {
    if (defaultType === 'file') {
      return selectedFiles.length > 0 && !errors.file;
    }
    return webLinks.trim().length > 0 && !errors.url;
  };

  return (
    <div className="flex flex-col space-y-4">
      {defaultType === 'file' && (
        <div className="space-y-4">
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 group"
                >
                  <span className="text-indigo-700 text-sm truncate flex-1 mr-2 font-medium">
                    {file.name}
                  </span>
                  <button
                    onClick={() => removeFile(index)}
                    disabled={isProcessing && defaultType === 'file'}
                    className="text-indigo-400 hover:text-red-500 transition-all duration-200 p-1.5 hover:bg-red-50 rounded-full"
                  >
                    <BiTrash className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {errors.file && (
            <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl shadow-sm">
              <p className="text-red-600 text-sm font-medium flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {errors.file}
              </p>
            </div>
          )}
        </div>
      )}

      {defaultType === 'url' && (
        <div className="space-y-4">
          <textarea
            placeholder="Enter URLs (one per line or comma separated)"
            value={webLinks}
            onChange={handleUrlChange}
            className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all duration-200 min-h-[120px] bg-gradient-to-br from-white to-emerald-50/30 shadow-sm hover:shadow-md placeholder-emerald-400/50"
            disabled={isProcessing && defaultType === 'url'}
          />
          {errors.url && (
            <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl shadow-sm">
              <p className="text-red-600 text-sm font-medium flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {errors.url}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={
          (isProcessing && defaultType === 'file') ||
          (isProcessing && defaultType === 'url') ||
          !canSubmit()
        }
        className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]
          ${
            (isProcessing && defaultType === 'file') ||
            (isProcessing && defaultType === 'url') ||
            !canSubmit()
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed hover:scale-100'
              : defaultType === 'file'
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:from-indigo-700 hover:to-blue-700 shadow-lg shadow-indigo-200/50 hover:shadow-xl hover:shadow-indigo-300/50'
                : 'bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:from-emerald-600 hover:to-green-600 shadow-lg shadow-green-200/50 hover:shadow-xl hover:shadow-green-300/50'
          }`}
      >
        {isProcessing && (defaultType === 'file' || defaultType === 'url') ? (
          <>
            <FiLoader className="w-5 h-5 animate-spin" />
            <span>Processing...</span>
          </>
        ) : (
          <span>Process Content</span>
        )}
      </button>
    </div>
  );
};

export default IngestForm;
