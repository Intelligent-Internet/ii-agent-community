"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import AuthGuard from "@/components/auth/AuthGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/stores/auth";
import { toast } from "sonner";
import { Upload, X, Image as ImageIcon, Video, MapPin, Camera, Type } from "lucide-react";

export default function CreatePostPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const storyFileInputRef = useRef<HTMLInputElement>(null);
  
  // Post creation state
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Story creation state
  const [storyFile, setStoryFile] = useState<File | null>(null);
  const [storyPreview, setStoryPreview] = useState<string>("");
  const [storyText, setStoryText] = useState("");
  const [isStoryLoading, setIsStoryLoading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    // Validate file types
    const validFiles = selectedFiles.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      return isImage || isVideo;
    });

    if (validFiles.length !== selectedFiles.length) {
      toast.error("Only image and video files are allowed");
    }

    // Limit to 10 files (Instagram's limit)
    const limitedFiles = validFiles.slice(0, 10);
    
    if (limitedFiles.length !== validFiles.length) {
      toast.warning("Maximum 10 files allowed");
    }

    setFiles(limitedFiles);

    // Create previews
    const newPreviews = limitedFiles.map(file => URL.createObjectURL(file));
    setPreviews(newPreviews);
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    
    // Revoke the URL to free memory
    URL.revokeObjectURL(previews[index]);
    
    setFiles(newFiles);
    setPreviews(newPreviews);
  };

  const handleSubmit = async () => {
    if (files.length === 0 && !caption.trim()) {
      toast.error("Please add a caption or select at least one image or video");
      return;
    }

    setIsLoading(true);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      formData.append('caption', caption);
      if (location) {
        formData.append('location', location);
      }

      const response = await fetch('/api/posts', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create post');
      }

      const post = await response.json();
      toast.success("Post created successfully!");
      
      // Clean up previews
      previews.forEach(preview => URL.revokeObjectURL(preview));
      
      // Redirect to home or post detail
      router.push("/");
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create post');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStoryFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const isImage = selectedFile.type.startsWith('image/');
    const isVideo = selectedFile.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      toast.error("Only image and video files are allowed for stories");
      return;
    }

    setStoryFile(selectedFile);

    // Create preview URL
    const previewUrl = URL.createObjectURL(selectedFile);
    setStoryPreview(previewUrl);
  };

  const handleStorySubmit = async () => {
    if (!storyFile) {
      toast.error("Please select a file for your story");
      return;
    }

    setIsStoryLoading(true);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', storyFile);
      if (storyText) {
        formData.append('text', storyText);
      }

      const response = await fetch('/api/stories', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create story');
      }

      const story = await response.json();
      toast.success("Story created successfully!");
      
      // Clean up preview
      if (storyPreview) {
        URL.revokeObjectURL(storyPreview);
      }
      
      // Redirect to home
      router.push("/");
    } catch (error) {
      console.error('Error creating story:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create story');
    } finally {
      setIsStoryLoading(false);
    }
  };

  const removeStoryFile = () => {
    if (storyPreview) {
      URL.revokeObjectURL(storyPreview);
    }
    setStoryFile(null);
    setStoryPreview("");
    setStoryText("");
  };

  if (!user) {
    return null; // AuthGuard will handle redirect
  }

  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Create Content</h1>
            <p className="text-muted-foreground">Share your moment with the world</p>
          </div>

          <Tabs defaultValue="post" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="post" className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Post
              </TabsTrigger>
              <TabsTrigger value="story" className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Story
              </TabsTrigger>
            </TabsList>

            {/* Post Creation Tab */}
            <TabsContent value="post">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={user.profileImage} />
                      <AvatarFallback>
                        {user.displayName?.charAt(0) || user.username?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{user.displayName}</p>
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                    </div>
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* File Upload */}
                  <div className="space-y-4">
                    <Label>Photos/Videos</Label>
                    
                    {files.length === 0 ? (
                      <div 
                        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-lg font-medium mb-2">Choose photos and videos</p>
                        <p className="text-sm text-muted-foreground mb-4">
                          Share images and videos up to 10 files
                        </p>
                        <Button 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                          }}
                        >
                          Select from computer
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {previews.map((preview, index) => (
                            <div key={index} className="relative group">
                              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                {files[index].type.startsWith('image/') ? (
                                  <img
                                    src={preview}
                                    alt={`Preview ${index + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <video
                                    src={preview}
                                    className="w-full h-full object-cover"
                                    controls={false}
                                    muted
                                  />
                                )}
                              </div>
                              
                              {/* File type indicator */}
                              <div className="absolute top-2 left-2">
                                {files[index].type.startsWith('image/') ? (
                                  <ImageIcon className="h-4 w-4 text-white bg-black bg-opacity-50 rounded p-1" />
                                ) : (
                                  <Video className="h-4 w-4 text-white bg-black bg-opacity-50 rounded p-1" />
                                )}
                              </div>
                              
                              {/* Remove button */}
                              <button
                                onClick={() => removeFile(index)}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                        
                        <Button
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full"
                        >
                          Add more files
                        </Button>
                      </div>
                    )}
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>

                  {/* Caption */}
                  <div className="space-y-2">
                    <Label htmlFor="caption">Caption</Label>
                    <Textarea
                      id="caption"
                      placeholder="Write a caption..."
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      rows={3}
                      maxLength={2000}
                    />
                    <div className="text-xs text-muted-foreground text-right">
                      {caption.length}/2,200
                    </div>
                  </div>

                  {/* Location */}
                  <div className="space-y-2">
                    <Label htmlFor="location" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Add location
                    </Label>
                    <Input
                      id="location"
                      placeholder="Add location..."
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => router.back()}
                      disabled={isLoading}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={isLoading || (files.length === 0 && !caption.trim())}
                      className="flex-1"
                    >
                      {isLoading ? "Publishing..." : "Share"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Story Creation Tab */}
            <TabsContent value="story">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={user.profileImage} />
                      <AvatarFallback>
                        {user.displayName?.charAt(0) || user.username?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{user.displayName}</p>
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                    </div>
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Story File Upload */}
                  <div className="space-y-4">
                    <Label>Story Media</Label>
                    
                    {!storyFile ? (
                      <div 
                        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
                        onClick={() => storyFileInputRef.current?.click()}
                      >
                        <Camera className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-lg font-medium mb-2">Add to your story</p>
                        <p className="text-sm text-muted-foreground mb-4">
                          Share a photo or video that disappears after 24 hours
                        </p>
                        <Button 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            storyFileInputRef.current?.click();
                          }}
                        >
                          Choose file
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="relative aspect-[9/16] max-w-xs mx-auto bg-gray-100 rounded-lg overflow-hidden">
                          {storyFile.type.startsWith('image/') ? (
                            <img
                              src={storyPreview}
                              alt="Story preview"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <video
                              src={storyPreview}
                              className="w-full h-full object-cover"
                              controls={false}
                              muted
                              autoPlay
                              loop
                            />
                          )}
                          
                          {/* File type indicator */}
                          <div className="absolute top-2 left-2">
                            {storyFile.type.startsWith('image/') ? (
                              <ImageIcon className="h-4 w-4 text-white bg-black bg-opacity-50 rounded p-1" />
                            ) : (
                              <Video className="h-4 w-4 text-white bg-black bg-opacity-50 rounded p-1" />
                            )}
                          </div>
                          
                          {/* Remove button */}
                          <button
                            onClick={removeStoryFile}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                          >
                            <X className="h-3 w-3" />
                          </button>

                          {/* Text overlay preview */}
                          {storyText && (
                            <div className="absolute inset-x-0 bottom-4 px-4">
                              <div className="bg-black bg-opacity-50 text-white text-center py-2 px-4 rounded-lg">
                                <p className="text-sm font-medium">{storyText}</p>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <Button
                          variant="outline"
                          onClick={() => storyFileInputRef.current?.click()}
                          className="w-full"
                        >
                          Change file
                        </Button>
                      </div>
                    )}
                    
                    <input
                      ref={storyFileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleStoryFileSelect}
                      className="hidden"
                    />
                  </div>

                  {/* Story Text Overlay */}
                  {storyFile && (
                    <div className="space-y-2">
                      <Label htmlFor="storyText" className="flex items-center gap-2">
                        <Type className="h-4 w-4" />
                        Add text overlay
                      </Label>
                      <Input
                        id="storyText"
                        placeholder="Add text to your story..."
                        value={storyText}
                        onChange={(e) => setStoryText(e.target.value)}
                        maxLength={100}
                      />
                      <div className="text-xs text-muted-foreground text-right">
                        {storyText.length}/100
                      </div>
                    </div>
                  )}

                  {/* Story Info */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-medium text-blue-900 mb-2">Story Guidelines</h3>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Stories disappear after 24 hours</li>
                      <li>• Only one photo or video per story</li>
                      <li>• Best size: 1080 x 1920 pixels (9:16 ratio)</li>
                      <li>• Maximum video length: 15 seconds</li>
                    </ul>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => router.back()}
                      disabled={isStoryLoading}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleStorySubmit}
                      disabled={isStoryLoading || !storyFile}
                      className="flex-1"
                    >
                      {isStoryLoading ? "Publishing..." : "Share to Story"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </MainLayout>
    </AuthGuard>
  );
}
