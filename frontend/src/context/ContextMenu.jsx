import React from "react";
import {  menuContainer, menuHeader, menuItem, menuItemDescription } from "./ContextMenu.styles";
import { getContextMenuCommands } from "../commands/contextMenuCommands";

export default function ContextMenu({ context, onAction }) {

  if (!context) return null;

  const { x, y, system } = context;

  const commands = Object.values(getContextMenuCommands);

  const handleCommandClick = (action) => {
  onAction(action, context);
};


   return (
        <div
        style={{ ...menuContainer, top: context.y, left: context.x }}
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.preventDefault()}
    >
    <div style={menuHeader}>
        {system?.name}
    </div>

    {commands.map((cmd) => (
        <div
        key={cmd.id}
        style={menuItem}
        onClick={() => handleCommandClick(cmd.action)}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#1e293b")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
        <div>{cmd.display}</div>
        <div style={menuItemDescription}>{cmd.description}</div>
        </div>
    ))}
    </div>

  );
}
