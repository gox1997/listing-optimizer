// services/user.service.ts

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { UserProfile, OnboardingData, UserProfileUpdate } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// getUserProfile
// Returns null on not-found — callers decide how to handle a missing profile.
// Throws on unexpected DB errors — never silently swallowed.
// ─────────────────────────────────────────────────────────────────────────────

export async function getUserProfile(
    userId: string,
): Promise<UserProfile | null> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (createAdminSupabaseClient() as any)
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single();

    if (error?.code === "PGRST116") return null;
    if (error) {
        console.error("[user.service] getUserProfile failed:", {
            userId,
            message: error.message,
        });
        throw new Error(`Failed to fetch profile: ${error.message}`);
    }

    return mapProfile(data);
}

// ─────────────────────────────────────────────────────────────────────────────
// completeOnboarding
// Called exactly once — at the end of the onboarding wizard.
// Saves preferences + flips onboarding_completed in a single atomic write.
// Throws if the profile row doesn't exist — that is a data integrity bug,
// not a recoverable error.
// ─────────────────────────────────────────────────────────────────────────────

export async function completeOnboarding(
    userId: string,
    data: OnboardingData,
): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error, count } = await (createAdminSupabaseClient() as any)
        .from("user_profiles")
        .update({
            default_platform: data.defaultPlatform,
            default_tone: data.defaultTone,
            niche: data.niche,
            onboarding_completed: true,
        })
        .eq("id", userId)
        .select("id", { count: "exact", head: true });

    if (error) {
        console.error("[user.service] completeOnboarding failed:", {
            userId,
            message: error.message,
        });
        throw new Error(`Failed to complete onboarding: ${error.message}`);
    }

    // Guard against silent no-op — 0 rows updated means the profile doesn't exist
    if (count === 0) {
        throw new Error(`User profile not found for onboarding: ${userId}`);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// updateUserProfile
// Called from the settings page.
// Only sends fields that are explicitly provided — never nulls existing data.
// Throws if called with an empty update — that is a caller bug, not a DB error.
// ─────────────────────────────────────────────────────────────────────────────

export async function updateUserProfile(
    userId: string,
    updates: UserProfileUpdate,
): Promise<UserProfile> {
    const dbUpdates: Record<string, unknown> = {};

    // Column names must match 001_initial_schema.sql exactly
    if (updates.displayName !== undefined)
        dbUpdates.display_name = updates.displayName;
    if (updates.defaultPlatform !== undefined)
        dbUpdates.default_platform = updates.defaultPlatform;
    if (updates.defaultTone !== undefined)
        dbUpdates.default_tone = updates.defaultTone;
    if (updates.niche !== undefined) dbUpdates.niche = updates.niche;

    // Guard: calling with no fields is a caller bug — fail loudly, not silently
    if (Object.keys(dbUpdates).length === 0) {
        throw new Error("updateUserProfile called with no fields to update.");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (createAdminSupabaseClient() as any)
        .from("user_profiles")
        .update(dbUpdates)
        .eq("id", userId)
        .select("*")
        .single();

    if (error) {
        console.error("[user.service] updateUserProfile failed:", {
            userId,
            message: error.message,
        });
        throw new Error(`Failed to update profile: ${error.message}`);
    }

    return mapProfile(data);
}

// ─────────────────────────────────────────────────────────────────────────────
// mapProfile
// Single mapping point — snake_case DB row → camelCase TypeScript type.
// Column names must match 001_initial_schema.sql exactly.
// Record<string, any> is intentional: no generated Supabase DB types yet.
// Replace with a typed row after running `supabase gen types typescript`.
// ─────────────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProfile(row: Record<string, any>): UserProfile {
    return {
        id: row.id,
        email: row.email,
        displayName: row.display_name ?? null, // col: display_name
        avatarUrl: row.avatar_url ?? null,
        niche: row.niche ?? null,
        defaultPlatform: row.default_platform ?? null,
        defaultTone: row.default_tone ?? null,
        onboardingCompleted: row.onboarding_completed,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
