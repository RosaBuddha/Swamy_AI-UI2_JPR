import React, { useState, useRef, useEffect } from 'react';
import { Button } from './button';
import { TableModal } from './TableModal';
import { 
  Bold as BoldIcon, 
  Italic as ItalicIcon, 
  List, 
  Table as TableIcon,
  Plus,
  Minus,
  Columns,
  MoreHorizontal,
  MoreVertical
} from 'lucide-react';
import { Dropdown } from "./Dropdown";

interface TableDropdownProps {
  onAddRow: () => void;
  onRemoveRow: () => void;
  onAddColumn: () => void;
  onRemoveColumn: () => void;
}

const TableDropdown: React.FC<TableDropdownProps> = ({
  onAddRow,
  onRemoveRow,
  onAddColumn,
  onRemoveColumn
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const dropdownItems = [
    {
      label: 'Add Row',
      onClick: onAddRow,
      icon: <Plus className="w-4 h-4" />,
    },
    {
      label: 'Remove Row',
      onClick: onRemoveRow,
      icon: <Minus className="w-4 h-4" />,
    },
    {
      label: 'Add Column',
      onClick: onAddColumn,
      icon: <Columns className="w-4 h-4" />,
    },
    {
      label: 'Remove Column',
      onClick: onRemoveColumn,
      icon: <MoreHorizontal className="w-4 h-4" />,
    },
  ];

  return (
    <div className="relative">
      <Button
        ref={buttonRef}
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        title="Table Actions"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        <MoreVertical className="h-4 w-4" />
      </Button>
      
      <Dropdown
        items={dropdownItems}
        isOpen={isDropdownOpen}
        onClose={() => setIsDropdownOpen(false)}
        triggerRef={buttonRef}
      />
    </div>
  );
};

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Enter text...",
  className = ""
}) => {
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isTableSelected, setIsTableSelected] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    handleInput();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const clipboardData = e.clipboardData;
    if (clipboardData) {
      const htmlData = clipboardData.getData('text/html');
      if (htmlData && htmlData.includes('<table')) {
        e.preventDefault();
        document.execCommand('insertHTML', false, htmlData);
        handleInput();
        return;
      }
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleSelectionChange = () => {
    const selection = window.getSelection();
    if (selection && selection.anchorNode) {
      const element = selection.anchorNode.nodeType === Node.TEXT_NODE 
        ? selection.anchorNode.parentElement 
        : selection.anchorNode as Element;
      
      if (element) {
        const isInTable = element.closest('table') !== null;
        setIsTableSelected(isInTable);
      }
    }
  };

  const getCurrentTableCell = () => {
    const selection = window.getSelection();
    if (selection && selection.anchorNode) {
      const element = selection.anchorNode.nodeType === Node.TEXT_NODE 
        ? selection.anchorNode.parentElement 
        : selection.anchorNode as Element;
      
      if (element) {
        return element.closest('td, th') as HTMLTableCellElement;
      }
    }
    return null;
  };

  const addTableRow = () => {
    const cell = getCurrentTableCell();
    if (!cell) return;
    
    const table = cell.closest('table');
    const row = cell.closest('tr');
    if (!table || !row) return;
    
    const newRow = row.cloneNode(true) as HTMLTableRowElement;
    const cells = newRow.querySelectorAll('td, th');
    cells.forEach(cell => {
      cell.textContent = '';
    });
    
    row.parentNode!.insertBefore(newRow, row.nextSibling);
    handleInput();
  };

  const removeTableRow = () => {
    const cell = getCurrentTableCell();
    if (!cell) return;
    
    const table = cell.closest('table');
    const row = cell.closest('tr');
    if (!table || !row) return;
    
    const tbody = row.parentNode as HTMLTableSectionElement;
    if (tbody.children.length > 1) {
      row.remove();
      handleInput();
    }
  };

  const addTableColumn = () => {
    const cell = getCurrentTableCell();
    if (!cell) return;
    
    const table = cell.closest('table');
    if (!table) return;
    
    const cellIndex = Array.from(cell.parentNode!.children).indexOf(cell);
    const rows = table.querySelectorAll('tr');
    
    rows.forEach(row => {
      const newCell = row.children[0].tagName === 'TH' 
        ? document.createElement('th') 
        : document.createElement('td');
      newCell.textContent = '';
      
      if (cellIndex + 1 < row.children.length) {
        row.insertBefore(newCell, row.children[cellIndex + 1]);
      } else {
        row.appendChild(newCell);
      }
    });
    
    handleInput();
  };

  const removeTableColumn = () => {
    const cell = getCurrentTableCell();
    if (!cell) return;
    
    const table = cell.closest('table');
    const row = cell.closest('tr');
    if (!table || !row) return;
    
    if (row.children.length > 1) {
      const cellIndex = Array.from(row.children).indexOf(cell);
      const rows = table.querySelectorAll('tr');
      
      rows.forEach(row => {
        if (row.children[cellIndex]) {
          row.children[cellIndex].remove();
        }
      });
      
      handleInput();
    }
  };

  const insertTable = () => {
    const tableHTML = `<table>
      <thead>
        <tr>
          <th>Header 1</th>
          <th>Header 2</th>
          <th>Header 3</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Cell 1</td>
          <td>Cell 2</td>
          <td>Cell 3</td>
        </tr>
        <tr>
          <td>Cell 4</td>
          <td>Cell 5</td>
          <td>Cell 6</td>
        </tr>
      </tbody>
    </table>`;
    
    document.execCommand('insertHTML', false, tableHTML);
    handleInput();
  };

  return (
    <div className={`border border-gray-300 rounded-lg ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('bold')}
          className="h-8 w-8 p-0"
        >
          <BoldIcon className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('italic')}
          className="h-8 w-8 p-0"
        >
          <ItalicIcon className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('insertUnorderedList')}
          className="h-8 w-8 p-0"
        >
          <List className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={insertTable}
          className="h-8 w-8 p-0"
          title="Insert Table"
        >
          <TableIcon className="h-4 w-4" />
        </Button>

        {/* Table Controls - Only show when table is selected */}
        {isTableSelected && (
          <>
            <TableDropdown 
              onAddRow={addTableRow}
              onRemoveRow={removeTableRow}
              onAddColumn={addTableColumn}
              onRemoveColumn={removeTableColumn}
            />
          </>
        )}
      </div>

      {/* Editor Content */}
      <div className="p-3">
        <div
          ref={editorRef}
          contentEditable
          className="prose prose-sm max-w-none focus:outline-none min-h-[120px] p-3"
          style={{ 
            minHeight: '120px',
            border: 'none',
            outline: 'none'
          }}
          onInput={handleInput}
          onPaste={handlePaste}
          onMouseUp={handleSelectionChange}
          onKeyUp={handleSelectionChange}
          suppressContentEditableWarning
          placeholder={placeholder}
        />
      </div>

      {/* Table Modal */}
      <TableModal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
        onInsert={(tableHTML) => {
          document.execCommand('insertHTML', false, tableHTML);
          handleInput();
          setIsTableModalOpen(false);
        }}
      />
    </div>
  );
};