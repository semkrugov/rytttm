export type TaskStatus = "todo" | "doing" | "done";

export interface Task {
  id: string;
  title: string;
  project?: string;
  projectTitle?: string; // Название проекта для отображения
  deadline?: string;
  deadlineTime?: string; // e.g., "12:00 | 25.01"
  status: TaskStatus;
  timeTracking?: string; // e.g., "01:45"
  isTracking?: boolean; // true for play, false for pause
  completed: boolean;
  /** Автор (создатель) задачи */
  author?: {
    username: string | null;
    avatar_url: string | null;
  } | null;
  /** Исполнитель (назначенный) */
  assignee?: {
    username: string | null;
    avatar_url: string | null;
  } | null;
  /** id автора и исполнителя для дедупа аватарок */
  creatorId?: string | null;
  assigneeId?: string | null;
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
