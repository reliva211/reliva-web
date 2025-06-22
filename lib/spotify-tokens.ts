import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Store tokens for the current user
export async function storeSpotifyTokens(
  accessToken: string,
  refreshToken: string,
  expiresIn: number
) {
  const user = getAuth().currentUser;
  if (!user) return;
  const expiresAt = Date.now() + expiresIn * 1000;
  await setDoc(
    doc(db, "users", user.uid),
    {
      spotify: {
        accessToken,
        refreshToken,
        expiresAt,
        connected: true,
      },
    },
    { merge: true }
  );
}

// Get tokens for the current user, refresh if expired
export async function getSpotifyTokensForCurrentUser() {
  const user = getAuth().currentUser;
  if (!user) return null;
  const userDoc = await getDoc(doc(db, "users", user.uid));
  const spotify = userDoc.exists() ? userDoc.data().spotify : null;
  if (!spotify || !spotify.accessToken) return null;

  // Check if token is expired
  if (
    spotify.expiresAt &&
    Date.now() > spotify.expiresAt &&
    spotify.refreshToken
  ) {
    // Refresh token
    const params = new URLSearchParams();
    params.append("grant_type", "refresh_token");
    params.append("refresh_token", spotify.refreshToken);
    params.append("client_id", process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!);
    params.append(
      "client_secret",
      process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET!
    );

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const data = await response.json();
    if (data.access_token) {
      await storeSpotifyTokens(
        data.access_token,
        data.refresh_token || spotify.refreshToken,
        data.expires_in
      );
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || spotify.refreshToken,
      };
    }
    return null;
  }

  return {
    accessToken: spotify.accessToken,
    refreshToken: spotify.refreshToken,
  };
}

// Disconnect Spotify for the current user
export async function disconnectSpotify() {
  const user = getAuth().currentUser;
  if (!user) return;
  await updateDoc(doc(db, "users", user.uid), {
    spotify: {},
  });
}
