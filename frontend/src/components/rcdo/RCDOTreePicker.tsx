import { useEffect, useRef, useState } from 'react';
import type { RallyCry } from '@/types/domain';

interface RCDOTreePickerProps {
  tree: RallyCry[];
  value: string;
  onChange: (outcomeId: string) => void;
}

export function RCDOTreePicker({ tree, value, onChange }: RCDOTreePickerProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selectedLabel = findOutcomeLabel(tree, value);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setOpen(false);
      triggerRef.current?.focus();
    }
  }

  return (
    <div className="relative" onKeyDown={handleKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Select outcome"
        aria-expanded={open}
        aria-haspopup="tree"
        onClick={() => setOpen(!open)}
        className={`
          w-full text-left px-3 py-2 rounded border text-sm transition-colors
          ${value ? 'border-border text-white' : 'border-border text-gray-400'}
          bg-background hover:border-gray-500 focus:outline-none focus:border-primary
        `}
      >
        {selectedLabel || 'Select an outcome...'}
      </button>

      {open && (
        <div
          ref={dropdownRef}
          role="tree"
          aria-label="RCDO outcome hierarchy"
          className="absolute z-10 mt-1 w-full max-h-64 overflow-auto bg-surface border border-border rounded shadow-lg"
        >
          {tree.map((rc) => (
            <div key={rc.id} role="treeitem" aria-expanded="true">
              <div className="px-3 py-1.5 text-xs font-bold text-gray-400 uppercase tracking-wide bg-surface">
                {rc.title}
              </div>
              {rc.definingObjectives.map((dObj) => (
                <div key={dObj.id} role="group">
                  <div role="treeitem" aria-expanded="true" className="pl-3">
                    <div className="px-3 py-1 text-xs text-gray-500">
                      {dObj.title}
                    </div>
                  </div>
                  {dObj.outcomes.map((outcome) => (
                    <button
                      key={outcome.id}
                      type="button"
                      role="treeitem"
                      aria-selected={value === outcome.id}
                      onClick={() => {
                        onChange(outcome.id);
                        setOpen(false);
                        triggerRef.current?.focus();
                      }}
                      className={`
                        w-full text-left px-6 py-1.5 text-sm transition-colors
                        ${value === outcome.id ? 'text-primary bg-primary/5' : 'text-gray-300 hover:bg-white/5'}
                      `}
                    >
                      {outcome.title}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function findOutcomeLabel(tree: RallyCry[], outcomeId: string): string | null {
  for (const rc of tree) {
    for (const dObj of rc.definingObjectives) {
      for (const outcome of dObj.outcomes) {
        if (outcome.id === outcomeId) return outcome.title;
      }
    }
  }
  return null;
}
