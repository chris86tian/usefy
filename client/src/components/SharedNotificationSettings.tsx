"use client";

import {
  NotificationSettingsFormData,
  notificationSettingsSchema,
} from "@/lib/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUpdateUserMutation } from "@/state/api";
import { useUser } from "@clerk/nextjs";
import React from "react";
import { useForm } from "react-hook-form";
import Header from "./Header";
import { Form } from "@/components/ui/form";
import { CustomFormField } from "./CustomFormField";
import { Button } from "@/components/ui/button";
import { SignInRequired } from "@/components/SignInRequired";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const SharedNotificationSettings = ({
  title = "Settings",
  subtitle = "Customize your learning experience",
}: SharedNotificationSettingsProps) => {
  const { user } = useUser();
  const [updateUser] = useUpdateUserMutation();

  const currentSettings =
    (user?.publicMetadata as { settings?: UserSettings })?.settings || {};

  const methods = useForm<NotificationSettingsFormData>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      // Notification Settings
      courseNotifications: currentSettings.courseNotifications || false,
      emailAlerts: currentSettings.emailAlerts || false,
      smsAlerts: currentSettings.smsAlerts || false,
      notificationFrequency: currentSettings.notificationFrequency || "daily",
      
      // Course Notifications
      assignmentReminders: currentSettings.assignmentReminders || true,
      dueDateAlerts: currentSettings.dueDateAlerts || true,
      gradePostedNotifications: currentSettings.gradePostedNotifications || true,
      courseAnnouncements: currentSettings.courseAnnouncements || true,
      instructorMessages: currentSettings.instructorMessages || true,
      peerInteractions: currentSettings.peerInteractions || false,
      
      // Learning Preferences
      language: currentSettings.language || "english",
      timeZone: currentSettings.timeZone || "UTC",
      displayMode: currentSettings.displayMode || "light",
      contentDifficulty: currentSettings.contentDifficulty || "adaptive",
      autoPlayVideos: currentSettings.autoPlayVideos || false,
      showCaptions: currentSettings.showCaptions || true,
      
      // Privacy Settings
      profileVisibility: currentSettings.profileVisibility || "all",
      showOnlineStatus: currentSettings.showOnlineStatus || true,
      shareProgress: currentSettings.shareProgress || false,
      allowMessageFromPeers: currentSettings.allowMessageFromPeers || true,
      
      // Study Preferences
      dailyGoalHours: currentSettings.dailyGoalHours || 2,
      preferredStudyTime: currentSettings.preferredStudyTime || "anytime",
      breakReminders: currentSettings.breakReminders || true,
      breakInterval: currentSettings.breakInterval || 45,
    },
  });

  const onSubmit = async (data: NotificationSettingsFormData) => {
    if (!user) return;

    const updatedUser = {
      userId: user.id,
      publicMetadata: {
        ...user.publicMetadata,
        settings: {
          ...currentSettings,
          ...data,
        },
      },
    };

    try {
      await updateUser(updatedUser);
    } catch (error) {
      console.error("Failed to update user settings: ", error);
    }
  };

  if (!user) return <SignInRequired />;

  return (
    <div className="settings-container max-w-4xl">
      <Header title={title} subtitle={subtitle} />
      
      <Form {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)}>
          <Tabs defaultValue="notifications" className="w-full">
            <TabsList className="grid w-full grid-cols-4 rounded-t-lg mb-4">
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="learning">Learning</TabsTrigger>
              <TabsTrigger value="privacy">Privacy</TabsTrigger>
              <TabsTrigger value="study">Study Habits</TabsTrigger>
            </TabsList>

            <TabsContent value="notifications" className="bg-zinc-900 rounded-lg p-4">
                <CardContent className="space-y-4 pt-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">General Notifications</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <CustomFormField
                        name="courseNotifications"
                        label="Course Notifications"
                        type="switch"
                      />
                      <CustomFormField
                        name="emailAlerts"
                        label="Email Alerts"
                        type="switch"
                      />
                      <CustomFormField
                        name="smsAlerts"
                        label="SMS Alerts"
                        type="switch"
                      />
                      <CustomFormField
                        name="notificationFrequency"
                        label="Frequency"
                        type="select"
                        options={[
                          { value: "immediate", label: "Immediate" },
                          { value: "daily", label: "Daily Digest" },
                          { value: "weekly", label: "Weekly Summary" },
                        ]}
                      />
                    </div>

                    <Separator className="my-4" />
                    
                    <h3 className="text-lg font-semibold">Course Updates</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <CustomFormField
                        name="assignmentReminders"
                        label="Assignment Reminders"
                        type="switch"
                      />
                      <CustomFormField
                        name="dueDateAlerts"
                        label="Due Date Alerts"
                        type="switch"
                      />
                      <CustomFormField
                        name="gradePostedNotifications"
                        label="Grade Notifications"
                        type="switch"
                      />
                      <CustomFormField
                        name="courseAnnouncements"
                        label="Course Announcements"
                        type="switch"
                      />
                      <CustomFormField
                        name="instructorMessages"
                        label="Instructor Messages"
                        type="switch"
                      />
                      <CustomFormField
                        name="peerInteractions"
                        label="Peer Interactions"
                        type="switch"
                      />
                    </div>
                  </div>
                </CardContent>
            </TabsContent>

            <TabsContent value="learning" className="bg-zinc-900 rounded-lg p-4">
                <CardContent className="space-y-4 pt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <CustomFormField
                      name="language"
                      label="Interface Language"
                      type="select"
                      options={[
                        { value: "english", label: "English" },
                        { value: "spanish", label: "Spanish" },
                        { value: "french", label: "French" },
                      ]}
                    />
                    <CustomFormField
                      name="timeZone"
                      label="Time Zone"
                      type="select"
                      options={[
                        { value: "UTC", label: "UTC" },
                        { value: "EST", label: "Eastern Time" },
                        { value: "PST", label: "Pacific Time" },
                      ]}
                    />
                    <CustomFormField
                      name="displayMode"
                      label="Display Mode"
                      type="select"
                      options={[
                        { value: "light", label: "Light" },
                        { value: "dark", label: "Dark" },
                        { value: "system", label: "System" },
                      ]}
                    />
                    <CustomFormField
                      name="contentDifficulty"
                      label="Content Difficulty"
                      type="select"
                      options={[
                        { value: "beginner", label: "Beginner" },
                        { value: "intermediate", label: "Intermediate" },
                        { value: "advanced", label: "Advanced" },
                        { value: "adaptive", label: "Adaptive" },
                      ]}
                    />
                    <CustomFormField
                      name="autoPlayVideos"
                      label="Auto-play Videos"
                      type="switch"
                    />
                    <CustomFormField
                      name="showCaptions"
                      label="Show Captions"
                      type="switch"
                    />
                  </div>
                </CardContent>
            </TabsContent>

            <TabsContent value="privacy" className="bg-zinc-900 rounded-lg p-4">
                <CardContent className="space-y-4 pt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <CustomFormField
                      name="profileVisibility"
                      label="Profile Visibility"
                      type="select"
                      options={[
                        { value: "all", label: "Everyone" },
                        { value: "coursemates", label: "Course Mates" },
                        { value: "private", label: "Private" },
                      ]}
                    />
                    <CustomFormField
                      name="showOnlineStatus"
                      label="Show Online Status"
                      type="switch"
                    />
                    <CustomFormField
                      name="shareProgress"
                      label="Share Progress"
                      type="switch"
                    />
                    <CustomFormField
                      name="allowMessageFromPeers"
                      label="Allow Messages from Peers"
                      type="switch"
                    />
                  </div>
                </CardContent>
            </TabsContent>

            <TabsContent value="study" className="bg-zinc-900 rounded-lg p-4">
                <CardContent className="space-y-4 pt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <CustomFormField
                      name="dailyGoalHours"
                      label="Daily Study Goal (hours)"
                      type="number"
                    />
                    <CustomFormField
                      name="preferredStudyTime"
                      label="Preferred Study Time"
                      type="select"
                      options={[
                        { value: "morning", label: "Morning" },
                        { value: "afternoon", label: "Afternoon" },
                        { value: "evening", label: "Evening" },
                        { value: "anytime", label: "Anytime" },
                      ]}
                    />
                    <CustomFormField
                      name="breakReminders"
                      label="Break Reminders"
                      type="switch"
                    />
                    <CustomFormField
                      name="breakInterval"
                      label="Break Interval (minutes)"
                      type="number"
                    />
                  </div>
                </CardContent>
            </TabsContent>
          </Tabs>

          <div className="mt-6 flex justify-end">
            <Button type="submit" className="bg-blue-500 text-white hover:bg-blue-600">
              Save Settings
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default SharedNotificationSettings;