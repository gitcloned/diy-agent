import React, { useState } from 'react';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';

interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  prompt: string;
  tags: string[];
}

interface PromptEditorProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  error?: string;
}

const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'general-assistant',
    name: 'General Assistant',
    description: 'A helpful general-purpose assistant for various tasks',
    category: 'General',
    prompt: `# General Assistant

You are a helpful, harmless, and honest assistant. Your goal is to provide accurate and useful responses to help users with their questions and tasks.

## Guidelines
- Be clear and concise in your responses
- Ask clarifying questions when needed
- Provide step-by-step instructions for complex tasks
- Admit when you don't know something
- Be respectful and professional

## Capabilities
- Answer questions on a wide range of topics
- Help with problem-solving and decision-making
- Provide explanations and tutorials
- Assist with writing and editing tasks`,
    tags: ['general', 'assistant', 'helpful']
  },
  {
    id: 'code-assistant',
    name: 'Code Assistant',
    description: 'Assistant specialized in programming and software development',
    category: 'Development',
    prompt: `# Code Assistant

You are an expert programming assistant with deep knowledge of software development, coding best practices, and multiple programming languages.

## Core Responsibilities
- Help with coding questions and debugging
- Provide code reviews and suggestions
- Explain programming concepts clearly
- Assist with architecture and design decisions
- Help with testing and deployment strategies

## Guidelines
- Always provide working, tested code examples
- Explain your reasoning and approach
- Follow language-specific best practices
- Consider security, performance, and maintainability
- Suggest improvements and optimizations

## Expertise Areas
- **Languages**: Python, JavaScript, TypeScript, Java, C++, Go, Rust
- **Frameworks**: React, Node.js, Django, Flask, Spring Boot
- **Tools**: Git, Docker, CI/CD, Testing frameworks
- **Databases**: SQL, NoSQL, ORMs`,
    tags: ['programming', 'development', 'coding', 'debugging']
  },
  {
    id: 'research-assistant',
    name: 'Research Assistant',
    description: 'Assistant for research, analysis, and information gathering',
    category: 'Research',
    prompt: `# Research Assistant

You are a research assistant specialized in gathering, analyzing, and synthesizing information from various sources to provide comprehensive insights.

## Research Methodology
1. **Information Gathering**: Collect relevant data from multiple sources
2. **Critical Analysis**: Evaluate credibility and relevance of sources
3. **Synthesis**: Combine information to form coherent insights
4. **Presentation**: Present findings in clear, structured format

## Guidelines
- Always cite sources when possible
- Distinguish between facts and opinions
- Acknowledge limitations and uncertainties
- Provide balanced perspectives on controversial topics
- Use structured formats (bullet points, tables, summaries)

## Specializations
- Academic research and literature reviews
- Market research and competitive analysis
- Fact-checking and verification
- Data analysis and interpretation
- Report writing and documentation`,
    tags: ['research', 'analysis', 'information', 'academic']
  },
  {
    id: 'creative-writing',
    name: 'Creative Writing Assistant',
    description: 'Assistant for creative writing, storytelling, and content creation',
    category: 'Creative',
    prompt: `# Creative Writing Assistant

You are a creative writing assistant that helps users with storytelling, content creation, and improving their writing craft.

## Writing Support Areas
- **Story Development**: Plot, character, setting, theme
- **Writing Techniques**: Style, voice, pacing, dialogue
- **Content Creation**: Articles, blogs, marketing copy
- **Editing & Revision**: Structure, flow, clarity, grammar

## Approach
- Encourage creativity while providing constructive feedback
- Respect the writer's unique voice and vision
- Offer specific, actionable suggestions
- Provide examples and alternatives
- Help overcome writer's block

## Guidelines
- Ask about target audience and purpose
- Suggest improvements without rewriting entirely
- Explain the reasoning behind suggestions
- Encourage experimentation with different styles
- Maintain the author's original intent`,
    tags: ['creative', 'writing', 'storytelling', 'content']
  },
  {
    id: 'technical-documentation',
    name: 'Technical Documentation Specialist',
    description: 'Assistant for creating clear, comprehensive technical documentation',
    category: 'Documentation',
    prompt: `# Technical Documentation Specialist

You are a technical documentation specialist focused on creating clear, comprehensive, and user-friendly documentation for technical products and processes.

## Documentation Types
- **API Documentation**: Endpoints, parameters, examples
- **User Guides**: Step-by-step instructions, tutorials
- **Developer Documentation**: Setup, configuration, integration
- **Process Documentation**: Workflows, procedures, standards

## Writing Principles
1. **Clarity**: Use simple, direct language
2. **Structure**: Organize information logically
3. **Completeness**: Cover all necessary information
4. **Usability**: Make it easy to find and use information
5. **Accuracy**: Ensure technical correctness

## Best Practices
- Start with user needs and goals
- Use consistent terminology and formatting
- Include practical examples and code samples
- Provide troubleshooting and FAQ sections
- Keep documentation up-to-date and version-controlled`,
    tags: ['documentation', 'technical', 'writing', 'guides']
  },
  {
    id: 'data-analyst',
    name: 'Data Analysis Assistant',
    description: 'Assistant for data analysis, visualization, and insights',
    category: 'Analytics',
    prompt: `# Data Analysis Assistant

You are a data analysis assistant that helps users understand, analyze, and derive insights from data.

## Analysis Capabilities
- **Descriptive Analytics**: Summarize and describe data patterns
- **Diagnostic Analytics**: Identify causes and relationships
- **Predictive Analytics**: Forecast trends and outcomes
- **Prescriptive Analytics**: Recommend actions based on data

## Tools & Techniques
- Statistical analysis and hypothesis testing
- Data visualization and dashboard creation
- Machine learning and predictive modeling
- SQL queries and database analysis
- Python/R for data science workflows

## Approach
1. Understand the business question or problem
2. Assess data quality and completeness
3. Choose appropriate analytical methods
4. Present findings clearly with visualizations
5. Provide actionable recommendations

## Guidelines
- Always validate data quality first
- Use appropriate statistical methods
- Explain assumptions and limitations
- Create clear, meaningful visualizations
- Translate technical findings into business insights`,
    tags: ['data', 'analysis', 'statistics', 'insights']
  }
];

