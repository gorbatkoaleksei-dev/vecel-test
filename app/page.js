"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const statuses = [
  { value: "new", label: "Новая" },
  { value: "in_progress", label: "В работе" },
  { value: "done", label: "Готово" }
];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default function Home() {
  const supabase = useMemo(
    () => createClient(supabaseUrl, supabaseAnonKey),
    []
  );

  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    company: "",
    status: "new",
    note: ""
  });

  useEffect(() => {
    async function loadSession() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
        window.history.replaceState({}, "", window.location.pathname);
      }

      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setLoading(false);
    }

    loadSession();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (session) {
      fetchLeads();
    }
  }, [session]);

  async function fetchLeads() {
    setError("");
    const { data, error: fetchError } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      return;
    }

    setLeads(data ?? []);
  }

  async function sendMagicLink(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin
      }
    });

    if (signInError) {
      setError(signInError.message);
      return;
    }

    setMessage("Проверь почту и открой ссылку для входа.");
  }

  async function addLead(event) {
    event.preventDefault();
    setError("");

    const payload = {
      name: form.name.trim(),
      company: form.company.trim(),
      status: form.status,
      note: form.note.trim()
    };

    if (!payload.name) {
      setError("Укажи имя клиента или название заявки.");
      return;
    }

    const { error: insertError } = await supabase.from("leads").insert(payload);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setForm({ name: "", company: "", status: "new", note: "" });
    await fetchLeads();
  }

  async function updateStatus(id, status) {
    setError("");
    const { error: updateError } = await supabase
      .from("leads")
      .update({ status })
      .eq("id", id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await fetchLeads();
  }

  async function deleteLead(id) {
    setError("");
    const { error: deleteError } = await supabase
      .from("leads")
      .delete()
      .eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    await fetchLeads();
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
    setLeads([]);
  }

  if (loading) {
    return (
      <main className="shell">
        <p className="hint">Загрузка...</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="shell">
        <section className="panel login">
          <h1>Leads Desk</h1>
          <p className="hint">
            Введи email, получи ссылку и зайди в личный список заявок.
          </p>
          <form onSubmit={sendMagicLink}>
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
              />
            </label>
            <button className="button" type="submit">
              Получить ссылку
            </button>
            {message ? <div className="success">{message}</div> : null}
            {error ? <div className="error">{error}</div> : null}
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">
          <h1>Leads Desk</h1>
          <p>Мини CRM на Next.js, Supabase и Vercel</p>
        </div>
        <button className="button secondary" type="button" onClick={signOut}>
          Выйти
        </button>
      </header>

      {error ? <div className="error">{error}</div> : null}

      <section className="grid">
        <aside className="panel form">
          <h2>Новая заявка</h2>
          <form onSubmit={addLead}>
            <label className="field">
              <span>Клиент / заявка</span>
              <input
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Например: Иван Петров"
              />
            </label>
            <label className="field">
              <span>Компания</span>
              <input
                value={form.company}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    company: event.target.value
                  }))
                }
                placeholder="Например: Acme"
              />
            </label>
            <div className="row">
              <label className="field">
                <span>Статус</span>
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      status: event.target.value
                    }))
                  }
                >
                  {statuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="field">
              <span>Комментарий</span>
              <textarea
                value={form.note}
                onChange={(event) =>
                  setForm((current) => ({ ...current, note: event.target.value }))
                }
                placeholder="Что нужно сделать?"
              />
            </label>
            <button className="button" type="submit">
              Добавить
            </button>
          </form>
        </aside>

        <section className="panel list">
          <div className="toolbar">
            <h2>Заявки</h2>
            <p className="meta">{leads.length} всего</p>
          </div>

          {leads.length === 0 ? (
            <div className="empty">Пока нет заявок.</div>
          ) : (
            <div className="cards">
              {leads.map((lead) => (
                <article className="lead" key={lead.id}>
                  <div>
                    <h3>{lead.name}</h3>
                    <span className="status">
                      {statuses.find((status) => status.value === lead.status)
                        ?.label ?? lead.status}
                    </span>
                    {lead.company ? <p>{lead.company}</p> : null}
                    {lead.note ? <p>{lead.note}</p> : null}
                  </div>
                  <div className="actions">
                    <select
                      value={lead.status}
                      onChange={(event) =>
                        updateStatus(lead.id, event.target.value)
                      }
                    >
                      {statuses.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                    <button
                      className="button danger"
                      type="button"
                      onClick={() => deleteLead(lead.id)}
                    >
                      Удалить
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
