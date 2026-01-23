# SPECIFICATION: AI Task Tracker Mini App (Telegram)

## 1. Vision & Value Proposition
"Task Tracker" — интеллектуальная экосистема для команд в Telegram. 
**Проблема:** Задачи теряются в потоке сообщений. 
**Решение:** Бот с ИИ анализирует чат, извлекает задачи и управляет ими через Mini App с премиальным UI.

## 2. Core Features (The "Sexy" Part)
*   **AI Smart Capture:** Автоматическое извлечение задач из сообщений (Title, Assignee, Deadline).
*   **Confidence Score (Грейды):**
    *   **9-10:** Авто-создание задачи в БД + уведомление.
    *   **5-8:** Предложение в "AI Inbox" для ручного подтверждения [✅ Да] [❌ Нет].
    *   **1-4:** Игнорирование или вежливое уточнение.
*   **AI-Chat (Inbox):** Интеллектуальный хаб предложений от ИИ и кнопка `/summary` для пересказа последних 50 сообщений чата.
*   **Premium UI:** Haptic Feedback (вибрации), плавные свайпы (Tinder-style) для закрытия задач.

## 3. Tech Stack
*   **Frontend:** Next.js 14 (App Router), Tailwind CSS, Shadcn UI, Framer Motion.
*   **Backend:** Supabase (Database, Auth, Realtime).
*   **Telegram:** Telegraf.js + Telegram WebApp SDK (@twa-dev/sdk).
*   **AI Core:** Gemini 1.5 Flash (MVP) / Claude 3.5 Sonnet (Production).

## 4. UI Structure (Based on Layouts)

### Screen 1: Widget (Dashboard)
- **Top:** AI Smart Notifications (Последние важные события).
- **Middle:** "My Focus" (Топ-3 активные задачи на сегодня).
- **Bottom:** Projects List (Telegram группы с индикаторами активности).

### Screen 2: Tasks List
- Фильтры: "Не начал", "В работе", "Готово".
- Карточки задач: Название, тайм-трекинг, дедлайн.
- **Интерактив:** Свайп вправо по карточке — мгновенный перевод в "Готово" с анимацией конфетти.

### Screen 3: AI Intelligence Center (Inbox)
- Лента карточек-предложений от ИИ (грейды 5-8).
- Кнопки быстрого действия (Подтвердить/Править/Удалить).
- Кнопка `/summary` чата.

### Screen 4: Profile & Settings
- Настройки уведомлений, роли, статистика продуктивности.

## 5. Data Model (Supabase)

### `profiles`
- id: uuid (pk), telegram_id: bigint, username: string, avatar_url: string

### `projects`
- id: uuid (pk), telegram_chat_id: bigint, title: string, status: active/archived

### `tasks`
- id: uuid (pk), project_id: ref(projects), creator_id: ref(profiles), assignee_id: ref(profiles)
- title: text, description: text, status: todo/doing/done, priority: low/medium/high
- deadline: timestamp, confidence_score: int, created_at: timestamp

## 6. Animation & UX Requirements (from .cursorrules)
- **Easing:** Использовать `ease-out-expo` (cubic-bezier(0.19, 1, 0.22, 1)) для входа элементов.
- **Performance:** Анимировать только `opacity` и `transform`.
- **Haptics:** Вибрация при каждом чекбоксе, свайпе и открытии шторки.
- **Stagger:** Плавное появление списка карточек друг за другом.

## 7. Monetization Strategy
- **Free:** 1 проект, базовый ИИ.
- **Pro ($19/mo):** Безлимит проектов, умные `/summary` чатов, аналитика команды.