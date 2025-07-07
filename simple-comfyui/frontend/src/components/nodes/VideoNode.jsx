import { useState, useRef } from 'react';
import { Handle, Position } from 'reactflow';
import { apiService } from '../../services/api';

function VideoNode({ data, id, selected }) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      alert('Please select a video file');
      return;
    }

    setUploading(true);
    try {
      const uploadResult = await apiService.uploadFile(file);
      
      // Update node data
      if (data.onChange) {
        data.onChange(id, { 
          file_url: uploadResult.file_url,
          file_type: uploadResult.file_type,
          filename: uploadResult.filename 
        });
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed: ' + (error.response?.data?.detail || error.message));
    } finally {
      setUploading(false);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const getVideoDisplay = () => {
    if (data.result && typeof data.result === 'string') {
      // Result from AI generation
      return data.result;
    }
    if (data.file_url) {
      // Uploaded file
      if (data.file_url.startsWith('http')) {
        return data.file_url;
      } else {
        // Encode the file path to handle spaces and special characters
        const encodedPath = data.file_url.split('/').map(segment => encodeURIComponent(segment)).join('/');
        return `${apiService.getBackendURL()}${encodedPath}`;
      }
    }
    return null;
  };

  const videoUrl = getVideoDisplay();

  // If we have a video, render only the video (borderless)
  if (videoUrl) {
    return (
      <div className="relative group transition-all duration-300 hover:scale-105" style={{ pointerEvents: 'auto' }}>
        {/* Input Handle */}
        <Handle
          type="target"
          position={Position.Left}
          className="!w-4 !h-4 !bg-white !border-2 !border-gray-400 !rounded-full !-left-2"
        />
        
        <video
          src={videoUrl}
          controls
          className="max-w-[400px] max-h-[300px] object-contain rounded-lg shadow-lg bg-black"
          onError={(e) => {
            console.error('Video load error:', e);
          }}
        >
          Your browser does not support the video tag.
        </video>
        
        {/* Replace button on hover */}
        <button
          onClick={triggerFileUpload}
          className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 backdrop-blur-sm p-2 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
          title="Replace video"
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
        
        {/* Output Handle */}
        <Handle
          type="source"
          position={Position.Right}
          className="!w-4 !h-4 !bg-white !border-2 !border-gray-400 !rounded-full !-right-2"
        />
      </div>
    );
  }

  // If no video, show the upload UI with full node container
  return (
    <div className={`bg-gray-300/20 backdrop-blur-md border rounded-xl p-4 min-w-[280px] shadow-2xl transition-all duration-300 hover:bg-gray-300/30 hover:backdrop-blur-xl hover:shadow-3xl hover:scale-105 ${
      data.isExecuting 
        ? 'border-blue-400/60 shadow-blue-400/25 animate-pulse' 
        : selected 
        ? 'ring-2 ring-gray-200 shadow-gray-200/25 border-gray-300/50' 
        : 'border-gray-300/30'
    }`} style={{ pointerEvents: 'auto', fontFamily: 'sans-serif' }}>
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-4 !h-4 !bg-white !border-2 !border-gray-400 !rounded-full !-left-2"
      />
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full shadow-sm transition-all duration-300 ${
              data.isExecuting 
                ? 'bg-blue-400 animate-pulse' 
                : data.result 
                ? 'bg-green-400' 
                : data.error 
                ? 'bg-red-400' 
                : 'bg-white'
            }`}></div>
            <h3 className="text-sm font-semibold text-white">Video Node</h3>
            {data.isExecuting && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            )}
          </div>
          <div className={`text-xs px-2 py-1 rounded-full transition-all duration-300 ${
            data.isExecuting 
              ? 'bg-blue-500/30 text-blue-200' 
              : 'bg-gray-500/30 text-gray-100'
          }`}>
            {data.isExecuting ? 'PROCESSING' : 'VIDEO'}
          </div>
        </div>
        
        {/* Upload Area */}
        <div
          onClick={triggerFileUpload}
          className="w-full h-40 border-2 border-dashed border-gray-400/50 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 hover:bg-black/20 transition-all duration-200 bg-black/30 backdrop-blur-sm"
        >
          {uploading ? (
            <div className="flex flex-col items-center">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mb-2"></div>
              <div className="text-sm text-gray-100">Uploading...</div>
            </div>
          ) : (
            <>
              <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <div className="text-sm text-gray-100 text-center">
                <div className="font-medium">Upload Video</div>
                <div className="text-xs text-gray-200/70 mt-1">Or connect from another node</div>
              </div>
            </>
          )}
        </div>
        
        {/* Error Display */}
        {data.error && (
          <div className="mt-3 p-3 bg-red-900/30 border border-red-500/30 rounded-lg backdrop-blur-sm">
            <div className="text-xs font-semibold text-red-200 mb-2 flex items-center space-x-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              <span>Error:</span>
            </div>
            <div className="text-xs text-red-200">{data.error}</div>
          </div>
        )}
      </div>
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />
      
      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-4 !h-4 !bg-white !border-2 !border-gray-400 !rounded-full !-right-2"
      />
    </div>
  );
}

export default VideoNode;