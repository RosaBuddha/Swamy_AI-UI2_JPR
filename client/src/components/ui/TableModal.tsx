import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './button';
import { Input } from './Input';
import { Plus, Minus, X } from 'lucide-react';

interface TableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (tableHTML: string) => void;
}

export const TableModal: React.FC<TableModalProps> = ({ isOpen, onClose, onInsert }) => {
  const [tableData, setTableData] = useState<string[][]>([
    ['Header 1', 'Header 2', 'Header 3'],
    ['Cell 1', 'Cell 2', 'Cell 3'],
    ['Cell 4', 'Cell 5', 'Cell 6'],
  ]);

  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    const newData = [...tableData];
    newData[rowIndex][colIndex] = value;
    setTableData(newData);
  };

  const addRow = () => {
    const newRow = new Array(tableData[0].length).fill('');
    setTableData([...tableData, newRow]);
  };

  const removeRow = (rowIndex: number) => {
    if (tableData.length > 1) {
      const newData = tableData.filter((_, index) => index !== rowIndex);
      setTableData(newData);
    }
  };

  const addColumn = () => {
    const newData = tableData.map(row => [...row, '']);
    setTableData(newData);
  };

  const removeColumn = (colIndex: number) => {
    if (tableData[0].length > 1) {
      const newData = tableData.map(row => row.filter((_, index) => index !== colIndex));
      setTableData(newData);
    }
  };

  const generateTableHTML = () => {
    const headerRow = tableData[0].map(cell => {
      const cellContent = cell.trim() || ' ';
      return `<th>${cellContent}</th>`;
    }).join('');
    
    const bodyRows = tableData.slice(1).map(row => {
      const cells = row.map(cell => {
        const cellContent = cell.trim() || ' ';
        return `<td>${cellContent}</td>`;
      }).join('');
      return `<tr>${cells}</tr>`;
    }).join('');
    
    return `<table><thead><tr>${headerRow}</tr></thead><tbody>${bodyRows}</tbody></table>`;
  };

  const handleInsert = () => {
    const tableHTML = generateTableHTML();
    onInsert(tableHTML);
    onClose();
  };

  const handleCancel = () => {
    // Reset to default table
    setTableData([
      ['Header 1', 'Header 2', 'Header 3'],
      ['Cell 1', 'Cell 2', 'Cell 3'],
      ['Cell 4', 'Cell 5', 'Cell 6'],
    ]);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} title="Create Table" className="max-w-5xl max-h-[80vh]">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addRow}
              className="flex items-center gap-1"
            >
              <Plus className="h-3 w-3" />
              Add Row
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addColumn}
              className="flex items-center gap-1"
            >
              <Plus className="h-3 w-3" />
              Add Column
            </Button>
          </div>
          <div className="text-sm text-gray-500">
            First row will be headers
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-auto max-h-[50vh]">
          <table className="w-full min-w-max">
            <tbody>
              {tableData.map((row, rowIndex) => (
                <tr key={rowIndex} className={rowIndex === 0 ? 'bg-gray-50' : ''}>
                  {row.map((cell, colIndex) => (
                    <td key={colIndex} className="border-r border-b border-gray-200 p-0 relative min-w-[150px]">
                      <div className="flex items-center">
                        <Input
                          value={cell}
                          onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                          className="border-0 rounded-none focus:ring-0 focus:border-0 min-w-[140px]"
                          placeholder={rowIndex === 0 ? 'Header' : 'Cell'}
                        />
                        {colIndex === row.length - 1 && tableData[0].length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeColumn(colIndex)}
                            className="absolute -right-1 top-0 h-full w-6 p-0 opacity-0 hover:opacity-100 hover:bg-red-50 text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                  ))}
                  {rowIndex !== 0 && tableData.length > 1 && (
                    <td className="w-8 border-b border-gray-200 p-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRow(rowIndex)}
                        className="h-full w-full p-0 opacity-0 hover:opacity-100 hover:bg-red-50 text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleInsert}
          >
            Insert Table
          </Button>
        </div>
      </div>
    </Modal>
  );
};