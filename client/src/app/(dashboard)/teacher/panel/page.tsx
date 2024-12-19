
"use client";

import React from "react";
import { useRouter } from "next/navigation";

const AdminPanel = () => {
  const router = useRouter();

  // Mock data for the admin panel
  const dashboardItems = [
    { id: 1, title: "Users", description: "Manage all users.", link: "/admin/users" },
    { id: 2, title: "Courses", description: "Manage courses and content.", link: "/admin/courses" },
    { id: 3, title: "Reports", description: "View system reports.", link: "/admin/reports" },
    { id: 4, title: "Settings", description: "System-wide settings.", link: "/admin/settings" },
  ];

  return (
    <div className="p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="text-secondary-foreground">Manage the system and its content.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboardItems.map((item) => (
          <div
            key={item.id}
            className="p-4 border border-gray-300 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => router.push(item.link)}
          >
            <h2 className="text-xl font-semibold text-primary-600 mb-2">{item.title}</h2>
            <p className="text-gray-600">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminPanel;
