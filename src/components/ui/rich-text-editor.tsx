import { useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  Bold, Italic, Underline, List, ListOrdered,
  Heading1, Heading2, Link, Undo, Redo, AlignRight, AlignLeft, AlignCenter,
  Quote, Code, Minus,
} from 'lucide-react';
import { Button } from './button';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from './tooltip';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  dir?: 'rtl' | 'ltr';
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

const execCmd = (command: string, value?: string) => {
  document.execCommand(command, false, value);
};

interface ToolbarButtonProps {
  icon: any;
  command: string;
  value?: string;
  label: string;
  onClick?: () => void;
}

const ToolbarButton = ({ icon: Icon, command, value, label, onClick }: ToolbarButtonProps) => (
  <TooltipProvider delayDuration={300}>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-foreground"
          onMouseDown={(e) => {
            e.preventDefault();
            if (onClick) onClick();
            else execCmd(command, value);
          }}
        >
          <Icon className="w-3.5 h-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">{label}</TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export const RichTextEditor = ({
  value,
  onChange,
  dir = 'rtl',
  placeholder = 'اكتب هنا...',
  className,
  minHeight = '200px',
}: RichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);

  // Sync external value changes
  useEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value;
      }
    }
    isInternalChange.current = false;
  }, [value]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const insertLink = () => {
    const url = prompt('أدخل الرابط:', 'https://');
    if (url) {
      execCmd('createLink', url);
      handleInput();
    }
  };

  const toolbarGroups = [
    [
      { icon: Bold, command: 'bold', label: 'غامق' },
      { icon: Italic, command: 'italic', label: 'مائل' },
      { icon: Underline, command: 'underline', label: 'تسطير' },
    ],
    [
      { icon: Heading1, command: 'formatBlock', value: 'h2', label: 'عنوان رئيسي' },
      { icon: Heading2, command: 'formatBlock', value: 'h3', label: 'عنوان فرعي' },
    ],
    [
      { icon: List, command: 'insertUnorderedList', label: 'قائمة نقطية' },
      { icon: ListOrdered, command: 'insertOrderedList', label: 'قائمة رقمية' },
      { icon: Quote, command: 'formatBlock', value: 'blockquote', label: 'اقتباس' },
    ],
    [
      { icon: AlignRight, command: 'justifyRight', label: 'محاذاة يمين' },
      { icon: AlignCenter, command: 'justifyCenter', label: 'وسط' },
      { icon: AlignLeft, command: 'justifyLeft', label: 'محاذاة يسار' },
    ],
    [
      { icon: Link, command: 'createLink', label: 'رابط', onClick: insertLink },
      { icon: Minus, command: 'insertHorizontalRule', label: 'خط فاصل' },
    ],
    [
      { icon: Undo, command: 'undo', label: 'تراجع' },
      { icon: Redo, command: 'redo', label: 'إعادة' },
    ],
  ];

  return (
    <div className={cn("rounded-xl border border-border/40 bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ring-offset-background", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-1.5 border-b border-border/30 bg-muted/20">
        {toolbarGroups.map((group, gi) => (
          <div key={gi} className="flex items-center gap-0.5">
            {group.map((btn, bi) => (
              <ToolbarButton
                key={bi}
                icon={btn.icon}
                command={btn.command}
                value={(btn as any).value}
                label={btn.label}
                onClick={(btn as any).onClick}
              />
            ))}
            {gi < toolbarGroups.length - 1 && (
              <div className="w-px h-5 bg-border/30 mx-1" />
            )}
          </div>
        ))}
      </div>

      {/* Editor Area */}
      <div
        ref={editorRef}
        contentEditable
        dir={dir}
        onInput={handleInput}
        data-placeholder={placeholder}
        className={cn(
          "px-4 py-3 text-sm outline-none overflow-y-auto",
          "prose prose-sm dark:prose-invert max-w-none",
          "prose-headings:font-bold prose-h2:text-lg prose-h3:text-base",
          "prose-blockquote:border-s-4 prose-blockquote:border-primary/30 prose-blockquote:ps-4 prose-blockquote:italic prose-blockquote:text-muted-foreground",
          "prose-a:text-primary prose-a:underline",
          "prose-ul:list-disc prose-ol:list-decimal",
          "[&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-muted-foreground/40 [&:empty]:before:pointer-events-none",
        )}
        style={{ minHeight }}
      />
    </div>
  );
};
