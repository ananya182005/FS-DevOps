export default function ConnectionStatus({ connected, users }) {
  return <div className="connection"><span className={connected ? 'dot live' : 'dot'} />{connected ? 'Live' : 'Disconnected'} <span className="online">· {users} {users === 1 ? 'user' : 'users'} online</span></div>;
}
