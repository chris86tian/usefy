"use client";

import React, { useState } from "react";
import {
  useGetUsersQuery,
  usePromoteUserToAdminMutation,
  useDemoteUserFromAdminMutation,
  useDeleteUserMutation,
} from "@/state/api";
import { Button } from "@/components/ui/button";
import Loading from "@/components/Loading";
import Header from "@/components/Header";
import { useUser, useClerk } from "@clerk/nextjs";

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
  const [promoteUserToAdmin] = usePromoteUserToAdminMutation();
  const [demoteUserFromAdmin] = useDemoteUserFromAdminMutation();
  const [deleteUser] = useDeleteUserMutation();

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
  if (data.data.length === 0) return <div>No users found.</div>;

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
            const userType = user.publicMetadata?.userType ?? "Unknown";
            const email = user.emailAddresses?.[0]?.emailAddress ?? "No email";

            return (
              <tr key={user.id}>
                <td className="border-b border-gray-200 p-2">
                  {user.firstName || "Unknown"}
                </td>
                <td className="border-b border-gray-200 p-2">{email}</td>
                <td className="border-b border-gray-200 p-2">
                  {userType[0]?.toUpperCase() + userType.slice(1)}
                </td>
                <td className="border-b border-gray-200 p-2">
                  {user.id === userId ? (
                    <Button
                      className="bg-gray-700 text-white px-4 py-2 rounded mr-2"
                      onClick={() => signOut()}
                    >
                      Sign Out
                    </Button>
                  ) : (
                    <>
                      {user.publicMetadata?.userType !== "teacher" && (
                        <Button
                          className="bg-gray-100 text-gray-800 px-4 py-2 rounded mr-2"
                          onClick={() => handlePromote(user.id)}
                        >
                          Promote
                        </Button>
                      )}
                      {user.publicMetadata?.userType === "teacher" && (
                        <Button
                          className="bg-gray-100 text-gray-800 px-4 py-2 rounded mr-2"
                          onClick={() => handleDemote(user.id)}
                        >
                          Demote
                        </Button>
                      )}
                      <Button
                        className="bg-gray-700 text-white px-4 py-2 rounded"
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
