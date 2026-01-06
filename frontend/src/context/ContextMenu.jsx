import React from "react";
import { menuContainer } from "./ContextMenu.styles";
import { getContextMenuCommands } from "../commands/contextMenuCommands";

export default function ContextMenu({ context }) {

  if (!context) return null;

  const { x, y, system } = context;

  const commands = Object.values(getContextMenuCommands);

  const handleCommandClick = (cmd) => {
  onAction?.(cmd, context);
  onClose?.();
};


   return (
        <div
    style={{ ...menuContainer, top: y, left: x }}
    onClick={(e) => e.stopPropagation()}
    onContextMenu={(e) => e.preventDefault()}
    >
    <div style={{ marginBottom: "6px", fontWeight: "bold" }}>
        {system?.name}
    </div>

    {commands.map((cmd) => (
        <div key={cmd.id} 
            style={{ padding: "4px 0" }}
            onClick={() => handleCommandClick(cmd)}
            >
        {cmd.display}
        
        </div>
    ))}
    </div>

  );
}
