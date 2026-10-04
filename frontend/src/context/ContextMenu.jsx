import { getContextMenuCommands } from '../commands/contextMenuCommands';
export default function ContextMenu({ context, onAction }) {
  if (!context) return null;
  return <div className="context-menu" style={{ top: context.y, left: context.x }} onClick={(e) => e.stopPropagation()} onContextMenu={(e) => e.preventDefault()}><p className="eyebrow p-2">{context.system.name}</p>{Object.values(getContextMenuCommands).map((command) => <button key={command.id} onClick={() => onAction(command.action, context)}>{command.display}<small>{command.description}</small></button>)}</div>;
}
