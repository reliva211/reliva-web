"use client"

import { useState, useEffect } from "react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

export interface UserMusic {
  id: string
  name?: string
  title?: string
  artistName?: string
  type: "artist" | "release" | "track"
  tags?: string[]
  isFavorite?: boolean
}

export interface UserMovie {
  id: number
  title: string
  year: number
  cover: string
  status: string
  rating?: number
  notes?: string
}

export interface UserBook {
  id: string
  title: string
  author: string
  cover: string
  status: string
  progress?: number
  rating?: number | string
}

export function useUserData(userId: string | undefined) {
  const [music, setMusic] = useState<UserMusic[]>([])
  const [movies, setMovies] = useState<UserMovie[]>([])
  const [books, setBooks] = useState<UserBook[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const fetchUserData = async () => {
      try {
        // Fetch music data (artists, releases, tracks)
        const musicData: UserMusic[] = []

        const artistsSnapshot = await getDocs(collection(db, "users", userId, "favoriteArtists"))
        artistsSnapshot.forEach((doc) => {
          musicData.push({ ...doc.data(), type: "artist" } as UserMusic)
        })

        const releasesSnapshot = await getDocs(collection(db, "users", userId, "favoriteReleases"))
        releasesSnapshot.forEach((doc) => {
          musicData.push({ ...doc.data(), type: "release" } as UserMusic)
        })

        const tracksSnapshot = await getDocs(collection(db, "users", userId, "favoriteTracks"))
        tracksSnapshot.forEach((doc) => {
          musicData.push({ ...doc.data(), type: "track" } as UserMusic)
        })

        // Fetch movies data
        const moviesSnapshot = await getDocs(collection(db, "users", userId, "movies"))
        const moviesData: UserMovie[] = []
        moviesSnapshot.forEach((doc) => {
          const data = doc.data()
          moviesData.push({
            id: Number(doc.id),
            title: data.title,
            year: data.year,
            cover: data.cover,
            status: data.status,
            rating: data.rating,
            notes: data.notes,
          } as UserMovie)
        })

        // Fetch books data
        const booksSnapshot = await getDocs(collection(db, "users", userId, "books"))
        const booksData: UserBook[] = []
        booksSnapshot.forEach((doc) => {
          booksData.push({ id: doc.id, ...doc.data() } as UserBook)
        })

        setMusic(musicData)
        setMovies(moviesData)
        setBooks(booksData)
      } catch (error) {
        console.error("Error fetching user data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [userId])

  return { music, movies, books, loading }
}
