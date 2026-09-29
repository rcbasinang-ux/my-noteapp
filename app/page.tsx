"use client";

import { FormEvent, startTransition, useEffect, useRef, useState } from "react";
import styles from "./page.module.css";

type Note = { id: string; title: string; description: string; updatedAt: string };
const STORAGE_KEY = "little-notes";

function NoteItem({ note, index, onEdit, onDelete }: {
  note: Note;
  index: number;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
}) {
  const date = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(note.updatedAt));

  return (
    <article className={`${styles.note} ${styles[`noteTone${index % 4}`]}`}>
      <div className={styles.noteTopline}>
        <span className={styles.noteDate}>{date}</span>
        <div className={styles.noteActions}>
          <button className={styles.iconButton} type="button" aria-label={`Edit ${note.title}`} title="Edit note" onClick={() => onEdit(note)}>
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m13.8 3.7 2.5 2.5M4 16l3.7-.8L16 6.9a1.8 1.8 0 0 0-2.5-2.5l-8.3 8.3L4 16Z" /></svg>
          </button>
          <button className={styles.iconButton} type="button" aria-label={`Delete ${note.title}`} title="Delete note" onClick={() => onDelete(note.id)}>
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4.5 6h11M8 6V4.5h4V6m2.5 0-.6 10H6.1L5.5 6m3 2.5v5m3-5v5" /></svg>
          </button>
        </div>
      </div>
      <h3>{note.title}</h3>
      <p>{note.description}</p>
      <span className={styles.noteMark} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
    </article>
  );
}

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [query, setQuery] = useState("");
  const titleInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let savedNotes: Note[] | null = null;
    try {
      const storedNotes = window.localStorage.getItem(STORAGE_KEY);
      if (storedNotes) {
        savedNotes = (JSON.parse(storedNotes) as Note[]).map((note) => ({
          id: note.id,
          title: note.title,
          description: note.description,
          updatedAt: note.updatedAt,
        }));
      }
    } catch {}
    startTransition(() => {
      if (savedNotes) setNotes(savedNotes);
      setIsReady(true);
    });
  }, []);

  useEffect(() => {
    if (isReady) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
      } catch {}
    }
  }, [isReady, notes]);

  useEffect(() => {
    const normalizedTitle = title.trim().toLocaleLowerCase();
    const exists = Boolean(normalizedTitle && notes.some((note) =>
      note.id !== editingId && note.title.trim().toLocaleLowerCase() === normalizedTitle,
    ));
    titleInput.current?.setCustomValidity(exists ? "A note with this title already exists." : "");
  }, [editingId, notes, title]);

  const normalizedTitle = title.trim().toLocaleLowerCase();
  const duplicateTitle = Boolean(normalizedTitle && notes.some((note) =>
    note.id !== editingId && note.title.trim().toLocaleLowerCase() === normalizedTitle,
  ));
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visibleNotes = notes.filter((note) =>
    `${note.title} ${note.description}`.toLocaleLowerCase().includes(normalizedQuery),
  );

  function resetForm() {
    setTitle("");
    setDescription("");
    setEditingId(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanTitle = title.trim();
    const cleanDescription = description.trim();
    if (!cleanTitle || !cleanDescription || duplicateTitle) return;

    if (editingId) {
      setNotes((current) => current.map((note) => note.id === editingId
        ? { ...note, title: cleanTitle, description: cleanDescription, updatedAt: new Date().toISOString() }
        : note));
    } else {
      setNotes((current) => [{
        id: crypto.randomUUID(),
        title: cleanTitle,
        description: cleanDescription,
        updatedAt: new Date().toISOString(),
      }, ...current]);
    }
    resetForm();
  }

  function deleteNote(id: string) {
    setNotes((current) => current.filter((note) => note.id !== id));
    if (editingId === id) resetForm();
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <a className={styles.brand} href="#top" aria-label="Nocturne home"><span className={styles.brandIcon}>n.</span><span>nocturne</span></a>
        <span className={styles.headerNote}>Capture the thoughts that keep you awake</span>
        <span className={styles.today}>{new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(new Date())}</span>
      </header>
      <main className={styles.main} id="top">
        <section className={styles.welcome}>
          <div>
            <p className={styles.eyebrow}><span /> YOUR PERSONAL NOTEBOOK</p>
            <h1>Gather the<br />ideas that glow.</h1>
            <p className={styles.welcomeCopy}>Turn fleeting sparks into something you can keep.</p>
          </div>
          <div className={styles.totalNotes}><span className={styles.totalNumber}>{String(notes.length).padStart(2, "0")}</span><span>{notes.length === 1 ? "note kept" : "notes kept"}</span></div>
        </section>

        <div className={styles.workspace}>
          <section className={styles.composer} aria-labelledby="composer-title">
            <div className={styles.sectionHeading}>
              <span className={styles.stepNumber}>{editingId ? "02" : "01"}</span>
              <div><p className={styles.eyebrow}>{editingId ? "REFINE THE THOUGHT" : "THE NOTEBOOK"}</p><h2 id="composer-title">{editingId ? "Edit a note" : "New note"}</h2></div>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              <label htmlFor="note-title">Title</label>
              <input ref={titleInput} id="note-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Give it a name" maxLength={80} required />
              {duplicateTitle && <span className={styles.fieldError}>You already have a note with this title.</span>}
              <label htmlFor="note-description">Your thought</label>
              <textarea id="note-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Start writing here..." rows={6} maxLength={1200} required />
              <div className={styles.formFooter}>
                <span>{description.length}/1200</span>
                <div className={styles.formButtons}>
                  {editingId && <button className={styles.cancelButton} type="button" onClick={resetForm}>Cancel</button>}
                  <button className={styles.submitButton} type="submit" disabled={duplicateTitle || !isReady}><span>{editingId ? "Save changes" : "Keep this note"}</span><span aria-hidden="true">↗</span></button>
                </div>
              </div>
            </form>
            <div className={styles.composerFootnote}><span aria-hidden="true">✳</span> A thought worth keeping, kept.</div>
          </section>

          <section className={styles.notesSection} aria-labelledby="notes-title">
            <div className={styles.notesHeader}>
              <div className={styles.sectionHeading}>
                <span className={styles.stepNumber}>02</span>
                <div><p className={styles.eyebrow}>COLLECTED THOUGHTS</p><h2 id="notes-title">Your notes <span className={styles.countBadge}>{notes.length}</span></h2></div>
              </div>
              <label className={styles.searchBox}>
                <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.8" cy="8.8" r="5.6" /><path d="m13 13 4 4" /></svg>
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a note" aria-label="Search notes" />
                {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search">×</button>}
              </label>
            </div>
            {!isReady ? (
              <div className={styles.emptyState}><span className={styles.emptyGlyph}>···</span><p>Opening your notebook...</p></div>
            ) : visibleNotes.length ? (
              <div className={styles.noteGrid}>{visibleNotes.map((note, index) => <NoteItem key={note.id} note={note} index={index} onEdit={(selected) => { setEditingId(selected.id); setTitle(selected.title); setDescription(selected.description); }} onDelete={deleteNote} />)}</div>
            ) : (
              <div className={styles.emptyState}><span className={styles.emptyGlyph} aria-hidden="true">✳</span><h3>{query ? "Nothing found just yet." : "A blank page, full of possibility."}</h3><p>{query ? "Try another word or phrase." : "Your first thought can go right here."}</p></div>
            )}
            <div className={styles.listFooter}><span>NOCTURNE NOTEBOOK</span><span>{String(visibleNotes.length).padStart(2, "0")} ENTRIES</span></div>
          </section>
        </div>
      </main>
      <footer className={styles.footer}><span>ARCI</span><span>KEEP WHAT MATTERS.</span></footer>
    </div>
  );
}
