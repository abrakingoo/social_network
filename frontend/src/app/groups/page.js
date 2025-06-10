'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { groupService } from '@/services/groupService';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Users, Search, Plus, UserPlus, Loader2 } from 'lucide-react';

const Groups = () => {
  const router = useRouter();
  const { currentUser, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Debug logs for auth state
  useEffect(() => {
    console.log('[Groups] Auth state:', { currentUser, authLoading });
  }, [currentUser, authLoading]);

  // Fetch groups on component mount
  useEffect(() => {
    const fetchGroups = async () => {
      // Only fetch if we're sure user is authenticated
      if (!currentUser || authLoading) return;

      console.log('[Groups] Fetching groups for user:', currentUser.id);
      try {
        setIsLoading(true);
        const fetchedGroups = await groupService.getAllGroups();
        setGroups(fetchedGroups);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load groups. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroups();
  }, [currentUser, authLoading, toast]);

  // Redirect to login only if we're sure user is not authenticated
  useEffect(() => {
    if (!authLoading && !currentUser) {
      console.log('[Groups] No authenticated user, redirecting to login');
      router.push('/login');
    }
  }, [currentUser, authLoading, router]);

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-social" />
      </div>
    );
  }

  // Don't render content if user is not authenticated (after loading)
  if (!currentUser) {
    return null;
  }

  const handleCreateGroup = async (e) => {
    e.preventDefault();

    // Validate input
    if (!newGroupName.trim()) {
      toast({
        title: "Error",
        description: "Group name is required",
        variant: "destructive"
      });
      return;
    }

    // Trim whitespace
    const trimmedName = newGroupName.trim();
    const trimmedDescription = newGroupDescription.trim();

    // Validate name length
    if (trimmedName.length < 3) {
      toast({
        title: "Error",
        description: "Group name must be at least 3 characters long",
        variant: "destructive"
      });
      return;
    }

    // Validate name format (alphanumeric and spaces only)
    if (!/^[a-zA-Z0-9\s]+$/.test(trimmedName)) {
      toast({
        title: "Error",
        description: "Group name can only contain letters, numbers, and spaces",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsCreating(true);
      const result = await groupService.createGroup({
        name: trimmedName,
        description: trimmedDescription
      });

      if (result.success) {
        // Refresh groups list
        const updatedGroups = await groupService.getAllGroups();
        setGroups(updatedGroups);

        toast({
          title: "Success",
          description: result.message || `${trimmedName} has been created successfully!`,
        });

        // Reset form and close dialog
        setNewGroupName('');
        setNewGroupDescription('');
        setIsCreateOpen(false);
      } else {
        throw new Error(result.message || 'Failed to create group');
      }
    } catch (error) {
      // Only log unexpected errors to console
      if (!error.message.includes('Group with this title already exists')) {
        console.error('Create group error:', error);
      }
      const errorMessage = error.message || "Failed to create group. Please try again.";
      const toastTitle = errorMessage.includes('Group with this title already exists') ? "Group Already Exists" : "Error";

      toast({
        title: toastTitle,
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinGroup = (groupId) => {
    // This will be implemented in a later phase
    toast({
      title: "Coming soon",
      description: "Group joining functionality will be available soon!",
    });
  };

  // Filter groups based on search query
  const filteredGroups = searchQuery
    ? groups.filter(group =>
        group.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.about.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : groups;

  // Filter groups based on tab
  const getFilteredGroupsByTab = (tab) => {
    switch (tab) {
      case 'joined':
        return filteredGroups.filter(group => group.is_joined);
      case 'discover':
        return filteredGroups.filter(group => !group.is_joined);
      default:
        return filteredGroups;
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-social" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Groups</h1>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-social hover:bg-social-dark">
              <Plus className="h-4 w-4 mr-2" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreateGroup}>
              <DialogHeader>
                <DialogTitle>Create a New Group</DialogTitle>
                <DialogDescription>
                  Fill in the details to create your own group community.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Group Name*</Label>
                  <Input
                    id="name"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Enter group name"
                    required
                    disabled={isCreating}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newGroupDescription}
                    onChange={(e) => setNewGroupDescription(e.target.value)}
                    placeholder="What is your group about?"
                    rows={4}
                    disabled={isCreating}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  className="bg-social hover:bg-social-dark"
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Group'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search groups"
          className="pl-10"
        />
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid grid-cols-3 w-full mb-6">
          <TabsTrigger value="all">All Groups</TabsTrigger>
          <TabsTrigger value="joined">My Groups</TabsTrigger>
          <TabsTrigger value="discover">Discover</TabsTrigger>
        </TabsList>

        {['all', 'joined', 'discover'].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getFilteredGroupsByTab(tab).map((group) => (
                <Card key={group.id} className="overflow-hidden bg-white shadow-sm">
                  <div className="h-32 bg-gradient-to-r from-social/20 to-social-accent/20"></div>
                  <CardHeader className="relative pt-0">
                    <div className="absolute -top-6 left-4">
                      <Avatar className="h-12 w-12 border-2 border-white">
                        <AvatarFallback className="bg-social text-white">
                          {group.title.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="ml-16">
                      <Link href={`/groups/${group.id}`} className="text-lg font-semibold hover:text-social">
                        {group.title}
                      </Link>
                      <p className="text-sm text-gray-500">{group.members_count} members</p>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {group.about}
                    </p>
                  </CardContent>
                  <CardFooter className="border-t pt-4 pb-4">
                    {group.is_joined ? (
                      <Button variant="outline" className="w-full" asChild>
                        <Link href={`/groups/${group.id}`}>
                          {group.user_role === 'admin' ? 'Manage Group' : 'View Group'}
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        className="w-full bg-social hover:bg-social-dark"
                        onClick={() => handleJoinGroup(group.id)}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Join Group
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>

            {getFilteredGroupsByTab(tab).length === 0 && (
              <div className="text-center py-10">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium">No groups found</h3>
                <p className="text-gray-500 mt-1">
                  {searchQuery
                    ? `No groups matching "${searchQuery}"`
                    : tab === 'joined'
                    ? "You haven't joined any groups yet"
                    : tab === 'discover'
                    ? "No groups available to discover"
                    : "There are no groups available right now"
                  }
                </p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default Groups;
