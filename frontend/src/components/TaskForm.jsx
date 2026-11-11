import { useState } from 'react';
export default function TaskForm({ onCreate, saving }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  async function submit(event) {
    event.preventDefault();
    if (!title.trim()) return;
    const ok = await onCreate({ title: title.trim(), description });
    if (ok) { setTitle(''); setDescription(''); }
  }
  return <form onSubmit={submit} className="task-form"><h2>Add a task</h2><label>Title<input maxLength="200" required value={title} onChange={e => setTitle(e.target.value)} placeholder="What needs to get done?" /></label><label>Description<textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional details" rows="3" /></label><button disabled={saving || !title.trim()}>{saving ? 'Saving…' : '+ Add task'}</button></form>;
}
