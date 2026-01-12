import React, { useState, useRef } from 'react';
import { dispatch } from '../cosmodrag/cosmoDragDispatcher';

const CosmoDropZone = ({ data }) => {
  const [hovering, setHovering] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');
  
  // Ref to trigger the hidden input
  const fileInputRef = useRef(null);

  const handleFile = (e) => {
    // Check files from input change OR drag-and-drop
    const file = e.target.files ? e.target.files[0] : e.dataTransfer.files[0];
    
    if (!file) return;

    setSelectedFileName(file.name);
    console.log('Received file:', file);

    dispatch({ type: 'FILE_DROPPED', file });
  };

  const handleClear = (e) => {
    e.stopPropagation(); // Prevent re-triggering the click upload
    setSelectedFileName('');
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setHovering(true);
  };

  return (
    <div
      onDragOver={onDragOver}
      onDragEnter={() => setHovering(true)}
      onDragLeave={() => setHovering(false)}
      onDrop={(e) => {
        e.preventDefault();
        setHovering(false);
        handleFile(e);
      }}
      onClick={() => fileInputRef.current.click()}
      style={{
        backgroundColor: hovering ? 'rgba(18, 24, 32, 0.85)' : 'rgba(12, 16, 22, 0.95)',
        padding: '20px',
        border: hovering ? '1px solid #00bfff' : '1px dashed #3a3f47',
        borderRadius: '6px',
        width: '380px',
        textAlign: 'center',
        boxShadow: hovering
          ? '0 0 12px 2px rgba(0, 191, 255, 0.4)'
          : '0 0 6px 1px rgba(0, 0, 0, 0.6)',
        transition: 'all 0.4s ease-out',
        fontFamily: 'monospace',
        color: '#cdd7e0',
        fontSize: '11px',
        letterSpacing: '0.6px',
        textTransform: 'uppercase',
        backdropFilter: 'blur(2px)',
        position: 'relative',
        cursor: 'pointer'
      }}
    >
      {/* Hidden input to remove the "No file chosen" browser text */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".txt,.doc,.docx"
        onChange={handleFile}
        style={{ display: 'none' }}
      />

      {!selectedFileName ? (
        <p style={{ margin: 0, opacity: 0.85, pointerEvents: 'none' }}>
          Drag & Drop or Click to Upload
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ color: '#00bfff', marginBottom: '8px', fontWeight: 'bold' }}>
            {selectedFileName}
          </span>
          <button 
            onClick={handleClear}
            style={{
              background: 'transparent',
              border: '1px solid #3a3f47',
              color: '#ff4d4d',
              fontSize: '9px',
              cursor: 'pointer',
              padding: '2px 8px',
              borderRadius: '4px'
            }}
          >
            REMOVE FILE
          </button>
        </div>
      )}
    </div>
  );
};

export default CosmoDropZone;