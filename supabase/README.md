# Supabase Schema Setup

Этот файл содержит SQL-запросы для создания структуры базы данных в Supabase.

## Установка

1. Откройте Supabase Dashboard
2. Перейдите в SQL Editor
3. Скопируйте содержимое `schema.sql`
4. Выполните запрос

## Структура таблиц

### `profiles`
- Хранит профили пользователей, привязанные к Telegram ID
- Поля: `id`, `telegram_id`, `username`, `avatar_url`

### `projects`
- Хранит проекты (Telegram чаты/группы)
- Поля: `id`, `telegram_chat_id`, `title`, `status` (active/archived)

### `tasks`
- Хранит задачи, извлеченные ИИ или созданные вручную
- Поля: `id`, `project_id`, `creator_id`, `assignee_id`, `title`, `description`, `status` (todo/doing/done), `priority`, `deadline`, `confidence_score`, `time_tracking`, `is_tracking`

## Row Level Security (RLS)

⚠️ **ВНИМАНИЕ**: Текущие политики разрешают анонимный доступ ко всем операциям (SELECT, INSERT, UPDATE, DELETE) для тестирования.

**Для production** необходимо заменить политики на более строгие, например:
- Разрешать доступ только аутентифицированным пользователям
- Ограничивать доступ на основе `telegram_id` или других критериев

## Индексы

Созданы индексы для оптимизации запросов:
- `profiles.telegram_id`
- `projects.telegram_chat_id` и `status`
- `tasks.project_id`, `creator_id`, `assignee_id`, `status`, `deadline`

## Автоматическое обновление `updated_at`

Настроены триггеры для автоматического обновления поля `updated_at` при изменении записей.
