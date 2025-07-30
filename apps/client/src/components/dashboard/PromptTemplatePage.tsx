import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FiFileText } from 'react-icons/fi';
import ReactModal from 'react-modal';
import { useLocation, useNavigate } from 'react-router-dom';
import { useContent } from '../../hooks/useContent';
import { useWorkspace } from '../../hooks/useWorkspace';
import { API } from '../../utils/constants';

// Add type for workspace type
interface WorkspaceType {
  id: number;
  name: string;
  is_default: boolean;
  sections: Array<{
    id: number;
    name: string;
    order: number;
    prompt?: string;
  }>;
}

const PromptTemplatePage: React.FC = () => {
  const [selectedType, setSelectedType] = useState<WorkspaceType | null>(null);
  const [selectedSection, setSelectedSection] = useState<{
    id: number;
    name: string;
    prompt?: string;
  } | null>(null);
  const [editablePrompt, setEditablePrompt] = useState('');
  const [saving, setSaving] = useState(false);
  const userInputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { savePromptToWorkspace } = useContent();
  const [workspaceTypes, setWorkspaceTypes] = useState<WorkspaceType[]>([]);
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionPrompt, setNewSectionPrompt] = useState('');
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('');
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [typesLoading, setTypesLoading] = useState(false);
  const { workspaces, fetchWorkspaces } = useWorkspace();

  useEffect(() => {
    fetchWorkspaces();
    fetchWorkspaceTypes();
  }, []);

  // Fetch workspace types from backend
  const fetchWorkspaceTypes = async () => {
    setTypesLoading(true);
    try {
      const response = await fetch(`${API.BASE_URL()}/api/prompt-templates/types`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (response.ok) {
        const types = await response.json();
        setWorkspaceTypes(types);
      } else {
        console.error('Failed to fetch workspace types');
        toast.error('Failed to fetch workspace types');
      }
    } catch (error) {
      console.error('Error fetching workspace types:', error);
      toast.error('Error fetching workspace types');
    } finally {
      setTypesLoading(false);
    }
  };

  // Helper to fetch all sections and their prompts for a workspace type
  const fetchSectionsWithPrompts = async (typeId: number) => {
    setSectionsLoading(true);
    try {
      const sectionsResp = await fetch(
        `${API.BASE_URL()}/api/prompt-templates/types/${typeId}/sections`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        },
      );
      if (!sectionsResp.ok) {
        throw new Error('Failed to fetch sections');
      }
      const sections = await sectionsResp.json();
      return sections;
    } catch (error) {
      console.error('Error fetching sections:', error);
      toast.error('Failed to fetch sections');
      return [];
    } finally {
      setSectionsLoading(false);
    }
  };

  const handleAddType = async () => {
    if (!newTypeName.trim()) {
      toast.error('Workspace type name is required.');
      return;
    }

    try {
      const response = await fetch(`${API.BASE_URL()}/api/prompt-templates/types`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          name: newTypeName.trim(),
          is_default: false,
        }),
      });

      if (response.ok) {
        const newType = await response.json();
        setWorkspaceTypes([...workspaceTypes, newType]);
        toast.success('Workspace type added!');
        setNewTypeName('');
        setShowAddTypeModal(false);
      } else {
        const error = await response.text();
        toast.error(error || 'Failed to add workspace type');
      }
    } catch (error) {
      console.error('Error adding workspace type:', error);
      toast.error('Failed to add workspace type');
    }
  };

  // Fetch and set sections+prompts for the selected type
  const loadSectionsForType = async (typeObj: WorkspaceType) => {
    if (!typeObj || !typeObj.id) return;

    const sectionsWithPrompts = await fetchSectionsWithPrompts(typeObj.id);
    const updatedType = {
      ...typeObj,
      sections: sectionsWithPrompts,
    };

    setWorkspaceTypes((prev) => prev.map((t) => (t.id === typeObj.id ? updatedType : t)));
    setSelectedType(updatedType);
  };

  // On type selection, fetch sections+prompts from backend
  useEffect(() => {
    if (selectedType && selectedType.id) {
      loadSectionsForType(selectedType);
    }
  }, [selectedType?.id]);

  // Pre-select workspace and type from navigation state
  useEffect(() => {
    if (location.state?.workspaceId) {
      setSelectedWorkspaceId(String(location.state.workspaceId));
    }
    if (location.state?.type && workspaceTypes.length > 0) {
      const typeObj = workspaceTypes.find((t) => t.name === location.state.type);
      if (typeObj) setSelectedType(typeObj);
    }
  }, [location.state, workspaceTypes]);

  useEffect(() => {
    setEditablePrompt(selectedSection ? selectedSection.prompt || '' : '');
  }, [selectedSection]);

  // Update handleSaveToWorkspace to use selectedWorkspaceId if location.state?.workspaceId is not present
  const handleSaveToWorkspace = async () => {
    if (!selectedType || !selectedSection) {
      toast.error('Please select a type and section');
      return;
    }
    // Prefer navigation state, fallback to selectedWorkspaceId
    let workspaceId = location.state?.workspaceId || selectedWorkspaceId;
    let workspace = workspaces.find((w) => String(w.id) === String(workspaceId));
    if (!workspace) {
      toast.error('Please select a workspace');
      return;
    }
    setSaving(true);
    try {
      const title = `${selectedType.name} - ${selectedSection.name}`;
      await savePromptToWorkspace(workspace.id, title, editablePrompt, []);
      toast.success('Prompt added to workspace');
      await fetchWorkspaces();
      // Reset section and prompt for new entry
      setSelectedSection(null);
      setEditablePrompt('');
    } catch (err) {
      console.error('Failed to save prompt:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to save prompt to workspace');
    } finally {
      setSaving(false);
    }
  };

  // Place this above the return statement
  const handleAddSection = async () => {
    if (selectedType && newSectionName.trim() && newSectionPrompt.trim()) {
      try {
        // 1. Create the section
        const response = await fetch(
          `${API.BASE_URL()}/api/prompt-templates/types/${selectedType.id}/sections`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({
              name: newSectionName.trim(),
              order: selectedType.sections.length,
            }),
          },
        );

        if (!response.ok) {
          const error = await response.text();
          toast.error(error || 'Failed to add section');
          return;
        }

        const sectionData = await response.json();
        const sectionId = sectionData.id;

        // 2. Create the prompt for the section
        const promptResp = await fetch(
          `${API.BASE_URL()}/api/prompt-templates/sections/${sectionId}/prompts`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({
              prompt: newSectionPrompt.trim(),
              is_default: true,
            }),
          },
        );

        if (!promptResp.ok) {
          const error = await promptResp.text();
          toast.error(error || 'Failed to add prompt');
          return;
        }

        // 3. Refresh the sections for this type
        await loadSectionsForType(selectedType);

        setNewSectionName('');
        setNewSectionPrompt('');
        setShowAddSectionModal(false);
        toast.success('Section and prompt added!');
      } catch (err) {
        console.error('Failed to add section or prompt:', err);
        toast.error('Failed to add section or prompt');
      }
    } else {
      toast.error('Section name and prompt are required.');
    }
  };

  // Seed default data
  const handleSeedData = async () => {
    try {
      const response = await fetch(`${API.BASE_URL()}/api/prompt-templates/seed`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message);
        await fetchWorkspaceTypes();
      } else {
        toast.error('Failed to seed data');
      }
    } catch (error) {
      console.error('Error seeding data:', error);
      toast.error('Failed to seed data');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-primary/5 to-transparent border-b border-gray-100 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FiFileText className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                  Prompt Templates
                </h2>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowAddTypeModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transform transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm"
                >
                  <span className="mr-2">+</span>
                  Add Type
                </button>
                <button
                  onClick={handleSeedData}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transform transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm"
                >
                  <span className="mr-2">+</span>
                  Seed Demo Data
                </button>
              </div>
            </div>
          </div>

          {/* Workspace Type Card Selector */}
          <div className="px-8 py-6">
            <div className="flex flex-wrap gap-4">
              {typesLoading ? (
                <div className="col-span-full text-center py-8">
                  <div className="animate-pulse inline-block">
                    <div className="h-6 w-48 bg-gray-200 rounded-full"></div>
                  </div>
                </div>
              ) : workspaceTypes.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-500 mb-2">No workspace types found.</p>
                  <p className="text-sm text-gray-400">
                    Click "Seed Demo Data" to add default types.
                  </p>
                </div>
              ) : (
                <>
                  {workspaceTypes.map((type) => (
                    <button
                      key={type.id}
                      className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 hover:shadow-md min-w-[200px]
                        ${
                          selectedType && selectedType.id === type.id
                            ? 'bg-gradient-to-r from-primary to-primary-dark text-white border-transparent shadow-lg'
                            : 'bg-white text-gray-800 border-gray-100 hover:border-primary/30 hover:bg-primary/5'
                        }
                      `}
                      onClick={() => {
                        setSelectedType(type);
                        setSelectedSection(null);
                      }}
                    >
                      <div
                        className={`p-2 rounded-lg transition-colors duration-200 
                        ${
                          selectedType && selectedType.id === type.id ? 'bg-white/20' : 'bg-gray-50'
                        }`}
                      >
                        <FiFileText
                          className={`w-5 h-5 ${selectedType && selectedType.id === type.id ? 'text-white' : 'text-gray-500'}`}
                        />
                      </div>
                      <span className="font-medium text-sm">{type.name}</span>
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Section Selector for Selected Type */}
          {selectedType && (
            <div className="border-t border-gray-100 bg-gray-50/50">
              <div className="px-8 py-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-500">Sections</h3>
                  <button
                    className="inline-flex items-center px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors duration-200"
                    onClick={() => setShowAddSectionModal(true)}
                    type="button"
                  >
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    Add Section
                  </button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {sectionsLoading ? (
                    <div className="w-full py-4">
                      <div className="animate-pulse flex space-x-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-8 w-24 bg-gray-200 rounded-full"></div>
                        ))}
                      </div>
                    </div>
                  ) : (selectedType?.sections?.length ?? 0) === 0 ? (
                    <div className="w-full py-4 text-center text-gray-500">
                      No sections found for this type.
                    </div>
                  ) : (
                    selectedType?.sections?.map((section) => (
                      <button
                        key={section.id}
                        className={`group px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm whitespace-nowrap
                          ${
                            selectedSection && selectedSection.id === section.id
                              ? 'bg-primary text-white shadow-md shadow-primary/20 transform scale-105'
                              : 'bg-white text-gray-700 border border-gray-200 hover:border-primary/30 hover:bg-primary/5 hover:text-primary'
                          }
                        `}
                        onClick={() => {
                          setSelectedSection(section);
                          setEditablePrompt(section.prompt || '');
                        }}
                      >
                        {section.name}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Prompt for Selected Section */}
          {selectedType && selectedSection ? (
            <div className="px-8 py-6 bg-white">
              <div className="max-w-4xl mx-auto">
                <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
                        {selectedSection.name}
                      </h3>
                      <div className="text-sm text-gray-500">{selectedType.name}</div>
                    </div>
                    <div className="space-y-4">
                      <textarea
                        value={editablePrompt}
                        onChange={(e) => setEditablePrompt(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-primary focus:border-primary transition-shadow duration-200 shadow-sm hover:shadow-md"
                        rows={8}
                        placeholder="Edit the prompt for this section..."
                      />
                      {/* Workspace selector if not navigated from a workspace */}
                      {!location.state?.workspaceId && (
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Workspace
                          </label>
                          <select
                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 focus:ring-2 focus:ring-primary focus:border-primary appearance-none cursor-pointer hover:border-primary/30 transition-colors"
                            value={selectedWorkspaceId}
                            onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                          >
                            <option value="">Choose a workspace...</option>
                            {workspaces.map((ws) => (
                              <option key={ws.id} value={ws.id}>
                                {ws.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div className="flex justify-end">
                        <button
                          className={`inline-flex items-center px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 transform
                            ${
                              saving || (!location.state?.workspaceId && !selectedWorkspaceId)
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-primary text-white hover:bg-primary-dark hover:scale-105 active:scale-95 shadow-sm hover:shadow-md'
                            }`}
                          onClick={handleSaveToWorkspace}
                          disabled={
                            saving || (!location.state?.workspaceId && !selectedWorkspaceId)
                          }
                        >
                          {saving ? (
                            <>
                              <svg
                                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                ></path>
                              </svg>
                              Saving...
                            </>
                          ) : (
                            <>
                              <svg
                                className="w-4 h-4 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                                />
                              </svg>
                              Save to Workspace
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="px-8 py-16 text-center">
              <div className="max-w-md mx-auto">
                <div className="bg-gray-50 rounded-xl p-8 border border-gray-100">
                  <div className="text-gray-400 mb-4">
                    <svg
                      className="w-12 h-12 mx-auto"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-600 text-lg">
                    {selectedType
                      ? 'Select a section to view its prompt template.'
                      : 'Choose a workspace type to get started.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Add Workspace Type Modal */}
        {showAddTypeModal && (
          <ReactModal
            isOpen={showAddTypeModal}
            onRequestClose={() => setShowAddTypeModal(false)}
            contentLabel="Add Workspace Type"
            ariaHideApp={false}
            className="fixed inset-0 flex items-center justify-center z-50"
            overlayClassName="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm"
          >
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md transform transition-all">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Add Workspace Type</h2>
                  <button
                    onClick={() => {
                      setShowAddTypeModal(false);
                      setNewTypeName('');
                    }}
                    className="text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="typeName"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Type Name
                    </label>
                    <input
                      id="typeName"
                      type="text"
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-primary focus:border-primary transition-shadow duration-200"
                      placeholder="Enter workspace type name..."
                      value={newTypeName}
                      onChange={(e) => setNewTypeName(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
                <button
                  className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-200 font-medium transition-colors duration-200"
                  onClick={() => {
                    setShowAddTypeModal(false);
                    setNewTypeName('');
                  }}
                >
                  Cancel
                </button>
                <button
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 transform
                    ${
                      !newTypeName.trim()
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-primary text-white hover:bg-primary-dark hover:scale-105 active:scale-95 shadow-sm hover:shadow-md'
                    }`}
                  onClick={handleAddType}
                  disabled={!newTypeName.trim()}
                >
                  Add Type
                </button>
              </div>
            </div>
          </ReactModal>
        )}

        {/* Add Section Modal */}
        {showAddSectionModal && (
          <ReactModal
            isOpen={showAddSectionModal}
            onRequestClose={() => setShowAddSectionModal(false)}
            contentLabel="Add Section"
            ariaHideApp={false}
            className="fixed inset-0 flex items-center justify-center z-50"
            overlayClassName="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm"
          >
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl transform transition-all">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Add New Section</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Adding to workspace type: {selectedType?.name}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowAddSectionModal(false);
                      setNewSectionName('');
                      setNewSectionPrompt('');
                    }}
                    className="text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  <div>
                    <label
                      htmlFor="sectionName"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Section Name
                    </label>
                    <input
                      id="sectionName"
                      type="text"
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-primary focus:border-primary transition-shadow duration-200"
                      placeholder="Enter a descriptive name for this section..."
                      value={newSectionName}
                      onChange={(e) => setNewSectionName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="promptTemplate"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Prompt Template
                    </label>
                    <div className="relative">
                      <textarea
                        id="promptTemplate"
                        className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-primary focus:border-primary transition-shadow duration-200 min-h-[200px]"
                        placeholder="Write your prompt template here..."
                        value={newSectionPrompt}
                        onChange={(e) => setNewSectionPrompt(e.target.value)}
                        rows={8}
                      />
                      <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                        {newSectionPrompt.length} characters
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
                <button
                  className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-200 font-medium transition-colors duration-200"
                  onClick={() => {
                    setShowAddSectionModal(false);
                    setNewSectionName('');
                    setNewSectionPrompt('');
                  }}
                >
                  Cancel
                </button>
                <button
                  className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200 transform
                    ${
                      !newSectionName.trim() || !newSectionPrompt.trim()
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-primary text-white hover:bg-primary-dark hover:scale-105 active:scale-95 shadow-sm hover:shadow-md'
                    }`}
                  onClick={handleAddSection}
                  disabled={!newSectionName.trim() || !newSectionPrompt.trim()}
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Add Section
                </button>
              </div>
            </div>
          </ReactModal>
        )}
      </div>
    </div>
  );
};

export default PromptTemplatePage;
