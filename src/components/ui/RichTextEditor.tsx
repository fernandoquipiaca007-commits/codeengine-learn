import React, { useEffect, useRef, useState } from 'react';
import { Bold, Italic, Underline, Link as LinkIcon, List, ListOrdered, RemoveFormatting } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Escreva aqui...',
  className = '',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    list: false,
    orderedList: false,
  });

  // Sync value from props to contentEditable innerHTML ONLY if it's different
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (editor.innerHTML !== value) {
      editor.innerHTML = value || '<p><br></p>';
    }
  }, [value]);

  const emitChange = () => {
    const editor = editorRef.current;
    if (!editor) return;
    let html = editor.innerHTML;
    // Normalize empty editor values
    if (html === '<p><br></p>' || html === '<br>' || html === '') {
      html = '';
    }
    onChange(html);
    updateActiveFormats();
  };

  const executeCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    emitChange();
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const updateActiveFormats = () => {
    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      list: document.queryCommandState('insertUnorderedList'),
      orderedList: document.queryCommandState('insertOrderedList'),
    });
  };

  const handleLink = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      alert('Selecione algum texto primeiro para inserir um link.');
      return;
    }
    const url = prompt('Insira o endereço do link (URL):', 'https://');
    if (url === null) return; // User cancelled
    if (url.trim() === '') {
      executeCommand('unlink');
    } else {
      executeCommand('createLink', url);
    }
  };

  const handleHeadingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'p') {
      executeCommand('formatBlock', '<p>');
    } else {
      executeCommand('formatBlock', `<${val}>`);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  const showPlaceholder = !value || value === '<p><br></p>' || value === '<br>' || value === '';

  return (
    <div className={`border border-white/10 rounded-xl bg-surface-high overflow-hidden flex flex-col ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 bg-white/5 border-b border-white/10 p-2 select-none">
        {/* Format Block Dropdown */}
        <select
          onChange={handleHeadingChange}
          className="bg-surface border border-white/10 text-white rounded px-2 py-1 text-xs focus:outline-none cursor-pointer hover:bg-white/10 mr-1"
        >
          <option value="p">Normal</option>
          <option value="h1">Título 1</option>
          <option value="h2">Título 2</option>
          <option value="h3">Título 3</option>
        </select>

        {/* Bold */}
        <button
          type="button"
          onClick={() => executeCommand('bold')}
          className={`p-1.5 rounded transition ${activeFormats.bold ? 'bg-primary/25 text-primary border border-primary/30' : 'text-white/70 hover:bg-white/10'}`}
          title="Negrito"
        >
          <Bold size={14} />
        </button>

        {/* Italic */}
        <button
          type="button"
          onClick={() => executeCommand('italic')}
          className={`p-1.5 rounded transition ${activeFormats.italic ? 'bg-primary/25 text-primary border border-primary/30' : 'text-white/70 hover:bg-white/10'}`}
          title="Itálico"
        >
          <Italic size={14} />
        </button>

        {/* Underline */}
        <button
          type="button"
          onClick={() => executeCommand('underline')}
          className={`p-1.5 rounded transition ${activeFormats.underline ? 'bg-primary/25 text-primary border border-primary/30' : 'text-white/70 hover:bg-white/10'}`}
          title="Sublinhado"
        >
          <Underline size={14} />
        </button>

        {/* Link */}
        <button
          type="button"
          onClick={handleLink}
          className="p-1.5 rounded transition text-white/70 hover:bg-white/10"
          title="Inserir Link"
        >
          <LinkIcon size={14} />
        </button>

        <div className="w-[1px] h-4 bg-white/10 mx-1" />

        {/* Bullet List */}
        <button
          type="button"
          onClick={() => executeCommand('insertUnorderedList')}
          className={`p-1.5 rounded transition ${activeFormats.list ? 'bg-primary/25 text-primary border border-primary/30' : 'text-white/70 hover:bg-white/10'}`}
          title="Lista com Marcadores"
        >
          <List size={14} />
        </button>

        {/* Numbered List */}
        <button
          type="button"
          onClick={() => executeCommand('insertOrderedList')}
          className={`p-1.5 rounded transition ${activeFormats.orderedList ? 'bg-primary/25 text-primary border border-primary/30' : 'text-white/70 hover:bg-white/10'}`}
          title="Lista Numerada"
        >
          <ListOrdered size={14} />
        </button>

        <div className="w-[1px] h-4 bg-white/10 mx-1" />

        {/* Clear Format */}
        <button
          type="button"
          onClick={() => executeCommand('removeFormat')}
          className="p-1.5 rounded transition text-white/70 hover:bg-white/10"
          title="Limpar Formatação"
        >
          <RemoveFormatting size={14} />
        </button>
      </div>

      {/* Editor Body Wrapper */}
      <div className="relative flex-1 min-h-[120px]">
        {showPlaceholder && (
          <span className="absolute left-4 top-3 text-white/30 pointer-events-none select-none text-sm font-sans">
            {placeholder}
          </span>
        )}
        <div
          ref={editorRef}
          contentEditable
          onInput={emitChange}
          onBlur={emitChange}
          onKeyUp={updateActiveFormats}
          onMouseUp={updateActiveFormats}
          onPaste={handlePaste}
          className="w-full min-h-[120px] px-4 py-3 text-sm text-white focus:outline-none overflow-y-auto font-sans leading-relaxed prose prose-invert max-w-none prose-sm outline-none"
        />
      </div>
    </div>
  );
}
