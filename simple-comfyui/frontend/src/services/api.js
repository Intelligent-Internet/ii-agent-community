import axios from 'axios';

// Create axios instance with base configuration  
const api = axios.create({
  baseURL: 'http://localhost:8080',  // Always use the deployed backend URL
  timeout: 120000, // 120 seconds for long-running video operations
  headers: {
    'Content-Type': 'application/json',
  },
});

// API service methods
export const apiService = {
  // Health check
  async checkHealth() {
    const response = await api.get('/health');
    return response.data;
  },

  // Configure API keys
  async configureAPI(config) {
    const response = await api.post('/configure-api', config);
    return response.data;
  },

  // Validate graph structure
  async validateGraph(graph) {
    const response = await api.post('/validate-graph', graph);
    return response.data;
  },

  // Execute workflow graph
  async runGraph(graph) {
    const response = await api.post('/run-graph', graph);
    return response.data;
  },

  // Execute workflow graph with streaming (Server-Sent Events)
  async runGraphStreaming(graph, callbacks) {
    return new Promise((resolve, reject) => {
      const url = `${api.defaults.baseURL}/run-graph-stream`;
      
      // Use fetch with ReadableStream for POST requests
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify(graph)
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        
        function readChunk() {
          return reader.read().then(({ done, value }) => {
            if (done) {
              resolve({ type: 'complete', success: true });
              return;
            }
            
            // Append new chunk to buffer
            buffer += decoder.decode(value, { stream: true });
            
            // Process complete lines
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  
                  switch (data.type) {
                    case 'start':
                      if (callbacks.onStart) callbacks.onStart(data);
                      break;
                    case 'node_start':
                      if (callbacks.onNodeStart) callbacks.onNodeStart(data);
                      break;
                    case 'node_complete':
                      if (callbacks.onNodeComplete) callbacks.onNodeComplete(data);
                      break;
                    case 'node_error':
                      if (callbacks.onNodeError) callbacks.onNodeError(data);
                      break;
                    case 'complete':
                      if (callbacks.onComplete) callbacks.onComplete(data);
                      resolve(data);
                      return;
                    case 'error':
                      if (callbacks.onError) callbacks.onError(data);
                      reject(new Error(data.errors.join(', ')));
                      return;
                    default:
                      console.warn('Unknown event type:', data.type);
                  }
                } catch (e) {
                  console.error('Failed to parse SSE data:', e, line);
                }
              }
            }
            
            return readChunk();
          });
        }
        
        return readChunk();
      })
      .catch(reject);
    });
  },

  // Upload file
  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/upload-file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get example workflow
  async getExampleWorkflow() {
    const response = await api.get('/example-workflow');
    return response.data;
  },

  // Get text-to-video example workflow
  async getTextToVideoExample() {
    const response = await api.get('/example-workflow/text-to-video');
    return response.data;
  },

  // Get text+image-to-video example workflow  
  async getTextImageToVideoExample() {
    const response = await api.get('/example-workflow/text-image-to-video');
    return response.data;
  },

  // Get image-to-video example workflow
  async getImageToVideoExample() {
    const response = await api.get('/example-workflow/image-to-video');
    return response.data;
  },

  // Get backend base URL for file serving
  getBackendURL() {
    return api.defaults.baseURL;
  },
};

// Set backend URL for production deployment
export const setBackendURL = (url) => {
  api.defaults.baseURL = url;
};

export default api;