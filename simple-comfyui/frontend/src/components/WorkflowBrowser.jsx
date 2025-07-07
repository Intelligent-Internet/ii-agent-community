import React, { useState, useEffect } from 'react';
import { workflowStorage } from '../services/workflowStorage';
import { useAuth } from '../context/AuthContext';

const WorkflowBrowser = ({ onWorkflowLoad, onClose }) => {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      setError(null);
      const userWorkflows = await workflowStorage.getAllWorkflows();
      setWorkflows(userWorkflows);
    } catch (err) {
      setError('Failed to load workflows');
      console.error('Failed to load workflows:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadWorkflow = async (workflow) => {
    try {
      const workflowData = await workflowStorage.loadWorkflow(
        (nodeId, newData) => {}, // Placeholder handler
        workflow.id
      );
      if (workflowData && onWorkflowLoad) {
        onWorkflowLoad(workflowData);
      }
      onClose();
    } catch (err) {
      setError('Failed to load selected workflow');
      console.error('Failed to load workflow:', err);
    }
  };

  const handleDeleteWorkflow = async (workflowId, workflowName) => {
    if (!confirm(`Are you sure you want to delete "${workflowName}"?`)) {
      return;
    }

    try {
      await workflowStorage.deleteWorkflow(workflowId);
      await loadWorkflows(); // Refresh the list
    } catch (err) {
      setError('Failed to delete workflow');
      console.error('Failed to delete workflow:', err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h2 className="text-xl font-bold mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-4">
            Please log in to access your saved workflows.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] mx-4 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Your Workflows</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-gray-600">Loading workflows...</div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        {!loading && !error && workflows.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <p className="text-lg mb-2">No workflows found</p>
              <p>Create your first workflow in the editor!</p>
            </div>
          </div>
        )}

        {!loading && workflows.length > 0 && (
          <div className="flex-1 overflow-auto">
            <div className="grid gap-4">
              {workflows.map((workflow) => (
                <div
                  key={workflow.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedWorkflow?.id === workflow.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedWorkflow(workflow)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">
                        {workflow.name}
                      </h3>
                      {workflow.description && (
                        <p className="text-gray-600 text-sm mb-2">
                          {workflow.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{workflow.nodeCount} nodes</span>
                        <span>{workflow.edgeCount} connections</span>
                        <span>Modified: {formatDate(workflow.lastModified)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLoadWorkflow(workflow);
                        }}
                        className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                      >
                        Load
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteWorkflow(workflow.id, workflow.name);
                        }}
                        className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Close
          </button>
          {selectedWorkflow && (
            <button
              onClick={() => handleLoadWorkflow(selectedWorkflow)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Load Selected Workflow
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkflowBrowser; 