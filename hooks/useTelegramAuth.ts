"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

interface Profile {
  id: string;
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  position: string | null;
  created_at: string;
  updated_at: string;
}

interface UseTelegramAuthReturn {
  user: Profile | null;
  loading: boolean;
  isDemoMode: boolean;
}

const AUTH_STORAGE_KEY = "tg_auth_profile_v1";

let cachedProfile: Profile | null | undefined = undefined;
let inFlightAuthPromise: Promise<Profile | null> | null = null;

function readProfileFromStorage(): Profile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Profile;
  } catch {
    return null;
  }
}

function writeProfileToStorage(profile: Profile | null): void {
  if (typeof window === "undefined") return;
  try {
    if (!profile) {
      window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
      return;
    }
    window.sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Ignore storage failures silently.
  }
}

async function resolveTelegramProfile(): Promise<Profile | null> {
  const telegramUser =
    (window as unknown as { Telegram?: { WebApp?: { initDataUnsafe?: { user?: TelegramUser } } } })
      .Telegram?.WebApp?.initDataUnsafe?.user;
  if (!telegramUser) {
    return null;
  }

  const telegramId = telegramUser.id;
  const username = telegramUser.username || null;
  const avatarUrl = telegramUser.photo_url || null;
  const firstName = telegramUser.first_name || null;
  const lastName = telegramUser.last_name || null;

  const { data: existingUser, error: searchError } = await supabase
    .from("profiles")
    .select("*")
    .eq("telegram_id", telegramId)
    .single();

  if (searchError && searchError.code !== "PGRST116") {
    throw searchError;
  }

  if (existingUser) {
    const updates: Partial<Profile> = {};
    if (username && existingUser.username !== username) {
      updates.username = username;
    }
    if (avatarUrl && existingUser.avatar_url !== avatarUrl) {
      updates.avatar_url = avatarUrl;
    }
    if (firstName && !existingUser.first_name) {
      updates.first_name = firstName;
    }
    if (lastName && !existingUser.last_name) {
      updates.last_name = lastName;
    }

    if (Object.keys(updates).length > 0) {
      const { data: updatedUser, error: updateError } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", existingUser.id)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating user:", updateError);
        return existingUser;
      }

      return updatedUser;
    }

    return existingUser;
  }

  const { data: newUser, error: createError } = await supabase
    .from("profiles")
    .insert({
      telegram_id: telegramId,
      username: username,
      avatar_url: avatarUrl,
      first_name: firstName,
      last_name: lastName,
    })
    .select()
    .single();

  if (createError) {
    throw createError;
  }

  return newUser;
}

export function useTelegramAuth(): UseTelegramAuthReturn {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(cachedProfile === undefined);

  useEffect(() => {
    const initAuth = async () => {
      if (typeof window === "undefined") {
        cachedProfile = null;
        setLoading(false);
        return;
      }

      // Instant restore from in-memory cache between route transitions.
      if (cachedProfile !== undefined) {
        setUser(cachedProfile);
        setLoading(false);
        return;
      }

      // Fast restore from session cache to avoid flicker.
      const stored = readProfileFromStorage();
      if (stored) {
        cachedProfile = stored;
        setUser(stored);
        setLoading(false);
      } else {
        setLoading(true);
      }

      try {
        if (!inFlightAuthPromise) {
          inFlightAuthPromise = resolveTelegramProfile();
        }

        const resolvedProfile = await inFlightAuthPromise;
        cachedProfile = resolvedProfile;
        writeProfileToStorage(resolvedProfile);
        setUser(resolvedProfile);
      } catch (error) {
        console.error("Error in useTelegramAuth:", error);
        cachedProfile = null;
        writeProfileToStorage(null);
        setUser(null);
      } finally {
        inFlightAuthPromise = null;
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  return { user, loading, isDemoMode: !user && !loading };
}
