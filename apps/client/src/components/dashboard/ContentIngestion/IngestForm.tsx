/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { BiTrash } from 'react-icons/bi';
import { FiLoader } from 'react-icons/fi';
import { useSources } from '../../../hooks/useSources';

type IngestFormProps = {
  onContentUploaded: (results: any[]) => void;
  onProcessingStart: () => void;
  onProcessingEnd: () => void;
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
      handleFileChange(e.detail.files);
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
      onProcessingStart();
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
      onProcessingEnd();
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
                  className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-100 rounded-lg"
                >
                  <span className="text-indigo-700 text-sm truncate flex-1 mr-2">{file.name}</span>
                  <button
                    onClick={() => removeFile(index)}
                    disabled={isProcessing}
                    className="text-indigo-400 hover:text-indigo-600 transition-colors p-1"
                  >
                    <BiTrash className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {errors.file && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{errors.file}</p>
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
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all min-h-[120px]"
            disabled={isProcessing}
          />
          {errors.url && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{errors.url}</p>
            </div>
          )}
        </div>
      )}

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={isProcessing || !canSubmit()}
        className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 
          ${
            isProcessing || !canSubmit()
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : defaultType === 'file'
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 hover:shadow-indigo-300'
                : 'bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-200 hover:shadow-green-300'
          }`}
      >
        {isProcessing ? (
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
