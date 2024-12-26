"use client";

import React, { useState } from "react";
import {
  useGetUsersQuery,
  usePromoteUserToAdminMutation,
  useDemoteUserFromAdminMutation,
  useDeleteUserMutation,
} from "@/state/api";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import Loading from "@/components/Loading";
import Header from "@/components/Header";
import { useUser, useClerk } from "@clerk/nextjs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Crown, Shield, User, UserMinus, LogOut } from "lucide-react";

type User = {
  id: string;
  firstName: string;
  emailAddresses: { emailAddress: string }[];
  publicMetadata?: { userType?: string };
  role?: string;
};

const Users = () => {
  const { data, isLoading, isError, refetch } = useGetUsersQuery();
  const [error, setError] = useState<string | null>(null);
  const currentUser = useUser().user;
  const userId = currentUser?.id;
  const { signOut } = useClerk();
  const [promoteUserToAdmin] = usePromoteUserToAdminMutation();
  const [demoteUserFromAdmin] = useDemoteUserFromAdminMutation();
  const [deleteUser] = useDeleteUserMutation();
  
  const users = data?.users.data 

  const handlePromote = async (userId: string) => {
    try {
      await promoteUserToAdmin(userId);
      refetch();
    } catch (error) {
      setError("Error promoting user: " + error);
    }
  };

  const handleDemote = async (userId: string) => {
    try {
      await demoteUserFromAdmin(userId);
      refetch();
    } catch (error) {
      setError("Error demoting user: " + error);
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      await deleteUser(userId);
      refetch();
    } catch (error) {
      setError("Error deleting user: " + error);
    }
  };

  if (isLoading) return <Loading />;
  if (isError || !data) return <div>Error loading users.</div>;
  if (data?.users.length === 0) return <div>No users found.</div>;

  const sortedUsers = [...users].sort((a: User, b: User) => {
    if (a.id === userId) return -1;
    if (b.id === userId) return 1;
    return 0;
  });

  return (
    <div className="space-y-6">
      <Header title="Users" subtitle="Manage all users" />
      
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

    <Card>
      <CardContent>
        <div className="space-y-4">
          {sortedUsers.map((user: User) => {
            const userType = user.publicMetadata?.userType ?? "User";
            const email = user.emailAddresses?.[0]?.emailAddress ?? "No email";
            const isCurrentUser = user.id === userId;
            const isTeacher = userType === "teacher";

            return (
              <div
                key={user.id}
                className={`
                  relative group rounded-xl p-4
                  ${isCurrentUser 
                    ? 'bg-gray-900/50 hover:bg-gray-900'
                    : 'bg-zinc-900/50 hover:bg-zinc-900'
                  }
                  transition-all duration-200
                `}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border-2 border-zinc-800">
                      <AvatarFallback className="bg-zinc-950 text-zinc-400">
                        {user.firstName?.[0] || ""}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${
                          isCurrentUser ? 'text-blue-400' : 'text-zinc-100'
                        }`}>
                          {user.firstName}
                        </span>
                        {isTeacher && (
                          <Badge variant="secondary" className="bg-blue-900/30 text-blue-400">
                            <Crown className="w-3 h-3 mr-1" />
                            Teacher
                          </Badge>
                        )}
                        {isCurrentUser && (
                          <Badge variant="secondary" className="bg-zinc-800 text-zinc-400">
                            <User className="w-3 h-3 mr-1" />
                            You
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-zinc-400 flex items-center gap-2">
                        {email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isCurrentUser ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => signOut()}
                        className="gap-2 text-zinc-400 hover:text-zinc-100"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </Button>
                    ) : (
                      <>
                        {!isTeacher && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePromote(user.id)}
                            className="gap-2 text-blue-400 hover:text-blue-300"
                          >
                            <Crown className="w-4 h-4" />
                            Promote
                          </Button>
                        )}
                        {isTeacher && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDemote(user.id)}
                            className="gap-2 text-zinc-400 hover:text-zinc-300"
                          >
                            <Shield className="w-4 h-4" />
                            Demote
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(user.id)}
                          className="gap-2 text-red-400 hover:text-red-300 hover:border-red-800/50"
                        >
                          <UserMinus className="w-4 h-4" />
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>

    </div>
  );
};

export default Users;