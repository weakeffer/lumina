import React from 'react';
import ReactMarkdown from 'react-markdown';
import { useTheme } from './ThemeContext';

const MarkdownPreview = ({ content }) => {
  const { themeClasses } = useTheme();

  return (
    <div className={`prose prose-sm dark:prose-invert max-w-none
      ${themeClasses.colors.text.primary}`}>
      <ReactMarkdown>
        {content || '*Пустая заметка*'}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownPreview;