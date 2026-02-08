"use client";

import { useState, useEffect } from "react";
import WebApp from "@twa-dev/sdk";
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

export function useTelegramAuth(): UseTelegramAuthReturn {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (typeof window === "undefined") {
        setLoading(false);
        return;
      }

      try {
        // Получаем данные пользователя из Telegram WebApp
        const telegramUser = WebApp.initDataUnsafe?.user as TelegramUser | undefined;

        if (!telegramUser) {
          console.warn("Telegram user data not available");
          setLoading(false);
          return;
        }

        const telegramId = telegramUser.id;
        const username = telegramUser.username || null;
        const avatarUrl = telegramUser.photo_url || null;
        const firstName = telegramUser.first_name || null;
        const lastName = telegramUser.last_name || null;

        // Ищем пользователя в базе данных
        const { data: existingUser, error: searchError } = await supabase
          .from("profiles")
          .select("*")
          .eq("telegram_id", telegramId)
          .single();

        if (searchError && searchError.code !== "PGRST116") {
          // PGRST116 = no rows returned, это нормально для нового пользователя
          console.error("Error searching for user:", searchError);
          setLoading(false);
          return;
        }

        if (existingUser) {
          // Пользователь найден - обновляем данные если нужно
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
              setUser(existingUser);
            } else {
              setUser(updatedUser);
            }
          } else {
            setUser(existingUser);
          }
        } else {
          // Пользователь не найден - создаем нового
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
            console.error("Error creating user:", createError);
          } else {
            setUser(newUser);
          }
        }
      } catch (error) {
        console.error("Error in useTelegramAuth:", error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  return { user, loading, isDemoMode: !user && !loading };
}
