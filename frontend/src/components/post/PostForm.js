"use client";

import React, { useState, useEffect } from "react";
import { Image, X, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePosts, PRIVACY_LEVELS } from "@/context/PostContext";
import { useAuth } from "@/context/AuthContext";
import { formatAvatarUrl } from "@/lib/utils";

const PostForm = ({ onPostCreated, groupId }) => {
  const [content, setContent] = useState("");
  const [privacy, setPrivacy] = useState(PRIVACY_LEVELS.PUBLIC);
  const [images, setImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]); // For private posts
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { currentUser, getAllUsers } = useAuth();
  const { addPost } = usePosts();

  // Check if we're on mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkIfMobile();

    // Add event listener
    window.addEventListener("resize", checkIfMobile);

    // Cleanup
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Fetch available users when "Selected people only" is chosen
  useEffect(() => {
    if (privacy === PRIVACY_LEVELS.SELECTED && availableUsers.length === 0) {
      fetchAvailableUsers();
    }
  }, [privacy]);

  const fetchAvailableUsers = async () => {
    setLoadingUsers(true);
    try {
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${API_BASE_URL}/api/users`, {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        // Filter out current user and get followers/following
        const users = data.message?.followers || data.message?.following || [];
        const filteredUsers = users.filter(
          (user) => user.id !== currentUser.id,
        );
        setAvailableUsers(filteredUsers);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUserSelect = (userId, isSelected) => {
    if (isSelected) {
      setSelectedUsers((prev) => [...prev, userId]);
    } else {
      setSelectedUsers((prev) => prev.filter((id) => id !== userId));
    }
  };

  const handlePrivacyChange = (newPrivacy) => {
    setPrivacy(newPrivacy);
    // Clear selected users when switching away from "Selected people only"
    if (newPrivacy !== PRIVACY_LEVELS.SELECTED) {
      setSelectedUsers([]);
    }
  };

  if (!currentUser) return null;

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      // Store the actual file objects for upload
      const files = Array.from(e.target.files).slice(0, 4 - imageFiles.length);
      setImageFiles((prev) => [...prev, ...files].slice(0, 4)); // Limit to 4 images

      // Create preview URLs for display
      const newImages = files.map((file) => URL.createObjectURL(file));
      setImages((prev) => [...prev, ...newImages].slice(0, 4)); // Limit to 4 images
    }
  };

  const removeImage = (indexToRemove) => {
    setImages(images.filter((_, index) => index !== indexToRemove));
    setImageFiles(imageFiles.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && imageFiles.length === 0) return;

    setIsSubmitting(true);

    try {
      // Send the actual file objects to the server
      const success = await addPost({
        content: content.trim(),
        images: imageFiles, // Send the actual file objects
        privacy,
        selectedUsers,
        groupId, // Pass groupId for group posts
      });

      if (success) {
        // Reset form
        setContent("");
        setPrivacy(PRIVACY_LEVELS.PUBLIC);
        setImages([]);
        setImageFiles([]);
        setSelectedUsers([]);
        // Notify parent component of successful post creation
        if (onPostCreated) {
          onPostCreated();
        }
      }
    } catch (error) {
      console.error("Error submitting post:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayName =
    currentUser.nickname || `${currentUser.firstName} ${currentUser.lastName}`;
  const initials =
    currentUser.firstName && currentUser.lastName
      ? `${currentUser.firstName[0]}${currentUser.lastName[0]}`
      : "??";

  return (
    <div className={`max-w-4xl mx-auto ${isMobile ? "-mx-4" : ""}`}>
      <Card
        className={`mb-1 bg-white ${isMobile ? "shadow-none rounded-none border-x-0" : "shadow-sm"}`}
      >
        <form onSubmit={handleSubmit}>
          <CardContent className="pt-4">
            <div className="flex space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={formatAvatarUrl(currentUser.avatar)}
                  alt={displayName}
                />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <Textarea
                placeholder={`What's on your mind, ${currentUser.first_name}?`}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="flex-1 resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-3">
                {images.map((img, index) => (
                  <div
                    key={index}
                    className="relative rounded-md overflow-hidden"
                  >
                    <img
                      src={img}
                      alt={`Upload preview ${index + 1}`}
                      className="w-full h-32 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-black bg-opacity-60 rounded-full p-1 text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-3">
              <p className="text-sm font-medium mb-2">Privacy</p>
              <RadioGroup
                value={privacy}
                onValueChange={handlePrivacyChange}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={PRIVACY_LEVELS.PUBLIC}
                    id="privacy-public"
                  />
                  <Label htmlFor="privacy-public" className="text-sm">
                    Public - Anyone can see
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={PRIVACY_LEVELS.FOLLOWERS}
                    id="privacy-followers"
                  />
                  <Label htmlFor="privacy-followers" className="text-sm">
                    Followers - Only people who follow you
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={PRIVACY_LEVELS.SELECTED}
                    id="privacy-selected"
                  />
                  <Label htmlFor="privacy-selected" className="text-sm">
                    Selected people only
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* User Selection for Private Posts */}
            {privacy === PRIVACY_LEVELS.SELECTED && (
              <div className="mt-4 p-4 border rounded-lg bg-blue-50 border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-blue-600" />
                    <h4 className="text-sm font-medium text-blue-900">
                      Select People
                    </h4>
                  </div>
                  {selectedUsers.length > 0 && (
                    <span className="text-xs bg-social text-white px-2 py-1 rounded-full">
                      {selectedUsers.length} selected
                    </span>
                  )}
                </div>

                {loadingUsers ? (
                  <div className="text-sm text-gray-500 py-4 text-center">
                    <div className="animate-pulse">
                      Loading your followers...
                    </div>
                  </div>
                ) : availableUsers.length > 0 ? (
                  <div>
                    <p className="text-xs text-gray-600 mb-2">
                      Choose who can see this post:
                    </p>
                    <ScrollArea className="h-36 border rounded bg-white p-2">
                      <div className="space-y-3">
                        {availableUsers.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center space-x-3 hover:bg-gray-50 p-2 rounded"
                          >
                            <Checkbox
                              id={`user-${user.id}`}
                              checked={selectedUsers.includes(user.id)}
                              onCheckedChange={(checked) =>
                                handleUserSelect(user.id, checked)
                              }
                            />
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={formatAvatarUrl(user.avatar)} />
                              <AvatarFallback className="text-xs">
                                {user.firstname?.[0] ||
                                  user.firstName?.[0] ||
                                  "?"}
                                {user.lastname?.[0] ||
                                  user.lastName?.[0] ||
                                  "?"}
                              </AvatarFallback>
                            </Avatar>
                            <Label
                              htmlFor={`user-${user.id}`}
                              className="text-sm cursor-pointer flex-1 font-medium"
                            >
                              {user.firstname || user.firstName}{" "}
                              {user.lastname || user.lastName}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    {selectedUsers.length === 0 && (
                      <p className="text-xs text-amber-600 mt-2">
                        ⚠️ Please select at least one person to share with
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 py-6 text-center bg-white rounded border-2 border-dashed">
                    <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="font-medium">No followers available</p>
                    <p className="text-xs mt-1">
                      You need followers to share posts with selected people.
                    </p>
                    <p className="text-xs text-blue-600 mt-2">
                      Try connecting with other users first!
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>

          <CardFooter
            className={`border-t flex justify-between items-center p-3 ${isMobile ? "border-x-0" : ""}`}
          >
            <div>
              <label htmlFor="image-upload" className="cursor-pointer">
                <div className="flex items-center text-gray-500 hover:text-gray-700">
                  <Image className="h-5 w-5 mr-1" />
                  <span className="text-sm">Add Photos</span>
                </div>
                <input
                  type="file"
                  id="image-upload"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={images.length >= 4}
                />
              </label>
            </div>
            <Button
              type="submit"
              className="bg-social hover:bg-social-dark"
              disabled={
                isSubmitting ||
                (!content.trim() && imageFiles.length === 0) ||
                (privacy === PRIVACY_LEVELS.SELECTED &&
                  selectedUsers.length === 0)
              }
            >
              {isSubmitting ? "Posting..." : "Post"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default PostForm;