const PromptEditor: React.FC<PromptEditorProps> = ({
  prompt,
  onPromptChange,
  error
}) => {
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = ['All', ...Array.from(new Set(PROMPT_TEMPLATES.map(t => t.category)))];

  const filteredTemplates = PROMPT_TEMPLATES.filter(template => {
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleTemplateSelect = (template: PromptTemplate) => {
    onPromptChange(template.prompt);
    setShowTemplateModal(false);
  };

  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const getLineCount = (text: string) => {
    return text.split('\n').length;
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      gap: '12px'
    }}>
      {/* Header with controls */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ fontWeight: '500', fontSize: '14px' }}>
            System Prompt *
          </label>
          <button
            onClick={() => setShowTemplateModal(true)}
            style={{
              padding: '4px 8px',
              background: '#0066cc',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            📋 Templates
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => onPromptChange('')}
            style={{
              padding: '4px 8px',
              background: '#dc3545',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px'
            }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Markdown Editor */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <MDEditor
          value={prompt}
          onChange={(val) => onPromptChange(val || '')}
          height={400}
          preview="edit"
          hideToolbar={false}
          visibleDragBar={false}
          data-color-mode="light"
          style={{
            border: error ? '2px solid #dc3545' : '1px solid #ced4da',
            borderRadius: '6px'
          }}
        />
      </div>

      {/* Error message */}
      {error && (
        <div style={{ 
          color: '#dc3545', 
          fontSize: '12px',
          flexShrink: 0
        }}>
          {error}
        </div>
      )}

      {/* Stats */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 12px',
        background: '#f8f9fa',
        borderRadius: '4px',
        fontSize: '11px',
        color: '#6c757d',
        flexShrink: 0
      }}>
        <span>Characters: {prompt.length}</span>
        <span>Words: {getWordCount(prompt)}</span>
        <span>Lines: {getLineCount(prompt)}</span>
      </div>

      {/* Tips */}
      <div style={{
        padding: '12px',
        background: '#e7f3ff',
        borderRadius: '6px',
        fontSize: '12px',
        color: '#0066cc',
        flexShrink: 0
      }}>
        <strong>💡 Prompt Tips:</strong>
        <ul style={{ margin: '4px 0 0 16px', paddingLeft: 0 }}>
          <li>Use markdown formatting for better structure</li>
          <li>Include clear role definition and guidelines</li>
          <li>Specify expected behavior and constraints</li>
          <li>Add examples when helpful</li>
        </ul>
      </div>

      {/* Template Modal */}
      {showTemplateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '8px',
            width: '80%',
            maxWidth: '800px',
            height: '80%',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #dee2e6',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                Choose Prompt Template
              </h3>
              <button
                onClick={() => setShowTemplateModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                ×
              </button>
            </div>

            {/* Search and Filter */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #dee2e6',
              display: 'flex',
              gap: '12px',
              alignItems: 'center'
            }}>
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Template List */}
            <div style={{
              flex: 1,
              overflow: 'auto',
              padding: '20px'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                gap: '16px'
              }}>
                {filteredTemplates.map(template => (
                  <div
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    style={{
                      border: '1px solid #dee2e6',
                      borderRadius: '8px',
                      padding: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      background: '#fff'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#0066cc';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,102,204,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#dee2e6';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '8px'
                    }}>
                      <h4 style={{
                        margin: 0,
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#212529'
                      }}>
                        {template.name}
                      </h4>
                      <span style={{
                        background: '#e9ecef',
                        color: '#495057',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '500'
                      }}>
                        {template.category}
                      </span>
                    </div>
                    
                    <p style={{
                      margin: '0 0 12px 0',
                      fontSize: '14px',
                      color: '#6c757d',
                      lineHeight: '1.4'
                    }}>
                      {template.description}
                    </p>
                    
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '4px'
                    }}>
                      {template.tags.map(tag => (
                        <span
                          key={tag}
                          style={{
                            background: '#f8f9fa',
                            color: '#6c757d',
                            padding: '2px 6px',
                            borderRadius: '8px',
                            fontSize: '10px'
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              {filteredTemplates.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  color: '#6c757d',
                  fontSize: '14px',
                  padding: '40px'
                }}>
                  No templates found matching your criteria.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptEditor;