import { useState, useEffect } from "react";

const API = "http://localhost:5000/api/workspaces";

export default function App() {
  const [workspaceId, setWorkspaceId] = useState("");
  const [workspace, setWorkspace] = useState(null);
  const [notes, setNotes] = useState([]);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  /* ---------------- OPEN WORKSPACE ---------------- */
  const openWorkspace = async () => {
    const res = await fetch(`${API}/open`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId }),
    });

    

    const data = await res.json();
    setWorkspace(data);
    fetchNotes(data.workspaceId);
  };

  /* ---------------- FETCH NOTES ---------------- */
  const fetchNotes = async (id) => {
    const res = await fetch(`${API}/${id}/notes`);
    const data = await res.json();
    setNotes(data);
  };

  /* ---------------- CREATE NOTE ---------------- */
  const createNote = async () => {
    const res = await fetch(`${API}/${workspace.workspaceId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New Note", content: "" }),
    });

    const data = await res.json();
    setNotes(data);
  };

  /* ---------------- SELECT NOTE ---------------- */
  const selectNote = (note) => {
    setActiveNoteId(note._id);
    setTitle(note.title);
    setContent(note.content);
  };

  /* ---------------- UPDATE NOTE ---------------- */
  const saveNote = async () => {
    if (!activeNoteId) return;

    const res = await fetch(
      `${API}/${workspace.workspaceId}/notes/${activeNoteId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      }
    );

    const data = await res.json();
    setNotes(data);
  };

  /* ---------------- DELETE NOTE ---------------- */
  const deleteNote = async (noteId) => {
    await fetch(`${API}/${workspace.workspaceId}/notes/${noteId}`, {
      method: "DELETE",
    });

    setNotes(notes.filter((n) => n._id !== noteId));
    setActiveNoteId(null);
    setTitle("");
    setContent("");
  };

  /* ---------------- DELETE WORKSPACE ---------------- */
  const deleteWorkspace = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this workspace?"
    );

    if (!confirmDelete) return;

    await fetch(`${API}/${workspace.workspaceId}`, {
      method: "DELETE",
    });

    setWorkspace(null);
    setNotes([]);
    setWorkspaceId("");
    setPassword("");
  };

  /* ================= UI ================= */

  if (!workspace) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Open Workspace</h2>
        <input
          placeholder="Workspace ID"
          value={workspaceId}
          onChange={(e) => setWorkspaceId(e.target.value)}
        />
        <br />
        
        <br />
        <button onClick={openWorkspace}>Open</button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Sidebar */}
      <div style={{ width: 250, borderRight: "1px solid #ccc", padding: 10 }}>
        <h3>Workspace: {workspace.workspaceId}</h3>
        <button onClick={createNote}> ➕ New Note</button>
        <button onClick={deleteWorkspace} style={{ color: "red" }}>
          🗑 Delete Workspace
        </button>

        <ul>
          {notes.map((note) => (
            <li key={note._id}>
              <span onClick={() => selectNote(note)}>{note.title}</span>
              <button onClick={() => deleteNote(note._id)}>❌</button>
            </li>
          ))}
        </ul>
      </div>

      {/* Editor */}
      <div style={{ flex: 1, padding: 20 }}>
        {activeNoteId ? (
          <>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
            />
            <br />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={15}
              cols={60}
            />
            <br />
            <button onClick={saveNote}>💾 Save</button>
          </>
        ) : (
          <p>Select a note</p>
        )}
      </div>
    </div>
  );
}


