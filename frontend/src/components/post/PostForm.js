import React, { useState, useEffect } from 'react';
import { Image, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import {
  RadioGroup,
  RadioGroupItem
} from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { usePosts, PRIVACY_LEVELS } from '@/context/PostContext';

const PostForm = () => {
  const [content, setContent] = useState('');
  const [privacy, setPrivacy] = useState(PRIVACY_LEVELS.PUBLIC);
  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const { currentUser } = useAuth();
  const { addPost } = usePosts();

  // Check if we're on mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkIfMobile();

    // Add event listener
    window.addEventListener('resize', checkIfMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  if (!currentUser) return null;

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      // In a real app, this would upload to a server
      // For this demo, we'll use URL.createObjectURL
      const newImages = Array.from(e.target.files).map(file => URL.createObjectURL(file));
      setImages(prev => [...prev, ...newImages].slice(0, 4)); // Limit to 4 images
    }
  };

  const removeImage = (indexToRemove) => {
    setImages(images.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim() && images.length === 0) return;

    setIsSubmitting(true);

    try {
      addPost({
        content: content.trim(),
        images: [...images], // Clone the array
        privacy
      });

      // Reset form
      setContent('');
      setPrivacy(PRIVACY_LEVELS.PUBLIC);
      setImages([]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayName = currentUser.nickname || `${currentUser.firstName} ${currentUser.lastName}`;

  return (
    <div className={`max-w-4xl mx-auto ${isMobile ? '-mx-4' : ''}`}>
      <Card className={`mb-1 bg-white ${isMobile ? 'shadow-none rounded-none border-x-0' : 'shadow-sm'}`}>
      <form onSubmit={handleSubmit}>
        <CardContent className="pt-4">
          <div className="flex space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={currentUser.avatar} alt={displayName} />
              <AvatarFallback>{currentUser.firstName[0]}{currentUser.lastName[0]}</AvatarFallback>
            </Avatar>
            <Textarea
              placeholder={`What's on your mind, ${currentUser.firstName}?`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          {images.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-3">
              {images.map((img, index) => (
                <div key={index} className="relative rounded-md overflow-hidden">
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
              onValueChange={setPrivacy}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={PRIVACY_LEVELS.PUBLIC} id="privacy-public" />
                <Label htmlFor="privacy-public" className="text-sm">Public - Anyone can see</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={PRIVACY_LEVELS.FOLLOWERS} id="privacy-followers" />
                <Label htmlFor="privacy-followers" className="text-sm">Followers - Only people who follow you</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={PRIVACY_LEVELS.SELECTED} id="privacy-selected" />
                <Label htmlFor="privacy-selected" className="text-sm">Selected people only</Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>

        <CardFooter className={`border-t flex justify-between items-center p-3 ${isMobile ? 'border-x-0' : ''}`}>
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
            disabled={isSubmitting || (!content.trim() && images.length === 0)}
          >
            {isSubmitting ? 'Posting...' : 'Post'}
          </Button>
        </CardFooter>
      </form>
    </Card>
    </div>
  );
};

export default PostForm;
