/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiCalendar, FiEye, FiFile, FiFileText, FiGlobe, FiTrash, FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { API } from '../../utils/constants';

type ContentSource = {
  id: number;
  name: string;
  type: 'pdf' | 'docx' | 'web';
  source_url: string;
  created_at: string;
};

const ContentSources: React.FC = () => {
  const [sources, setSources] = useState<ContentSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<'all' | 'pdf' | 'docx' | 'web'>('all');
  const [deleteTarget, setDeleteTarget] = useState<null | { id: number; name: string }>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    try {
      const response = await fetch(
        `${API.BASE_URL()}${API.ENDPOINTS.SOURCES.BASE_URL()}${API.ENDPOINTS.SOURCES.LIST()}`,
      );
      if (response.ok) {
        const data = await response.json();
        setSources(data.sources || []);
      }
    } catch (error) {
      console.error('Error fetching sources:', error);
      toast.error('Failed to load content sources');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSource = async (sourceId: number, sourceName: string) => {
    setDeleteTarget({ id: sourceId, name: sourceName });
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FiFile className="w-5 h-5 text-red-500" />;
      case 'docx':
        return <FiFileText className="w-5 h-5 text-blue-500" />;
      case 'web':
        return <FiGlobe className="w-5 h-5 text-green-500" />;
      default:
        return <FiFile className="w-5 h-5 text-gray-500" />;
    }
  };

  const truncateName = (name: string, maxLength: number = 30) => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + '...';
  };

  const filteredSources = sources.filter(
    (source) => selectedType === 'all' || source.type === selectedType,
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black mb-3">Content Sources</h1>
        <p className="text-neutral-600">View and manage all your extracted content sources</p>
      </div>

      <div className="flex flex-row flex-wrap gap-2 mb-6 bg-gray-100 p-1 rounded-lg w-full">
        {[
          { key: 'all', label: 'All Sources' },
          { key: 'pdf', label: 'PDF' },
          { key: 'docx', label: 'DOCX' },
          { key: 'web', label: 'Web' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedType(tab.key as any)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedType === tab.key
                ? 'bg-white text-primary shadow-sm'
                : 'text-neutral-600 hover:text-neutral-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredSources.length === 0 ? (
        <div className="text-center py-12">
          <FiFile className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No content sources found</h3>
          <p className="text-gray-500 mb-4">
            {selectedType === 'all'
              ? "You haven't uploaded any content sources yet."
              : `No ${selectedType.toUpperCase()} sources found.`}
          </p>
          <button
            onClick={() => navigate('/dashboard/content-ingestion')}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Upload Content
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4 w-full">
          {filteredSources.map((source) => (
            <div
              key={source.id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-3 min-w-0 flex-1">
                  <div className="flex-shrink-0 mt-1">{getSourceIcon(source.type)}</div>
                  <div className="min-w-0 flex-1">
                    <h3
                      className="font-semibold text-black leading-tight break-words"
                      title={source.name}
                    >
                      {truncateName(source.name)}
                    </h3>
                    <span className="inline-block text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full mt-1">
                      {source.type.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-1 ml-2 flex-shrink-0">
                  <button
                    onClick={() => navigate(`/dashboard/content-sources/${source.id}`)}
                    className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    title="View details"
                  >
                    <FiEye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteSource(source.id, source.name)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete source"
                  >
                    <FiTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center text-sm text-gray-500 mb-4">
                <FiCalendar className="w-4 h-4 mr-2" />
                {new Date(source.created_at).toLocaleDateString()}
              </div>

              <button
                onClick={() => navigate(`/dashboard/content-sources/${source.id}`)}
                className="w-full bg-primary/10 text-primary py-2 px-4 rounded-lg hover:bg-primary/20 transition-colors text-sm font-medium"
              >
                View Content
              </button>
            </div>
          ))}
        </div>
      )}
 
{deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-black">Delete Content Source</h3>
              <button
                onClick={() => setDeleteTarget(null)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-6 text-neutral-700">
              Are you sure you want to delete <span className="font-semibold">{deleteTarget.name}</span>? This action cannot be undone.
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-neutral-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    const response = await fetch(
                      `${API.BASE_URL()}${API.ENDPOINTS.SOURCES.BASE_URL()}${API.ENDPOINTS.SOURCES.DELETE_SOFT(deleteTarget.id)}`,
                      { method: 'DELETE' },
                    );
                    if (response.ok) {
                      setSources((prev) => prev.filter((s) => s.id !== deleteTarget.id));
                      toast.success('Content source deleted');
                    } else {
                      toast.error('Failed to delete content source');
                    }
                  } catch (error) {
                    toast.error('Failed to delete content source');
                  } finally {
                    setDeleteTarget(null);
                  }
                }}
                className="flex-1 py-3 px-4 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
 
    </div>
  );
};

export default ContentSources;
