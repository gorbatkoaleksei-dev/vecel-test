"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const statuses = [
  { value: "new", label: "Нова" },
  { value: "in_progress", label: "У роботі" },
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
  const [profile, setProfile] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    company: "",
    note: ""
  });
  const [savingId, setSavingId] = useState("");

  const isAdmin = profile?.role === "admin";

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
      loadProfileAndLeads();
    }
  }, [session]);

  async function loadProfileAndLeads() {
    setError("");

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id,email,role")
      .eq("id", session.user.id)
      .single();

    if (profileError) {
      setError(profileError.message);
      return;
    }

    setProfile(profileData);
    await fetchLeads();
  }

  async function fetchLeads() {
    setError("");
    const { data, error: fetchError } = await supabase
      .from("leads")
      .select("*, profiles!leads_user_profile_fkey(email)")
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      return;
    }

    setLeads(data ?? []);
  }

  async function signInWithPassword(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError) {
      setError(signInError.message);
      return;
    }

    setMessage("");
  }

  async function signUpWithPassword() {
    setError("");
    setMessage("");

    if (password.length < 6) {
      setError("Пароль має містити щонайменше 6 символів.");
      return;
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password
    });

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    setMessage("Акаунт створено. Тепер увійди з цим email і паролем.");
  }

  async function addLead(event) {
    event.preventDefault();
    setError("");

    const payload = {
      user_id: session.user.id,
      name: form.name.trim(),
      company: form.company.trim(),
      note: form.note.trim(),
      status: "new"
    };

    if (!payload.name) {
      setError("Вкажи ім'я клієнта або назву заявки.");
      return;
    }

    const { error: insertError } = await supabase.from("leads").insert(payload);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setForm({ name: "", company: "", note: "" });
    await fetchLeads();
  }

  async function updateLead(id, changes) {
    setError("");
    setSavingId(id);

    const { error: updateError } = await supabase
      .from("leads")
      .update(changes)
      .eq("id", id);

    setSavingId("");

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
    setProfile(null);
    setLeads([]);
  }

  if (loading) {
    return (
      <main className="shell">
        <p className="hint">Завантаження...</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="shell">
        <section className="panel login">
          <h1>Leads Desk</h1>
          <p className="hint">
            Увійди або створи акаунт, щоб працювати із заявками.
          </p>
          <form onSubmit={signInWithPassword}>
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
            <label className="field">
              <span>Пароль</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Мінімум 6 символів"
                required
              />
            </label>
            <button className="button" type="submit">
              Увійти
            </button>
            <button
              className="button secondary"
              type="button"
              onClick={signUpWithPassword}
            >
              Створити акаунт
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
          <p>
            {isAdmin
              ? "Адмін-панель заявок клієнтів"
              : "Оформлення та відстеження заявок"}
          </p>
        </div>
        <div className="account">
          <span>{session.user.email}</span>
          <strong>{isAdmin ? "admin" : "client"}</strong>
          <button className="button secondary" type="button" onClick={signOut}>
            Вийти
          </button>
        </div>
      </header>

      {error ? <div className="error">{error}</div> : null}

      <section className="grid">
        <aside className="panel form">
          <h2>Нова заявка</h2>
          <form onSubmit={addLead}>
            <label className="field">
              <span>Клієнт / заявка</span>
              <input
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Наприклад: Іван Петренко"
              />
            </label>
            <label className="field">
              <span>Компанія</span>
              <input
                value={form.company}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    company: event.target.value
                  }))
                }
                placeholder="Наприклад: Acme"
              />
            </label>
            <label className="field">
              <span>Опис заявки</span>
              <textarea
                value={form.note}
                onChange={(event) =>
                  setForm((current) => ({ ...current, note: event.target.value }))
                }
                placeholder="Що потрібно зробити?"
              />
            </label>
            <button className="button" type="submit">
              Надіслати заявку
            </button>
          </form>
        </aside>

        <section className="panel list">
          <div className="toolbar">
            <h2>{isAdmin ? "Усі заявки" : "Мої заявки"}</h2>
            <p className="meta">{leads.length} всього</p>
          </div>

          {leads.length === 0 ? (
            <div className="empty">Поки що немає заявок.</div>
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
                    {isAdmin && lead.profiles?.email ? (
                      <p>Клієнт: {lead.profiles.email}</p>
                    ) : null}
                    {lead.company ? <p>Компанія: {lead.company}</p> : null}
                    {lead.note ? <p>Заявка: {lead.note}</p> : null}
                    {lead.admin_note ? (
                      <p className="admin-note">Коментар: {lead.admin_note}</p>
                    ) : null}
                  </div>

                  {isAdmin ? (
                    <div className="actions">
                      <select
                        value={lead.status}
                        onChange={(event) =>
                          updateLead(lead.id, { status: event.target.value })
                        }
                      >
                        {statuses.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                      <textarea
                        defaultValue={lead.admin_note ?? ""}
                        placeholder="Коментар адміна"
                        onBlur={(event) =>
                          updateLead(lead.id, {
                            admin_note: event.target.value.trim()
                          })
                        }
                      />
                      <button
                        className="button danger"
                        type="button"
                        onClick={() => deleteLead(lead.id)}
                      >
                        Видалити
                      </button>
                      {savingId === lead.id ? (
                        <span className="meta">Збереження...</span>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
