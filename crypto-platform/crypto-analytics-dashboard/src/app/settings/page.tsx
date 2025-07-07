"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Save, Key, Eye, EyeOff, Check, AlertCircle, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    // Fetch current settings when component mounts
    fetchUserSettings();
  }, []);

  const fetchUserSettings = async () => {
    try {
      const response = await fetch("/api/user/settings");
      if (response.ok) {
        const data = await response.json();
        if (data.openaiApiKey) {
          // Show masked version of existing API key
          setOpenaiApiKey("sk-" + "*".repeat(40) + data.openaiApiKey.slice(-8));
        }
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const handleSaveSettings = async () => {
    if (!openaiApiKey.trim()) {
      setErrorMessage("Please enter a valid OpenAI API key");
      setSaveStatus("error");
      return;
    }

    if (!openaiApiKey.startsWith("sk-")) {
      setErrorMessage("OpenAI API key should start with 'sk-'");
      setSaveStatus("error");
      return;
    }

    setLoading(true);
    setSaveStatus("saving");
    setErrorMessage("");

    try {
      const response = await fetch("/api/user/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          openaiApiKey: openaiApiKey,
        }),
      });

      if (response.ok) {
        setSaveStatus("success");
        setTimeout(() => setSaveStatus("idle"), 3000);
        // Mask the saved API key
        setOpenaiApiKey("sk-" + "*".repeat(40) + openaiApiKey.slice(-8));
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.message || "Failed to save settings");
        setSaveStatus("error");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      setErrorMessage("Network error. Please try again.");
      setSaveStatus("error");
    } finally {
      setLoading(false);
    }
  };

  const handleClearApiKey = async () => {
    setLoading(true);
    setSaveStatus("saving");

    try {
      const response = await fetch("/api/user/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          openaiApiKey: null,
        }),
      });

      if (response.ok) {
        setOpenaiApiKey("");
        setSaveStatus("success");
        setTimeout(() => setSaveStatus("idle"), 3000);
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.message || "Failed to clear API key");
        setSaveStatus("error");
      }
    } catch (error) {
      console.error("Error clearing API key:", error);
      setErrorMessage("Network error. Please try again.");
      setSaveStatus("error");
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-gray-400">Please sign in to access settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-8 h-8 text-blue-500" />
            <h1 className="text-3xl font-bold">Settings</h1>
          </div>
          <p className="text-gray-400">Manage your account preferences and API integrations</p>
        </div>

        <div className="max-w-2xl">
          {/* OpenAI API Key Settings */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5 text-blue-500" />
                OpenAI API Key
              </CardTitle>
              <p className="text-sm text-gray-400">
                Enter your OpenAI API key to enable AI-powered price predictions and market analysis.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* API Key Input */}
              <div>
                <label htmlFor="openai-key" className="block text-sm font-medium mb-2">
                  API Key
                </label>
                <div className="relative">
                  <input
                    id="openai-key"
                    type={showApiKey ? "text" : "password"}
                    value={openaiApiKey}
                    onChange={(e) => setOpenaiApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Your API key is stored securely and never shared. It's only used for generating predictions.
                </p>
              </div>

              {/* Status Messages */}
              {saveStatus === "success" && (
                <div className="flex items-center gap-2 text-green-500 text-sm">
                  <Check className="w-4 h-4" />
                  Settings saved successfully!
                </div>
              )}

              {saveStatus === "error" && errorMessage && (
                <div className="flex items-center gap-2 text-red-500 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {errorMessage}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleSaveSettings}
                  disabled={loading || saveStatus === "saving"}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 rounded-lg font-medium transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {saveStatus === "saving" ? "Saving..." : "Save API Key"}
                </button>

                {openaiApiKey && (
                  <button
                    onClick={handleClearApiKey}
                    disabled={loading}
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 rounded-lg font-medium transition-colors"
                  >
                    Clear API Key
                  </button>
                )}
              </div>

              {/* Information Box */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <h4 className="font-medium text-blue-400 mb-2">How to get your OpenAI API Key:</h4>
                <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
                  <li>Visit <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">platform.openai.com/api-keys</a></li>
                  <li>Sign in to your OpenAI account</li>
                  <li>Click "Create new secret key"</li>
                  <li>Copy the key (starts with "sk-")</li>
                  <li>Paste it in the field above</li>
                </ol>
                <p className="text-xs text-gray-400 mt-3">
                  Note: You'll need OpenAI credits in your account to use the prediction features.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card className="bg-gray-800/50 border-gray-700 mt-6">
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Email:</span>
                  <span>{session.user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Name:</span>
                  <span>{session.user?.name || "Not provided"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Account Type:</span>
                  <span className="text-green-500">Active</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}