import React, { useState, useRef } from 'react';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading,
  Sparkles,
  FileText,
  Eye,
  Edit3,
  RotateCcw,
  HelpCircle,
  Check
} from 'lucide-react';
import { ProductDescription } from '../product/ProductDescription';

export const ProductDescriptionEditor = ({
  value = '',
  onChange,
  required = false,
  placeholder = 'Enter detailed product description, key benefits, and recommended usage...'
}) => {
  const [activeTab, setActiveTab] = useState('write'); // 'write' | 'preview'
  const [copiedTemplateMsg, setCopiedTemplateMsg] = useState(false);
  const textareaRef = useRef(null);

  // Helper to wrap selected text or insert markdown at cursor
  const insertFormatting = (prefix, suffix = '', defaultText = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const originalText = value || '';
    const selected = originalText.substring(start, end) || defaultText;
    const replacement = `${prefix}${selected}${suffix}`;
    const newText = originalText.substring(0, start) + replacement + originalText.substring(end);

    onChange(newText);

    // Restore cursor position inside the wrapped text
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selected.length
      );
    }, 0);
  };

  // Bold selected text (**text**)
  const handleBold = () => {
    insertFormatting('**', '**', 'bold benefit');
  };

  // Italic selected text (*text*)
  const handleItalic = () => {
    insertFormatting('*', '*', 'italic text');
  };

  // Heading Markdown (### Title)
  const handleHeading = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const originalText = value || '';
    const needsLeadingNewline = start > 0 && originalText[start - 1] !== '\n';
    const prefix = needsLeadingNewline ? '\n### ' : '### ';

    insertFormatting(prefix, '\n', 'Section Title');
  };

  // Bullet List (- Item)
  const handleBulletList = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const originalText = value || '';
    const selected = originalText.substring(start, end);

    if (selected) {
      const formatted = selected
        .split('\n')
        .map((line) => (line.startsWith('- ') ? line : `- ${line}`))
        .join('\n');
      const newText = originalText.substring(0, start) + formatted + originalText.substring(end);
      onChange(newText);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start, start + formatted.length);
      }, 0);
    } else {
      const needsLeadingNewline = start > 0 && originalText[start - 1] !== '\n';
      const prefix = needsLeadingNewline ? '\n- ' : '- ';
      insertFormatting(prefix, '\n', 'Key benefit or feature');
    }
  };

  // Numbered List (1. Step)
  const handleNumberedList = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const originalText = value || '';
    const selected = originalText.substring(start, end);

    if (selected) {
      const lines = selected.split('\n');
      const formatted = lines
        .map((line, idx) => (line.match(/^\d+\.\s/) ? line : `${idx + 1}. ${line}`))
        .join('\n');
      const newText = originalText.substring(0, start) + formatted + originalText.substring(end);
      onChange(newText);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start, start + formatted.length);
      }, 0);
    } else {
      const needsLeadingNewline = start > 0 && originalText[start - 1] !== '\n';
      const prefix = needsLeadingNewline ? '\n1. ' : '1. ';
      insertFormatting(prefix, '\n', 'First step or item');
    }
  };

  // Add structured Key Benefit item: - **Label:** Description
  const handleAddBenefit = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const originalText = value || '';
    const needsLeadingNewline = start > 0 && originalText[start - 1] !== '\n';
    const prefix = needsLeadingNewline ? '\n- **' : '- **';

    insertFormatting(prefix, ':** Explains how this feature benefits the athlete.\n', 'Benefit Name');
  };

  // Insert standard high-converting product description template
  const handleInsertTemplate = () => {
    const template = `Ultra-filtered protein formula designed to support muscle protein synthesis, athletic endurance, and clean post-workout recovery.

### Key Benefits
- **High-Quality Whey Protein:** Delivers 24g of premium whey protein per serving to support muscle growth and recovery.
- **Enhanced Strength & Performance:** Contains 3g of creatine monohydrate to boost power, endurance, and workout intensity.
- **Quality Tested:** Rigorously tested to ensure high-quality, safe, and effective protein supplementation.
- **Digestive Support:** Fortified with digestive enzymes for smooth mixing, rapid absorption, and zero bloating.
- **Ideal for Muscle Gain & Recovery:** Suitable for fitness enthusiasts and athletes seeking premium sports nutrition.

### Recommended Usage
Mix 1 level scoop with 200–250ml of cold water or your preferred beverage. Consume within 30 minutes post-workout or between meals.`;

    if (value && value.trim()) {
      if (!window.confirm('Do you want to append this template to your current description? (Click Cancel to replace existing content)')) {
        onChange(template);
        return;
      }
      onChange(`${value.trim()}\n\n${template}`);
    } else {
      onChange(template);
    }

    setCopiedTemplateMsg(true);
    setTimeout(() => setCopiedTemplateMsg(false), 2500);
  };

  // Keyboard shortcut handler
  const handleKeyDown = (e) => {
    // Ctrl+B or Cmd+B for bold
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      handleBold();
    }
    // Tab key indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      insertFormatting('  ', '', '');
    }
  };

  const wordCount = value ? value.replace(/<[^>]*>?/gm, '').split(/\s+/).filter(Boolean).length : 0;
  const charCount = value ? value.length : 0;

  return (
    <div className="border border-slate-700/80 rounded-2xl bg-slate-950 overflow-hidden shadow-inner flex flex-col focus-within:border-orange-500/80 transition-colors">
      {/* Editor Header Toolbar */}
      <div className="bg-slate-900 border-b border-slate-800 p-2 sm:px-3 sm:py-2 flex flex-wrap items-center justify-between gap-2">
        {/* Formatting Actions */}
        <div className="flex flex-wrap items-center gap-1 text-slate-300">
          <button
            type="button"
            onClick={handleBold}
            className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition"
            title="Bold (**text**) [Ctrl+B]"
          >
            <Bold className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleItalic}
            className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition"
            title="Italic (*text*)"
          >
            <Italic className="w-4 h-4" />
          </button>

          <span className="w-px h-4 bg-slate-800 mx-1" />

          <button
            type="button"
            onClick={handleHeading}
            className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition flex items-center gap-1 font-bold text-xs"
            title="Section Heading (### Title)"
          >
            <Heading className="w-3.5 h-3.5" />
            <span className="text-[11px]">H3</span>
          </button>

          <button
            type="button"
            onClick={handleBulletList}
            className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition"
            title="Bullet List (- Item)"
          >
            <List className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleNumberedList}
            className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition"
            title="Numbered List (1. Item)"
          >
            <ListOrdered className="w-4 h-4" />
          </button>

          <span className="w-px h-4 bg-slate-800 mx-1" />

          {/* Quick Structured Benefit Button */}
          <button
            type="button"
            onClick={handleAddBenefit}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 hover:text-orange-400 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            title="Insert structured benefit item: - **Feature:** Description"
          >
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            <span className="hidden sm:inline">+ Benefit Item</span>
            <span className="sm:hidden">+ Benefit</span>
          </button>

          {/* Quick Template Loader */}
          <button
            type="button"
            onClick={handleInsertTemplate}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 hover:text-orange-400 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            title="Load recommended product description layout template"
          >
            {copiedTemplateMsg ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 text-[11px]">Loaded!</span>
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Use Template</span>
                <span className="sm:hidden">Template</span>
              </>
            )}
          </button>
        </div>

        {/* View Mode Toggle: Write vs Live Preview */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 ml-auto">
          <button
            type="button"
            onClick={() => setActiveTab('write')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
              activeTab === 'write'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Write</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
              activeTab === 'preview'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Live Preview</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'write' ? (
        <div className="relative">
          <textarea
            ref={textareaRef}
            required={required}
            rows={8}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full px-4 py-3 bg-slate-950 text-slate-100 placeholder:text-slate-600 text-xs sm:text-sm font-sans focus:outline-none resize-y min-h-[180px] leading-relaxed"
          />
        </div>
      ) : (
        <div className="p-4 sm:p-6 bg-white min-h-[200px] max-h-[500px] overflow-y-auto border-t border-slate-800">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 pb-2 border-b border-slate-100 flex items-center justify-between">
            <span>Customer View (Product Details Tab)</span>
            <span className="text-emerald-600 font-semibold lowercase">live responsive preview</span>
          </div>
          <ProductDescription description={value} />
        </div>
      )}

      {/* Helpful Instructions Footer */}
      <div className="px-3.5 py-2 bg-slate-900 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5 flex-wrap">
          <HelpCircle className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
          <span>
            Start lines with <code className="text-orange-300 font-mono">-</code> for bullets,{' '}
            <code className="text-orange-300 font-mono">**Title:** Detail</code> for bold benefit labels,{' '}
            <code className="text-orange-300 font-mono">### Title</code> for headings. Blank lines create paragraphs.
          </span>
        </div>

        <div className="flex items-center gap-3 text-slate-500 font-mono text-[10px] ml-auto flex-shrink-0">
          <span>{wordCount} words</span>
          <span>•</span>
          <span>{charCount} chars</span>
        </div>
      </div>
    </div>
  );
};

export default ProductDescriptionEditor;
