import { Panel, Button, Tag } from './ui';
export default function CrewCard({ member, onEdit, onAssign, busy }) {
  const initials = member.name.split(' ').map((word) => word[0]).join('').slice(0, 2);
  return <Panel className="stack" draggable onDragStart={(e) => { e.dataTransfer.setData('application/x-starfield-crew', String(member.id)); e.dataTransfer.effectAllowed = 'move'; }} aria-label={member.name + ' crew card'}>
    <div className="card-heading"><div><p className="eyebrow">{member.faction}</p><h2>{member.name}</h2><p className="small muted">{member.role}</p></div><span className="crew-avatar" aria-hidden="true">{initials}</span></div>
    <div className="stack">{member.skills.map((skill) => <div className="card-heading small" key={skill.name}><span>{skill.name}</span><span className="skill-pips" aria-label={'Rank ' + skill.rank + ' of 4'}>{[1, 2, 3, 4].map((rank) => <i key={rank} className={rank <= skill.rank ? 'filled' : ''} />)}</span></div>)}</div>
    <p className="small muted">{member.assigned_ship ? 'Ship / ' + member.assigned_ship : member.assigned_outpost ? 'Outpost / ' + member.assigned_outpost : 'Awaiting assignment'}</p>
    <div>{member.is_companion && <Tag>Companion</Tag>}{member.traits.map((trait) => <Tag key={trait}>{trait}</Tag>)}</div>
    <div className="actions"><Button variant="ghost" onClick={() => onEdit(member)}>Edit {member.name}</Button><Button variant="ghost" disabled={busy} onClick={() => onAssign(member.id, 'ship')}>Ship</Button><Button variant="ghost" disabled={busy} onClick={() => onAssign(member.id, 'outpost')}>Outpost</Button>{(member.assigned_ship || member.assigned_outpost) && <Button variant="ghost" disabled={busy} onClick={() => onAssign(member.id, 'unassigned')}>Unassign</Button>}</div>
  </Panel>;
}
