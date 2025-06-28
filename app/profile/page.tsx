"use client";
import UserProfile from "@/components/user-profile";
import { useCurrentUser } from "@/hooks/use-current-user";

export default function Page() {
  const user = useCurrentUser();
  return user ? <UserProfile userId={user.uid} /> : null;
}
