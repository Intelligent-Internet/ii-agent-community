/**
 * Workflow persistence service using database with user authentication
 */

import * as authAPI from './authAPI';

const WORKFLOW_STORAGE_KEY = 'node-media-generator-workflow';
const TABS_STORAGE_KEY = 'node-media-generator-tabs';
const ACTIVE_TAB_KEY = 'node-media-generator-active-tab';
const STORAGE_VERSION = '2.0';

export const workflowStorage = {
  /**
   * Save workflow to database
   * @param {Array} nodes - React Flow nodes
   * @param {Array} edges - React Flow edges
   * @param {string} workflowName - Name for the workflow
   */
  saveWorkflow: async (nodes, edges, workflowName = 'My Workflow') => {
    try {
      const workflowData = {
        version: STORAGE_VERSION,
        timestamp: Date.now(),
        nodes: nodes.map(node => ({
          id: node.id,
          type: node.type,
          position: node.position,
          data: {
            // Save all data except the onChange function
            ...node.data,
            onChange: undefined
          }
        })),
        edges: edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle
        }))
      };

      const result = await authAPI.saveWorkflow({
        name: workflowName,
        description: `Workflow created on ${new Date().toLocaleString()}`,
        workflow_data: JSON.stringify(workflowData),
        is_public: false
      });

      return result.id; // Return the database ID
    } catch (error) {
      console.warn('Failed to save workflow to database:', error);
      // Fallback to localStorage for offline support
      try {
        localStorage.setItem('node-media-generator-workflow', JSON.stringify({
          version: STORAGE_VERSION,
          timestamp: Date.now(),
          nodes: nodes.map(node => ({
            id: node.id,
            type: node.type,
            position: node.position,
            data: { ...node.data, onChange: undefined }
          })),
          edges
        }));
        return 'localStorage_fallback';
      } catch (localError) {
        console.warn('Fallback to localStorage also failed:', localError);
        return false;
      }
    }
  },

  /**
   * Load workflow from database
   * @param {Function} handleNodeDataChange - The onChange handler for nodes
   * @param {number} workflowId - Optional specific workflow ID to load
   * @returns {Object|null} - Object with nodes and edges, or null if not found/invalid
   */
  loadWorkflow: async (handleNodeDataChange, workflowId = null) => {
    try {
      let workflow;
      
      if (workflowId) {
        // Load specific workflow (you'll need to add this endpoint)
        const workflows = await authAPI.getUserWorkflows();
        workflow = workflows.find(w => w.id === workflowId);
      } else {
        // Load the most recent workflow
        const workflows = await authAPI.getUserWorkflows();
        workflow = workflows.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))[0];
      }

      if (!workflow) {
        // Try localStorage fallback
        return workflowStorage.loadWorkflowFromLocalStorage(handleNodeDataChange);
      }

      const workflowData = JSON.parse(workflow.workflow_data);
      
      // Check version compatibility
      if (!workflowData.version) {
        console.warn('Old workflow format detected, skipping load');
        return null;
      }

      // Restore nodes with onChange handlers
      const nodes = workflowData.nodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          onChange: handleNodeDataChange
        }
      }));

      return {
        nodes,
        edges: workflowData.edges,
        workflowId: workflow.id,
        workflowName: workflow.name,
        lastModified: workflow.updated_at
      };
    } catch (error) {
      console.warn('Failed to load workflow from database:', error);
      // Fallback to localStorage
      return workflowStorage.loadWorkflowFromLocalStorage(handleNodeDataChange);
    }
  },

  /**
   * Fallback method to load from localStorage
   */
  loadWorkflowFromLocalStorage: (handleNodeDataChange) => {
    try {
      const stored = localStorage.getItem('node-media-generator-workflow');
      if (!stored) return null;

      const workflowData = JSON.parse(stored);
      
      if (!workflowData.version) {
        console.warn('Old workflow format detected, skipping load');
        return null;
      }

      const nodes = workflowData.nodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          onChange: handleNodeDataChange
        }
      }));

      return {
        nodes,
        edges: workflowData.edges,
        workflowId: 'localStorage',
        workflowName: 'Local Workflow',
        lastModified: new Date(workflowData.timestamp)
      };
    } catch (error) {
      console.warn('Failed to load workflow from localStorage:', error);
      return null;
    }
  },

  /**
   * Update existing workflow
   * @param {number} workflowId - Database ID of workflow
   * @param {Array} nodes - React Flow nodes
   * @param {Array} edges - React Flow edges
   * @param {string} workflowName - Optional new name
   */
  updateWorkflow: async (workflowId, nodes, edges, workflowName = null) => {
    try {
      const workflowData = {
        version: STORAGE_VERSION,
        timestamp: Date.now(),
        nodes: nodes.map(node => ({
          id: node.id,
          type: node.type,
          position: node.position,
          data: {
            ...node.data,
            onChange: undefined
          }
        })),
        edges: edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle
        }))
      };

      const updateData = {
        workflow_data: JSON.stringify(workflowData)
      };

      if (workflowName) {
        updateData.name = workflowName;
      }

      const result = await authAPI.updateWorkflow(workflowId, updateData);
      return result.id;
    } catch (error) {
      console.warn('Failed to update workflow in database:', error);
      return false;
    }
  },

  /**
   * Delete workflow from database
   * @param {number} workflowId - Database ID of workflow
   */
  deleteWorkflow: async (workflowId) => {
    try {
      await authAPI.deleteWorkflow(workflowId);
      return true;
    } catch (error) {
      console.warn('Failed to delete workflow from database:', error);
      return false;
    }
  },

  /**
   * Get all user workflows
   * @returns {Array} Array of workflow objects
   */
  getAllWorkflows: async () => {
    try {
      const workflows = await authAPI.getUserWorkflows();
      return workflows.map(workflow => ({
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        created: workflow.created_at,
        lastModified: workflow.updated_at,
        nodeCount: (() => {
          try {
            const data = JSON.parse(workflow.workflow_data);
            return data.nodes?.length || 0;
          } catch {
            return 0;
          }
        })(),
        edgeCount: (() => {
          try {
            const data = JSON.parse(workflow.workflow_data);
            return data.edges?.length || 0;
          } catch {
            return 0;
          }
        })()
      }));
    } catch (error) {
      console.warn('Failed to get workflows from database:', error);
      return [];
    }
  },

  /**
   * Clear saved workflow (legacy method for backward compatibility)
   */
  clearWorkflow: () => {
    try {
      localStorage.removeItem('node-media-generator-workflow');
      return true;
    } catch (error) {
      console.warn('Failed to clear workflow from localStorage:', error);
      return false;
    }
  },

  /**
   * Check if there's a saved workflow (checks both database and localStorage)
   * @returns {boolean}
   */
  hasSavedWorkflow: async () => {
    try {
      const workflows = await authAPI.getUserWorkflows();
      if (workflows.length > 0) return true;
      
      // Fallback to localStorage check
      const stored = localStorage.getItem('node-media-generator-workflow');
      return stored !== null && stored !== undefined;
    } catch (error) {
      // Fallback to localStorage check
      try {
        const stored = localStorage.getItem('node-media-generator-workflow');
        return stored !== null && stored !== undefined;
      } catch {
        return false;
      }
    }
  },

  /**
   * Get workflow info without loading it (legacy method, now uses database)
   * @returns {Object|null} - Basic info about most recent workflow
   */
  getWorkflowInfo: async () => {
    try {
      const workflows = await authAPI.getUserWorkflows();
      if (workflows.length === 0) return null;

      const mostRecent = workflows.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))[0];
      const workflowData = JSON.parse(mostRecent.workflow_data);

      return {
        id: mostRecent.id,
        name: mostRecent.name,
        timestamp: new Date(mostRecent.updated_at).getTime(),
        nodeCount: workflowData.nodes?.length || 0,
        edgeCount: workflowData.edges?.length || 0,
        version: workflowData.version
      };
    } catch (error) {
      console.warn('Failed to get workflow info from database:', error);
      // Fallback to localStorage
      try {
        const stored = localStorage.getItem('node-media-generator-workflow');
        if (!stored) return null;

        const workflowData = JSON.parse(stored);
        return {
          id: 'localStorage',
          name: 'Local Workflow',
          timestamp: workflowData.timestamp,
          nodeCount: workflowData.nodes?.length || 0,
          edgeCount: workflowData.edges?.length || 0,
          version: workflowData.version
        };
      } catch {
        return null;
      }
    }
  },

  // ===== TABS MANAGEMENT (Updated for Database) =====

  /**
   * Generate a unique tab ID (now uses database IDs)
   * @returns {string}
   */
  generateTabId: () => `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,

  /**
   * Get all tabs (now returns workflows from database)
   * @returns {Array} Array of workflow objects formatted as tabs
   */
  getAllTabs: async () => {
    try {
      const workflows = await workflowStorage.getAllWorkflows();
      return workflows.map(workflow => ({
        id: workflow.id,
        name: workflow.name,
        created: workflow.created,
        lastModified: workflow.lastModified
      }));
    } catch (error) {
      console.warn('Failed to load tabs from database:', error);
      // Fallback to localStorage tab system
      return workflowStorage.getLocalStorageTabs();
    }
  },

  /**
   * Fallback method for localStorage tabs
   */
  getLocalStorageTabs: () => {
    try {
      const stored = localStorage.getItem('node-media-generator-tabs');
      if (!stored) {
        // Migrate from old single workflow format if it exists
        const oldWorkflow = workflowStorage.getWorkflowInfo();
        if (oldWorkflow) {
          const defaultTab = {
            id: workflowStorage.generateTabId(),
            name: 'Workflow 1',
            created: Date.now(),
            lastModified: oldWorkflow.timestamp || Date.now()
          };
          const tabs = [defaultTab];
          localStorage.setItem('node-media-generator-tabs', JSON.stringify(tabs));
          workflowStorage.setActiveTab(defaultTab.id);
          return tabs;
        }
        return [];
      }
      return JSON.parse(stored);
    } catch (error) {
      console.warn('Failed to load tabs from localStorage:', error);
      return [];
    }
  },

  /**
   * Create a new tab (now creates a new workflow in database)
   * @param {string} name - Tab name
   * @returns {Object} New workflow object
   */
  createTab: async (name = 'New Workflow') => {
    try {
      const result = await authAPI.saveWorkflow({
        name,
        description: `Workflow created on ${new Date().toLocaleString()}`,
        workflow_data: JSON.stringify({
          version: STORAGE_VERSION,
          timestamp: Date.now(),
          nodes: [],
          edges: []
        }),
        is_public: false
      });

      return {
        id: result.id,
        name: result.name,
        created: result.created_at,
        lastModified: result.updated_at
      };
    } catch (error) {
      console.warn('Failed to create tab in database:', error);
      // Fallback to localStorage
      const newTab = {
        id: workflowStorage.generateTabId(),
        name,
        created: Date.now(),
        lastModified: Date.now()
      };
      const tabs = workflowStorage.getLocalStorageTabs();
      tabs.push(newTab);
      localStorage.setItem('node-media-generator-tabs', JSON.stringify(tabs));
      return newTab;
    }
  },

  /**
   * Delete a tab (now deletes workflow from database)
   * @param {string|number} tabId - Tab ID to delete
   * @returns {boolean} Success status
   */
  deleteTab: async (tabId) => {
    try {
      if (typeof tabId === 'number' || !tabId.startsWith('tab_')) {
        // Database workflow
        await authAPI.deleteWorkflow(tabId);
      } else {
        // localStorage tab
        const tabs = workflowStorage.getLocalStorageTabs();
        const filteredTabs = tabs.filter(tab => tab.id !== tabId);
        localStorage.setItem('node-media-generator-tabs', JSON.stringify(filteredTabs));
        workflowStorage.clearTabWorkflow(tabId);
      }

      // Clear active tab if it was deleted
      const activeTabId = workflowStorage.getActiveTab();
      if (activeTabId === tabId) {
        const remainingTabs = await workflowStorage.getAllTabs();
        if (remainingTabs.length > 0) {
          workflowStorage.setActiveTab(remainingTabs[0].id);
        } else {
          workflowStorage.setActiveTab(null);
        }
      }

      return true;
    } catch (error) {
      console.warn('Failed to delete tab:', error);
      return false;
    }
  },

  /**
   * Rename a tab (now updates workflow name in database)
   * @param {string|number} tabId - Tab ID
   * @param {string} newName - New tab name
   * @returns {boolean} Success status
   */
  renameTab: async (tabId, newName) => {
    try {
      if (typeof tabId === 'number' || !tabId.startsWith('tab_')) {
        // Database workflow
        await authAPI.updateWorkflow(tabId, { name: newName });
      } else {
        // localStorage tab
        const tabs = workflowStorage.getLocalStorageTabs();
        const tabIndex = tabs.findIndex(tab => tab.id === tabId);
        if (tabIndex !== -1) {
          tabs[tabIndex].name = newName;
          tabs[tabIndex].lastModified = Date.now();
          localStorage.setItem('node-media-generator-tabs', JSON.stringify(tabs));
        }
      }
      return true;
    } catch (error) {
      console.warn('Failed to rename tab:', error);
      return false;
    }
  },

  /**
   * Get active tab ID
   * @returns {string|number|null}
   */
  getActiveTab: () => {
    try {
      const activeTab = localStorage.getItem('node-media-generator-active-tab');
      // Convert to number if it's a database ID
      if (activeTab && !activeTab.startsWith('tab_')) {
        return parseInt(activeTab);
      }
      return activeTab;
    } catch (error) {
      return null;
    }
  },

  /**
   * Set active tab ID
   * @param {string|number|null} tabId - Tab ID to set as active
   */
  setActiveTab: (tabId) => {
    try {
      if (tabId) {
        localStorage.setItem('node-media-generator-active-tab', tabId.toString());
      } else {
        localStorage.removeItem('node-media-generator-active-tab');
      }
      return true;
    } catch (error) {
      console.warn('Failed to set active tab:', error);
      return false;
    }
  },

  /**
   * Save workflow for specific tab (now updates workflow in database)
   * @param {string|number} tabId - Tab ID
   * @param {Array} nodes - React Flow nodes
   * @param {Array} edges - React Flow edges
   */
  saveTabWorkflow: async (tabId, nodes, edges) => {
    try {
      if (typeof tabId === 'number' || !tabId.startsWith('tab_')) {
        // Database workflow - update existing
        return await workflowStorage.updateWorkflow(tabId, nodes, edges);
      } else {
        // localStorage tab - save locally
        const workflowData = {
          version: STORAGE_VERSION,
          timestamp: Date.now(),
          nodes: nodes.map(node => ({
            id: node.id,
            type: node.type,
            position: node.position,
            data: {
              ...node.data,
              onChange: undefined
            }
          })),
          edges: edges.map(edge => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            sourceHandle: edge.sourceHandle,
            targetHandle: edge.targetHandle
          }))
        };
        
        localStorage.setItem(`node-media-generator-workflow_${tabId}`, JSON.stringify(workflowData));
        
        // Update tab's lastModified timestamp
        const tabs = workflowStorage.getLocalStorageTabs();
        const tabIndex = tabs.findIndex(tab => tab.id === tabId);
        if (tabIndex !== -1) {
          tabs[tabIndex].lastModified = Date.now();
          localStorage.setItem('node-media-generator-tabs', JSON.stringify(tabs));
        }
        
        return true;
      }
    } catch (error) {
      console.warn('Failed to save tab workflow:', error);
      return false;
    }
  },

  /**
   * Load workflow for specific tab (now loads from database)
   * @param {string|number} tabId - Tab ID
   * @param {Function} handleNodeDataChange - The onChange handler for nodes
   * @returns {Object|null} - Object with nodes and edges, or null if not found/invalid
   */
  loadTabWorkflow: async (tabId, handleNodeDataChange) => {
    try {
      if (typeof tabId === 'number' || !tabId.startsWith('tab_')) {
        // Database workflow
        return await workflowStorage.loadWorkflow(handleNodeDataChange, tabId);
      } else {
        // localStorage tab
        let stored = localStorage.getItem(`node-media-generator-workflow_${tabId}`);
        
        if (!stored) {
          // Try migration from old storage
          const tabs = workflowStorage.getLocalStorageTabs();
          const firstTab = tabs[0];
          if (firstTab && firstTab.id === tabId) {
            stored = localStorage.getItem('node-media-generator-workflow');
            if (stored) {
              localStorage.setItem(`node-media-generator-workflow_${tabId}`, stored);
              localStorage.removeItem('node-media-generator-workflow');
            }
          }
        }
        
        if (!stored) return null;

        const workflowData = JSON.parse(stored);
        
        if (!workflowData.version) {
          console.warn('Old workflow format detected, skipping load');
          return null;
        }

        const nodes = workflowData.nodes.map(node => ({
          ...node,
          data: {
            ...node.data,
            onChange: handleNodeDataChange
          }
        }));

        return {
          nodes,
          edges: workflowData.edges,
          workflowId: tabId,
          workflowName: 'Local Workflow'
        };
      }
    } catch (error) {
      console.warn('Failed to load tab workflow:', error);
      return null;
    }
  },

  /**
   * Clear workflow for specific tab
   * @param {string|number} tabId - Tab ID
   */
  clearTabWorkflow: async (tabId) => {
    try {
      if (typeof tabId === 'number' || !tabId.startsWith('tab_')) {
        // Database workflow - update with empty workflow
        return await workflowStorage.updateWorkflow(tabId, [], []);
      } else {
        // localStorage tab
        localStorage.removeItem(`node-media-generator-workflow_${tabId}`);
        return true;
      }
    } catch (error) {
      console.warn('Failed to clear tab workflow:', error);
      return false;
    }
  },

  /**
   * Initialize tabs system if none exist
   * @returns {Object|null} First tab or null
   */
  initializeTabs: async () => {
    try {
      const tabs = await workflowStorage.getAllTabs();
      if (tabs.length === 0) {
        const firstTab = await workflowStorage.createTab('Workflow 1');
        workflowStorage.setActiveTab(firstTab.id);
        return firstTab;
      }
      
      // Ensure there's an active tab set
      const activeTabId = workflowStorage.getActiveTab();
      if (!activeTabId || !tabs.find(tab => tab.id === activeTabId)) {
        workflowStorage.setActiveTab(tabs[0].id);
        return tabs[0];
      }
      
      return tabs.find(tab => tab.id === activeTabId);
    } catch (error) {
      console.warn('Failed to initialize tabs from database, using localStorage fallback:', error);
      // Fallback to localStorage system
      const tabs = workflowStorage.getLocalStorageTabs();
      if (tabs.length === 0) {
        const firstTab = {
          id: workflowStorage.generateTabId(),
          name: 'Workflow 1',
          created: Date.now(),
          lastModified: Date.now()
        };
        localStorage.setItem('node-media-generator-tabs', JSON.stringify([firstTab]));
        workflowStorage.setActiveTab(firstTab.id);
        return firstTab;
      }
      
      const activeTabId = workflowStorage.getActiveTab();
      if (!activeTabId || !tabs.find(tab => tab.id === activeTabId)) {
        workflowStorage.setActiveTab(tabs[0].id);
        return tabs[0];
      }
      
      return tabs.find(tab => tab.id === activeTabId);
    }
  }
};