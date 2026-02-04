export type Locale = "en" | "ru";

export const translations: Record<
  Locale,
  Record<string, string>
> = {
  en: {
    // Nav
    "nav.widget": "Widget",
    "nav.tasks": "Tasks",
    "nav.projects": "Projects",
    "nav.profile": "Profile",

    // Tasks page
    "tasks.title": "Tasks",
    "tasks.empty": "No tasks in this status",
    "tasks.noProject": "No project",

    // Status tabs (tasks variant)
    "status.all": "All",
    "status.todo": "To do",
    "status.doing": "In progress",
    "status.done": "Done",

    // Profile
    "profile.editField": "Edit {field}",
    "profile.enterField": "Enter {field}",
    "profile.save": "Save",
    "profile.saving": "Saving...",
    "profile.app": "App",
    "profile.main": "Main",
    "profile.support": "Support",
    "profile.records": "My records",
    "profile.widgets": "Widgets",
    "profile.notifications": "Notifications",
    "profile.contacts": "Contacts",
    "profile.language": "Language",
    "profile.payment": "Payment",
    "profile.security": "Security",
    "profile.faq": "FAQ",
    "profile.ask": "Ask a question",
    "profile.community": "Community",
    "profile.loading": "Loading...",
    "profile.userNotFound": "User not found",
    "profile.positionDefault": "Position not specified",
    "profile.mvp": "MVP",
    "profile.mvpDesc": "Unlock all AI and analytics features",
    "profile.change": "Change",
    "profile.userDefault": "User",
    "profile.fieldUsername": "username",
    "profile.fieldPosition": "position",

    // Language page
    "language.title": "Language",

    // Notifications page
    "notifications.title": "Notifications",
    "notifications.newTask": "New task",
    "notifications.changeInTask": "Change in task",
    "notifications.commentOnTask": "Comment on task",
    "notifications.reactionToTask": "Reaction to task",
    "notifications.deadlines": "Deadlines",
    "notifications.newProject": "New project",
    "notifications.disableAll": "Disable all",
    "notifications.workingHours": "Working hours",
    "notifications.saveChanges": "Save changes",

    // Contacts page
    "contacts.title": "Contacts",
    "contacts.search": "Search",
    "contacts.invite": "Invite to rytttm",
    "contacts.folders": "Folders",
    "contacts.designers": "Designers",
    "contacts.coders": "Coders",
    "contacts.freelancers": "Freelancers",
    "contacts.clients": "Clients",
    "contacts.addFolder": "Add folder",
    "contacts.linkCopied": "Link copied",
    "contacts.linkCopiedMessage": "Bot link copied. You can share it with friends.",

    // Achievements page
    "achievements.title": "My achievements",

    // Home / widget
    "home.attention": "Attention",
    "home.focusTasks": "Focus",
    "home.projects": "Projects",
    "home.noTasks": "No tasks for today",
    "home.noProjects": "No projects yet",

    // Projects
    "projects.title": "Projects",
    "projects.search": "Search",
    "projects.all": "All",
    "projects.archive": "Archive",
    "projects.allTasks": "All tasks",
    "projects.add": "Add",
    "projects.addTask": "Add task",
    "projects.selectProject": "Select project",
    "projects.addParticipant": "Add participant",

    // Add task
    "addTask.task": "Task",
    "addTask.description": "Description...",
    "addTask.noDeadline": "No deadline",
    "addTask.time": "Time",
    "addTask.create": "Create",
    "addTask.cancel": "Cancel",

    // Task detail
    "taskDetail.back": "Back",
    "taskDetail.deadline": "Deadline",
    "taskDetail.project": "Project",
    "taskDetail.assignee": "Assignee",
    "taskDetail.description": "Description",
    "taskDetail.noDescription": "No description",

    // Payment page
    "payment.title": "Payment",
    "payment.aboutTariffs": "All about tariffs",
    "payment.free": "Free",
    "payment.method": "Method",
    "payment.card": "Card",
    "payment.phone": "Phone",
    "payment.wallet": "Wallet",
    "payment.number": "Number",
    "payment.expiry": "Expiration",
    "payment.cvv": "CVV/CVC",
    "payment.autoPay": "Automatic payment",
    "payment.relink": "Re-link",
    "payment.history": "History",
    "payment.allPayments": "All payments",
    "payment.successful": "Successful",
    "payment.referralLink": "Referral link",
    "payment.referralProgram": "Referral program",
    "payment.levelDirect": "20% of client's monthly/annual payment",
    "payment.levelIndirect": "10% of each client's payment, attracted by a 1st-level partner",
    "payment.levelNetwork": "5% of each client's payment, attracted by a 2nd-level partner",
    "payment.referralInfo": "The program works as long as partners of levels 1, 2, 3 throughout the chain are active and use paid tariffs.",
    "payment.myLevel": "My level",
    "payment.indirect": "Indirect",

    // Common
    "common.back": "Back",
  },
  ru: {
    "nav.widget": "Виджет",
    "nav.tasks": "Задачи",
    "nav.projects": "Проекты",
    "nav.profile": "Профиль",

    "tasks.title": "Задачи",
    "tasks.empty": "Нет задач в этом статусе",
    "tasks.noProject": "Без проекта",

    "status.all": "Все",
    "status.todo": "Задачи",
    "status.doing": "В работе",
    "status.done": "Готово",

    "profile.editField": "Редактировать {field}",
    "profile.enterField": "Введите {field}",
    "profile.save": "Сохранить",
    "profile.saving": "Сохранение...",
    "profile.app": "Приложение",
    "profile.main": "Основные",
    "profile.support": "Поддержка",
    "profile.records": "Мои пластинки",
    "profile.widgets": "Виджеты",
    "profile.notifications": "Уведомления",
    "profile.contacts": "Контакты",
    "profile.language": "Язык",
    "profile.payment": "Оплата",
    "profile.security": "Безопасность",
    "profile.faq": "FAQ",
    "profile.ask": "Задать вопрос",
    "profile.community": "Коммьюнити",
    "profile.loading": "Загрузка...",
    "profile.userNotFound": "Пользователь не найден",
    "profile.positionDefault": "Должность не указана",
    "profile.mvp": "MVP",
    "profile.mvpDesc": "Разблокируйте все функции AI и аналитики",
    "profile.change": "Изменить",
    "profile.userDefault": "Пользователь",
    "profile.fieldUsername": "имя пользователя",
    "profile.fieldPosition": "должность",

    "language.title": "Язык",

    "notifications.title": "Уведомления",
    "notifications.newTask": "Новая задача",
    "notifications.changeInTask": "Изменение в задаче",
    "notifications.commentOnTask": "Коментарий к задаче",
    "notifications.reactionToTask": "Реакция к задаче",
    "notifications.deadlines": "Сроки",
    "notifications.newProject": "Новый проект",
    "notifications.disableAll": "Отключить все",
    "notifications.workingHours": "Рабочее время",
    "notifications.saveChanges": "Сохранить изменения",

    "contacts.title": "Контакты",
    "contacts.search": "Поиск",
    "contacts.invite": "Пригласить в rytttm",
    "contacts.folders": "Папки",
    "contacts.designers": "Дизайнеры",
    "contacts.coders": "Кодеры",
    "contacts.freelancers": "Фрилы",
    "contacts.clients": "Клиенты",
    "contacts.addFolder": "Добавить папку",
    "contacts.linkCopied": "Ссылка скопирована",
    "contacts.linkCopiedMessage": "Ссылка на бота скопирована. Можете переслать её друзьям.",

    "achievements.title": "Мои достижения",

    "home.attention": "Внимание",
    "home.focusTasks": "В фокусе",
    "home.projects": "Проекты",
    "home.noTasks": "Нет задач на сегодня",
    "home.noProjects": "Пока нет проектов",

    "projects.title": "Проекты",
    "projects.search": "Поиск",
    "projects.all": "Все",
    "projects.archive": "Архив",
    "projects.allTasks": "Все задачи",
    "projects.add": "Добавить",
    "projects.addTask": "Добавить задачу",
    "projects.selectProject": "Выбрать проект",
    "projects.addParticipant": "Добавить участника",

    "addTask.task": "Задача",
    "addTask.description": "Описание...",
    "addTask.noDeadline": "Без срока",
    "addTask.time": "Время",
    "addTask.create": "Создать",
    "addTask.cancel": "Отмена",

    "taskDetail.back": "Назад",
    "taskDetail.deadline": "Срок",
    "taskDetail.project": "Проект",
    "taskDetail.assignee": "Исполнитель",
    "taskDetail.description": "Описание",
    "taskDetail.noDescription": "Нет описания",

    "payment.title": "Оплата",
    "payment.aboutTariffs": "Всё о тарифах",
    "payment.free": "Бесплатно",
    "payment.method": "Способ",
    "payment.card": "Карта",
    "payment.phone": "Телефон",
    "payment.wallet": "Wallet",
    "payment.number": "Номер",
    "payment.expiry": "Срок действия",
    "payment.cvv": "CVV/CVC",
    "payment.autoPay": "Автоматическая оплата",
    "payment.relink": "Перепривязать",
    "payment.history": "История",
    "payment.allPayments": "Все оплаты",
    "payment.successful": "Успешно",
    "payment.referralLink": "Реферальная ссылка",
    "payment.referralProgram": "Реферальная программа",
    "payment.levelDirect": "20% от ежемесячного/годового платежа клиента",
    "payment.levelIndirect": "10% от платежа каждого клиента, привлечённого партнёром с 1-го",
    "payment.levelNetwork": "5% от платежа каждого клиента, привлечённого партнёром со 2-го",
    "payment.referralInfo": "Программа работает, пока партнёры 1, 2, 3 уровней по всей цепочке активны и пользуются платными тарифами.",
    "payment.myLevel": "Мой уровень",
    "payment.indirect": "Indirect",

    "common.back": "Назад",
  },
};

function replaceParams(text: string, params: Record<string, string>): string {
  return Object.entries(params).reduce(
    (acc, [key, value]) => acc.replace(new RegExp(`\\{${key}\\}`, "g"), value),
    text
  );
}

export function t(
  locale: Locale,
  key: string,
  params?: Record<string, string>
): string {
  const dict = translations[locale];
  const value = dict[key] ?? translations.en[key] ?? key;
  return params ? replaceParams(value, params) : value;
}
