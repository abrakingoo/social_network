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

          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;