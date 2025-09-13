"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface AvatarContextType {
  avatarUpdates: { [userId: string]: { url: string; timestamp: number } };
  updateAvatar: (userId: string, url: string) => void;
  getAvatarUpdate: (
    userId: string
  ) => { url: string; timestamp: number } | null;
}

const AvatarContext = createContext<AvatarContextType | undefined>(undefined);

export function AvatarProvider({ children }: { children: React.ReactNode }) {
  const [avatarUpdates, setAvatarUpdates] = useState<{
    [userId: string]: { url: string; timestamp: number };
  }>({});

  const updateAvatar = (userId: string, url: string) => {
    console.log(
      "Avatar context: Updating avatar for user",
      userId,
      "with URL",
      url
    );
    setAvatarUpdates((prev) => ({
      ...prev,
      [userId]: { url, timestamp: Date.now() },
    }));
  };

  const getAvatarUpdate = (userId: string) => {
    return avatarUpdates[userId] || null;
  };

  return (
    <AvatarContext.Provider
      value={{ avatarUpdates, updateAvatar, getAvatarUpdate }}
    >
      {children}
    </AvatarContext.Provider>
  );
}

export function useAvatarContext() {
  const context = useContext(AvatarContext);
  if (context === undefined) {
    throw new Error("useAvatarContext must be used within an AvatarProvider");
  }
  return context;
}
