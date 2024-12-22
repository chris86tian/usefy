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
import { Box, Typography, List, ListItem, ListItemText, ListItemSecondaryAction, Divider } from "@mui/material";

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
  const users = data?.users.data;

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

  const sortedUsers = [...users].sort((a: UserType, b: UserType) => {
    if (a.id === userId) return -1;
    if (b.id === userId) return 1;
    return 0;
  });

  return (
    <>
      <Header title="Users" subtitle="Manage all users" />
      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}

      <Box
        sx={{
          mt: 4,
          bgcolor: "#2c2c2c",
          p: 3,
          borderRadius: 2,
          color: "#f5f5f5",
        }}
      >
        <List>
          {sortedUsers.map((user: UserType, index: number) => {
            const userType = user.publicMetadata?.userType ?? "Unknown";
            const email = user.emailAddresses?.[0]?.emailAddress ?? "No email";

            return (
              <React.Fragment key={user.id}>
                <ListItem
                  sx={{
                    bgcolor: user.id === userId ? "#424242" : "#333333",
                    borderRadius: 1,
                    mb: 1,
                    p: 2,
                    "&:hover": {
                      bgcolor: "#4a4a4a",
                    },
                  }}
                >
                  <ListItemText
                    primary={`${user.firstName || "Unknown"} (${userType})`}
                    secondary={email}
                    primaryTypographyProps={{
                      fontWeight: user.id === userId ? "bold" : "normal",
                      fontSize: "1.1rem",
                      color: user.id === userId ? "#90caf9" : "#f5f5f5",
                    }}
                    secondaryTypographyProps={{
                      fontSize: "0.9rem",
                      color: "#bdbdbd",
                    }}
                  />
                  <ListItemSecondaryAction>
                    {user.id === userId ? (
                      <Button
                        variant="outline"
                        className="mr-2"
                        onClick={() => signOut()}
                      >
                        Sign Out
                      </Button>
                    ) : (
                      <>
                        {user.publicMetadata?.userType !== "teacher" && (
                          <Button
                            variant="default"
                            className="mr-2 bg-gray-700"
                            onClick={() => handlePromote(user.id)}
                          >
                            Promote
                          </Button>
                        )}
                        {user.publicMetadata?.userType === "teacher" && (
                          <Button
                            variant="default"
                            className="mr-2 bg-gray-700"
                            onClick={() => handleDemote(user.id)}
                          >
                            Demote
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          onClick={() => handleDelete(user.id)}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
                {index < sortedUsers.length - 1 && <Divider sx={{ bgcolor: "#444" }} />}
              </React.Fragment>
            );
          })}
        </List>
      </Box>
    </>
  );
};

export default Users;
