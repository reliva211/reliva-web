// lib/spotify.ts
import axios from 'axios'

export async function getUserPlaylists(accessToken: string) {
  const res = await axios.get('https://api.spotify.com/v1/me/playlists', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
  return res.data.items
}
