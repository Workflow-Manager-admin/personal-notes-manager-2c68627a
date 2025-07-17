import React, { useState, useEffect, useMemo } from "react";
import "./App.css";

// Component imports
import Topbar from "./components/Topbar";
import Sidebar from "./components/Sidebar";
import MainContent from "./components/MainContent";
import NoteModal from "./components/NoteModal";

// Helper to get unique tags from notes
function getAllTags(notes) {
  const set = new Set();
  notes.forEach(n => (n.tags || []).forEach(tag => set.add(tag)));
  return Array.from(set);
}

// Simulate local storage
const STORAGE_KEY = "kavia_notes_v1";
function loadNotesFromLS() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const notes = JSON.parse(raw);
    if (!Array.isArray(notes)) return [];
    return notes;
  } catch (e) {
    return [];
  }
}
function saveNotesToLS(notes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

// PUBLIC_INTERFACE
function App() {
  // Theme management (light only, but dark-mode toggle as a showcase)
  const [theme, setTheme] = useState("light");
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);
  const toggleTheme = () => setTheme(t => (t === "light" ? "dark" : "light"));

  // Notes state
  const [notes, setNotes] = useState(() => loadNotesFromLS());

  useEffect(() => {
    saveNotesToLS(notes);
  }, [notes]);

  // Modal controls
  const [modalOpen, setModalOpen] = useState(false);
  const [modalNote, setModalNote] = useState(undefined);

  // Search/filter state
  const [searchText, setSearchText] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);

  const allTags = useMemo(() => getAllTags(notes), [notes]);

  // Filter/search logic
  const filteredNotes = useMemo(() => {
    return notes
      .filter(n =>
        n.title.toLowerCase().includes(searchText.trim().toLowerCase()) ||
        n.content.toLowerCase().includes(searchText.trim().toLowerCase())
      )
      .filter(n => selectedTags.length === 0 || (n.tags && selectedTags.every(tag => (n.tags || []).includes(tag))));
  }, [notes, searchText, selectedTags]);

  // Handlers
  function handleNewNote() {
    setModalNote(undefined);
    setModalOpen(true);
  }
  function handleEditNote(note) {
    setModalNote(note);
    setModalOpen(true);
  }
  function handleDeleteNote(id) {
    if (window.confirm("Delete this note?")) {
      setNotes(notes => notes.filter(n => n.id !== id));
    }
  }
  function handleSaveNote(updatedNote) {
    if (!updatedNote.id) {
      // New note
      setNotes(notes =>
        [{ ...updatedNote, id: Date.now().toString() }, ...notes]
      );
    } else {
      // Edit existing
      setNotes(notes =>
        notes.map(n => (n.id === updatedNote.id ? updatedNote : n))
      );
    }
  }
  function handleTagToggle(tag) {
    setSelectedTags(tags =>
      tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag]
    );
  }
  function handleSearchTextChange(text) {
    setSearchText(text);
  }

  return (
    <div className="App notes-app-root">
      <button
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      >
        {theme === "light" ? "🌙 Dark" : "☀️ Light"}
      </button>
      <Topbar onNewNote={handleNewNote} />
      <div className="layout">
        <Sidebar
          searchText={searchText}
          onSearchTextChange={handleSearchTextChange}
          availableTags={allTags}
          selectedTags={selectedTags}
          onTagToggle={handleTagToggle}
        />
        <MainContent notes={filteredNotes} onEdit={handleEditNote} onDelete={handleDeleteNote} />
      </div>
      <NoteModal
        open={modalOpen}
        note={modalNote}
        onSave={handleSaveNote}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}

export default App;
