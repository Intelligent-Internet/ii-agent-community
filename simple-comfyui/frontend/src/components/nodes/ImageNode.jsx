import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Handle, Position } from 'reactflow';
import { apiService } from '../../services/api';

function ImageNode({ data, id, selected }) {
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
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

  const triggerFileUpload = (event) => {
    console.log('triggerFileUpload called', event);
    event?.stopPropagation();
    event?.preventDefault();
    fileInputRef.current?.click();
  };

  const handleDownload = async (event) => {
    event?.stopPropagation();
    event?.preventDefault();
    
    const imageUrl = getImageDisplay();
    if (!imageUrl) return;

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Use filename from data or generate one
      const filename = data.filename || `image-${Date.now()}.${blob.type.split('/')[1] || 'png'}`;
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed: ' + error.message);
    }
  };

  const handleViewLarger = (event) => {
    event?.stopPropagation();
    event?.preventDefault();
    setShowModal(true);
  };

  const getImageDisplay = () => {
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

  const imageUrl = getImageDisplay();

  // Image Modal Component
  const ImageModal = () => {
    if (!showModal) return null;

    return createPortal(
      <div 
        className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[9999] cursor-pointer"
        onClick={() => setShowModal(false)}
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999
        }}
      >
        <div className="relative max-w-[95vw] max-h-[95vh] p-4" onClick={(e) => e.stopPropagation()}>
          <img
            src={imageUrl}
            alt="Large view"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            style={{ maxWidth: '95vw', maxHeight: '95vh' }}
          />
          
          {/* Close button */}
          <button
            onClick={() => setShowModal(false)}
            className="absolute -top-2 -right-2 bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white p-2 rounded-full shadow-lg transition-all duration-200 z-10"
            title="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>,
      document.body
    );
  };

  // If we have an image, render only the image (borderless)
  if (imageUrl) {
    return (
      <>
        <div className="relative group transition-all duration-300 hover:scale-105" style={{ pointerEvents: 'auto' }}>
          {/* Input Handle */}
          <Handle
            type="target"
            position={Position.Left}
            className="!w-4 !h-4 !bg-white !border-2 !border-gray-400 !rounded-full !-left-2"
          />
          
          <img
            src={imageUrl}
            alt="Node content"
            className="max-w-[400px] max-h-[300px] object-contain rounded-lg shadow-lg"
            onError={(e) => {
              console.error('Image load error:', e);
              e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23374151"/><text x="50" y="50" text-anchor="middle" fill="%23ffffff" font-size="12">Error</text></svg>';
            }}
          />
          
          {/* Action buttons on hover */}
          <div className="absolute top-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
            {/* View larger button */}
            <button
              onClick={handleViewLarger}
              className="bg-black/50 hover:bg-black/70 backdrop-blur-sm p-2 rounded-lg transition-all duration-200"
              title="View larger"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            </button>
            
            {/* Download button */}
            <button
              onClick={handleDownload}
              className="bg-black/50 hover:bg-black/70 backdrop-blur-sm p-2 rounded-lg transition-all duration-200"
              title="Download image"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
            
            {/* Replace button */}
            <button
              onClick={triggerFileUpload}
              className="bg-black/50 hover:bg-black/70 backdrop-blur-sm p-2 rounded-lg transition-all duration-200"
              title="Replace image"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </button>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
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

        {/* Render modal using portal */}
        <ImageModal />
      </>
    );
  }

  // If no image, show the upload UI with full node container
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
            <h3 className="text-sm font-semibold text-white">Image Node</h3>
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
            {data.isExecuting ? 'PROCESSING' : 'IMAGE'}
          </div>
        </div>
        
        {/* Upload Area */}
        <div
          onClick={triggerFileUpload}
          onMouseDown={triggerFileUpload}
          className="nodrag w-full h-40 border-2 border-dashed border-gray-400/50 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 hover:bg-black/20 transition-all duration-200 bg-black/30 backdrop-blur-sm"
          style={{ pointerEvents: 'auto' }}
        >
          {uploading ? (
            <div className="flex flex-col items-center">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mb-2"></div>
              <div className="text-sm text-gray-100">Uploading...</div>
            </div>
          ) : (
            <>
              <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div className="text-sm text-gray-100 text-center">
                <div className="font-medium">Upload Image</div>
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
        accept="image/*"
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

export default ImageNode;