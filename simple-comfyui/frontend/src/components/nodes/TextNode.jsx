import { useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';

function TextNode({ data, id, selected }) {
  const [text, setText] = useState(data.text || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isResultExpanded, setIsResultExpanded] = useState(false);
  const [isErrorExpanded, setIsErrorExpanded] = useState(false);

  // Sync local state with prop changes (for tab switching)
  useEffect(() => {
    setText(data.text || '');
  }, [data.text]);

  const handleTextChange = (e) => {
    const newText = e.target.value;
    setText(newText);
    // Call onChange immediately when user types
    if (data.onChange) {
      data.onChange(id, { text: newText });
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  const handleFocus = () => {
    setIsEditing(true);
  };

  const truncateText = (text, maxLength = 200) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength);
  };

  const renderTruncatedContent = (content, isExpanded, setIsExpanded, maxLength = 200) => {
    const textContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    const shouldTruncate = textContent.length > maxLength;
    const displayText = isExpanded || !shouldTruncate ? textContent : truncateText(textContent, maxLength);

    return (
      <div>
        <div className={`text-xs text-white whitespace-pre-wrap break-words ${isExpanded ? 'max-h-48 overflow-y-auto' : ''}`}>
          {displayText}
          {!isExpanded && shouldTruncate && '...'}
        </div>
        {shouldTruncate && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 text-xs text-gray-300 hover:text-white underline focus:outline-none"
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>
    );
  };

  const renderTruncatedError = (errorText, isExpanded, setIsExpanded, maxLength = 200) => {
    const shouldTruncate = errorText.length > maxLength;
    const displayText = isExpanded || !shouldTruncate ? errorText : truncateText(errorText, maxLength);

    return (
      <div>
        <div className={`text-xs text-red-200 break-words ${isExpanded ? 'max-h-48 overflow-y-auto' : ''}`}>
          {displayText}
          {!isExpanded && shouldTruncate && '...'}
        </div>
        {shouldTruncate && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 text-xs text-red-300 hover:text-red-100 underline focus:outline-none"
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className={`bg-gray-300/20 backdrop-blur-md border rounded-xl p-4 w-80 max-h-[600px] shadow-2xl transition-all duration-300 hover:bg-gray-300/30 hover:backdrop-blur-xl hover:shadow-3xl hover:scale-105 ${
      data.isExecuting 
        ? 'border-blue-400/60 shadow-blue-400/25 animate-pulse' 
        : selected 
        ? 'ring-2 ring-gray-200 shadow-gray-200/25 border-gray-300/50' 
        : 'border-gray-300/30'
    }`} style={{ fontFamily: 'sans-serif' }}>
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-4 !h-4 !bg-white !border-2 !border-gray-400 !rounded-full !-left-2"
      />
      
      <div className="space-y-3 overflow-y-auto max-h-[550px]">
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
            <h3 className="text-sm font-semibold text-white">Text Input</h3>
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
            {data.isExecuting ? 'PROCESSING' : 'TEXT'}
          </div>
        </div>
        
        <textarea
          value={text}
          onChange={handleTextChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="Enter your text prompt..."
          className="w-full min-h-20 max-h-32 px-3 py-2 text-sm border border-gray-400/30 bg-black/30 text-white rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent placeholder-gray-200/50 backdrop-blur-sm overflow-y-auto"
          rows={3}
        />
        
        {/* Result Display */}
        {data.result && (
          <div className="mt-3 p-3 bg-black/30 border border-gray-400/30 rounded-lg backdrop-blur-sm">
            <div className="text-xs font-semibold text-gray-200 mb-2 flex items-center space-x-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
              <span>Output:</span>
            </div>
            {renderTruncatedContent(data.result, isResultExpanded, setIsResultExpanded)}
          </div>
        )}
        
        {/* Error Display */}
        {data.error && (
          <div className="mt-3 p-3 bg-red-900/30 border border-red-500/30 rounded-lg backdrop-blur-sm">
            <div className="text-xs font-semibold text-red-200 mb-2 flex items-center space-x-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              <span>Error:</span>
            </div>
            {renderTruncatedError(data.error, isErrorExpanded, setIsErrorExpanded)}
          </div>
        )}
      </div>
      
      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-4 !h-4 !bg-white !border-2 !border-gray-400 !rounded-full !-right-2"
      />
    </div>
  );
}

export default TextNode;