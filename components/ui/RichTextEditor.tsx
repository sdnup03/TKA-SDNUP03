import React, { useRef, useEffect } from 'react';
import { Button } from './brutalist';
import { Bold, Italic, Underline, List, ListOrdered, Heading1, Heading2 } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder, className }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const isFocused = useRef(false);

  // Sync value to innerHTML when value changes externally (e.g. loading saved data), 
  // but NOT when the user is typing (to avoid cursor jumping).
  useEffect(() => {
    if (contentRef.current && contentRef.current.innerHTML !== value && !isFocused.current) {
       contentRef.current.innerHTML = value;
    }
    // Handle empty case explicitly to clear editor
    if (value === '' && contentRef.current) {
      contentRef.current.innerHTML = '';
    }
  }, [value]);

  const exec = (command: string, val: string = '') => {
    document.execCommand(command, false, val);
    if (contentRef.current) {
        onChange(contentRef.current.innerHTML);
        contentRef.current.focus();
    }
  };

  const handleInput = () => {
    if (contentRef.current) {
      onChange(contentRef.current.innerHTML);
    }
  };

  return (
    <div className={`border-2 border-black bg-white shadow-[2px_2px_0px_0px_#000] flex flex-col ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b-2 border-black bg-gray-50 select-none">
        <Button type="button" size="sm" variant="ghost" onClick={() => exec('bold')} className="h-8 w-8 p-0 hover:bg-black hover:text-white" title="Bold"><Bold className="w-4 h-4"/></Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => exec('italic')} className="h-8 w-8 p-0 hover:bg-black hover:text-white" title="Italic"><Italic className="w-4 h-4"/></Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => exec('underline')} className="h-8 w-8 p-0 hover:bg-black hover:text-white" title="Underline"><Underline className="w-4 h-4"/></Button>
        
        <div className="w-[2px] h-6 bg-black/20 mx-1"></div>
        
        <Button type="button" size="sm" variant="ghost" onClick={() => exec('formatBlock', 'H3')} className="h-8 w-8 p-0 hover:bg-black hover:text-white" title="Heading"><Heading1 className="w-4 h-4"/></Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => exec('formatBlock', 'H4')} className="h-8 w-8 p-0 hover:bg-black hover:text-white" title="Subheading"><Heading2 className="w-4 h-4"/></Button>
        
        <div className="w-[2px] h-6 bg-black/20 mx-1"></div>

        <Button type="button" size="sm" variant="ghost" onClick={() => exec('insertUnorderedList')} className="h-8 w-8 p-0 hover:bg-black hover:text-white" title="Bullet List"><List className="w-4 h-4"/></Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => exec('insertOrderedList')} className="h-8 w-8 p-0 hover:bg-black hover:text-white" title="Number List"><ListOrdered className="w-4 h-4"/></Button>
      </div>
      
      {/* Editor Content Area */}
      <div 
        ref={contentRef}
        contentEditable
        onInput={handleInput}
        onFocus={() => { isFocused.current = true; }}
        onBlur={() => { isFocused.current = false; }}
        className="flex-1 min-h-[150px] p-4 focus:outline-none focus:bg-yellow-50/30 overflow-y-auto 
          [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-2 
          [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:mb-2
          [&>h3]:text-xl [&>h3]:font-black [&>h3]:mb-2 
          [&>h4]:text-lg [&>h4]:font-bold [&>h4]:mb-1
          [&>p]:mb-2 [&>div]:mb-1"
        data-placeholder={placeholder}
      />
    </div>
  );
};