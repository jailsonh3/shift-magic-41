import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ShiftTemplate } from '@/types';
import { Coffee, X } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  templates: ShiftTemplate[];
  onSelect: (templateId: string) => void;
  onDayOff: () => void;
  onClear: () => void;
}

const ShiftEditPopover: React.FC<Props> = ({ children, templates, onSelect, onDayOff, onClear }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-64 p-2">
        <p className="text-xs font-medium text-muted-foreground px-2 py-1">Turnos disponíveis</p>
        <div className="space-y-1 max-h-52 overflow-y-auto">
          {templates.filter(t => t.active).map(t => (
            <button key={t.id} onClick={() => onSelect(t.id)}
              className="w-full text-left px-2 py-1.5 rounded hover:bg-muted text-sm flex justify-between">
              <span className="font-medium">{t.name}</span>
              <span className="text-xs text-muted-foreground">{t.startTime}</span>
            </button>
          ))}
        </div>
        <div className="border-t mt-2 pt-2 space-y-1">
          <Button variant="outline" size="sm" className="w-full gap-2" onClick={onDayOff}>
            <Coffee className="w-3.5 h-3.5" />Marcar como folga
          </Button>
          <Button variant="ghost" size="sm" className="w-full gap-2 text-destructive" onClick={onClear}>
            <X className="w-3.5 h-3.5" />Limpar célula
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ShiftEditPopover;
