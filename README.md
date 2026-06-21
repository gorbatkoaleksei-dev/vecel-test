# Leads Desk

Мини-проект для проверки связки Next.js, Supabase и Vercel.

## Что внутри

- Вход по email magic link через Supabase Auth.
- Таблица заявок `leads` в Supabase Postgres.
- Row Level Security: каждый пользователь видит только свои заявки.
- Добавление, смена статуса и удаление заявок.

## 1. Создай Supabase проект

1. Открой [Supabase](https://supabase.com/).
2. Создай новый project.
3. Открой `SQL Editor`.
4. Выполни SQL из файла `supabase_schema.sql`.

## 2. Получи ключи Supabase

В Supabase открой:

`Project Settings` -> `Data API`

Скопируй:

- `Project URL`
- `anon public key`

## 3. Настрой локальные env-переменные

Создай файл `.env.local` рядом с `package.json`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## 4. Запуск локально

Нужен Node.js 20+.

```bash
npm install
npm run dev
```

Открой `http://localhost:3000`.

## 5. Деплой на Vercel

1. Создай GitHub repository.
2. Залей туда этот проект.
3. Открой [Vercel](https://vercel.com/).
4. `Add New` -> `Project`.
5. Выбери GitHub repository.
6. Добавь env-переменные:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
7. Нажми `Deploy`.

## 6. Настрой redirect URL в Supabase

После деплоя скопируй URL Vercel, например:

```text
https://leads-desk.vercel.app
```

В Supabase открой:

`Authentication` -> `URL Configuration`

Укажи:

- `Site URL`: твой Vercel URL
- `Redirect URLs`: твой Vercel URL

Для локальной разработки также можно добавить:

```text
http://localhost:3000
```

## Как сделать общие заявки

Сейчас каждый пользователь видит только свои заявки. Это специально сделано через RLS, чтобы первый проект был безопасным.

Если нужно, чтобы все вошедшие пользователи видели общий список, замени select policy в Supabase:

```sql
drop policy if exists "Users can read own leads" on public.leads;

create policy "Authenticated users can read all leads"
on public.leads
for select
to authenticated
using (true);
```

Аналогично можно расширить update/delete, если нужно общее редактирование.
