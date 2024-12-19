"use client";

import Loading from "@/components/Loading";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGetNotificationsQuery } from "@/state/api";
import { useUser } from "@clerk/nextjs";
import React from "react";

const UserNotifications = () => {
  const { user, isLoaded } = useUser();
  const { data: notifications, isLoading: isLoadingNotifications } =
    useGetNotificationsQuery(user?.id || "", {
      skip: !isLoaded || !user,
    });

  if (!isLoaded) return <Loading />;
  if (!user) return <div>Please sign in to view your notifications.</div>;

  return (
    <div className="notifications">
      <div className="notifications__container">
        <h2 className="notifications__title">Notifications</h2>

        <div className="notifications__grid">
          {isLoadingNotifications ? (
            <Loading />
          ) : (
            <Table className="notifications__table">
              <TableHeader className="notifications__table-header">
                <TableRow className="notifications__table-header-row">
                  <TableHead className="notifications__table-cell">Date</TableHead>
                  <TableHead className="notifications__table-cell">
                    Notification
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="notifications__table-body">
                {notifications?.length > 0 ? (
                  notifications.map((notification) => (
                    <TableRow
                      className="notifications__table-row"
                      key={notification.id}
                    >
                      <TableCell className="notifications__table-cell">
                        {new Date(notification.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="notifications__table-cell">
                        {notification.message}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow className="notifications__table-row">
                    <TableCell
                      className="notifications__table-cell text-center"
                      colSpan={2}
                    >
                      No notifications to display
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserNotifications;
