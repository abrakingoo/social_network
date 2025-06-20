'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  User,
  Lock,
  Bell,
  Palette,
  Mail,
  Phone,
  MapPin,
  Save,
  Check,
  X
} from 'lucide-react';

const Settings = () => {
  const router = useRouter();
  const { currentUser, loading, checkAuth } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('account');

  // Form states
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    date_of_birth: '',
    about: '',
    nickname: '',
    is_public: true
  });

  const [notifications, setNotifications] = useState({
    newMessage: true,
    newComment: true,
    friendRequest: true,
    taggedPost: true,
    emailNotifications: false
  });

  const [appearance, setAppearance] = useState({
    darkMode: false,
    highContrast: false,
    fontSize: 'medium',
    reducedMotion: false
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (loading) return; // Wait for the authentication check to complete

    if (!currentUser) {
      router.push('/login');
      return;
    }

    // Load user data
    if (currentUser) {
      setProfile({
        firstName: currentUser.first_name || '',
        lastName: currentUser.last_name || '',
        email: currentUser.email || '',
        date_of_birth: currentUser.date_of_birth ? new Date(currentUser.date_of_birth).toISOString().split('T')[0] : '',
        about: currentUser.about_me || '',
        nickname: currentUser.nickname || '',
        is_public: currentUser.is_public !== undefined ? currentUser.is_public : true
      });

    }
  }, [currentUser, router, loading]);

  // Don't render if user is not authenticated
  if (loading || !currentUser) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  const saveSettings = async (section) => {
    if (section === 'account') {
      try {
        const payload = {
          first_name: profile.firstName,
          last_name: profile.lastName,
          email: profile.email,
          date_of_birth: profile.date_of_birth ? new Date(profile.date_of_birth).toISOString() : '',
          nickname: profile.nickname,
          about_me: profile.about,
          is_public: profile.is_public,
        };

        // Remove empty fields from payload to avoid sending unnecessary data
        Object.keys(payload).forEach(key => {
          if (payload[key] === '' || payload[key] === null) {
            delete payload[key];
          }
        });

        // Use environment variable consistent with other parts of the app
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiBaseUrl}/api/updateUser`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          credentials: 'include', // Ensure cookies are sent with the request
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to update profile');
        }

        const data = await response.json();
        toast({
          title: 'Success',
          description: data.message || 'Profile updated successfully',
          status: 'success',
          duration: 3000,
        });
        
        // Refresh user data in AuthContext to ensure profile page shows updated info
        await checkAuth();
      } catch (error) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to update profile',
          status: 'error',
          duration: 5000,
        });
      }
    } else if (section === 'notifications') {
      // TODO: Implement notifications settings update
      toast({
        title: 'Success',
        description: 'Notifications settings saved',
        status: 'success',
        duration: 3000,
      });
    } 
  };

  return (
    <div className="max-w-6xl mx-auto">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl">Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="account" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="account" className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                Account
              </TabsTrigger>
            </TabsList>

            {/* Account Settings */}
            <TabsContent value="account">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={profile.firstName}
                      onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={profile.lastName}
                      onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="date_of_birth">Date of Birth</Label>
                        <Input
                        id="date_of_birth"
                        type="date"
                        value={profile.date_of_birth}
                        onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value })}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nickname">Nickname</Label>
                  <Input
                    id="nickname"
                    value={profile.nickname}
                    onChange={(e) => setProfile({ ...profile, nickname: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="about">About Me</Label>
                  <textarea
                    id="about"
                    className="w-full min-h-[100px] p-2 border rounded-md"
                    value={profile.about}
                    onChange={(e) => setProfile({ ...profile, about: e.target.value })}
                  />
                </div>

                <div className="flex items-center justify-between pt-4 border-t mt-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="publicProfile">Public Profile</Label>
                    <div className="text-sm text-gray-500">
                      Allow others to find your profile
                    </div>
                  </div>
                  <Switch
                    id="publicProfile"
                    checked={profile.is_public}
                    onCheckedChange={(checked) => setProfile({ ...profile, is_public: checked })}
                  />
                </div>

                <Button
                  onClick={() => saveSettings('account')}
                  className="bg-social hover:bg-social-dark mt-6"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </TabsContent>

          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;