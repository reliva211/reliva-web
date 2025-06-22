import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/firebase-admin";
import { db } from "@/lib/firebase";
import { setDoc, doc } from "firebase/firestore";

export async function POST(req: NextRequest) {
  const { code, redirectUri } = await req.json();

  // 1. Get the Firebase session cookie from the request
  const sessionCookie = req.cookies.get("session")?.value;
  if (!sessionCookie) {
    return NextResponse.json({ error: "No session cookie" }, { status: 401 });
  }

  // 2. Verify the session cookie and get the UID
  let uid;
  try {
    const decodedToken = await getAuth().verifySessionCookie(
      sessionCookie,
      true
    );
    uid = decodedToken.uid;
  } catch (err) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  // 3. Exchange code for tokens
  const params = new URLSearchParams();
  params.append("grant_type", "authorization_code");
  params.append("code", code);
  params.append("redirect_uri", redirectUri);
  params.append("client_id", process.env.SPOTIFY_CLIENT_ID!);
  params.append("client_secret", process.env.SPOTIFY_CLIENT_SECRET!);

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const data = await response.json();
  if (!response.ok) {
    return NextResponse.json({ error: data }, { status: 400 });
  }

  // 4. Store tokens in Firestore for the correct user
  const expiresAt = Date.now() + data.expires_in * 1000;
  await setDoc(
    doc(db, "users", uid),
    {
      spotify: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt,
        connected: true,
      },
    },
    { merge: true }
  );

  return NextResponse.json({ ok: true });
}
