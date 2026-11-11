import TaskItem from './TaskItem.jsx';
const columns = [{ id: 'todo', name: 'To do' }, { id: 'in_progress', name: 'In progress' }, { id: 'done', name: 'Done' }];
export default function TaskList({ tasks, onUpdate, onDelete }) {
  return <div className="board">{columns.map(column => { const items = tasks.filter(task => task.status === column.id); return <section className="column" key={column.id}><div className="column-header"><h2>{column.name}</h2><span className="count">{items.length}</span></div><div className="column-body">{items.length ? items.map(task => <TaskItem key={task.id} task={task} onUpdate={onUpdate} onDelete={onDelete} />) : <p className="empty">No tasks yet</p>}</div></section>; })}</div>;
}
