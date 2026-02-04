"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from "react";

const STORAGE_KEY = "rytttm-time-tracking";

interface TrackingSession {
  taskId: string;
  startedAt: number;
  accumulatedSeconds: number;
}

interface TimeTrackingContextValue {
  /** id задачи, по которой идёт учёт времени, или null */
  activeTaskId: string | null;
  /** текущее накопленное число секунд (учитывает фоновый ход времени) */
  elapsedSeconds: number;
  /** начать учёт по задаче (accumulatedSeconds — уже накопленные до старта) */
  startTracking: (taskId: string, accumulatedSeconds: number) => void;
  /** остановить учёт; возвращает итоговое число секунд для сохранения в БД */
  stopTracking: () => number;
}

const TimeTrackingContext = createContext<TimeTrackingContextValue | null>(null);

function loadSession(): TrackingSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as TrackingSession;
    if (data?.taskId && typeof data.startedAt === "number" && typeof data.accumulatedSeconds === "number") {
      return data;
    }
  } catch {
    // ignore
  }
  return null;
}

function saveSession(session: TrackingSession | null) {
  if (typeof window === "undefined") return;
  try {
    if (session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

export function TimeTrackingProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<TrackingSession | null>(null);
  const [tick, setTick] = useState(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const stored = loadSession();
    if (stored) setSession(stored);
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!session) return;
    const id = setInterval(() => {
      if (mounted.current) setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [session?.taskId]);

  const elapsedSeconds = session
    ? session.accumulatedSeconds + Math.floor((Date.now() - session.startedAt) / 1000)
    : 0;

  const startTracking = useCallback((taskId: string, accumulatedSeconds: number) => {
    const newSession: TrackingSession = {
      taskId,
      startedAt: Date.now(),
      accumulatedSeconds,
    };
    setSession(newSession);
    saveSession(newSession);
  }, []);

  const stopTracking = useCallback((): number => {
    if (!session) return 0;
    const total = session.accumulatedSeconds + Math.floor((Date.now() - session.startedAt) / 1000);
    setSession(null);
    saveSession(null);
    return total;
  }, [session]);

  const value: TimeTrackingContextValue = {
    activeTaskId: session?.taskId ?? null,
    elapsedSeconds: session ? elapsedSeconds : 0,
    startTracking,
    stopTracking,
  };

  return (
    <TimeTrackingContext.Provider value={value}>
      {children}
    </TimeTrackingContext.Provider>
  );
}

export function useTimeTracking() {
  const ctx = useContext(TimeTrackingContext);
  if (!ctx) throw new Error("useTimeTracking must be used within TimeTrackingProvider");
  return ctx;
}
