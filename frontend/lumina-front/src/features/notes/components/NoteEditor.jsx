import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Clock, CheckCircle, XCircle, Type, Hash, Bold, Italic, 
  List, Image, Link, Eye, Edit2, Heading1, Heading2, Heading3,
  ListOrdered, Quote, Code, Table, Undo, Redo, Copy, Scissors,
  Clipboard, Highlighter, AlignLeft, AlignCenter, AlignRight,
  Minus, CheckSquare, CornerDownRight, Superscript, Subscript,
  Pilcrow, FileText, Download, Upload, Search, Replace,
  Palette, Brush, Eraser, Grid, Columns, Maximize, Minimize,
  BookOpen, BookMarked, Bookmark, Pin, Archive, Tag, ChevronLeft, ChevronRight, X,
  GripVertical
} from 'lucide-react';
import { Image as ImageIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import EmojiPicker from 'emoji-picker-react';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import { useTheme } from '../../../shared/context/ThemeContext';
import ImageUploader from './ImageUploader';
import { api } from '../../../shared/api/api';

const CodeBlock = ({ language, value }) => {
  return (
    <pre className={`language-${language} bg-gray-800 text-white p-4 rounded-lg overflow-x-auto`}>
      <code>{value}</code>
    </pre>
  );
};

const DraggableImage = ({ src, alt, index, onDragStart, onDrag, onDragEnd, onResizeStart, onResize, onResizeEnd, position, size, isSelected, onSelect, onResetPosition, onResetSize }) => {
  const imageRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0 });
  const [startSize, setStartSize] = useState({ width: 0, height: 0 });
  const handleMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - (position?.x || 0),
      y: e.clientY - (position?.y || 0)
    });
    onDragStart?.(src, index);
  };

  const handleResizeMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({ x: e.clientX, y: e.clientY });
    setStartSize({
      width: size?.width || imageRef.current?.offsetWidth || 300,
      height: size?.height || imageRef.current?.offsetHeight || 'auto'
    });
    onResizeStart?.(src, index);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        onDrag?.(src, index, newX, newY);
      }
      if (isResizing) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;
        const newWidth = Math.max(100, startSize.width + deltaX);
        const newHeight = startSize.height === 'auto' ? 'auto' : Math.max(100, startSize.height + deltaY);
        onResize?.(src, index, newWidth, newHeight);
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        onDragEnd?.(src, index);
      }
      if (isResizing) {
        setIsResizing(false);
        onResizeEnd?.(src, index);
      }
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, resizeStart, startSize, src, index, onDrag, onResize, onDragEnd, onResizeEnd]);

  return (
    <div
      className={`relative inline-block mb-4 group ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        transform: `translate(${position?.x || 0}px, ${position?.y || 0}px)`,
        transition: isDragging ? 'none' : 'transform 0.1s ease',
        zIndex: isDragging || isResizing || isSelected ? 50 : 1,
        width: size?.width || 'auto',
        height: size?.height || 'auto'
      }}
      onClick={() => onSelect?.(src)}
    >
      <img
        ref={imageRef}
        src={api.getImageUrl(src)}
        alt={alt}
        className="w-full h-full object-contain rounded-lg shadow-lg select-none"
        style={{
          pointerEvents: isDragging ? 'none' : 'auto',
          border: isSelected ? '2px solid #6366f1' : 'none',
          boxShadow: isSelected ? '0 0 0 4px rgba(99, 102, 241, 0.2)' : 'none'
        }}
        onMouseDown={handleMouseDown}
        draggable={false}
      />
      
      {/* Уголок для изменения размера */}
      <div
        className={`absolute bottom-1 right-1 w-6 h-6 cursor-se-resize
          ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
          transition-opacity duration-200 z-10`}
        onMouseDown={handleResizeMouseDown}
      >
        <div className="w-full h-full border-r-2 border-b-2 border-indigo-500 rounded-br-lg" />
      </div>

      {/* Панель управления (появляется при выборе) */}
      {isSelected && (
        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-1 flex space-x-1 z-20">
          <button
            onClick={() => onResetSize?.(src)}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            title="Сбросить размер"
          >
            <Maximize className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onResetPosition?.(src)}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            title="Сбросить позицию"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

const NoteEditor = ({ note, onUpdate }) => {
  const { themeClasses } = useTheme();
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [saveStatus, setSaveStatus] = useState('saved');
  const [lastSaved, setLastSaved] = useState(null);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [charCountNoSpaces, setCharCountNoSpaces] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [speakingTime, setSpeakingTime] = useState(0);
  const [viewMode, setViewMode] = useState('split');
  const [showSidebar, setShowSidebar] = useState(true);
  const [fontFamily, setFontFamily] = useState('sans');
  const [fontSize, setFontSize] = useState(16);
  const [lineHeight, setLineHeight] = useState(1.8);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);
  const [showOutline, setShowOutline] = useState(false);
  const [outline, setOutline] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [recentEmojis, setRecentEmojis] = useState(['😊', '👍', '🎉', '❤️', '✨']);
  const [showStats, setShowStats] = useState(true);
  const [showWordCount, setShowWordCount] = useState(true);
  const [autoSaveInterval, setAutoSaveInterval] = useState(1000);
  const [darkMode, setDarkMode] = useState(false);
  const [imagePositions, setImagePositions] = useState({});
  const [imageSizes, setImageSizes] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [images, setImages] = useState([]);
  const [draggedImageIndex, setDraggedImageIndex] = useState(-1);
  const [splitRatio, setSplitRatio] = useState(50);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const splitRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const isInitialMount = useRef(true);
  const textareaRef = useRef(null);
  const findInputRef = useRef(null);
  const editorRef = useRef(null);
  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);
  const maxHistorySize = 100;
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const applyFormatting = (type, value) => {
    if (!textareaRef.current) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const hasSelection = start !== end;

    if (hasSelection) {
      const selectedText = text.substring(start, end);
      
      let formattedText = selectedText;
      
      if (type === 'bold') {
        formattedText = `**${selectedText}**`;
      } else if (type === 'italic') {
        formattedText = `*${selectedText}*`;
      } else if (type === 'heading1') {
        formattedText = `# ${selectedText}`;
      } else if (type === 'heading2') {
        formattedText = `## ${selectedText}`;
      } else if (type === 'heading3') {
        formattedText = `### ${selectedText}`;
      } else if (type === 'code') {
        formattedText = `\`${selectedText}\``;
      } else if (type === 'codeblock') {
        formattedText = `\`\`\`\n${selectedText}\n\`\`\``;
      } else if (type === 'quote') {
        formattedText = `> ${selectedText}`;
      } else if (type === 'list') {
        formattedText = `- ${selectedText}`;
      } else if (type === 'numberedList') {
        formattedText = `1. ${selectedText}`;
      } else if (type === 'checklist') {
        formattedText = `- [ ] ${selectedText}`;
      }
      
      const newText = text.substring(0, start) + formattedText + text.substring(end);
      setText(newText);
      addToHistory(newText);
      
      setTimeout(() => {
        textareaRef.current.focus();
        textareaRef.current.selectionStart = start;
        textareaRef.current.selectionEnd = start + formattedText.length;
      }, 0);
    } else {
      if (type === 'fontFamily') {
        setFontFamily(value);
      } else if (type === 'fontSize') {
        setFontSize(value);
      }
    }
  };

  const applyFontSizeToSelection = (newSize) => {
    if (!textareaRef.current) return;
    
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const hasSelection = start !== end;
    
    if (hasSelection) {
      const selectedText = text.substring(start, end);
      const formattedText = `<span style="font-size: ${newSize}px">${selectedText}</span>`;
      
      const newText = text.substring(0, start) + formattedText + text.substring(end);
      setText(newText);
      addToHistory(newText);
    } else {
      setFontSize(newSize);
    }
  };

  const applyFontFamilyToSelection = (newFamily) => {
    if (!textareaRef.current) return;
    
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const hasSelection = start !== end;
    
    if (hasSelection) {
      const selectedText = text.substring(start, end);
      const fontFamilyMap = {
        'sans': 'sans-serif',
        'serif': 'serif',
        'mono': 'monospace'
      };
      const formattedText = `<span style="font-family: ${fontFamilyMap[newFamily]}">${selectedText}</span>`;
      
      const newText = text.substring(0, start) + formattedText + text.substring(end);
      setText(newText);
      addToHistory(newText);
    } else {
      setFontFamily(newFamily);
    }
  };

  useEffect(() => {
    const savedRatio = localStorage.getItem('editor_split_ratio');
    if (savedRatio) {
      setSplitRatio(parseInt(savedRatio, 10));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('editor_split_ratio', splitRatio.toString());
  }, [splitRatio]);

  const handleSplitMouseDown = (e) => {
    e.preventDefault();
    setIsDraggingSplit(true);
  };

  const handleSplitMouseMove = (e) => {
    if (!isDraggingSplit || !splitRef.current) return;
    
    const container = splitRef.current.parentElement;
    const containerRect = container.getBoundingClientRect();
    const newRatio = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    
    const clampedRatio = Math.min(80, Math.max(20, newRatio));
    setSplitRatio(clampedRatio);
  };

  const handleSplitMouseUp = () => {
    setIsDraggingSplit(false);
  };

  useEffect(() => {
    if (isDraggingSplit) {
      window.addEventListener('mousemove', handleSplitMouseMove);
      window.addEventListener('mouseup', handleSplitMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleSplitMouseMove);
      window.removeEventListener('mouseup', handleSplitMouseUp);
    };
  }, [isDraggingSplit]);

  const parseImagesFromMarkdown = useCallback((content) => {
    const imageRegex = /!\[(.*?)\]\((.*?)\)/g;
    const matches = [];
    let match;
    while ((match = imageRegex.exec(content)) !== null) {
      matches.push({
        alt: match[1],
        url: match[2],
        fullMatch: match[0],
        index: match.index
      });
    }
    return matches;
  }, []);

  useEffect(() => {
    if (note?.id) {
      const savedPositions = localStorage.getItem(`image_positions_${note.id}`);
      const savedSizes = localStorage.getItem(`image_sizes_${note.id}`);
      if (savedPositions) setImagePositions(JSON.parse(savedPositions));
      if (savedSizes) setImageSizes(JSON.parse(savedSizes));
    }
  }, [note?.id]);

  useEffect(() => {
    if (note?.id && Object.keys(imagePositions).length > 0) {
      localStorage.setItem(`image_positions_${note.id}`, JSON.stringify(imagePositions));
    }
    if (note?.id && Object.keys(imageSizes).length > 0) {
      localStorage.setItem(`image_sizes_${note.id}`, JSON.stringify(imageSizes));
    }
  }, [imagePositions, imageSizes, note?.id]);

  useEffect(() => {
    const parsedImages = parseImagesFromMarkdown(text);
    setImages(parsedImages);
  }, [text, parseImagesFromMarkdown]);

  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setText(note.text || '');
      setLastSaved(new Date());
      setSaveStatus('saved');

      historyRef.current = [];
      historyIndexRef.current = -1;
      addToHistory(note.text || '');
    }
  }, [note?.id]);
  useEffect(() => {
    if (!text) {
      setWordCount(0);
      setCharCount(0);
      setCharCountNoSpaces(0);
      setReadingTime(0);
      setSpeakingTime(0);
      return;
    }

    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    const chars = text.length;
    const charsNoSpaces = text.replace(/\s+/g, '').length;
    const readTime = Math.ceil(words / 200);
    const speakTime = Math.ceil(words / 150);
    
    setWordCount(words);
    setCharCount(chars);
    setCharCountNoSpaces(charsNoSpaces);
    setReadingTime(readTime);
    setSpeakingTime(speakTime);

    updateOutline(text);
  }, [text]);

  const updateOutline = (content) => {
    const lines = content.split('\n');
    const headers = [];
    
    lines.forEach((line, index) => {
      const headerMatch = line.match(/^(#{1,3})\s+(.+)$/);
      if (headerMatch) {
        const level = headerMatch[1].length;
        const title = headerMatch[2];
        headers.push({ level, title, lineIndex: index });
      }
    });
    
    setOutline(headers);
  };
  const addToHistory = (newText) => {
    if (historyRef.current.length === 0 || historyRef.current[historyRef.current.length - 1] !== newText) {
      if (historyIndexRef.current < historyRef.current.length - 1) {
        historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
      }

      historyRef.current.push(newText);

      if (historyRef.current.length > maxHistorySize) {
        historyRef.current.shift();
      }

      historyIndexRef.current = historyRef.current.length - 1;
    }
  };

  const undo = () => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      setText(historyRef.current[historyIndexRef.current]);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 0);
    }
  };

  const redo = () => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++;
      setText(historyRef.current[historyIndexRef.current]);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 0);
    }
  };

  const saveNote = useCallback(async () => {
    if (!note) return;
    
    if (title === note.title && text === note.text) {
      return;
    }
    
    setSaveStatus('saving');
    
    try {
      await onUpdate(note.id, { title, text });
      setSaveStatus('saved');
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
      setSaveStatus('error');
    }
  }, [note, title, text, onUpdate]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveNote();
      if (historyRef.current[historyIndexRef.current] !== text) {
        addToHistory(text);
      }
    }, autoSaveInterval);
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [title, text, saveNote, autoSaveInterval]);

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
  };

  const handleKeyDown = (e) => {

    const isEditable = viewMode === 'edit' || viewMode === 'split';
    
    if (!isEditable) return;
    
    if (e.key === 'Enter' && !e.shiftKey) {
      const handled = handleListEnter(e);
      if (handled) return;
    }

    if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
      e.preventDefault();
      applyFormattingUniversal('**', '**');
    }

    if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
      e.preventDefault();
      applyFormattingUniversal('*', '*');
    }

    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      saveNote();
    }

    if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
      e.preventDefault();
      undo();
    }

    if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
      e.preventDefault();
      redo();
    }

    if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
      e.preventDefault();
      setShowFindReplace(true);
      setTimeout(() => findInputRef.current?.focus(), 100);
    }

    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'f') {
      e.preventDefault();
      setShowFindReplace(true);
    }

    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'P') {
      e.preventDefault();
      setViewMode(prev => prev === 'edit' ? 'preview' : prev === 'preview' ? 'split' : 'edit');
    }

    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;

      if (start !== end) {
        const selectedText = text.substring(start, end);
        const lines = selectedText.split('\n');
        const indentedLines = lines.map(line => '  ' + line);
        const newText = indentedLines.join('\n');
        setText(text.substring(0, start) + newText + text.substring(end));

        setTimeout(() => {
          e.target.selectionStart = start;
          e.target.selectionEnd = start + newText.length;
        }, 0);
      } else {
        setText(text.substring(0, start) + '  ' + text.substring(end));
        setTimeout(() => {
          e.target.selectionStart = e.target.selectionEnd = start + 2;
        }, 0);
      }
    }
    if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;

      if (start !== end) {
        const selectedText = text.substring(start, end);
        const lines = selectedText.split('\n');
        const unindentedLines = lines.map(line => line.replace(/^ {2}/, ''));
        const newText = unindentedLines.join('\n');
        setText(text.substring(0, start) + newText + text.substring(end));

        setTimeout(() => {
          e.target.selectionStart = start;
          e.target.selectionEnd = start + newText.length;
        }, 0);
      }
    }

    const pairs = {
      '(': ')',
      '[': ']',
      '{': '}',
      '"': '"',
      "'": "'",
      '`': '`',
      '**': '**',
      '*': '*',
      '_': '_'
    };

    if (pairs[e.key]) {
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;

      if (start === end) {
        e.preventDefault();
        setText(text.substring(0, start) + e.key + pairs[e.key] + text.substring(end));
        setTimeout(() => {
          e.target.selectionStart = e.target.selectionEnd = start + 1;
        }, 0);
      }
    }
  };

  const insertFormat = (prefix, suffix = '') => {
    if (!textareaRef.current || (viewMode !== 'edit' && viewMode !== 'split')) return;
    
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selectedText = text.substring(start, end);
    
    if (start === end) {
      const newText = text.substring(0, start) + prefix + suffix + text.substring(end);
      setText(newText);
      setTimeout(() => {
        textareaRef.current.focus();
        textareaRef.current.selectionStart = start + prefix.length;
        textareaRef.current.selectionEnd = start + prefix.length;
      }, 0);
    } else {
      const newText = text.substring(0, start) + prefix + selectedText + suffix + text.substring(end);
      setText(newText);
      setTimeout(() => {
        textareaRef.current.focus();
        textareaRef.current.selectionStart = start;
        textareaRef.current.selectionEnd = start + newText.length - (text.length - end);
      }, 0);
    }
  };

  const applyFormattingUniversal = (prefix, suffix = '') => {
    if (!textareaRef.current || (viewMode !== 'edit' && viewMode !== 'split')) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const hasSelection = start !== end;

    if (hasSelection) {
      const selectedText = text.substring(start, end);
      const newText = text.substring(0, start) + prefix + selectedText + suffix + text.substring(end);
      setText(newText);
      addToHistory(newText);
      setTimeout(() => {
        textareaRef.current.focus();
        textareaRef.current.selectionStart = start;
        textareaRef.current.selectionEnd = start + prefix.length + selectedText.length + suffix.length;
      }, 0);
    } else {
      const newText = text.substring(0, start) + prefix + suffix + text.substring(end);
      setText(newText);
      addToHistory(newText);

      setTimeout(() => {
        textareaRef.current.focus();
        textareaRef.current.selectionStart = start + prefix.length;
        textareaRef.current.selectionEnd = start + prefix.length;
      }, 0);
    }
  };

  const handleListEnter = (e) => {
    const start = e.target.selectionStart;
    const end = e.target.selectionEnd;
    const currentLine = text.substring(0, start).split('\n').pop();
    const bulletMatch = currentLine.match(/^(\s*[-*+]\s+)(.*)$/);
    const numberedMatch = currentLine.match(/^(\s*\d+\.\s+)(.*)$/);
    const checklistMatch = currentLine.match(/^(\s*[-*+]\s+\[[ x]\]\s+)(.*)$/);
  
    if (bulletMatch && bulletMatch[2].trim() === '') {
      e.preventDefault();
      const lineStart = start - currentLine.length;
      setText(text.substring(0, lineStart) + text.substring(end));
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = lineStart;
      }, 0);
      return true;
    }
  
    if (numberedMatch && numberedMatch[2].trim() === '') {
      e.preventDefault();
      const lineStart = start - currentLine.length;
      setText(text.substring(0, lineStart) + text.substring(end));
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = lineStart;
      }, 0);
      return true;
    }
  
    if (checklistMatch && checklistMatch[2].trim() === '') {
      e.preventDefault();
      const lineStart = start - currentLine.length;
      setText(text.substring(0, lineStart) + text.substring(end));
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = lineStart;
      }, 0);
      return true;
    }
  
    if (bulletMatch) {
      e.preventDefault();
      const indent = bulletMatch[1];
      setText(
        text.substring(0, start) + 
        '\n' + indent + 
        text.substring(end)
      );
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 1 + indent.length;
      }, 0);
      return true;
    }
  
    if (numberedMatch) {
      e.preventDefault();
      const indent = numberedMatch[1];
      const currentNumber = parseInt(numberedMatch[1].match(/\d+/)[0]);
      const nextNumber = currentNumber + 1;
      const nextIndent = indent.replace(/\d+/, nextNumber);
    
      setText(
        text.substring(0, start) + 
        '\n' + nextIndent + 
        text.substring(end)
      );
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 1 + nextIndent.length;
      }, 0);
      return true;
    }
  
    if (checklistMatch) {
      e.preventDefault();
      const indent = checklistMatch[1];
      const newIndent = indent.replace(/\[[ x]\]/, '[ ]');
      setText(
        text.substring(0, start) + 
        '\n' + newIndent + 
        text.substring(end)
      );
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 1 + newIndent.length;
      }, 0);
      return true;
    }
  
    return false;
  };

  const insertEmoji = (emojiData) => {
    if (!textareaRef.current || (viewMode !== 'edit' && viewMode !== 'split')) {
      if (viewMode === 'preview') {
        alert('Для вставки эмодзи переключитесь в режим редактирования (Edit или Split)');
        setShowEmojiPicker(false);
      }
      return;
    }
    const emoji = emojiData.original || emojiData.emoji;

    if (!emoji) {
      console.error('Не удалось получить эмодзи из данных:', emojiData);
      return;
    }

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;

    const newText = text.substring(0, start) + emoji + text.substring(end);
    setText(newText);
    addToHistory(newText);
    //setShowEmojiPicker(false);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + emoji.length;
      }
    }, 0);
  };

  const insertTable = (rows, cols) => {
    let table = '\n';
    
    table += '| ' + Array(cols).fill('Заголовок').join(' | ') + ' |\n';
    table += '|' + Array(cols).fill(' --- ').join('|') + '|\n';
    
    for (let i = 0; i < rows; i++) {
      table += '| ' + Array(cols).fill('Текст').join(' | ') + ' |\n';
    }
    
    insertFormat(table, '');
  };

  const insertCodeBlock = (language = '') => {
    insertFormat('```' + language + '\n', '\n```');
  };

  const insertChecklist = () => {
    insertFormat('- [ ] ');
  };

  const insertHorizontalRule = () => {
    insertFormat('\n---\n');
  };

  const insertFootnote = () => {
    const number = (text.match(/\[\^(\d+)\]/g)?.length || 0) + 1;
    insertFormat(`[^${number}]`, `\n\n[^${number}]: `);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Никогда';
    
    try {
      if (typeof dateString === 'string' && dateString.match(/^\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}$/)) {
        return dateString;
      }
      
      let date;
      if (typeof dateString === 'string') {
        const isoString = dateString.replace(' ', 'T');
        date = new Date(isoString);
      } else {
        date = new Date(dateString);
      }
      
      if (isNaN(date.getTime())) {
        return 'Только что';
      }
      
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${day}.${month}.${year} ${hours}:${minutes}`;
      
    } catch (error) {
      return 'Только что';
    }
  };

  const getDisplayDate = () => {
    if (!note) return 'Никогда';
    
    if (note.updated_at) {
      return formatDate(note.updated_at);
    }
    
    if (note.created_at) {
      return formatDate(note.created_at);
    }
    
    return 'Только что';
  };

  const getStatusIcon = () => {
    switch (saveStatus) {
      case 'saving':
        return <div className="w-4 h-4 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin" />;
      case 'saved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  // Поиск и замена
  const performSearch = () => {
    if (!findText) {
      setSearchResults([]);
      setCurrentSearchIndex(-1);
      return;
    }

    const flags = matchCase ? 'g' : 'gi';
    let regex;
    
    try {
      if (wholeWord) {
        regex = new RegExp(`\\b${findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, flags);
      } else {
        regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
      }
    } catch (e) {
      console.error('Invalid regex', e);
      return;
    }

    const matches = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push({
        index: match.index,
        length: match[0].length
      });
    }

    setSearchResults(matches);
    setCurrentSearchIndex(matches.length > 0 ? 0 : -1);

    if (matches.length > 0 && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = matches[0].index;
      textareaRef.current.selectionEnd = matches[0].index + matches[0].length;
    }
  };

  const findNext = () => {
    if (searchResults.length === 0) return;
    
    const nextIndex = (currentSearchIndex + 1) % searchResults.length;
    setCurrentSearchIndex(nextIndex);
    
    if (textareaRef.current) {
      const match = searchResults[nextIndex];
      textareaRef.current.focus();
      textareaRef.current.selectionStart = match.index;
      textareaRef.current.selectionEnd = match.index + match.length;
    }
  };

  const findPrev = () => {
    if (searchResults.length === 0) return;
    
    const prevIndex = currentSearchIndex - 1 < 0 ? searchResults.length - 1 : currentSearchIndex - 1;
    setCurrentSearchIndex(prevIndex);
    
    if (textareaRef.current) {
      const match = searchResults[prevIndex];
      textareaRef.current.focus();
      textareaRef.current.selectionStart = match.index;
      textareaRef.current.selectionEnd = match.index + match.length;
    }
  };

  const replace = () => {
    if (searchResults.length === 0 || currentSearchIndex === -1) return;
    
    const match = searchResults[currentSearchIndex];
    const newText = text.substring(0, match.index) + replaceText + text.substring(match.index + match.length);
    
    setText(newText);
    
    setTimeout(() => {
      performSearch();
    }, 0);
  };

  const replaceAll = () => {
    if (!findText) return;
    
    const flags = matchCase ? 'g' : 'gi';
    let regex;
    
    try {
      if (wholeWord) {
        regex = new RegExp(`\\b${findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, flags);
      } else {
        regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
      }
    } catch (e) {
      console.error('Invalid regex', e);
      return;
    }
    
    const newText = text.replace(regex, replaceText);
    setText(newText);
    setSearchResults([]);
    setCurrentSearchIndex(-1);
  };

  const exportAsMarkdown = () => {
    const content = `# ${title}\n\n${text}`;
    downloadFile(content, 'note.md', 'text/markdown');
  };

  const exportAsHTML = () => {
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  ${text.replace(/\n/g, '<br>')}
</body>
</html>`;
    downloadFile(html, 'note.html', 'text/html');
  };

  const exportAsTXT = () => {
    const content = `${title}\n\n${text}`;
    downloadFile(content, 'note.txt', 'text/plain');
  };

  const downloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const scrollToHeader = (lineIndex) => {
    if (!textareaRef.current) return;
    
    const lines = text.split('\n');
    let charIndex = 0;
    for (let i = 0; i < lineIndex; i++) {
      charIndex += lines[i].length + 1;
    }
    
    textareaRef.current.focus();
    textareaRef.current.selectionStart = charIndex;
    textareaRef.current.selectionEnd = charIndex;
  };

  const handleImageUpload = (imageUrl, filename, imageData) => {
    if (!textareaRef.current) return;
    
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    
    const imageMarkdown = `![${filename || 'image'}](${imageUrl})`;
    
    const newText = text.substring(0, start) + imageMarkdown + text.substring(end);
    setText(newText);
    
    addToHistory(newText);
    
    if (imageData) {
      setUploadedImages(prev => [...prev, { url: imageUrl, ...imageData }]);
    }
    
    setTimeout(() => {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + imageMarkdown.length;
    }, 0);
    
    setShowImageUploader(false);
  };

  const handleChecklistToggle = (lineIndex, checked) => {
    const lines = text.split('\n');
    const line = lines[lineIndex];

    const checklistMatch = line.match(/^(\s*[-*+]\s+)\[([ x])\](.*)$/);
    if (checklistMatch) {
      const newChecked = checked ? 'x' : ' ';
      const newLine = checklistMatch[1] + '[' + newChecked + ']' + checklistMatch[3];
      lines[lineIndex] = newLine;
      setText(lines.join('\n'));
      addToHistory(lines.join('\n'));
    }
  };

  // Обработчики для изображений
  const handleImageDragStart = (src, index) => {
    setDraggedImageIndex(index);
  };

  const handleImageDrag = (src, index, x, y) => {
    setImagePositions(prev => ({
      ...prev,
      [src]: { x, y }
    }));
  };

  const handleImageDragEnd = (src, index) => {
    setDraggedImageIndex(-1);
  };

  const handleImageResizeStart = (src, index) => {
    setSelectedImage(src);
  };

  const handleImageResize = (src, index, width, height) => {
    setImageSizes(prev => ({
      ...prev,
      [src]: { width, height }
    }));
  };

  const handleImageResizeEnd = (src, index) => {};

  const handleImageSelect = (src) => {
    setSelectedImage(prev => prev === src ? null : src);
  };

  const handleResetPosition = (src) => {
    setImagePositions(prev => {
      const newPositions = { ...prev };
      delete newPositions[src];
      return newPositions;
    });
  };

  const handleResetSize = (src) => {
    setImageSizes(prev => {
      const newSizes = { ...prev };
      delete newSizes[src];
      return newSizes;
    });
  };

  const renderContentWithImages = (content) => {
    if (!images.length) {
      return (
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkBreaks]}
          rehypePlugins={[rehypeRaw]}
          components={{
            ul: ({ node, ordered, className, children, ...props }) => {
              return (
                <ul className="list-disc pl-6 my-2 space-y-1 marker:text-indigo-500" {...props}>
                  {children}
                </ul>
              );
            },
            ol: ({ node, ordered, className, children, ...props }) => {
              return (
                <ol className="list-decimal pl-6 my-2 space-y-1 marker:text-indigo-500" {...props}>
                  {children}
                </ol>
              );
            },
            li: ({ node, className, children, ...props }) => {
              return (
                <li className="leading-relaxed" {...props}>
                  {children}
                </li>
              );
            },
            input: ({ node, ...props }) => {
              const lines = text.split('\n');
              let lineIndex = -1;
            
              if (node?.position?.start?.line) {
                lineIndex = node.position.start.line - 1;
                const isChecked = lines[lineIndex]?.includes('[x]');
              
                return (
                  <input 
                    {...props} 
                    type="checkbox"
                    checked={isChecked}
                    className="w-4 h-4 mr-2 rounded border-2 border-gray-300 
                      text-indigo-500 focus:ring-indigo-500 cursor-pointer
                      hover:border-indigo-400 transition-colors"
                    onChange={(e) => {
                      e.stopPropagation();
                      handleChecklistToggle(lineIndex, e.target.checked);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                );
              }
            
              return (
                <input 
                  {...props} 
                  className="w-4 h-4 mr-2 rounded border-2 border-gray-300 
                    text-indigo-500 focus:ring-indigo-500 cursor-pointer
                    hover:border-indigo-400 transition-colors"
                  readOnly
                />
              );
            },
            table: ({ node, ...props }) => (
              <div className="overflow-x-auto my-4">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" {...props} />
              </div>
            ),
            th: ({ node, ...props }) => (
              <th className="px-4 py-2 bg-gray-50 dark:bg-gray-800 font-semibold text-left" {...props} />
            ),
            td: ({ node, ...props }) => (
              <td className="px-4 py-2 border-t border-gray-200 dark:border-gray-700" {...props} />
            ),
            code: ({ node, inline, className, children, ...props }) => {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <CodeBlock
                  language={match[1]}
                  value={String(children).replace(/\n$/, '')}
                  {...props}
                />
              ) : (
                <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm" {...props}>
                  {children}
                </code>
              );
            },
            p: ({ node, children, ...props }) => {
              const isInList = node?.position?.start?.line ? 
                text.split('\n')[node.position.start.line - 1]?.match(/^\s*[-*+]\s+/) : false;
            
              if (isInList) {
                return <span {...props}>{children}</span>;
              }
            
              return <p className="my-2 leading-relaxed" {...props}>{children}</p>;
            }
          }}
        >
          {content || '*Пустая заметка*'}
        </ReactMarkdown>
      );
    }
  
    const parts = [];
    let lastIndex = 0;

    const sortedImages = [...images].sort((a, b) => a.index - b.index);
  
    sortedImages.forEach((img, idx) => {
      if (img.index > lastIndex) {
        const textPart = content.substring(lastIndex, img.index);
        if (textPart) {
          parts.push(
            <ReactMarkdown
              key={`text-${idx}`}
              remarkPlugins={[remarkGfm, remarkBreaks]}
              rehypePlugins={[rehypeRaw]}
              components={{
                ul: ({ node, ordered, className, children, ...props }) => {
                  return (
                    <ul className="list-disc pl-6 my-2 space-y-1 marker:text-indigo-500" {...props}>
                      {children}
                    </ul>
                  );
                },
                ol: ({ node, ordered, className, children, ...props }) => {
                  return (
                    <ol className="list-decimal pl-6 my-2 space-y-1 marker:text-indigo-500" {...props}>
                      {children}
                    </ol>
                  );
                },
                li: ({ node, className, children, ...props }) => {
                  return (
                    <li className="leading-relaxed" {...props}>
                      {children}
                    </li>
                  );
                },
                input: ({ node, ...props }) => {
                  const lines = text.split('\n');
                  let lineIndex = -1;
                
                  if (node?.position?.start?.line) {
                    lineIndex = node.position.start.line - 1;
                    const isChecked = lines[lineIndex]?.includes('[x]');
                  
                    return (
                      <input 
                        {...props} 
                        type="checkbox"
                        checked={isChecked}
                        className="w-4 h-4 mr-2 rounded border-2 border-gray-300 
                          text-indigo-500 focus:ring-indigo-500 cursor-pointer
                          hover:border-indigo-400 transition-colors"
                        onChange={(e) => {
                          e.stopPropagation();
                          handleChecklistToggle(lineIndex, e.target.checked);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    );
                  }
                
                  return (
                    <input 
                      {...props} 
                      className="w-4 h-4 mr-2 rounded border-2 border-gray-300 
                        text-indigo-500 focus:ring-indigo-500 cursor-pointer
                        hover:border-indigo-400 transition-colors"
                      readOnly
                    />
                  );
                },
                table: ({ node, ...props }) => (
                  <div className="overflow-x-auto my-4">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" {...props} />
                  </div>
                ),
                th: ({ node, ...props }) => (
                  <th className="px-4 py-2 bg-gray-50 dark:bg-gray-800 font-semibold text-left" {...props} />
                ),
                td: ({ node, ...props }) => (
                  <td className="px-4 py-2 border-t border-gray-200 dark:border-gray-700" {...props} />
                ),
                code: ({ node, inline, className, children, ...props }) => {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <CodeBlock
                      language={match[1]}
                      value={String(children).replace(/\n$/, '')}
                      {...props}
                    />
                  ) : (
                    <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm" {...props}>
                      {children}
                    </code>
                  );
                },
                p: ({ node, children, ...props }) => {
                  const isInList = node?.position?.start?.line ? 
                    text.split('\n')[node.position.start.line - 1]?.match(/^\s*[-*+]\s+/) : false;
                
                  if (isInList) {
                    return <span {...props}>{children}</span>;
                  }
                
                  return <p className="my-2 leading-relaxed" {...props}>{children}</p>;
                }
              }}
            >
              {textPart}
            </ReactMarkdown>
          );
        }
      }
    
      parts.push(
        <DraggableImage
          key={`img-${idx}`}
          src={img.url}
          alt={img.alt}
          index={idx}
          position={imagePositions[img.url]}
          size={imageSizes[img.url]}
          isSelected={selectedImage === img.url}
          onDragStart={handleImageDragStart}
          onDrag={handleImageDrag}
          onDragEnd={handleImageDragEnd}
          onResizeStart={handleImageResizeStart}
          onResize={handleImageResize}
          onResizeEnd={handleImageResizeEnd}
          onSelect={handleImageSelect}
          onResetPosition={handleResetPosition}
          onResetSize={handleResetSize}
        />
      );
    
      lastIndex = img.index + img.fullMatch.length;
    });
  
    if (lastIndex < content.length) {
      const textPart = content.substring(lastIndex);
      if (textPart) {
        parts.push(
          <ReactMarkdown
            key="text-end"
            remarkPlugins={[remarkGfm, remarkBreaks]}
            rehypePlugins={[rehypeRaw]}
            components={{
              ul: ({ node, ordered, className, children, ...props }) => {
                return (
                  <ul className="list-disc pl-6 my-2 space-y-1 marker:text-indigo-500" {...props}>
                    {children}
                  </ul>
                );
              },
              ol: ({ node, ordered, className, children, ...props }) => {
                return (
                  <ol className="list-decimal pl-6 my-2 space-y-1 marker:text-indigo-500" {...props}>
                    {children}
                  </ol>
                );
              },
              li: ({ node, className, children, ...props }) => {
                return (
                  <li className="leading-relaxed" {...props}>
                    {children}
                  </li>
                );
              },
              input: ({ node, ...props }) => {
                const lines = text.split('\n');
                let lineIndex = -1;
              
                if (node?.position?.start?.line) {
                  lineIndex = node.position.start.line - 1;
                  const isChecked = lines[lineIndex]?.includes('[x]');
                
                  return (
                    <input 
                      {...props} 
                      type="checkbox"
                      checked={isChecked}
                      className="w-4 h-4 mr-2 rounded border-2 border-gray-300 
                        text-indigo-500 focus:ring-indigo-500 cursor-pointer
                        hover:border-indigo-400 transition-colors"
                      onChange={(e) => {
                        e.stopPropagation();
                        handleChecklistToggle(lineIndex, e.target.checked);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  );
                }
              
                return (
                  <input 
                    {...props} 
                    className="w-4 h-4 mr-2 rounded border-2 border-gray-300 
                      text-indigo-500 focus:ring-indigo-500 cursor-pointer
                      hover:border-indigo-400 transition-colors"
                    readOnly
                  />
                );
              },
              table: ({ node, ...props }) => (
                <div className="overflow-x-auto my-4">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" {...props} />
                </div>
              ),
              th: ({ node, ...props }) => (
                <th className="px-4 py-2 bg-gray-50 dark:bg-gray-800 font-semibold text-left" {...props} />
              ),
              td: ({ node, ...props }) => (
                <td className="px-4 py-2 border-t border-gray-200 dark:border-gray-700" {...props} />
              ),
              code: ({ node, inline, className, children, ...props }) => {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <CodeBlock
                    language={match[1]}
                    value={String(children).replace(/\n$/, '')}
                    {...props}
                  />
                ) : (
                  <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm" {...props}>
                    {children}
                  </code>
                );
              },
              p: ({ node, children, ...props }) => {
                const isInList = node?.position?.start?.line ? 
                  text.split('\n')[node.position.start.line - 1]?.match(/^\s*[-*+]\s+/) : false;
              
                if (isInList) {
                  return <span {...props}>{children}</span>;
                }
              
                return <p className="my-2 leading-relaxed" {...props}>{children}</p>;
              }
            }}
          >
            {textPart}
          </ReactMarkdown>
        );
      }
    }
  
    return parts;
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Панель статуса */}
      <div className={`shrink-0 ${themeClasses.colors.bg.secondary} border-b ${themeClasses.colors.border.primary} px-4 sm:px-6 py-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-1">
              <Clock className={`w-3.5 h-3.5 ${themeClasses.colors.text.tertiary}`} />
              <span className={themeClasses.colors.text.secondary}>
                {getDisplayDate()}
              </span>
            </div>
            
            {showWordCount && (
              <>
                <div className="flex items-center space-x-1">
                  <Type className={`w-3.5 h-3.5 ${themeClasses.colors.text.tertiary}`} />
                  <span className={themeClasses.colors.text.secondary}>
                    {wordCount} слов
                  </span>
                </div>
                
                <div className="flex items-center space-x-1">
                  <Hash className={`w-3.5 h-3.5 ${themeClasses.colors.text.tertiary}`} />
                  <span className={themeClasses.colors.text.secondary}>
                    {charCount} зн. · {charCountNoSpaces} без пробелов
                  </span>
                </div>
              </>
            )}
            
            {readingTime > 0 && (
              <div className="flex items-center space-x-1">
                <BookOpen className={`w-3.5 h-3.5 ${themeClasses.colors.text.tertiary}`} />
                <span className={themeClasses.colors.text.secondary}>
                  {readingTime} мин чтения
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className={`text-xs ${
              saveStatus === 'error' ? 'text-red-500' : themeClasses.colors.text.tertiary
            }`}>
              {saveStatus === 'saving' ? 'Сохранение...' : 
               saveStatus === 'saved' ? 'Сохранено' : 
               saveStatus === 'error' ? 'Ошибка' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Поиск и замена */}
      {showFindReplace && (
        <div className={`shrink-0 ${themeClasses.colors.bg.primary} border-b ${themeClasses.colors.border.primary} p-4`}>
          <div className="flex items-center space-x-2 mb-2">
            <div className="flex-1 flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                ref={findInputRef}
                type="text"
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && performSearch()}
                placeholder="Найти..."
                className={`flex-1 px-3 py-2 text-sm rounded-lg border ${themeClasses.colors.border.primary}
                  ${themeClasses.colors.bg.secondary} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              />
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={findPrev}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                title="Предыдущее"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-500">
                {searchResults.length > 0 ? `${currentSearchIndex + 1}/${searchResults.length}` : '0/0'}
              </span>
              <button
                onClick={findNext}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                title="Следующее"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => setShowFindReplace(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex-1 flex items-center space-x-2">
              <Replace className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                placeholder="Заменить на..."
                className={`flex-1 px-3 py-2 text-sm rounded-lg border ${themeClasses.colors.border.primary}
                  ${themeClasses.colors.bg.secondary} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              />
            </div>
            <button
              onClick={replace}
              className="px-3 py-2 text-sm bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
            >
              Заменить
            </button>
            <button
              onClick={replaceAll}
              className="px-3 py-2 text-sm bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
            >
              Заменить все
            </button>
          </div>
          
          <div className="flex items-center space-x-4 mt-2">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={matchCase}
                onChange={(e) => setMatchCase(e.target.checked)}
                className="rounded text-indigo-500"
              />
              <span>Учитывать регистр</span>
            </label>
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={wholeWord}
                onChange={(e) => setWholeWord(e.target.checked)}
                className="rounded text-indigo-500"
              />
              <span>Только целые слова</span>
            </label>
          </div>
        </div>
      )}

      {/* Основная панель инструментов */}
      <div className={`shrink-0 ${themeClasses.colors.bg.primary} border-b ${themeClasses.colors.border.primary} px-4 py-2`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            {/* История */}
            <button
              onClick={undo}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Отменить (Ctrl+Z)"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button
              onClick={redo}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Повторить (Ctrl+Y)"
            >
              <Redo className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

            {/* Базовое форматирование */}
            <button
              onClick={() => applyFormattingUniversal('**', '**')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Жирный (Ctrl+B)"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              onClick={() => applyFormattingUniversal('*', '*')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Курсив (Ctrl+I)"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              onClick={() => applyFormattingUniversal('~~', '~~')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Зачеркнутый"
            >
              <Minus className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

            {/* Заголовки */}
            <button
              onClick={() => applyFormattingUniversal('# ')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Заголовок 1"
            >
              <Heading1 className="w-4 h-4" />
            </button>
            <button
              onClick={() => applyFormattingUniversal('## ')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Заголовок 2"
            >
              <Heading2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => applyFormattingUniversal('### ')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Заголовок 3"
            >
              <Heading3 className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

            {/* Списки */}
            <button
              onClick={() => applyFormattingUniversal('- ')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Маркированный список"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => applyFormattingUniversal('1. ')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Нумерованный список"
            >
              <ListOrdered className="w-4 h-4" />
            </button>
            <button
              onClick={() => applyFormattingUniversal('- [ ] ')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Чек-лист"
            >
              <CheckSquare className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

            {/* Цитаты и код */}
            <button
              onClick={() => applyFormattingUniversal('> ')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Цитата"
            >
              <Quote className="w-4 h-4" />
            </button>
            <button
              onClick={() => applyFormattingUniversal('`', '`')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Код (строчный)"
            >
              <Code className="w-4 h-4" />
            </button>
            <button
              onClick={() => applyFormattingUniversal('```\n', '\n```')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Блок кода"
            >
              <FileText className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

            {/* Таблицы и разделители */}
            <button
              onClick={() => insertTable(3, 3)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Таблица"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={insertHorizontalRule}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Горизонтальная линия"
            >
              <Minus className="w-4 h-4 rotate-90" />
            </button>

            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

            {/* Медиа */}
            <button
              onClick={() => setShowImageUploader(true)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors relative group"
              title="Вставить изображение"
            >
              <ImageIcon className="w-4 h-4" />
              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Вставить изображение (до 5MB)
              </span>
            </button>
            <button
              onClick={() => applyFormattingUniversal('[', '](url)')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Ссылка"
            >
              <Link className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

            {/* Emoji */}
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Emoji"
              >
                <span className="text-lg">😊</span>
              </button>

              {showEmojiPicker && (
                <div className="absolute top-full left-0 mt-1 z-50">
                  <EmojiPicker
                    onEmojiClick={insertEmoji}
                    autoFocusSearch={false}
                    theme={darkMode ? 'dark' : 'light'}
                    skinTonesDisabled={true}
                    searchPlaceholder="Поиск эмодзи..."
                    width={300}
                    height={400}
                  />
                </div>
              )}
            </div>
          </div>
            
          {/* Правая часть панели инструментов */}
          <div className="flex items-center space-x-1">
            {/* Экспорт */}
            <button
              onClick={exportAsMarkdown}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Экспорт в Markdown"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={() => setViewMode('edit')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'edit' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-500' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title="Редактирование"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'split' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-500' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title="Разделенный просмотр"
            >
              <Columns className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'preview' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-500' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title="Предпросмотр"
            >
              <Eye className="w-4 h-4" />
            </button>
            
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

            <button
              onClick={() => setShowFindReplace(true)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Поиск и замена (Ctrl+F)"
            >
              <Search className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setShowOutline(!showOutline)}
              className={`p-2 rounded-lg transition-colors ${
                showOutline ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-500' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title="Структура документа"
            >
              <Pilcrow className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden" ref={splitRef}>
        {/* Структура документа (сайдбар) */}
        {showOutline && outline.length > 0 && (
          <div className={`w-48 border-r ${themeClasses.colors.border.primary} p-2 overflow-y-auto`}>
            <h3 className="text-sm font-semibold mb-2 px-2">Содержание</h3>
            {outline.map((header, index) => (
              <button
                key={index}
                onClick={() => scrollToHeader(header.lineIndex)}
                className={`w-full text-left px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors
                  ${header.level === 1 ? 'font-bold' : ''}
                  ${header.level === 2 ? 'ml-2' : ''}
                  ${header.level === 3 ? 'ml-4' : ''}
                `}
              >
                {header.title}
              </button>
            ))}
          </div>
        )}

        {(viewMode === 'edit' || viewMode === 'split') && (
          <div 
            className={`overflow-y-auto p-4 sm:p-6 ${viewMode === 'split' ? 'border-r' : 'w-full'} ${themeClasses.colors.border.primary}`}
            style={{ width: viewMode === 'split' ? `${splitRatio}%` : '100%' }}
          >
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              onKeyDown={handleKeyDown}
              placeholder="Заголовок"
              className={`w-full text-2xl sm:text-3xl font-semibold bg-transparent border-0 
                focus:outline-none focus:ring-0 p-0 mb-4 sm:mb-6
                ${themeClasses.colors.text.primary}
                ${themeClasses.colors.placeholder}
              `}
            />

            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              onClick={() => textareaRef.current?.focus()}
              onFocus={() => {}}
              placeholder="Начните писать... Используйте Markdown для форматирования"
              className={`w-full bg-transparent border-0 focus:outline-none focus:ring-0 
                resize-none leading-relaxed font-mono
                ${themeClasses.colors.text.primary}
                ${themeClasses.colors.placeholder}
              `}
              style={{ 
                height: viewMode === 'split' ? 'calc(100vh - 350px)' : 'calc(100vh - 350px)',
                fontSize: `${fontSize}px`, 
                lineHeight: lineHeight,
                fontFamily: fontFamily === 'sans' ? 'sans-serif' : fontFamily === 'serif' ? 'serif' : 'monospace'
              }}
            />
          </div>
        )}
        {viewMode === 'split' && (
          <div
            className={`w-1 cursor-col-resize hover:bg-indigo-500 hover:w-1.5 transition-all relative group ${isDraggingSplit ? 'bg-indigo-500 w-1.5' : ''}`}
            onMouseDown={handleSplitMouseDown}
          >
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
              <GripVertical className="w-4 h-4 text-indigo-500" />
            </div>
          </div>
        )}

        {(viewMode === 'preview' || viewMode === 'split') && (
          <div 
            className={`overflow-y-auto p-4 sm:p-6 ${viewMode === 'split' ? '' : 'w-full'} ${themeClasses.colors.border.primary}`}
            style={{ width: viewMode === 'split' ? `${100 - splitRatio}%` : '100%' }}
          >
            <h1 className={`text-2xl sm:text-3xl font-semibold mb-4 sm:mb-6 ${themeClasses.colors.text.primary}`}>
              {title || 'Без названия'}
            </h1>
            <div className="prose prose-lg dark:prose-invert max-w-none overflow-y-auto relative" style={{ height: 'calc(100vh - 350px)' }}>
              {renderContentWithImages(text)}
            </div>
          </div>
        )}
      </div>
      {showImageUploader && (
        <ImageUploader
          onImageUpload={handleImageUpload}
          onClose={() => setShowImageUploader(false)}
          noteId={note?.id}
        />
      )}

    </div>
  );
};

export default NoteEditor;