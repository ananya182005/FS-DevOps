import { useCallback, useEffect, useState } from 'react';
import { api } from './api';
import { socket } from './socket';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import ConnectionStatus from './components/ConnectionStatus';
const sortTasks = tasks => [...tasks].sort((a, b) => new Date(b.created_at) - new Date(a.created_at) || b.id - a.id);
const upsert = (tasks, task) => sortTasks([task, ...tasks.filter(item => item.id !== task.id)]);
export default function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(socket.connected);
  const [users, setUsers] = useState(0);
  const refresh = useCallback(async () => { try { const { data } = await api.get('/api/tasks'); setTasks(sortTasks(data)); setError(''); } catch { setError('Could not load tasks. Check the backend connection.'); } finally { setLoading(false); } }, []);
  useEffect(() => {
    // Connect first; fetch on connection to resync after network interruptions.
    const onConnect = () => { setConnected(true); refresh(); };
    const onDisconnect = () => { setConnected(false); setUsers(0); };
    const onCreated = task => setTasks(old => upsert(old, task));
    const onUpdated = task => setTasks(old => upsert(old, task));
    const onDeleted = id => setTasks(old => old.filter(task => task.id !== id));
    const onCount = count => setUsers(count);
    socket.on('connect', onConnect); socket.on('disconnect', onDisconnect);
    socket.on('task:created', onCreated); socket.on('task:updated', onUpdated);
    socket.on('task:deleted', onDeleted); socket.on('users:count', onCount);
    socket.connect(); refresh();
    return () => { socket.off('connect', onConnect); socket.off('disconnect', onDisconnect); socket.off('task:created', onCreated); socket.off('task:updated', onUpdated); socket.off('task:deleted', onDeleted); socket.off('users:count', onCount); socket.disconnect(); };
  }, [refresh]);
  async function createTask(task) { setSaving(true); setError(''); try { const { data } = await api.post('/api/tasks', task); setTasks(old => upsert(old, data)); return true; } catch (err) { setError(err.response?.data?.error || 'Could not create task'); return false; } finally { setSaving(false); } }
  async function updateTask(id, changes) { setError(''); try { const { data } = await api.put(`/api/tasks/${id}`, changes); setTasks(old => upsert(old, data)); return true; } catch (err) { setError(err.response?.data?.error || 'Could not update task'); return false; } }
  async function deleteTask(id) { setError(''); try { await api.delete(`/api/tasks/${id}`); setTasks(old => old.filter(task => task.id !== id)); return true; } catch (err) { setError(err.response?.data?.error || 'Could not delete task'); return false; } }
  return <div className="app"><header className="topbar"><div className="brand"><span className="brand-mark">✓</span><div><h1>Live Task Board</h1><p>Stay organized, together.</p></div></div><ConnectionStatus connected={connected} users={users} /></header><main><div className="intro"><div><span className="eyebrow">YOUR WORKSPACE</span><h2>Make progress, one task at a time.</h2><p>Changes sync instantly across every open board.</p></div><div className="total"><strong>{tasks.length}</strong><span>Total tasks</span></div></div>{error && <div role="alert" className="error">{error} <button onClick={refresh}>Retry</button></div>}<TaskForm onCreate={createTask} saving={saving} />{loading ? <p className="loading">Loading tasks…</p> : <TaskList tasks={tasks} onUpdate={updateTask} onDelete={deleteTask} />}</main><footer>Built with React · Express · PostgreSQL · Redis · Socket.IO</footer></div>;
}
