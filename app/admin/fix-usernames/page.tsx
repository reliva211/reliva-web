"use client";

import { useState } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
// Simple username generation function
const generateUsername = (displayName: string): string => {
  const cleanName = displayName
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .trim();
  const timestamp = Date.now();
  return `${cleanName}_${timestamp}`;
};
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProfileToFix {
  id: string;
  displayName: string;
  currentUsername: string;
  newUsername: string;
}

export default function FixUsernamesPage() {
  const [profiles, setProfiles] = useState<ProfileToFix[]>([]);
  const [loading, setLoading] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const scanProfiles = async () => {
    setLoading(true);
    setResults([]);
    
    try {
      const profilesRef = collection(db, "userProfiles");
      const querySnapshot = await getDocs(profilesRef);
      
      const profilesToFix: ProfileToFix[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const currentUsername = data.username || "";
        const displayName = data.displayName || "Unknown User";
        
        // Check if username needs updating (doesn't follow new format)
        if (!currentUsername || !currentUsername.includes("_") || currentUsername.startsWith("user_")) {
          const newUsername = generateUsername(displayName);
          profilesToFix.push({
            id: doc.id,
            displayName,
            currentUsername,
            newUsername
          });
        }
      });
      
      setProfiles(profilesToFix);
      setResults([`Found ${profilesToFix.length} profiles that need username updates.`]);
    } catch (error) {
      console.error("Error scanning profiles:", error);
      setResults(["Error scanning profiles: " + (error as Error).message]);
    } finally {
      setLoading(false);
    }
  };

  const fixUsernames = async () => {
    setFixing(true);
    const newResults: string[] = [];
    
    try {
      for (const profile of profiles) {
        try {
          const docRef = doc(db, "userProfiles", profile.id);
          await updateDoc(docRef, {
            username: profile.newUsername
          });
          newResults.push(`✅ Updated ${profile.displayName}: ${profile.currentUsername} → ${profile.newUsername}`);
        } catch (error) {
          newResults.push(`❌ Failed to update ${profile.displayName}: ${(error as Error).message}`);
        }
      }
      
      setResults(newResults);
      setProfiles([]); // Clear the list after fixing
    } catch (error) {
      setResults([...newResults, "Error during fix: " + (error as Error).message]);
    } finally {
      setFixing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Fix User Usernames</CardTitle>
            <p className="text-muted-foreground">
              This utility will scan and fix usernames to use the new format: DisplayName_timestamp
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-4">
              <Button 
                onClick={scanProfiles} 
                disabled={loading}
                variant="outline"
              >
                {loading ? "Scanning..." : "Scan Profiles"}
              </Button>
              
              {profiles.length > 0 && (
                <Button 
                  onClick={fixUsernames} 
                  disabled={fixing}
                  variant="default"
                >
                  {fixing ? "Fixing..." : `Fix ${profiles.length} Profiles`}
                </Button>
              )}
            </div>

            {profiles.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">Profiles to update:</h3>
                <div className="bg-muted p-4 rounded-lg max-h-60 overflow-y-auto">
                  {profiles.map((profile) => (
                    <div key={profile.id} className="text-sm mb-2">
                      <strong>{profile.displayName}</strong>: 
                      <span className="text-red-600"> {profile.currentUsername || "(no username)"}</span> 
                      → 
                      <span className="text-green-600"> {profile.newUsername}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">Results:</h3>
                <div className="bg-muted p-4 rounded-lg max-h-60 overflow-y-auto">
                  {results.map((result, index) => (
                    <div key={index} className="text-sm mb-1">
                      {result}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
