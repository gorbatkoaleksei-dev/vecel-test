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
