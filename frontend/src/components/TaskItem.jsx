import { useState } from 'react';
export default function TaskItem({ task, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [busy, setBusy] = useState(false);
  async function save(event) {
    event.preventDefault(); setBusy(true);
    try { if (await onUpdate(task.id, { title, description })) setEditing(false); } finally { setBusy(false); }
  }
  async function changeStatus(event) { setBusy(true); try { await onUpdate(task.id, { status: event.target.value }); } finally { setBusy(false); } }
  async function remove() { if (!window.confirm('Delete this task?')) return; setBusy(true); try { await onDelete(task.id); } finally { setBusy(false); } }
  return <article className="task-card">{editing ? <form onSubmit={save} className="edit-form"><input aria-label="Edit title" required maxLength="200" value={title} onChange={e => setTitle(e.target.value)} /><textarea aria-label="Edit description" value={description} onChange={e => setDescription(e.target.value)} /><div className="actions"><button disabled={busy}>Save</button><button type="button" className="secondary" onClick={() => { setEditing(false); setTitle(task.title); setDescription(task.description || ''); }}>Cancel</button></div></form> : <><div className="task-heading"><h3>{task.title}</h3><span className="task-id">#{task.id}</span></div>{task.description && <p>{task.description}</p>}<div className="task-bottom"><select aria-label={`Status for ${task.title}`} disabled={busy} value={task.status} onChange={changeStatus}><option value="todo">To do</option><option value="in_progress">In progress</option><option value="done">Done</option></select><div className="actions"><button className="secondary" disabled={busy} onClick={() => setEditing(true)}>Edit</button><button className="danger" disabled={busy} onClick={remove}>Delete</button></div></div></>}</article>;
}
