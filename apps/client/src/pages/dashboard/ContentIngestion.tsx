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
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSourcesPanel, setShowSourcesPanel] = useState(false);
  const location = useLocation();
  const params = useParams<{ id?: string }>();
  // Try to get workspaceId from params or location.state
  const workspaceId = params.id || location.state?.workspaceId;

  const handleProcessingStart = () => {
    setIsProcessing(true);
  };

  const handleProcessingEnd = () => {
    setIsProcessing(false);
  };

  const handleContentUploaded = (results: ExtractedContent[]) => {
    setExtractedResults(results); // Only keep the latest results, no duplicates
    setIsProcessing(false);
  };

  const handleReset = () => {
    setExtractedResults([]);
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 relative">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1e293b',
            color: '#fff',
            borderRadius: '0.75rem',
            padding: '1rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
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
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900">Content Ingestion</h2>
                    <p className="mt-2 text-gray-600">
                      Upload files or add URLs to process content
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* File Upload Card */}
                    <div className="bg-white rounded-2xl shadow-xl border border-indigo-100 overflow-hidden hover:shadow-2xl transition-shadow duration-300">
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-indigo-50 rounded-lg">
                              <FiUpload className="w-5 h-5 text-indigo-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Upload Files</h3>
                          </div>
                          <div className="text-xs text-gray-500">PDF, DOC, DOCX up to 10MB</div>
                        </div>
                        <div className="relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 hover:bg-indigo-50/50 hover:border-indigo-300 border-gray-200">
                          <input
                            type="file"
                            id="fileInput"
                            multiple
                            className="hidden"
                            accept=".pdf,.doc,.docx"
                            disabled={isProcessing}
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
                                const changeEvent = new CustomEvent('fileSelected', {
                                  detail: { files },
                                });
                                ingestForm?.dispatchEvent(changeEvent);
                              }
                            }}
                          />
                          <div className="space-y-2">
                            <div className="mx-auto w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mb-3">
                              <FiUpload className="w-6 h-6 text-indigo-600" />
                            </div>
                            <p className="text-sm text-gray-600">
                              {isProcessing ? (
                                'Processing files...'
                              ) : (
                                <>
                                  <span className="text-indigo-600 font-medium cursor-pointer">
                                    Click to upload
                                  </span>{' '}
                                  or drag and drop
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                        <div id="fileIngestForm" style={{ marginTop: '-1px', overflow: 'hidden' }}>
                          <IngestForm
                            onContentUploaded={handleContentUploaded}
                            onProcessingStart={handleProcessingStart}
                            onProcessingEnd={handleProcessingEnd}
                            isProcessing={isProcessing}
                            defaultType="file"
                          />
                        </div>
                      </div>
                    </div>

                    {/* URL Input Card */}
                    <div className="bg-white rounded-2xl shadow-xl border border-indigo-100 overflow-hidden hover:shadow-2xl transition-shadow duration-300">
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-green-50 rounded-lg">
                              <FiGlobe className="w-5 h-5 text-green-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Add URLs</h3>
                          </div>
                          <div className="text-xs text-gray-500">Web pages & articles</div>
                        </div>
                        <div className="space-y-4">
                          <div id="urlIngestForm">
                            <IngestForm
                              onContentUploaded={handleContentUploaded}
                              onProcessingStart={handleProcessingStart}
                              onProcessingEnd={handleProcessingEnd}
                              isProcessing={isProcessing}
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
