import { useState, useEffect } from 'react';
import { workflowStorage } from '../services/workflowStorage';

function WorkflowTabs({ 
  activeTabId, 
  onTabChange, 
  onTabCreate, 
  onTabDelete, 
  onTabRename 
}) {
  const [tabs, setTabs] = useState([]);
  const [editingTabId, setEditingTabId] = useState(null);
  const [editingName, setEditingName] = useState('');

  // Load tabs on component mount
  useEffect(() => {
    const loadTabs = async () => {
      try {
        const loadedTabs = await workflowStorage.getAllTabs();
        setTabs(loadedTabs);
      } catch (error) {
        console.error('Failed to load tabs:', error);
        setTabs([]); // Fallback to empty array
      }
    };
    
    loadTabs();
  }, []);

  // Handle tab creation
  const handleCreateTab = async () => {
    try {
      const newTab = await workflowStorage.createTab();
      const updatedTabs = await workflowStorage.getAllTabs();
      setTabs(updatedTabs);
      onTabCreate(newTab);
    } catch (error) {
      console.error('Failed to create tab:', error);
    }
  };

  // Handle tab deletion
  const handleDeleteTab = async (tabId) => {
    if (tabs.length <= 1) {
      alert('Cannot delete the last tab');
      return;
    }
    
    if (confirm('Are you sure you want to delete this tab? This action cannot be undone.')) {
      try {
        await workflowStorage.deleteTab(tabId);
        const updatedTabs = await workflowStorage.getAllTabs();
        setTabs(updatedTabs);
        onTabDelete(tabId);
      } catch (error) {
        console.error('Failed to delete tab:', error);
      }
    }
  };

  // Start editing tab name
  const startEditing = (tab) => {
    setEditingTabId(tab.id);
    setEditingName(tab.name);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingTabId(null);
    setEditingName('');
  };

  // Save tab name
  const saveTabName = async (tabId) => {
    if (editingName.trim()) {
      try {
        await workflowStorage.renameTab(tabId, editingName.trim());
        const updatedTabs = await workflowStorage.getAllTabs();
        setTabs(updatedTabs);
        onTabRename(tabId, editingName.trim());
      } catch (error) {
        console.error('Failed to rename tab:', error);
      }
    }
    setEditingTabId(null);
    setEditingName('');
  };

  // Handle keyboard events during editing
  const handleKeyDown = (e, tabId) => {
    if (e.key === 'Enter') {
      saveTabName(tabId);
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  return (
    <div className="border-b border-gray-400/30 bg-gray-500/15 backdrop-blur-md" style={{ fontFamily: 'sans-serif' }}>
      <div className="flex items-center px-4">
        {/* Tabs */}
        <div className="flex items-center space-x-1 flex-1 overflow-x-auto">
          {Array.isArray(tabs) && tabs.map((tab) => (
            <div
              key={tab.id}
              className={`group flex items-center min-w-0 ${
                tab.id === activeTabId
                  ? 'bg-gray-600/40 border-t border-l border-r border-gray-400/30 rounded-t-lg'
                  : 'bg-gray-600/20 hover:bg-gray-500/30'
              } transition-colors backdrop-blur-sm`}
            >
              {/* Tab Button */}
              <button
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center px-3 py-2 text-sm font-medium min-w-0 ${
                  tab.id === activeTabId
                    ? 'text-gray-100'
                    : 'text-gray-200 hover:text-gray-100'
                } transition-colors`}
              >
                {editingTabId === tab.id ? (
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => saveTabName(tab.id)}
                    onKeyDown={(e) => handleKeyDown(e, tab.id)}
                    className="bg-gray-700/50 border border-gray-400/30 rounded px-2 py-1 text-sm min-w-0 w-24 text-gray-100 backdrop-blur-sm"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span 
                    className="truncate max-w-32"
                    onDoubleClick={() => startEditing(tab)}
                    title={tab.name}
                  >
                    {tab.name}
                  </span>
                )}
              </button>

              {/* Tab Actions */}
              <div className="flex items-center space-x-1 px-1">
                {editingTabId !== tab.id && (
                  <>
                    {/* Rename Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(tab);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-500 rounded transition-all"
                      title="Rename tab"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>

                    {/* Close Button */}
                    {tabs.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTab(tab.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-600 hover:text-red-200 rounded transition-all"
                        title="Close tab"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add Tab Button */}
        <button
          onClick={handleCreateTab}
          className="ml-2 p-2 hover:bg-gray-500/30 text-gray-300 hover:text-gray-100 rounded transition-colors backdrop-blur-sm"
          title="Add new tab"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default WorkflowTabs;