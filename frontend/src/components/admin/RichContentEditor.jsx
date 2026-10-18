import React, { useRef, useState } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Heading1, 
  Heading2, 
  Heading3, 
  List, 
  ListOrdered, 
  Quote, 
  Code, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  Table as TableIcon,
  Eye,
  Edit3,
  RotateCcw
} from 'lucide-react';
import { sanitizeHtml } from '../../utils/blogUtils';

export const RichContentEditor = ({ value, onChange, placeholder = 'Write your article or recipe content here...' }) => {
  const [activeTab, setActiveTab] = useState('write'); // 'write' | 'preview'
  const editorRef = useRef(null);

  // Helper to execute commands in editable container or insert markdown/html
  const handleFormat = (command, val = null) => {
    document.execCommand(command, false, val);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleHeading = (tag) => {
    document.execCommand('formatBlock', false, `<${tag}>`);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInsertLink = () => {
    const url = prompt('Enter link URL (e.g. https://osoaa.com/shop):');
    if (url) {
      document.execCommand('createLink', false, url);
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
    }
  };

  const handleInsertImage = () => {
    const url = prompt('Enter Image URL:');
    if (url) {
      document.execCommand('insertImage', false, url);
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
    }
  };

  const handleInsertTable = () => {
    const tableHtml = `
      <table class="table-auto w-full border-collapse border border-slate-700 my-4 text-left">
        <thead>
          <tr class="bg-slate-800 text-white">
            <th class="border border-slate-700 p-2">Item</th>
            <th class="border border-slate-700 p-2">Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="border border-slate-700 p-2">Nutrient / Step</td>
            <td class="border border-slate-700 p-2">Details</td>
          </tr>
        </tbody>
      </table>
      <p><br></p>
    `;
    document.execCommand('insertHTML', false, tableHtml);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div className="border border-slate-800 rounded-2xl bg-slate-950 overflow-hidden shadow-inner flex flex-col">
      
      {/* Editor Toolbar */}
      <div className="bg-slate-900 border-b border-slate-800 p-2 flex flex-wrap items-center justify-between gap-1.5 text-slate-300">
        
        <div className="flex flex-wrap items-center gap-1">
          
          {/* Headings */}
          <button
            type="button"
            onClick={() => handleHeading('h2')}
            className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition font-bold text-xs"
            title="Heading 2"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => handleHeading('h3')}
            className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition font-bold text-xs"
            title="Heading 3"
          >
            H3
          </button>
          <button
            type="button"
            onClick={() => handleHeading('p')}
            className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition font-bold text-xs"
            title="Normal Paragraph"
          >
            P
          </button>

          <span className="w-px h-5 bg-slate-800 mx-1" />

          {/* Text Style */}
          <button
            type="button"
            onClick={() => handleFormat('bold')}
            className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition"
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleFormat('italic')}
            className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition"
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleFormat('underline')}
            className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition"
            title="Underline"
          >
            <Underline className="w-4 h-4" />
          </button>

          <span className="w-px h-5 bg-slate-800 mx-1" />

          {/* Lists */}
          <button
            type="button"
            onClick={() => handleFormat('insertUnorderedList')}
            className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition"
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleFormat('insertOrderedList')}
            className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition"
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>

          <span className="w-px h-5 bg-slate-800 mx-1" />

          {/* Blockquote & Code */}
          <button
            type="button"
            onClick={() => handleHeading('blockquote')}
            className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition"
            title="Quote Box"
          >
            <Quote className="w-4 h-4" />
          </button>

          {/* Embeds */}
          <button
            type="button"
            onClick={handleInsertLink}
            className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition"
            title="Insert Link"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleInsertImage}
            className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition"
            title="Insert Image URL"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleInsertTable}
            className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition"
            title="Insert Data Table"
          >
            <TableIcon className="w-4 h-4" />
          </button>
        </div>

        {/* View Mode Toggle: Edit vs Preview */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('write')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              activeTab === 'write' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Editor</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              activeTab === 'preview' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview</span>
          </button>
        </div>

      </div>

      {/* Content Area */}
      {activeTab === 'write' ? (
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          dangerouslySetInnerHTML={{ __html: value || '' }}
          className="p-4 sm:p-6 min-h-[320px] max-h-[600px] overflow-y-auto text-slate-100 text-sm focus:outline-none leading-relaxed prose prose-invert max-w-none"
          placeholder={placeholder}
        />
      ) : (
        <div 
          className="p-4 sm:p-6 min-h-[320px] max-h-[600px] overflow-y-auto bg-slate-900/50 text-slate-200 text-sm leading-relaxed prose prose-invert max-w-none border-t border-slate-900"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(value || '<p class="text-slate-500 italic">No content written yet.</p>') }}
        />
      )}

      {/* Footer Info */}
      <div className="px-4 py-2 bg-slate-900/80 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <span>Rich Text & HTML Supported</span>
        <span>{value ? value.replace(/<[^>]*>?/gm, '').split(/\s+/).filter(Boolean).length : 0} words</span>
      </div>

    </div>
  );
};
