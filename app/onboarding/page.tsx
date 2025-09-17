"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useOnboardingStatus } from "@/hooks/use-onboarding-status";
import { onboardingOptions } from "@/lib/onboarding-options";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import Image from "next/image";

const STEPS = [
  { id: "movies", title: "Movies", description: "Select your favorite movies" },
  {
    id: "series",
    title: "TV Shows",
    description: "Choose your preferred series",
  },
  { id: "songs", title: "Music", description: "Pick your favorite albums" },
  { id: "books", title: "Books", description: "Select your favorite books" },
];

export default function OnboardingPage() {
  const { user, loading } = useCurrentUser();
  const { onboardingCompleted, checking } = useOnboardingStatus();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState({
    movies: [],
    series: [],
    songs: [],
    books: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if user is not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Redirect if user has already completed onboarding
  useEffect(() => {
    if (!checking && onboardingCompleted) {
      router.push("/reviews");
    }
  }, [onboardingCompleted, checking, router]);

  const handleSelection = (category, item) => {
    setSelections((prev) => ({
      ...prev,
      [category]: prev[category].includes(item.id)
        ? prev[category].filter((id) => id !== item.id)
        : [...prev[category], item.id],
    }));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/onboarding/save-preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firebaseUserId: user.uid,
          preferences: selections,
        }),
      });

      if (response.ok) {
        router.push("/reviews");
      } else {
        console.error("Failed to save preferences");
      }
    } catch (error) {
      console.error("Error saving preferences:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentCategory = STEPS[currentStep].id;
  const currentOptions = onboardingOptions[currentCategory];
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  // Show loading while checking authentication or onboarding status
  if (loading || checking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if user is not authenticated or has completed onboarding
  if (!user || onboardingCompleted) {
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="w-full max-w-7xl mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Welcome to Reliva! 🎉
          </h1>
          <p className="text-base sm:text-lg text-gray-300 mb-4 sm:mb-6">
            Let's personalize your experience by learning about your preferences
          </p>

          {/* Progress Bar */}
          <div className="w-full max-w-sm mx-auto mb-4 sm:mb-6">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-gray-400 mt-2">
              Step {currentStep + 1} of {STEPS.length}
            </p>
          </div>
        </div>

        {/* Current Step */}
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-white mb-2">
              {STEPS[currentStep].title}
            </h2>
            <p className="text-gray-300 text-sm sm:text-base">
              {STEPS[currentStep].description}
            </p>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 mb-8">
            {currentOptions.map((item) => (
              <div
                key={item.id}
                className={`group cursor-pointer transition-all duration-200 rounded-xl overflow-hidden ${
                  selections[currentCategory].includes(item.id)
                    ? "ring-2 ring-purple-500 scale-105"
                    : "hover:scale-105"
                }`}
                onClick={() => handleSelection(currentCategory, item)}
              >
                <div className="relative aspect-square">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                  {selections[currentCategory].includes(item.id) && (
                    <div className="absolute top-2 right-2 bg-purple-500 text-white rounded-full p-1.5">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                </div>

                <div className="p-2 sm:p-3 bg-gray-800/50 backdrop-blur-sm">
                  <h3 className="font-medium text-white text-xs sm:text-sm mb-1 line-clamp-2">
                    {item.title}
                  </h3>
                  {(item.artist || item.author) && (
                    <p className="text-white text-xs mb-1 line-clamp-1">
                      {item.artist || item.author}
                    </p>
                  )}
                  <p className="text-white text-xs">{item.year}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center max-w-md mx-auto">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center gap-2 bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600 hover:text-white px-4 sm:px-6"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Previous</span>
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-400">
                {selections[currentCategory].length} selected
              </p>
            </div>

            {currentStep === STEPS.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 sm:px-6"
              >
                {isSubmitting ? "Saving..." : "Complete"}
                <Check className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={nextStep}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 sm:px-6"
              >
                <span className="hidden sm:inline">Next</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
