
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";

const AdminPanel = () => {
  const router = useRouter();

  const dashboardItems = [
    { id: 1, title: "Users", description: "Manage all users", link: "/teacher/users" },
    { id: 2, title: "Analitycs", description: "View system analitycs", link: "/teacher/analitycs" }
  ];

  return (
    <>
      <Header title="Admin Panel" subtitle="Manage your platform" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboardItems.map((item) => (
          <div
            key={item.id}
            className="p-4 border border-gray-500 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => router.push(item.link)}
          >
            <h2 className="text-xl font-semibold mb-2">{item.title}</h2>
            <p className="text-gray-600">{item.description}</p>
          </div>
        ))}
      </div>
    </>
  );
};

export default AdminPanel;
