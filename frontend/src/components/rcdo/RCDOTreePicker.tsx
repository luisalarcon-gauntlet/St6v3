import { useState } from 'react';
import type { RallyCry } from '@/types/domain';

interface RCDOTreePickerProps {
  tree: RallyCry[];
  value: string;
  onChange: (outcomeId: string) => void;
}

export function RCDOTreePicker({ tree, value, onChange }: RCDOTreePickerProps) {
  const [open, setOpen] = useState(false);

  const selectedLabel = findOutcomeLabel(tree, value);

  return (
    <div className="relative">
      <button
        type="button"
        role="button"
        aria-label="Select outcome"
        aria-expanded={open}
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
          role="tree"
          className="absolute z-10 mt-1 w-full max-h-64 overflow-auto bg-surface border border-border rounded shadow-lg"
        >
          {tree.map((rc) => (
            <div key={rc.id} role="treeitem" aria-expanded="true">
              <div className="px-3 py-1.5 text-xs font-bold text-gray-400 uppercase tracking-wide bg-surface">
                {rc.title}
              </div>
              {rc.definingObjectives.map((dObj) => (
                <div key={dObj.id} role="treeitem" aria-expanded="true" className="pl-3">
                  <div className="px-3 py-1 text-xs text-gray-500">
                    {dObj.title}
                  </div>
                  {dObj.outcomes.map((outcome) => (
                    <button
                      key={outcome.id}
                      type="button"
                      role="treeitem"
                      onClick={() => {
                        onChange(outcome.id);
                        setOpen(false);
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
