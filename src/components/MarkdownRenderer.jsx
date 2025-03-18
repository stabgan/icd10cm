import React, { useState, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Box, 
  Typography, 
  useTheme, 
  Paper, 
  Button, 
  CircularProgress, 
  Collapse 
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

const CONTENT_PREVIEW_LENGTH = 5000; // Number of characters to show initially

const MarkdownRenderer = ({ content }) => {
  const theme = useTheme();
  const [showFullContent, setShowFullContent] = useState(false);
  const [rendering, setRendering] = useState(false);
  
  // Determine if content is large
  const isLargeContent = content && content.length > CONTENT_PREVIEW_LENGTH;
  
  // Create preview and full content
  const { preview, fullContent } = useMemo(() => {
    if (!content) return { preview: '', fullContent: '' };
    
    if (isLargeContent) {
      // Find a good breakpoint near CONTENT_PREVIEW_LENGTH
      let breakpoint = CONTENT_PREVIEW_LENGTH;
      
      // Try to find a line break near the breakpoint
      const nextLineBreak = content.indexOf('\n', breakpoint);
      if (nextLineBreak > 0 && nextLineBreak < breakpoint + 500) {
        breakpoint = nextLineBreak;
      }
      
      return {
        preview: content.substring(0, breakpoint) + '\n\n...',
        fullContent: content
      };
    }
    
    return {
      preview: content,
      fullContent: content
    };
  }, [content, isLargeContent]);
  
  // Handle toggling full content
  const handleToggleFullContent = () => {
    if (!showFullContent) {
      setRendering(true);
      
      // Use setTimeout to allow UI to update before starting expensive rendering
      setTimeout(() => {
        setShowFullContent(true);
        
        // Allow some time for rendering to complete
        setTimeout(() => {
          setRendering(false);
        }, 50);
      }, 10);
    } else {
      setShowFullContent(false);
    }
  };
  
  if (!content) return null;

  // Add prism.js code highlighting manually
  useEffect(() => {
    // Add prism.js styles if they don't exist
    if (!document.getElementById('prism-styles')) {
      const style = document.createElement('style');
      style.id = 'prism-styles';
      style.textContent = `
        pre {
          background: ${theme.palette.mode === 'dark' ? '#1a1e29' : '#f6f8fa'};
          border-radius: 8px;
          padding: 16px;
          overflow: auto;
        }
        
        code {
          color: ${theme.palette.mode === 'dark' ? '#c9d1d9' : '#24292e'};
          font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
        }
        
        .token.comment,
        .token.prolog,
        .token.doctype,
        .token.cdata {
          color: ${theme.palette.mode === 'dark' ? '#8b949e' : '#6a737d'};
        }
        
        .token.punctuation {
          color: ${theme.palette.mode === 'dark' ? '#c9d1d9' : '#24292e'};
        }
        
        .token.namespace {
          opacity: 0.7;
        }
        
        .token.property,
        .token.tag,
        .token.boolean,
        .token.number,
        .token.constant,
        .token.symbol {
          color: ${theme.palette.mode === 'dark' ? '#79c0ff' : '#005cc5'};
        }
        
        .token.selector,
        .token.attr-name,
        .token.string,
        .token.char,
        .token.builtin {
          color: ${theme.palette.mode === 'dark' ? '#a5d6ff' : '#032f62'};
        }
        
        .token.operator,
        .token.entity,
        .token.url,
        .language-css .token.string,
        .style .token.string {
          color: ${theme.palette.mode === 'dark' ? '#d2a8ff' : '#d73a49'};
        }
        
        .token.atrule,
        .token.attr-value,
        .token.keyword {
          color: ${theme.palette.mode === 'dark' ? '#ff7b72' : '#d73a49'};
        }
        
        .token.function,
        .token.class-name {
          color: ${theme.palette.mode === 'dark' ? '#d2a8ff' : '#6f42c1'};
        }
        
        .token.regex,
        .token.important,
        .token.variable {
          color: ${theme.palette.mode === 'dark' ? '#ffa657' : '#e36209'};
        }
        
        .token.important,
        .token.bold {
          font-weight: bold;
        }
        
        .token.italic {
          font-style: italic;
        }
        
        .token.entity {
          cursor: help;
        }
      `;
      document.head.appendChild(style);
    }
  }, [theme.palette.mode]);
  
  return (
    <Paper 
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 2,
        backgroundColor: theme.palette.mode === 'dark' ? 'background.paper' : 'background.default',
        border: '1px solid',
        borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
        boxShadow: theme.palette.mode === 'dark' 
          ? '0 4px 8px rgba(0,0,0,0.3)' 
          : '0 4px 8px rgba(0,0,0,0.04)',
      }}
    >
      <Box className="markdown-body" sx={{
        '& h1, & h2, & h3, & h4, & h5, & h6': {
          mt: 3,
          mb: 2,
          fontWeight: 600,
          color: theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.dark,
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            bottom: '-8px',
            left: 0,
            width: '40px',
            height: '3px',
            backgroundColor: theme.palette.primary.main,
            borderRadius: '2px',
          },
        },
        '& h1': { 
          fontSize: '2.5rem',
          mb: 3,
          borderBottom: `1px solid ${theme.palette.divider}`,
          pb: 2,
        },
        '& h2': { 
          fontSize: '2rem',
          borderBottom: `1px solid ${theme.palette.divider}`,
          pb: 1,
          mb: 2.5,
        },
        '& h3': { 
          fontSize: '1.75rem', 
          color: theme.palette.mode === 'dark' ? '#eee' : theme.palette.text.primary, 
          fontWeight: 600 
        },
        '& h4': { 
          fontSize: '1.5rem', 
          color: theme.palette.mode === 'dark' ? '#ddd' : theme.palette.text.secondary 
        },
        '& h5': { fontSize: '1.25rem' },
        '& h6': { fontSize: '1.1rem' },
        '& p': {
          my: 2,
          lineHeight: 1.7,
          fontSize: '1rem',
        },
        '& a': {
          color: theme.palette.primary.main,
          textDecoration: 'none',
          borderBottom: `1px solid ${theme.palette.primary.main}`,
          transition: 'all 0.2s ease',
          '&:hover': {
            color: theme.palette.primary.dark,
            borderBottom: `2px solid ${theme.palette.primary.dark}`,
          },
        },
        '& ul, & ol': {
          pl: 4,
          my: 2,
        },
        '& li': {
          mb: 1.5,
          lineHeight: 1.6,
        },
        '& pre': {
          borderRadius: 2,
          p: 2,
          m: 0,
          mb: 3,
          overflow: 'auto',
          boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)',
        },
        '& blockquote': {
          borderLeft: `4px solid ${theme.palette.primary.main}`,
          pl: 2,
          ml: 0,
          my: 2,
          color: theme.palette.mode === 'dark' ? theme.palette.grey[400] : theme.palette.grey[700],
          fontStyle: 'italic',
          backgroundColor: theme.palette.mode === 'dark' 
            ? 'rgba(255,255,255,0.05)' 
            : 'rgba(0,0,0,0.03)',
          py: 1,
          px: 2,
          borderRadius: '0 8px 8px 0',
        },
        '& table': {
          borderCollapse: 'collapse',
          width: '100%',
          my: 3,
          border: `1px solid ${theme.palette.divider}`,
          '& th': {
            border: `1px solid ${theme.palette.divider}`,
            p: 1.5,
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
            fontWeight: 'bold',
            textAlign: 'left',
          },
          '& td': {
            border: `1px solid ${theme.palette.divider}`,
            p: 1.5,
            verticalAlign: 'top',
          },
        },
        '& hr': {
          border: 'none',
          height: '1px',
          backgroundColor: theme.palette.divider,
          my: 3,
        },
        '& code': {
          fontFamily: 'monospace',
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
          borderRadius: 1,
          px: 0.8,
          py: 0.3,
          fontSize: '0.875rem',
        },
        '& img': {
          maxWidth: '100%',
          borderRadius: 1,
          display: 'block',
          margin: '0 auto',
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 4px 8px rgba(0,0,0,0.3)' 
            : '0 4px 8px rgba(0,0,0,0.1)',
        },
      }}>
        {/* Preview content */}
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <pre className={className} {...props}>
                  <code className={`language-${match[1]}`}>
                    {String(children).replace(/\n$/, '')}
                  </code>
                </pre>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
            h1: ({ node, ...props }) => <Typography variant="h1" component="h1" gutterBottom {...props} />,
            h2: ({ node, ...props }) => <Typography variant="h2" component="h2" gutterBottom {...props} />,
            h3: ({ node, ...props }) => <Typography variant="h3" component="h3" gutterBottom {...props} />,
            h4: ({ node, ...props }) => <Typography variant="h4" component="h4" gutterBottom {...props} />,
            h5: ({ node, ...props }) => <Typography variant="h5" component="h5" gutterBottom {...props} />,
            h6: ({ node, ...props }) => <Typography variant="h6" component="h6" gutterBottom {...props} />,
          }}
        >
          {showFullContent ? fullContent : preview}
        </ReactMarkdown>
        
        {/* Toggle button for large content */}
        {isLargeContent && (
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button
              variant="outlined"
              size="medium"
              color="primary"
              onClick={handleToggleFullContent}
              endIcon={showFullContent ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              disabled={rendering}
              sx={{ px: 3, py: 1 }}
            >
              {rendering ? (
                <>
                  <CircularProgress size={16} sx={{ mr: 1 }} />
                  Loading...
                </>
              ) : (
                showFullContent ? "Show Less" : "Show Full Content"
              )}
            </Button>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default MarkdownRenderer; 