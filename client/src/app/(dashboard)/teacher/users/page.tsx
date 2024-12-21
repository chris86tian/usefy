'use client';

import React, { useState } from 'react';
import { useGetUsersQuery } from '@/state/api';
import { Button } from '@/components/ui/button';
import Loading from '@/components/Loading';
import Header from '@/components/Header';
import { useUser, useClerk } from '@clerk/nextjs';

type UserType = {
  id: string;
  firstName: string;
  emailAddresses: { emailAddress: string }[];
  publicMetadata?: { userType?: string };
  role?: string;
};

const Users = () => {
  const { data, isLoading, isError, refetch } = useGetUsersQuery();
  const [error, setError] = useState<string | null>(null);
  const user = useUser().user;
  const userId = user?.id;
  const { signOut } = useClerk();

  // Handle promoting a user to admin
  const handlePromote = async (targetUserId: string) => {
    try {
      // Replace with API call
      // await promoteUserToAdmin(targetUserId);
      await refetch();
    } catch {
      setError('Error promoting user.');
    }
  };

  // Handle demoting a user from admin
  const handleDemote = async (targetUserId: string) => {
    try {
      // Replace with API call
      // await demoteUserFromAdmin(targetUserId);
      await refetch();
    } catch {
      setError('Error demoting user.');
    }
  };

  // Handle deleting a user
  const handleDelete = async (targetUserId: string) => {
    try {
      // Replace with API call
      // await deleteUser(targetUserId);
      await refetch();
    } catch {
      setError('Error deleting user.');
    }
  };

  if (isLoading) return <Loading />;
  if (isError || !data) return <div>Error loading users.</div>;
  if (!data.data?.length) return <div>No users found.</div>;

  // Sort users so the logged-in user is first
  const sortedUsers = [...data.data].sort((a: UserType, b: UserType) => {
    if (a.id === userId) return -1;
    if (b.id === userId) return 1;
    return 0;
  });

  return (
    <>
      <Header title="Users" subtitle="Manage all users" />

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <table className="min-w-full table-auto border-collapse border border-gray-300 rounded-lg">
        <thead>
          <tr>
            <th className="border-b border-gray-200 p-2 text-left">Username</th>
            <th className="border-b border-gray-200 p-2 text-left">Email</th>
            <th className="border-b border-gray-200 p-2 text-left">Role</th>
            <th className="border-b border-gray-200 p-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedUsers.map((user: UserType) => {
            const userType = user.publicMetadata?.userType ?? 'Unknown';
            const email = user.emailAddresses?.[0]?.emailAddress ?? 'No email';

            return (
              <tr key={user.id}>
                <td className="border-b border-gray-200 p-2">{user.firstName || 'Unknown'}</td>
                <td className="border-b border-gray-200 p-2">{email}</td>
                <td className="border-b border-gray-200 p-2">
                  {userType[0]?.toUpperCase() + userType.slice(1)}
                </td>
                <td className="border-b border-gray-200 p-2">
                  {user.id === userId ? (
                    <Button
                      className="bg-blue-900 text-white px-4 py-2 rounded"
                      onClick={() => signOut()}
                    >
                      Sign Out
                    </Button>
                  ) : (
                    <>
                      {user.role !== 'admin' && (
                        <Button
                          className="bg-blue-900 text-white px-4 py-2 rounded mr-2"
                          onClick={() => handlePromote(user.id)}
                        >
                          Promote to Admin
                        </Button>
                      )}
                      {user.role === 'admin' && (
                        <Button
                          className="bg-blue-900 text-white px-4 py-2 rounded mr-2"
                          onClick={() => handleDemote(user.id)}
                        >
                          Demote from Admin
                        </Button>
                      )}
                      <Button
                        className="bg-red-500 text-white px-4 py-2 rounded"
                        onClick={() => handleDelete(user.id)}
                      >
                        Delete User
                      </Button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
};

export default Users;
