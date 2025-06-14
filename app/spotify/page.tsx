'use client'

import { useSession } from "next-auth/react"
import { getUserPlaylists } from "@/lib/spotify"
import { useEffect, useState } from "react"
import { signIn, signOut } from "next-auth/react"

export default function SpotifyPage() {
  const { data: session, status } = useSession()
  const [playlists, setPlaylists] = useState<any[]>([])

  useEffect(() => {
    if (session?.accessToken) {
      getUserPlaylists(session.accessToken).then(setPlaylists)
    }
  }, [session])

  if (status === "loading") return <p>Loading...</p>

  if (!session)
    return (
      <div className="flex flex-col items-center">
        <p>You are not logged in.</p>
        <button onClick={() => signIn("spotify")}>Login with Spotify</button>
      </div>
    )

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Your Playlists</h1>
      <button onClick={() => signOut()}>Logout</button>
      <div className="grid grid-cols-2 gap-4 mt-4">
        {playlists.map((playlist) => (
          <div key={playlist.id} className="border p-4 rounded-lg">
            <img
              src={playlist.images?.[0]?.url}
              alt={playlist.name}
              className="w-full rounded"
            />
            <p className="mt-2 font-semibold">{playlist.name}</p>
            <a
              href={playlist.external_urls.spotify}
              target="_blank"
              className="text-blue-500"
            >
              Open in Spotify
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
