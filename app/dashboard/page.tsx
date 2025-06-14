"use client"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { getUserPlaylists } from "@/lib/spotify"
import React from "react";

export default function Dashboard() {
  const { data: session } = useSession()
  const [playlists, setPlaylists] = useState<any[]>([])

  useEffect(() => {
    if (session?.accessToken) {
      getUserPlaylists(session.accessToken).then(setPlaylists)
    }
  }, [session])

  return (
    <div>
      <h1>My Playlists</h1>
      {playlists.map((p) => (
        <div key={p.id}>
          <img src={p.images?.[0]?.url} alt={p.name} width={100} />
          <p>{p.name}</p>
          <a href={p.external_urls.spotify} target="_blank">Open in Spotify</a>
        </div>
      ))}
    </div>
  )
}
