import { Task, Project, Notification, TaskStatus, AIInboxItem } from "@/types";

export const mockTasks: Task[] = [
  {
    id: "1",
    title: "Завершить дизайн главной страницы",
    project: "Веб-сайт",
    deadline: "Сегодня, 18:00",
    completed: false,
    status: "todo",
  },
  {
    id: "2",
    title: "Провести код-ревью PR #42",
    project: "Backend",
    deadline: "Завтра, 10:00",
    completed: false,
    status: "todo",
  },
  {
    id: "3",
    title: "Подготовить презентацию для клиента",
    project: "Маркетинг",
    deadline: "25 января",
    completed: true,
    status: "done",
  },
];

export const mockTasksWithStatus: Task[] = [
  {
    id: "1",
    title: "Название задачи в одну — две строки",
    status: "todo",
    timeTracking: "01:45",
    isTracking: true,
    deadlineTime: "12:00 | 25.01",
    completed: false,
  },
  {
    id: "2",
    title: "Название задачи в одну — две строки",
    status: "doing",
    timeTracking: "01:45",
    isTracking: false,
    deadlineTime: "12:00 | 25.01",
    completed: false,
  },
  {
    id: "3",
    title: "Название задачи в одну — две строки",
    status: "doing",
    timeTracking: "01:45",
    isTracking: true,
    deadlineTime: "12:00 | 25.01",
    completed: false,
  },
  {
    id: "4",
    title: "Название задачи в одну — две строки",
    status: "todo",
    timeTracking: "01:45",
    isTracking: false,
    deadlineTime: "12:00 | 25.01",
    completed: false,
  },
  {
    id: "5",
    title: "Завершить дизайн главной страницы",
    status: "done",
    timeTracking: "02:30",
    isTracking: false,
    deadlineTime: "18:00 | 23.01",
    completed: true,
  },
  {
    id: "6",
    title: "Провести код-ревью PR #42",
    status: "done",
    timeTracking: "00:15",
    isTracking: false,
    deadlineTime: "10:00 | 24.01",
    completed: true,
  },
];

export const mockProjects: Project[] = [
  {
    id: "1",
    title: "Команда разработки",
    active: true,
    unreadCount: 3,
  },
  {
    id: "2",
    title: "Дизайн-студия",
    active: true,
    unreadCount: 1,
  },
  {
    id: "3",
    title: "Маркетинг",
    active: false,
    unreadCount: 0,
  },
  {
    id: "4",
    title: "Продажи",
    active: true,
    unreadCount: 5,
  },
];

export const mockNotifications: Notification[] = [
  {
    id: "1",
    title: "Новая задача создана",
    message: "ИИ обнаружил задачу 'Обновить документацию API' в чате Команда разработки",
    time: "5 минут назад",
  },
];

export const mockAIInboxItems: AIInboxItem[] = [
  {
    id: "1",
    title: "Подготовить договор",
    chatName: "Юристы",
    confidenceScore: 85,
  },
  {
    id: "2",
    title: "Ответить клиенту в WhatsApp",
    chatName: "Продажи",
    confidenceScore: 75,
  },
  {
    id: "3",
    title: "Заказать пиццу в офис",
    chatName: "Флудилка",
    confidenceScore: 60,
  },
];
