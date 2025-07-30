import React, { useEffect } from 'react';
import { FiArrowRight, FiClock, FiEdit, FiFileText, FiFolder, FiPlus, FiTag } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useDashboard } from '../../hooks/useDashboard';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { dashboardData, loading, error, fetchDashboardData } = useDashboard();

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="h-full overflow-y-auto bg-gray-50">
        <div className="p-8">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full overflow-y-auto bg-gray-50">
        <div className="p-8">
          <div className="text-center py-20">
            <p className="text-red-600">Error loading dashboard: {error}</p>
            <button
              onClick={fetchDashboardData}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Update the stats cards
  const stats = [
    {
      label: 'Workspaces',
      value: dashboardData?.stats.total_workspaces?.toString() || '0',
      icon: FiFolder,
      color: 'text-blue-700',
      bgColor: 'bg-blue-100',
    },
    {
      label: 'Content Chunks',
      value: dashboardData?.stats.total_sections?.toString() || '0',
      icon: FiFileText,
      color: 'text-blue-700',
      bgColor: 'bg-blue-100',
    },
    {
      label: 'Saved Prompts',
      value: dashboardData?.stats.total_prompts?.toString() || '0',
      icon: FiEdit,
      color: 'text-blue-700',
      bgColor: 'bg-blue-100',
    },
    {
      label: 'Generated Content',
      value: dashboardData?.stats.total_generated_content?.toString() || '0',
      icon: FiTag,
      color: 'text-blue-700',
      bgColor: 'bg-blue-100',
    },
  ];

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMilliseconds = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMilliseconds / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      const diffInWeeks = Math.floor(diffInDays / 7);
      return `${diffInWeeks} weeks ago`;
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      {/* Updated Top Navigation Bar */}
      <div className="w-full bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
              <div className="flex space-x-4">
                <button
                  onClick={() => navigate('/dashboard/workspaces')}
                  className="px-4 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <FiFolder className="inline-block w-5 h-5 mr-2" />
                  Workspaces
                </button>
                <button
                  onClick={() => navigate('/dashboard/content-ingestion')}
                  className="px-4 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <FiFileText className="inline-block w-5 h-5 mr-2" />
                  Content
                </button>
                <button
                  onClick={() => navigate('/dashboard/prompts')}
                  className="px-4 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <FiEdit className="inline-block w-5 h-5 mr-2" />
                  Prompts
                </button>
              </div>
            </div>
            <button
              onClick={fetchDashboardData}
              className="px-4 py-2 text-base font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Stats Grid - Larger size */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div 
              key={index} 
              className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-lg bg-blue-200`}>
                  <stat.icon className={`w-6 h-6 text-blue-700`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue-900 uppercase tracking-wide">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-blue-700 mt-1">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions Section */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 shadow-sm mb-8">
          <div className="p-5 border-b border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900">Quick Actions</h3>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/dashboard/workspaces?create=1')}
              className="p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors transform hover:scale-[1.02]"
            >
              <div className="flex items-center">
                <FiPlus className="w-5 h-5 mr-3" />
                <span className="text-base font-medium">New Workspace</span>
              </div>
            </button>
            <button
              onClick={() => navigate('/dashboard/content-ingestion')}
              className="p-4 bg-blue-50 text-blue-800 rounded-xl hover:bg-blue-100 transition-colors transform hover:scale-[1.02] border border-blue-300"
            >
              <div className="flex items-center">
                <FiFolder className="w-5 h-5 mr-3" />
                <span className="text-base font-medium">Upload Content</span>
              </div>
            </button>
            <button
              onClick={() => navigate('/dashboard/prompt-templates')}
              className="p-4 bg-blue-50 text-blue-800 rounded-xl hover:bg-blue-100 transition-colors transform hover:scale-[1.02] border border-blue-300"
            >
              <div className="flex items-center">
                <FiEdit className="w-5 h-5 mr-3" />
                <span className="text-base font-medium">View Prompts</span>
              </div>
            </button>
          </div>
        </div>

        {/* Updated Recent Workspaces */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 shadow-sm">
          <div className="p-5 border-b border-blue-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-blue-900">Recent Workspaces</h2>
            <button
              onClick={() => navigate('/dashboard/workspaces')}
              className="text-base text-blue-700 hover:text-blue-800"
            >
              View all
            </button>
          </div>
          <div className="p-5">
            {dashboardData?.recent_workspaces && dashboardData.recent_workspaces.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {dashboardData.recent_workspaces.map((ws) => (
                  <div
                    key={ws.id}
                    onClick={() => navigate(`/dashboard/workspaces/${ws.id}`)}
                    className="p-4 bg-white border border-blue-200 rounded-xl hover:border-blue-400 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md group hover:bg-blue-50"
                  >
                    <h3 className="font-medium text-blue-900 text-lg mb-2 group-hover:text-blue-700">
                      {ws.name}
                    </h3>
                    <p className="text-sm text-blue-700 mb-3">Client: {ws.client}</p>
                    <div className="flex items-center justify-between text-sm text-blue-600">
                      <span className="flex items-center">
                        <FiClock className="w-4 h-4 mr-2" />
                        {ws.last_used_at ? formatTimeAgo(ws.last_used_at) : 'Never used'}
                      </span>
                      <FiArrowRight className="w-4 h-4 group-hover:text-blue-700" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FiFolder className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No recently used workspaces
                </h3>
                <p className="text-gray-500 mb-6">Open a workspace to see it appear here</p>
                <button
                  onClick={() => navigate('/dashboard/workspaces?create=1')}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  Create Workspace
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
