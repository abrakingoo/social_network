'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Image, Upload, FolderPlus, Filter, Search } from 'lucide-react';

const Photos = () => {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
    }
  }, [currentUser, router]);

  // Don't render if user is not authenticated
  if (!currentUser) {
    return null;
  }

  // Mock photos data
  const mockPhotos = [
    {
      id: '1',
      url: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94',
      title: 'Sunset over the mountains',
      album: 'Nature',
      uploadedAt: new Date(2023, 4, 15)
    },
    {
      id: '2',
      url: 'https://images.unsplash.com/photo-1501854140801-50d01698950b',
      title: 'Beach waves',
      album: 'Travel',
      uploadedAt: new Date(2023, 5, 21)
    },
    {
      id: '3',
      url: 'https://images.unsplash.com/photo-1520962922320-2038eebab146',
      title: 'City skyline',
      album: 'Urban',
      uploadedAt: new Date(2023, 3, 10)
    },
    {
      id: '4',
      url: 'https://images.unsplash.com/photo-1496449903678-68ddcb189a24',
      title: 'Coffee time',
      album: 'Lifestyle',
      uploadedAt: new Date(2023, 6, 5)
    },
    {
      id: '5',
      url: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc',
      title: 'Winter landscape',
      album: 'Nature',
      uploadedAt: new Date(2023, 2, 18)
    },
    {
      id: '6',
      url: 'https://images.unsplash.com/photo-1517760444937-f6397edcbbcd',
      title: 'Street photography',
      album: 'Urban',
      uploadedAt: new Date(2023, 5, 30)
    }
  ];

  // Mock albums
  const albums = [...new Set(mockPhotos.map(photo => photo.album))];

  // Filter photos based on the active tab and search query
  const filteredPhotos = mockPhotos.filter(photo => {
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      if (!photo.title.toLowerCase().includes(searchLower) &&
          !photo.album.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    if (activeTab === 'all') return true;
    return photo.album === activeTab;
  });

  const handleUploadPhoto = () => {
    toast({
      title: 'Upload feature',
      description: 'Photo upload functionality would be implemented here.',
    });
  };

  const handleCreateAlbum = () => {
    toast({
      title: 'Create album',
      description: 'Album creation functionality would be implemented here.',
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <Card className="mb-6">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <CardTitle className="text-xl">Photos</CardTitle>
          <div className="flex space-x-2 mt-2 sm:mt-0">
            <Button onClick={handleCreateAlbum} variant="outline" size="sm">
              <FolderPlus className="h-4 w-4 mr-2" />
              Create Album
            </Button>
            <Button onClick={handleUploadPhoto} className="bg-social hover:bg-social-dark" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Upload Photo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search photos"
              className="pl-10"
            />
          </div>

          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="all">All Photos</TabsTrigger>
              {albums.map(album => (
                <TabsTrigger key={album} value={album}>{album}</TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all" className="mt-0">
              {filteredPhotos.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredPhotos.map((photo) => (
                    <div key={photo.id} className="overflow-hidden rounded-lg shadow-sm">
                      <div className="relative aspect-square overflow-hidden bg-gray-100">
                        <img
                          src={photo.url}
                          alt={photo.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="p-2">
                        <h3 className="text-sm font-medium truncate">{photo.title}</h3>
                        <p className="text-xs text-gray-500">{photo.album}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <Image className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-medium">No photos found</h3>
                  <p className="text-gray-500 mt-1">
                    {searchQuery
                      ? `No photos matching "${searchQuery}"`
                      : "You haven't uploaded any photos yet"
                    }
                  </p>
                  <Button onClick={handleUploadPhoto} className="mt-4 bg-social hover:bg-social-dark">
                    Upload Your First Photo
                  </Button>
                </div>
              )}
            </TabsContent>

            {albums.map(album => (
              <TabsContent key={album} value={album} className="mt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredPhotos.filter(photo => photo.album === album).map((photo) => (
                    <div key={photo.id} className="overflow-hidden rounded-lg shadow-sm">
                      <div className="relative aspect-square overflow-hidden bg-gray-100">
                        <img
                          src={photo.url}
                          alt={photo.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="p-2">
                        <h3 className="text-sm font-medium truncate">{photo.title}</h3>
                        <p className="text-xs text-gray-500">
                          {new Date(photo.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Photos;

