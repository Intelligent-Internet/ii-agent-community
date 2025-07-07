import { useState, useEffect } from 'react';
import { apiService } from '../services/api';

function ConfigPage() {
  const [config, setConfig] = useState({
    openai_api_key: '',
    fal_api_key: '',
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [healthData, setHealthData] = useState(null);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const data = await apiService.checkHealth();
      setHealthData(data);
    } catch (error) {
      console.error('Health check failed:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const result = await apiService.configureAPI(config);
      setStatus({
        type: 'success',
        message: result.message || 'API keys configured successfully!',
      });
      // Refresh health data
      await checkHealth();
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.response?.data?.detail || 'Failed to configure API keys',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUseTestKeys = () => {
    setConfig({
      openai_api_key: '',
      fal_api_key: '',
    });
  };

  return (
    <div className="min-h-screen bg-black relative py-8">
      <div className="max-w-2xl mx-auto p-6">
        <div className="glass-effect rounded-2xl p-8 border border-white/10 shadow-2xl">
          <h2 className="text-3xl font-bold text-white mb-8">API Configuration</h2>
          
          {/* Status Display */}
          {healthData && (
            <div className="mb-8 p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
              <h3 className="text-xl font-semibold text-white mb-4">Service Status</h3>
              <div className="flex items-center space-x-6">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    healthData.openai_configured ? 'bg-green-400' : 'bg-red-400'
                  }`}></div>
                  <span className="text-gray-300">
                    OpenAI: {healthData.openai_configured ? 'Configured' : 'Not Configured'}
                  </span>
                </div>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    healthData.fal_configured ? 'bg-green-400' : 'bg-red-400'
                  }`}></div>
                  <span className="text-gray-300">
                    fal.ai: {healthData.fal_configured ? 'Configured' : 'Not Configured'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Configuration Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="openai-key" className="block text-sm font-medium text-gray-300 mb-2">
                OpenAI API Key
              </label>
              <input
                id="openai-key"
                type="password"
                value={config.openai_api_key}
                onChange={(e) => handleInputChange('openai_api_key', e.target.value)}
                className="input-field"
                placeholder="sk-..."
              />
              <p className="text-xs text-gray-500 mt-2">
                Used for text processing and image analysis
              </p>
            </div>

            <div>
              <label htmlFor="fal-key" className="block text-sm font-medium text-gray-300 mb-2">
                fal.ai API Key
              </label>
              <input
                id="fal-key"
                type="password"
                value={config.fal_api_key}
                onChange={(e) => handleInputChange('fal_api_key', e.target.value)}
                className="input-field"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:xxxxxxxx..."
              />
              <p className="text-xs text-gray-500 mt-2">
                Used for image and video generation
              </p>
            </div>

            {/* Status Message */}
            {status && (
              <div className={`p-4 rounded-xl border ${
                status.type === 'success' 
                  ? 'bg-green-900/30 text-green-300 border-green-500/30' 
                  : 'bg-red-900/30 text-red-300 border-red-500/30'
              }`}>
                {status.message}
              </div>
            )}

            {/* Buttons */}
            <div className="flex space-x-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1"
              >
                {loading ? 'Configuring...' : 'Save Configuration'}
              </button>
              <button
                type="button"
                onClick={handleUseTestKeys}
                className="btn-secondary"
              >
                Use Test Keys
              </button>
            </div>
          </form>

          {/* Information */}
          <div className="mt-8 p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
            <h4 className="text-sm font-semibold text-white mb-3">How to get API keys:</h4>
            <ul className="text-sm text-gray-300 space-y-2">
              <li>• OpenAI: Visit <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-white hover:text-gray-300 underline transition-colors">platform.openai.com/api-keys</a></li>
              <li>• fal.ai: Visit <a href="https://fal.ai/dashboard" target="_blank" rel="noopener noreferrer" className="text-white hover:text-gray-300 underline transition-colors">fal.ai/dashboard</a></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfigPage;