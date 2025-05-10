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
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('account');

  // Form states
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    about: ''
  });

  const [privacy, setPrivacy] = useState({
    isPublic: true,
    showEmail: false,
    showPhone: false,
    showLocation: true
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
    if (!currentUser) {
      router.push('/login');
      return;
    }

    // Load user data
    if (currentUser) {
      setProfile({
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        location: currentUser.location || '',
        about: currentUser.about || ''
      });

      setPrivacy({
        isPublic: currentUser.isPublic !== undefined ? currentUser.isPublic : true,
        showEmail: currentUser.showEmail !== undefined ? currentUser.showEmail : false,
        showPhone: currentUser.showPhone !== undefined ? currentUser.showPhone : false,
        showLocation: currentUser.showLocation !== undefined ? currentUser.showLocation : true
      });
    }
  }, [currentUser, router]);

  // Don't render if user is not authenticated
  if (!currentUser) {
    return null;
  }

  const saveSettings = (section) => {
    // In a real app, this would save to backend
    toast({
      title: "Settings updated",
      description: `Your ${section} settings have been saved.`,
      variant: "success",
    });
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
              <TabsTrigger value="privacy" className="flex items-center">
                <Lock className="h-4 w-4 mr-2" />
                Privacy
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="appearance" className="flex items-center">
                <Palette className="h-4 w-4 mr-2" />
                Appearance
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

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <Input
                        id="phone"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <Input
                        id="location"
                        value={profile.location}
                        onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="about">About</Label>
                  <textarea
                    id="about"
                    className="w-full min-h-[100px] p-2 border rounded-md"
                    value={profile.about}
                    onChange={(e) => setProfile({ ...profile, about: e.target.value })}
                  />
                </div>

                <Button
                  onClick={() => saveSettings('account')}
                  className="bg-social hover:bg-social-dark"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Account Settings
                </Button>
              </div>
            </TabsContent>

            {/* Privacy Settings */}
            <TabsContent value="privacy">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="publicProfile">Public Profile</Label>
                    <div className="text-sm text-gray-500">
                      Allow others to find your profile
                    </div>
                  </div>
                  <Switch
                    id="publicProfile"
                    checked={privacy.isPublic}
                    onCheckedChange={(checked) => setPrivacy({ ...privacy, isPublic: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="showEmail">Show Email</Label>
                    <div className="text-sm text-gray-500">
                      Display your email on your profile
                    </div>
                  </div>
                  <Switch
                    id="showEmail"
                    checked={privacy.showEmail}
                    onCheckedChange={(checked) => setPrivacy({ ...privacy, showEmail: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="showPhone">Show Phone Number</Label>
                    <div className="text-sm text-gray-500">
                      Display your phone number on your profile
                    </div>
                  </div>
                  <Switch
                    id="showPhone"
                    checked={privacy.showPhone}
                    onCheckedChange={(checked) => setPrivacy({ ...privacy, showPhone: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="showLocation">Show Location</Label>
                    <div className="text-sm text-gray-500">
                      Display your location on your profile
                    </div>
                  </div>
                  <Switch
                    id="showLocation"
                    checked={privacy.showLocation}
                    onCheckedChange={(checked) => setPrivacy({ ...privacy, showLocation: checked })}
                  />
                </div>

                <Button
                  onClick={() => saveSettings('privacy')}
                  className="bg-social hover:bg-social-dark"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Privacy Settings
                </Button>
              </div>
            </TabsContent>

            {/* Notification Settings */}
            <TabsContent value="notifications">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="newMessage">New Messages</Label>
                    <div className="text-sm text-gray-500">
                      Get notified when you receive a message
                    </div>
                  </div>
                  <Switch
                    id="newMessage"
                    checked={notifications.newMessage}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, newMessage: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="newComment">New Comments</Label>
                    <div className="text-sm text-gray-500">
                      Get notified when someone comments on your post
                    </div>
                  </div>
                  <Switch
                    id="newComment"
                    checked={notifications.newComment}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, newComment: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="friendRequest">Friend Requests</Label>
                    <div className="text-sm text-gray-500">
                      Get notified about new friend requests
                    </div>
                  </div>
                  <Switch
                    id="friendRequest"
                    checked={notifications.friendRequest}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, friendRequest: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="taggedPost">Tagged Posts</Label>
                    <div className="text-sm text-gray-500">
                      Get notified when you're tagged in a post
                    </div>
                  </div>
                  <Switch
                    id="taggedPost"
                    checked={notifications.taggedPost}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, taggedPost: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="emailNotifications">Email Notifications</Label>
                    <div className="text-sm text-gray-500">
                      Receive email notifications
                    </div>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={notifications.emailNotifications}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, emailNotifications: checked })}
                  />
                </div>

                <Button
                  onClick={() => saveSettings('notification')}
                  className="bg-social hover:bg-social-dark"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Notification Settings
                </Button>
              </div>
            </TabsContent>

            {/* Appearance Settings */}
            <TabsContent value="appearance">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="darkMode">Dark Mode</Label>
                    <div className="text-sm text-gray-500">
                      Use dark theme
                    </div>
                  </div>
                  <Switch
                    id="darkMode"
                    checked={appearance.darkMode}
                    onCheckedChange={(checked) => setAppearance({ ...appearance, darkMode: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="highContrast">High Contrast</Label>
                    <div className="text-sm text-gray-500">
                      Improve text visibility
                    </div>
                  </div>
                  <Switch
                    id="highContrast"
                    checked={appearance.highContrast}
                    onCheckedChange={(checked) => setAppearance({ ...appearance, highContrast: checked })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fontSize">Font Size</Label>
                  <select
                    id="fontSize"
                    className="w-full p-2 border rounded-md"
                    value={appearance.fontSize}
                    onChange={(e) => setAppearance({ ...appearance, fontSize: e.target.value })}
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="reducedMotion">Reduced Motion</Label>
                    <div className="text-sm text-gray-500">
                      Minimize animations
                    </div>
                  </div>
                  <Switch
                    id="reducedMotion"
                    checked={appearance.reducedMotion}
                    onCheckedChange={(checked) => setAppearance({ ...appearance, reducedMotion: checked })}
                  />
                </div>

                <Button
                  onClick={() => saveSettings('appearance')}
                  className="bg-social hover:bg-social-dark"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Appearance Settings
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