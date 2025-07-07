import { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';

import TextNode from '../components/nodes/TextNode';
import ImageNode from '../components/nodes/ImageNode';
import VideoNode from '../components/nodes/VideoNode';
import WorkflowTabs from '../components/WorkflowTabs';
import { apiService } from '../services/api';
import { workflowStorage } from '../services/workflowStorage';

// Define custom node types
const nodeTypes = {
  text: TextNode,
  image: ImageNode,
  video: VideoNode,
};

// Helper function to generate unique IDs
const generateId = () => `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

function WorkflowEditor() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [runningTabs, setRunningTabs] = useState(new Set()); // Track running state per tab
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidation, setLastValidation] = useState(null);
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Tabs state
  const [activeTabId, setActiveTabId] = useState(null);
  const [tabs, setTabs] = useState([]);
  
  // Store viewport state per tab
  const [tabViewports, setTabViewports] = useState(new Map());
  const [isSwitchingTabs, setIsSwitchingTabs] = useState(false);

  // Handle node data changes - now scoped to current tab
  const handleNodeDataChange = useCallback((nodeId, newData) => {
    // Only update nodes if we're dealing with the active tab
    if (!activeTabId) return;
    
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...newData } }
          : node
      )
    );
  }, [setNodes, activeTabId]);

  // Initialize tabs system on component mount
  useEffect(() => {
    const initializeTabs = async () => {
      try {
        console.log('Initializing tabs...');
        const activeTab = await workflowStorage.initializeTabs();
        console.log('Active tab:', activeTab);
        
        if (activeTab) {
          setActiveTabId(activeTab.id);
          console.log('Loading workflow for tab:', activeTab.id);
          const savedWorkflow = await workflowStorage.loadTabWorkflow(activeTab.id, handleNodeDataChange);
          console.log('Loaded workflow:', savedWorkflow);
          
          if (savedWorkflow) {
            setNodes(savedWorkflow.nodes);
            setEdges(savedWorkflow.edges);
          }
        }
        
        const allTabs = await workflowStorage.getAllTabs();
        console.log('All tabs loaded:', allTabs);
        setTabs(allTabs);
        setIsLoaded(true);
        console.log('Tab initialization complete');
      } catch (error) {
        console.error('Failed to initialize tabs:', error);
        setIsLoaded(true);
      }
    };

    initializeTabs();
  }, [handleNodeDataChange, setNodes, setEdges]);

  // Auto-save workflow when nodes or edges change (but not on initial load)
  useEffect(() => {
    if (isLoaded && activeTabId) {
      // Debounce the save operation to avoid too many API calls
      const timeoutId = setTimeout(() => {
        workflowStorage.saveTabWorkflow(activeTabId, nodes, edges).catch(error => {
          console.error('Failed to auto-save workflow:', error);
        });
      }, 1000); // Save after 1 second of inactivity

      return () => clearTimeout(timeoutId);
    }
  }, [nodes, edges, isLoaded, activeTabId]);

  // Handle viewport restoration when switching tabs or on initial load
  useEffect(() => {
    if (isLoaded && activeTabId && reactFlowInstance && !isSwitchingTabs) {
      // Use requestAnimationFrame to ensure React Flow has rendered
      const handle = requestAnimationFrame(() => {
        const savedViewport = tabViewports.get(activeTabId);
        if (savedViewport) {
          // Restore saved viewport
          reactFlowInstance.setViewport(savedViewport, { duration: 200 });
        } else {
          // If no saved viewport, fit view to show all nodes or use default
          if (nodes.length > 0) {
            reactFlowInstance.fitView({ padding: 0.1, duration: 200 });
          } else {
            reactFlowInstance.setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 200 });
          }
        }
      });

      return () => cancelAnimationFrame(handle);
    }
  }, [isLoaded, activeTabId, reactFlowInstance, isSwitchingTabs, tabViewports]);

  // Create a new handleNodeDataChange function when tab changes
  const createTabSpecificNodeDataChangeHandler = useCallback((tabId) => {
    return (nodeId, newData) => {
      // Only update if this is for the currently active tab
      if (tabId === activeTabId) {
        setNodes((nds) =>
          nds.map((node) =>
            node.id === nodeId
              ? { ...node, data: { ...node.data, ...newData } }
              : node
          )
        );
      }
    };
  }, [activeTabId, setNodes]);

  // Tab management functions
  const handleTabChange = async (tabId) => {
    if (tabId === activeTabId) return;
    
    setIsSwitchingTabs(true);
    
    // Save current viewport state before switching
    if (activeTabId && reactFlowInstance) {
      const viewport = reactFlowInstance.getViewport();
      setTabViewports(prev => {
        const newMap = new Map(prev);
        newMap.set(activeTabId, viewport);
        return newMap;
      });
    }
    
    setActiveTabId(tabId);
    workflowStorage.setActiveTab(tabId);
    
    // Create tab-specific handler
    const tabHandler = createTabSpecificNodeDataChangeHandler(tabId);
    
    try {
      // Load workflow for the selected tab
      const savedWorkflow = await workflowStorage.loadTabWorkflow(tabId, tabHandler);
      if (savedWorkflow) {
        setNodes(savedWorkflow.nodes);
        setEdges(savedWorkflow.edges);
      } else {
        setNodes([]);
        setEdges([]);
      }
      setLastValidation(null);
    } catch (error) {
      console.error('Failed to load workflow for tab:', error);
      setNodes([]);
      setEdges([]);
      setLastValidation(null);
    } finally {
      setIsSwitchingTabs(false);
    }
  };

  const handleTabCreate = async (newTab) => {
    try {
      const allTabs = await workflowStorage.getAllTabs();
      setTabs(allTabs);
      setActiveTabId(newTab.id);
      workflowStorage.setActiveTab(newTab.id);
      setNodes([]);
      setEdges([]);
      setLastValidation(null);
    } catch (error) {
      console.error('Failed to refresh tabs after creation:', error);
    }
  };

  const handleTabDelete = async (deletedTabId) => {
    try {
      const updatedTabs = await workflowStorage.getAllTabs();
      setTabs(updatedTabs);
      
      // Clean up running state for deleted tab
      setRunningTabs(prev => {
        const newSet = new Set(prev);
        newSet.delete(deletedTabId);
        return newSet;
      });
      
      // Clean up saved viewport state for deleted tab
      setTabViewports(prev => {
        const newMap = new Map(prev);
        newMap.delete(deletedTabId);
        return newMap;
      });
      
      if (deletedTabId === activeTabId) {
        const newActiveTabId = workflowStorage.getActiveTab();
        if (newActiveTabId && updatedTabs.length > 0) {
          await handleTabChange(newActiveTabId);
        } else {
          setActiveTabId(null);
          setNodes([]);
          setEdges([]);
          setLastValidation(null);
        }
      }
    } catch (error) {
      console.error('Failed to handle tab deletion:', error);
    }
  };

  const handleTabRename = async (tabId, newName) => {
    try {
      const allTabs = await workflowStorage.getAllTabs();
      setTabs(allTabs);
    } catch (error) {
      console.error('Failed to refresh tabs after rename:', error);
    }
  };

  // Handle connection creation
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Handle drag over
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle drop to create new nodes
  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      if (!activeTabId) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      // Snap position to grid
      const gridSize = 20;
      const snappedPosition = {
        x: Math.round(position.x / gridSize) * gridSize,
        y: Math.round(position.y / gridSize) * gridSize,
      };

      const newNode = {
        id: generateId(),
        type,
        position: snappedPosition,
        data: { 
          label: type.charAt(0).toUpperCase() + type.slice(1),
          onChange: handleNodeDataChange,
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes, handleNodeDataChange, activeTabId]
  );

  // Add predefined nodes
  const addNode = (type) => {
    if (!activeTabId) return;
    
    const gridSize = 20;
    const randomX = Math.random() * 400;
    const randomY = Math.random() * 300;
    
    // Snap to grid
    const position = {
      x: Math.round(randomX / gridSize) * gridSize,
      y: Math.round(randomY / gridSize) * gridSize,
    };

    const newNode = {
      id: generateId(),
      type,
      position,
      data: { 
        label: type.charAt(0).toUpperCase() + type.slice(1),
        onChange: handleNodeDataChange,
      },
    };

    setNodes((nds) => nds.concat(newNode));
  };

  // Clear all nodes and edges for current tab
  const clearWorkflow = async () => {
    setNodes([]);
    setEdges([]);
    setLastValidation(null);
    if (activeTabId) {
      try {
        await workflowStorage.clearTabWorkflow(activeTabId);
      } catch (error) {
        console.error('Failed to clear workflow:', error);
      }
    }
  };

  // Load example workflow
  const loadExample = async () => {
    if (!activeTabId) return;
    
    try {
      const exampleData = await apiService.getExampleWorkflow();
      
      // Convert to React Flow format and add onChange handlers
      const exampleNodes = exampleData.nodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          onChange: handleNodeDataChange,
        },
      }));

      setNodes(exampleNodes);
      setEdges(exampleData.edges);
      setLastValidation(null);
    } catch (error) {
      console.error('Failed to load example:', error);
      alert('Failed to load example workflow');
    }
  };

  // Load text-to-video example workflow
  const loadTextToVideoExample = async () => {
    if (!activeTabId) return;
    
    try {
      const exampleData = await apiService.getTextToVideoExample();
      
      // Convert to React Flow format and add onChange handlers
      const exampleNodes = exampleData.nodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          onChange: handleNodeDataChange,
        },
      }));

      setNodes(exampleNodes);
      setEdges(exampleData.edges);
      setLastValidation(null);
    } catch (error) {
      console.error('Failed to load text-to-video example:', error);
      alert('Failed to load text-to-video example workflow');
    }
  };

  // Load text+image-to-video example workflow
  const loadTextImageToVideoExample = async () => {
    if (!activeTabId) return;
    
    try {
      const exampleData = await apiService.getTextImageToVideoExample();
      
      // Convert to React Flow format and add onChange handlers
      const exampleNodes = exampleData.nodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          onChange: handleNodeDataChange,
        },
      }));

      setNodes(exampleNodes);
      setEdges(exampleData.edges);
      setLastValidation(null);
    } catch (error) {
      console.error('Failed to load text+image-to-video example:', error);
      alert('Failed to load text+image-to-video example workflow');
    }
  };

  // Load image-to-video example workflow
  const loadImageToVideoExample = async () => {
    if (!activeTabId) return;
    
    try {
      const exampleData = await apiService.getImageToVideoExample();
      
      // Convert to React Flow format and add onChange handlers
      const exampleNodes = exampleData.nodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          onChange: handleNodeDataChange,
        },
      }));

      setNodes(exampleNodes);
      setEdges(exampleData.edges);
      setLastValidation(null);
    } catch (error) {
      console.error('Failed to load image-to-video example:', error);
      alert('Failed to load image-to-video example workflow');
    }
  };

  // Validate workflow
  const validateWorkflow = async () => {
    if (nodes.length === 0) {
      alert('Please add some nodes first');
      return;
    }

    setIsValidating(true);
    try {
      // Prepare graph data for validation
      const graphData = {
        nodes: nodes.map(node => ({
          id: node.id,
          type: node.type,
          data: {
            text: node.data.text,
            file_url: node.data.file_url,
            file_type: node.data.file_type,
          },
          position: node.position,
        })),
        edges: edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
        })),
      };

      const validation = await apiService.validateGraph(graphData);
      setLastValidation(validation);

      if (validation.valid) {
        alert('Workflow is valid!');
      } else {
        const errorMessages = validation.errors.map(err => `${err.type}: ${err.message}`).join('\n');
        alert(`Workflow validation failed:\n\n${errorMessages}`);
      }
    } catch (error) {
      console.error('Validation failed:', error);
      alert('Validation failed: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsValidating(false);
    }
  };

  // Run workflow with streaming
  const runWorkflow = async () => {
    if (nodes.length === 0) {
      alert('Please add some nodes first');
      return;
    }

    if (!activeTabId) {
      alert('No active tab selected');
      return;
    }

    // Store the current tab ID to ensure we update the correct tab even if user switches tabs
    const executingTabId = activeTabId;

    setRunningTabs(prev => {
      const newSet = new Set(prev);
      newSet.add(executingTabId);
      return newSet;
    });

    try {
      // Clear previous results and errors
      setNodes((nds) =>
        nds.map((node) => ({
          ...node,
          data: { 
            ...node.data, 
            result: undefined, 
            error: undefined,
            isExecuting: false
          },
        }))
      );

      // Prepare graph data for execution
      const graphData = {
        nodes: nodes.map(node => ({
          id: node.id,
          type: node.type,
          data: {
            text: node.data.text,
            file_url: node.data.file_url,
            file_type: node.data.file_type,
          },
          position: node.position,
        })),
        edges: edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
        })),
      };

      // Use streaming API with real-time callbacks
      await apiService.runGraphStreaming(graphData, {
        onStart: (data) => {
          console.log('Workflow started:', data.message);
        },
        
        onNodeStart: (data) => {
          // Only update if we're still on the same tab
          if (executingTabId === activeTabId) {
            setNodes((nds) =>
              nds.map((node) => 
                node.id === data.node_id
                  ? { 
                      ...node, 
                      data: { 
                        ...node.data, 
                        isExecuting: true,
                        result: undefined, 
                        error: undefined 
                      } 
                    }
                  : node
              )
            );
          }
          console.log(`Node ${data.node_id} started execution`);
        },
        
        onNodeComplete: (data) => {
          // Only update if we're still on the same tab
          if (executingTabId === activeTabId) {
            setNodes((nds) =>
              nds.map((node) => 
                node.id === data.node_id
                  ? { 
                      ...node, 
                      data: { 
                        ...node.data, 
                        isExecuting: false,
                        result: data.result, 
                        error: data.error 
                      } 
                    }
                  : node
              )
            );
          }
          console.log(`Node ${data.node_id} completed:`, data.result);
        },
        
        onNodeError: (data) => {
          // Only update if we're still on the same tab
          if (executingTabId === activeTabId) {
            setNodes((nds) =>
              nds.map((node) => 
                node.id === data.node_id
                  ? { 
                      ...node, 
                      data: { 
                        ...node.data, 
                        isExecuting: false,
                        result: undefined, 
                        error: data.error 
                      } 
                    }
                  : node
              )
            );
          }
          console.error(`Node ${data.node_id} error:`, data.error);
        },
        
        onComplete: (data) => {
          console.log('Workflow completed:', data.message);
          // Visual feedback is already provided by node color changes and status indicators
          // No need for intrusive popups
        },
        
        onError: (data) => {
          console.error('Workflow error:', data.errors);
          // Error details are shown in the node components and console
          // No need for intrusive popups
        }
      });

    } catch (error) {
      console.error('Execution failed:', error);
      alert('Execution failed: ' + error.message);
      // Error details are logged to console for debugging
    } finally {
      setRunningTabs(prev => {
        const newSet = new Set(prev);
        newSet.delete(executingTabId);
        return newSet;
      });
    }
  };

  return (
    <div className="h-full flex flex-col bg-black">
      {/* Workflow Tabs */}
      <WorkflowTabs
        activeTabId={activeTabId}
        onTabChange={handleTabChange}
        onTabCreate={handleTabCreate}
        onTabDelete={handleTabDelete}
        onTabRename={handleTabRename}
      />
      
      <div className="flex-1 flex">
        {/* Sidebar */}
      <div className="w-72 bg-gray-500/15 backdrop-blur-md border-r border-gray-400/20 p-6 space-y-6 shadow-2xl" style={{ fontFamily: 'sans-serif' }}>
        <div>
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <span>Add Nodes</span>
          </h3>
          <div className="space-y-3">
            <button
              onClick={() => addNode('text')}
              className="w-full bg-gray-600/40 hover:bg-gray-500/40 text-white p-4 rounded-xl text-left flex items-center space-x-3 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-gray-500/25 backdrop-blur-sm border border-gray-400/20"
            >
              <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
              <div>
                <div className="font-medium">Text Node</div>
                <div className="text-xs text-gray-100">Process and generate text</div>
              </div>
            </button>
            <button
              onClick={() => addNode('image')}
              className="w-full bg-gray-600/40 hover:bg-gray-500/40 text-white p-4 rounded-xl text-left flex items-center space-x-3 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-gray-500/25 backdrop-blur-sm border border-gray-400/20"
            >
              <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
              <div>
                <div className="font-medium">Image Node</div>
                <div className="text-xs text-gray-100">Generate and edit images</div>
              </div>
            </button>
            <button
              onClick={() => addNode('video')}
              className="w-full bg-gray-600/40 hover:bg-gray-500/40 text-white p-4 rounded-xl text-left flex items-center space-x-3 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-gray-500/25 backdrop-blur-sm border border-gray-400/20"
            >
              <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
              <div>
                <div className="font-medium">Video Node</div>
                <div className="text-xs text-gray-100">Create and process videos</div>
              </div>
            </button>
          </div>
        </div>

        <div className="border-t border-gray-400/30 pt-6">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <span>Actions</span>
          </h3>
          <div className="space-y-3">
            <button
              onClick={validateWorkflow}
              disabled={isValidating}
              className="w-full bg-gray-600/40 hover:bg-gray-500/40 text-white p-3 rounded-lg transition-all duration-200 border border-gray-400/20 hover:border-gray-300/30 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
            >
              {isValidating ? 'Validating...' : 'Validate Workflow'}
            </button>
            <button
              onClick={runWorkflow}
              disabled={runningTabs.has(activeTabId) || nodes.length === 0}
              className="w-full bg-gray-600/40 hover:bg-gray-500/40 text-white p-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg backdrop-blur-sm border border-gray-400/20 hover:border-gray-300/30"
            >
              {runningTabs.has(activeTabId) ? 'Running...' : 'Run Workflow'}
            </button>
          </div>
        </div>

        <div className="border-t border-gray-400/30 pt-6">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <span>Examples</span>
          </h3>
          <div className="space-y-2">
            <button
              onClick={loadExample}
              className="w-full bg-gray-600/30 hover:bg-gray-500/30 text-white p-2 rounded-lg transition-all duration-200 border border-gray-400/20 hover:border-gray-300/30 text-sm backdrop-blur-sm"
            >
              Basic Text → Image
            </button>
            <button
              onClick={loadTextToVideoExample}
              className="w-full bg-gray-600/30 hover:bg-gray-500/30 text-white p-2 rounded-lg transition-all duration-200 border border-gray-400/20 hover:border-gray-300/30 text-sm backdrop-blur-sm"
            >
              Text → Video
            </button>
            <button
              onClick={loadTextImageToVideoExample}
              className="w-full bg-gray-600/30 hover:bg-gray-500/30 text-white p-2 rounded-lg transition-all duration-200 border border-gray-400/20 hover:border-gray-300/30 text-sm backdrop-blur-sm"
            >
              Text + Image → Video
            </button>
            <button
              onClick={loadImageToVideoExample}
              className="w-full bg-gray-600/30 hover:bg-gray-500/30 text-white p-2 rounded-lg transition-all duration-200 border border-gray-400/20 hover:border-gray-300/30 text-sm backdrop-blur-sm"
            >
              Text → Image → Video
            </button>
            <button
              onClick={clearWorkflow}
              className="w-full bg-red-600/40 hover:bg-red-500/40 text-white p-2 rounded-lg transition-all duration-200 border border-red-400/20 hover:border-red-300/30 text-sm backdrop-blur-sm"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Validation Status */}
        {lastValidation && (
          <div className="border-t border-gray-700/50 pt-6">
            <h4 className="text-lg font-semibold text-white mb-3">Status</h4>
            <div className={`text-sm p-3 rounded-lg ${
              lastValidation.valid 
                ? 'bg-green-900/30 text-green-300 border border-green-500/30'
                : 'bg-red-900/30 text-red-300 border border-red-500/30'
            }`}>
              {lastValidation.valid ? '✅ Workflow Valid' : `❌ ${lastValidation.errors.length} errors found`}
            </div>
          </div>
        )}
      </div>

      {/* Main Canvas */}
      <div className={`flex-1 relative bg-black ${runningTabs.has(activeTabId) ? 'running-workflow' : ''}`} ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          attributionPosition="bottom-left"
          nodesDraggable={true}
          nodesConnectable={true}
          elementsSelectable={true}
          snapToGrid={true}
          snapGrid={[20, 20]}
          className="workflow-canvas"
        >
          <Background variant="dots" gap={20} size={2} color="#4b5563" className="opacity-60" />
          <Controls 
            className="!bottom-8 !left-8"
            showZoom={true}
            showFitView={true}
            showInteractive={true}
          />
          <MiniMap 
            className="!bottom-8 !right-8 !bg-gray-900/80 !border !border-gray-700 !rounded-lg"
            nodeColor={(node) => {
              switch (node.type) {
                case 'text': return '#3b82f6';
                case 'image': return '#10b981';
                case 'video': return '#8b5cf6';
                default: return '#6b7280';
              }
            }}
          />
        </ReactFlow>
        
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-gray-400">
              <div className="mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-grey-500 to-grey-600 rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Ready to Create?</h3>
              <p className="text-gray-400">Add nodes from the sidebar or load an example workflow</p>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

export default WorkflowEditor;