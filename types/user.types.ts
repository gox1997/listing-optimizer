import type { Platform, Tone } from "./generation.types";

// The niche a seller operates in - collected during onboarding
// Used to tailor AI prompts to their specific market
export type Niche =
    | "fashion"
    | "electronics"
    | "home_garden"
    | "sports"
    | "beauty"
    | "toys"
    | "food"
    | "other";

// A row in the user_profiles database table
// Created automatically when a user signs up (via a DB trigger)
export type UserProfile = {
    id: string; // Same as Supabase auth user ID
    email: string;
    displayName: string | null;
    avatarUrl: string | null;
    niche: Niche | null;
    defaultPlatform: Platform | null;
    defaultTone: Tone | null;
    onboardingCompleted: boolean;
    createdAt: string;
    updatedAt: string;
};

// Data collected in the 3-step onboarding wizard
export type OnboardingData = {
    defaultPlatform: Platform;
    niche: Niche;
    defaultTone: Tone;
};

// What the user can update in Settings
export type UserProfileUpdate = {
    displayName?: string;
    defaultPlatform?: Platform;
    defaultTone?: Tone;
    niche?: Niche;
};
