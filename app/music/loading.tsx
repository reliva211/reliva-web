"use client"; 
import { useAuth } from "../context/Authcontext";

export default function Loading() {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;  // Show loading if still fetching the user state
  if (!user) return <div>Please log in</div>;  // Handle if no user is logged in
}
