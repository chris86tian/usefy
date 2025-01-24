import SharedNotificationSettings from "@/components/SharedNotificationSettings";
import React from "react";

const Settings = () => {
  return (
    <div className="w-3/5">
      <SharedNotificationSettings
        title="Settings"
        subtitle="Manage your settings"
      />
    </div>
  );
};

export default Settings;