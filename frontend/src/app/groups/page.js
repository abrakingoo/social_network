'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
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
import { Users, Search, Plus, UserPlus } from 'lucide-react';

const Groups = () => {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Mock groups data
  const mockGroups = [
    {
      id: '1',
      name: 'Photography Enthusiasts',
      description: 'A group for sharing photography tips, gear recommendations, and amazing photos!',
      coverImage: null,
      memberCount: 452,
      isJoined: true,
      isAdmin: false
    },
    {
      id: '2',
      name: 'Book Club',
      description: 'We discuss a new book every month. Join us for thoughtful conversations about literature!',
      coverImage: null,
      memberCount: 126,
      isJoined: true,
      isAdmin: true
    },
    {
      id: '3',
      name: 'Tech Talks',
      description: 'Discussions about the latest in technology, programming, and digital innovation.',
      coverImage: null,
      memberCount: 872,
      isJoined: false,
      isAdmin: false
    },
    {
      id: '4',
      name: 'Fitness Motivation',
      description: 'Share your fitness journey, workout routines, nutrition tips, and stay motivated together!',
      coverImage: null,
      memberCount: 350,
      isJoined: false,
      isAdmin: false
    }
  ];

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!currentUser) {
      router.push('/login');
    }
  }, [currentUser, router]);

  // Don't render content if user is not authenticated
  if (!currentUser) {
    return null;
  }

  const handleCreateGroup = (e) => {
    e.preventDefault();

    if (!newGroupName.trim()) {
      toast({
        title: "Error",
        description: "Group name is required",
        variant: "destructive"
      });
      return;
    }

    // In a real app, this would call an API to create the group
    toast({
      title: "Group created",
      description: `${newGroupName} has been created successfully!`,
    });

    // Reset form and close dialog
    setNewGroupName('');
    setNewGroupDescription('');
    setIsCreateOpen(false);
  };

  const handleJoinGroup = (groupId) => {
    // In a real app, this would call an API to join the group
    toast({
      title: "Group joined",
      description: "You have successfully joined the group!",
    });
  };

  // Filter groups based on search query
  const filteredGroups = searchQuery
    ? mockGroups.filter(group =>
        group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : mockGroups;

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
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" className="bg-social hover:bg-social-dark">Create Group</Button>
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

                <TabsContent value="all" className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredGroups.map((group) => (
              <Card key={group.id} className="overflow-hidden bg-white shadow-sm">
                        <div className="h-32 bg-gradient-to-r from-social/20 to-social-accent/20"></div>
                        <CardHeader className="relative pt-0">
                          <div className="absolute -top-6 left-4">
                            <Avatar className="h-12 w-12 border-2 border-white">
                              <AvatarFallback className="bg-social text-white">
                                {group.name.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="ml-14 pt-2">
                    <Link href={`/groups/${group.id}`} className="text-lg font-semibold hover:text-social">
                              {group.name}
                            </Link>
                            <p className="text-sm text-gray-500">{group.memberCount} members</p>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600 line-clamp-3">
                            {group.description}
                          </p>
                        </CardContent>
                        <CardFooter className="border-t pt-4 pb-4">
                          {group.isJoined ? (
                            <Button variant="outline" className="w-full" asChild>
                      <Link href={`/groups/${group.id}`}>
                                {group.isAdmin ? 'Manage Group' : 'View Group'}
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

                  {filteredGroups.length === 0 && (
                    <div className="text-center py-10">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <h3 className="text-lg font-medium">No groups found</h3>
                      <p className="text-gray-500 mt-1">
                        {searchQuery
                          ? `No groups matching "${searchQuery}"`
                          : "There are no groups available right now"
                        }
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="joined" className="mt-0">
                  {/* Will filter and show only joined groups */}
                </TabsContent>

                <TabsContent value="discover" className="mt-0">
                  {/* Will filter and show only groups to discover */}
                </TabsContent>
              </Tabs>
    </div>
  );
};

export default Groups;
