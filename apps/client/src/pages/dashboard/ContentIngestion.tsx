import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { FiGlobe, FiMenu, FiUpload } from 'react-icons/fi';
import { useLocation, useParams } from 'react-router-dom';
import ContentResults from '../../components/dashboard/ContentIngestion/ContentResults';
import IngestForm from '../../components/dashboard/ContentIngestion/IngestForm';
import ContentSources from './ContentSources';

type ExtractedContent = {
  success: boolean;
  content_source_id: number;
  chunks: Array<{
    content: string;
    label: string;
    file_source?: string;
    page?: number;
    section_type?: string;
  }>;
  figures?: Array<{
    path: string;
    page: number;
    caption?: string;
  }>;
  filename?: string;
  url?: string;
  error?: string;
};

const ContentIngestion: React.FC = () => {
  const [extractedResults, setExtractedResults] = useState<ExtractedContent[]>([]);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isProcessingUrl, setIsProcessingUrl] = useState(false);
  const [showSourcesPanel, setShowSourcesPanel] = useState(false);
  const location = useLocation();
  const params = useParams<{ id?: string }>();
  // Try to get workspaceId from params or location.state
  const workspaceId = params.id || location.state?.workspaceId;

  const handleProcessingStart = (type: 'file' | 'url') => {
    if (type === 'file') {
      setIsProcessingFile(true);
    } else {
      setIsProcessingUrl(true);
    }
  };

  const handleProcessingEnd = (type: 'file' | 'url') => {
    if (type === 'file') {
      setIsProcessingFile(false);
    } else {
      setIsProcessingUrl(false);
    }
  };

  const handleContentUploaded = (results: ExtractedContent[]) => {
    setExtractedResults(results); // Only keep the latest results, no duplicates
    setIsProcessingFile(false);
    setIsProcessingUrl(false);
  };

  const handleReset = () => {
    setExtractedResults([]);
    setIsProcessingFile(false);
    setIsProcessingUrl(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative">
      <div className="absolute inset-0 bg-grid-slate-900/[0.04] -z-1"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/5 -z-1"></div>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'linear-gradient(to right, #4F46E5, #6366F1)',
            color: '#fff',
            borderRadius: '1rem',
            padding: '1rem',
            boxShadow:
              '0 20px 25px -5px rgba(99, 102, 241, 0.1), 0 8px 10px -6px rgba(99, 102, 241, 0.1)',
          },
        }}
      />

      {/* Right side panel for Content Sources */}
      <div
        className={`fixed top-0 right-0 h-full z-40 transition-all duration-500 ease-in-out transform
          ${showSourcesPanel ? 'translate-x-0' : 'translate-x-full'}
          w-full max-w-md bg-white border-l border-indigo-100 shadow-2xl backdrop-blur-xl`}
      >
        <div className="absolute left-0 top-1/2 -translate-x-full transform">
          <button
            onClick={() => setShowSourcesPanel((prev) => !prev)}
            className={`flex items-center gap-2 px-4 py-3 bg-white rounded-l-xl border border-r-0 border-indigo-100 
              shadow-lg transition-all duration-300 group ${showSourcesPanel ? 'hover:bg-red-50' : 'hover:bg-indigo-50'}`}
            title={showSourcesPanel ? 'Close Content Sources' : 'Open Content Sources'}
          >
            <FiMenu
              className={`w-5 h-5 transition-colors duration-300 
              ${showSourcesPanel ? 'text-red-500 group-hover:text-red-600' : 'text-indigo-500 group-hover:text-indigo-600'}`}
            />
            <span
              className={`text-sm font-medium transition-colors duration-300
              ${showSourcesPanel ? 'text-red-500 group-hover:text-red-600' : 'text-indigo-500 group-hover:text-indigo-600'}`}
            >
              {showSourcesPanel ? 'Close' : 'Sources'}
            </span>
          </button>
        </div>
        <div className="h-full overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto px-6 py-8">
            <ContentSources />
          </div>
        </div>
      </div>

      <div
        className={`transition-all duration-500 ease-in-out
          ${showSourcesPanel ? 'lg:mr-[28rem]' : ''}`}
      >
        <div className="min-h-screen p-8">
          <div className="max-w-5xl mx-auto">
            {extractedResults.length === 0 ? (
              <div className="min-h-[80vh] flex items-center justify-center">
                <div className="w-full max-w-4xl mx-auto">
                  <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                      Content Ingestion
                    </h2>
                    <p className="mt-4 text-gray-600 text-lg">
                      Transform your documents and web content into structured data
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* File Upload Card */}
                    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-indigo-100/50 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:border-indigo-200 group">
                      <div className="p-8">
                        <div className="flex items-center justify-between mb-8">
                          <div className="flex items-center space-x-4">
                            <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                              <FiUpload className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                              Upload Files
                            </h3>
                          </div>
                          <div className="text-sm px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full font-medium">
                            PDF, DOC, DOCX
                          </div>
                        </div>
                        <div
                          className="relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 group/upload hover:bg-gradient-to-br hover:from-indigo-50/50 hover:to-blue-50/50 hover:border-indigo-300 border-gray-200/50 backdrop-blur-sm"
                          onClick={() => document.getElementById('fileInput')?.click()}
                          onDrop={(e) => {
                            e.preventDefault();
                            const files = e.dataTransfer.files;
                            if (files?.length) {
                              const ingestForm = document.getElementById('fileIngestForm');
                              if (ingestForm) {
                                const event = new CustomEvent('fileSelected', {
                                  detail: { files },
                                });
                                ingestForm.dispatchEvent(event);
                              }
                            }
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.add('border-indigo-300', 'bg-indigo-50/50');
                          }}
                          onDragLeave={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.remove(
                              'border-indigo-300',
                              'bg-indigo-50/50',
                            );
                          }}
                        >
                          <input
                            type="file"
                            id="fileInput"
                            multiple
                            className="hidden"
                            accept=".pdf,.doc,.docx"
                            disabled={isProcessingFile}
                            onChange={(e) => {
                              const files = e.target.files;
                              if (files?.length) {
                                const ingestForm = document.getElementById('fileIngestForm');
                                if (ingestForm) {
                                  const event = new CustomEvent('fileSelected', {
                                    detail: { files },
                                  });
                                  ingestForm.dispatchEvent(event);
                                }
                                // Reset the input so it can trigger the same file again if needed
                                e.target.value = '';
                              }
                            }}
                          />
                          <div className="space-y-2">
                            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-blue-500/10 p-4 flex items-center justify-center mb-4 group-hover/upload:scale-110 group-hover/upload:from-indigo-500/20 group-hover/upload:to-blue-500/20 transition-all duration-300">
                              <FiUpload className="w-8 h-8 text-indigo-600" />
                            </div>
                            <p className="text-base text-gray-600">
                              {isProcessingFile ? (
                                <span className="inline-flex items-center gap-2 text-indigo-600 font-medium">
                                  <svg
                                    className="animate-spin w-4 h-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                  >
                                    <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                    ></circle>
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                  </svg>
                                  Processing files...
                                </span>
                              ) : (
                                <>
                                  <span className="text-indigo-600 font-semibold cursor-pointer hover:text-indigo-700 transition-colors">
                                    Click to upload
                                  </span>{' '}
                                  <span className="text-gray-400">or</span>{' '}
                                  <span className="text-indigo-600 font-semibold">
                                    drag and drop
                                  </span>
                                </>
                              )}
                            </p>
                            <p className="mt-2 text-sm text-gray-400">Maximum file size: 10MB</p>
                          </div>
                        </div>
                        <div id="fileIngestForm" style={{ marginTop: '-1px', overflow: 'hidden' }}>
                          <IngestForm
                            onContentUploaded={handleContentUploaded}
                            onProcessingStart={(type) => handleProcessingStart(type)}
                            onProcessingEnd={(type) => handleProcessingEnd(type)}
                            isProcessing={isProcessingFile}
                            defaultType="file"
                          />
                        </div>
                      </div>
                    </div>

                    {/* URL Input Card */}
                    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-emerald-100/50 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:border-emerald-200 group">
                      <div className="p-8">
                        <div className="flex items-center justify-between mb-8">
                          <div className="flex items-center space-x-4">
                            <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                              <FiGlobe className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                              Add URLs
                            </h3>
                          </div>
                          <div className="text-sm px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full font-medium">
                            Web pages & articles
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div id="urlIngestForm">
                            <IngestForm
                              onContentUploaded={handleContentUploaded}
                              onProcessingStart={(type) => handleProcessingStart(type)}
                              onProcessingEnd={(type) => handleProcessingEnd(type)}
                              isProcessing={isProcessingUrl}
                              defaultType="url"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl border border-indigo-100 overflow-hidden">
                <ContentResults
                  extractedResults={extractedResults}
                  onReset={handleReset}
                  workspaceId={workspaceId}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlay when panel is open on mobile */}
      {showSourcesPanel && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setShowSourcesPanel(false)}
        />
      )}
    </div>
  );
};

export default ContentIngestion;
