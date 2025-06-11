"use client"

import { useEffect } from "react"
import { CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PostSuccessToastProps {
  show: boolean
  onClose: () => void
}

export function PostSuccessToast({ show, onClose }: PostSuccessToastProps) {
  const { toast } = useToast()

  useEffect(() => {
    if (show) {
      toast({
        title: "Post published!",
        description: "Your post has been successfully shared with the community.",
        action: <CheckCircle className="h-4 w-4 text-green-500" />,
      })

      // Reset the show state
      onClose()
    }
  }, [show, toast, onClose])

  return null
}
