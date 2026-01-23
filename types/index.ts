export type TaskStatus = "todo" | "doing" | "done";

export interface Task {
  id: string;
  title: string;
  project?: string;
  deadline?: string;
  deadlineTime?: string; // e.g., "12:00 | 25.01"
  status: TaskStatus;
  timeTracking?: string; // e.g., "01:45"
  isTracking?: boolean; // true for play, false for pause
  completed: boolean;
}

export interface Project {
  id: string;
  title: string;
  avatar?: string;
  active?: boolean;
  unreadCount?: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  time?: string;
}

export interface AIInboxItem {
  id: string;
  title: string;
  chatName: string;
  chatIcon?: string;
  confidenceScore: number; // 0-100
}
