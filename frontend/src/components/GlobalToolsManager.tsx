import React, { useState, useEffect } from 'react';

// Tool Definition Interfaces based on Google ADK specifications
interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  type: 'function' | 'code_execution' | 'search' | 'file_operation';
  function_declaration: FunctionDeclaration;
  implementation?: string; // For custom functions
  enabled: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface FunctionDeclaration {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, ParameterSchema>;
    required: string[];
  };
}

interface ParameterSchema {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  enum?: string[];
  items?: ParameterSchema;
  properties?: Record<string, ParameterSchema>;
}

interface ToolTestResult {
  success: boolean;
  message: string;
  output?: any;
  error?: string;
}

interface GlobalToolsManagerProps {
  tools: ToolDefinition[];
  onToolCreate: (tool: ToolDefinition) => void;
  onToolUpdate: (id: string, tool: ToolDefinition) => void;
  onToolDelete: (id: string) => void;
  onToolTest: (id: string) => Promise<ToolTestResult>;
}

const TOOL_CATEGORIES = [
  'All',
  'General',
  'Code & Development',
  'Data & Analytics',
  'File Operations',
  'Web & API',
  'Math & Calculations',
  'Text Processing',
  'Custom'
];

const TOOL_TEMPLATES: Partial<ToolDefinition>[] = [
  {
    name: 'calculator',
    description: 'Perform mathematical calculations',
    category: 'Math & Calculations',
    type: 'function',
    function_declaration: {
      name: 'calculator',
      description: 'Evaluate mathematical expressions',
      parameters: {
        type: 'object',
        properties: {
          expression: {
            type: 'string',
            description: 'Mathematical expression to evaluate (e.g., "2 + 2", "sqrt(16)")'
          }
        },
        required: ['expression']
      }
    },
    tags: ['math', 'calculation', 'arithmetic']
  },
  {
    name: 'web_search',
    description: 'Search the web for information',
    category: 'Web & API',
    type: 'search',
    function_declaration: {
      name: 'web_search',
      description: 'Search the web for current information',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query'
          },
          num_results: {
            type: 'number',
            description: 'Number of results to return (default: 5)'
          }
        },
        required: ['query']
      }
    },
    tags: ['search', 'web', 'information']
  },
  {
    name: 'code_executor',
    description: 'Execute code in various programming languages',
    category: 'Code & Development',
    type: 'code_execution',
    function_declaration: {
      name: 'code_executor',
      description: 'Execute code and return the result',
      parameters: {
        type: 'object',
        properties: {
          language: {
            type: 'string',
            enum: ['python', 'javascript', 'bash', 'sql'],
            description: 'Programming language'
          },
          code: {
            type: 'string',
            description: 'Code to execute'
          }
        },
        required: ['language', 'code']
      }
    },
    tags: ['code', 'execution', 'programming']
  },
  {
    name: 'file_reader',
    description: 'Read and analyze file contents',
    category: 'File Operations',
    type: 'file_operation',
    function_declaration: {
      name: 'file_reader',
      description: 'Read and analyze file contents',
      parameters: {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: 'Path to the file to read'
          },
          encoding: {
            type: 'string',
            description: 'File encoding (default: utf-8)'
          }
        },
        required: ['file_path']
      }
    },
    tags: ['file', 'read', 'analysis']
  }
];

const GlobalToolsManager: React.FC<GlobalToolsManagerProps> = ({
  tools,
  onToolCreate,
  onToolUpdate,
  onToolDelete,
  onToolTest
}) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTool, setEditingTool] = useState<ToolDefinition | null>(null);
  const [testingTool, setTestingTool] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, ToolTestResult>>({});

  const filteredTools = tools.filter(tool => {
    const matchesCategory = selectedCategory === 'All' || tool.category === selectedCategory;
    const matchesSearch = tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tool.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleCreateTool = (template?: Partial<ToolDefinition>) => {
    const newTool: ToolDefinition = {
      id: `tool_${Date.now()}`,
      name: template?.name || 'new_tool',
      description: template?.description || 'A new custom tool',
      category: template?.category || 'Custom',
      type: template?.type || 'function',
      function_declaration: template?.function_declaration || {
        name: 'new_tool',
        description: 'A new custom tool',
        parameters: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      implementation: template?.implementation || '',
      enabled: true,
      tags: template?.tags || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setEditingTool(newTool);
    setShowCreateModal(false);
  };

  const handleSaveTool = (tool: ToolDefinition) => {
    if (tools.find(t => t.id === tool.id)) {
      onToolUpdate(tool.id, { ...tool, updated_at: new Date().toISOString() });
    } else {
      onToolCreate(tool);
    }
    setEditingTool(null);
  };

  const handleTestTool = async (toolId: string) => {
    setTestingTool(toolId);
    try {
      const result = await onToolTest(toolId);
      setTestResults(prev => ({ ...prev, [toolId]: result }));
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        [toolId]: { 
          success: false, 
          message: 'Test failed', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        } 
      }));
    } finally {
      setTestingTool(null);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      background: '#f8f9fa'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid #dee2e6',
        background: '#fff'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>
            Global Tools Library
          </h2>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '8px 16px',
              background: '#0066cc',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            + Create Tool
          </button>
        </div>

        {/* Search and Filter */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search tools..."
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
            {TOOL_CATEGORIES.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tools Grid */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '16px'
        }}>
          {filteredTools.map(tool => (
            <div
              key={tool.id}
              style={{
                background: '#fff',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              {/* Tool Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600' }}>
                    {tool.name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{
                      background: '#e9ecef',
                      color: '#495057',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '500'
                    }}>
                      {tool.category}
                    </span>
                    <span style={{
                      background: tool.enabled ? '#d4edda' : '#f8d7da',
                      color: tool.enabled ? '#155724' : '#721c24',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '500'
                    }}>
                      {tool.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => handleTestTool(tool.id)}
                    disabled={testingTool === tool.id}
                    style={{
                      padding: '4px 8px',
                      background: '#28a745',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: testingTool === tool.id ? 'not-allowed' : 'pointer',
                      fontSize: '11px',
                      opacity: testingTool === tool.id ? 0.6 : 1
                    }}
                  >
                    {testingTool === tool.id ? '⏳' : '🧪'} Test
                  </button>
                  <button
                    onClick={() => setEditingTool(tool)}
                    style={{
                      padding: '4px 8px',
                      background: '#6c757d',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '11px'
                    }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => onToolDelete(tool.id)}
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
                    🗑️
                  </button>
                </div>
              </div>

              {/* Tool Description */}
              <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#6c757d', lineHeight: '1.4' }}>
                {tool.description}
              </p>

              {/* Function Declaration Preview */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>
                  Parameters:
                </div>
                <div style={{
                  background: '#f8f9fa',
                  padding: '8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontFamily: 'Monaco, Menlo, monospace'
                }}>
                  {Object.keys(tool.function_declaration.parameters.properties).length > 0 ? (
                    Object.entries(tool.function_declaration.parameters.properties).map(([key, param]) => (
                      <div key={key} style={{ marginBottom: '2px' }}>
                        <span style={{ fontWeight: '600' }}>{key}</span>
                        <span style={{ color: '#6c757d' }}> ({param.type})</span>
                        {tool.function_declaration.parameters.required.includes(key) && (
                          <span style={{ color: '#dc3545' }}> *</span>
                        )}
                      </div>
                    ))
                  ) : (
                    <span style={{ color: '#6c757d' }}>No parameters</span>
                  )}
                </div>
              </div>

              {/* Test Results */}
              {testResults[tool.id] && (
                <div style={{
                  padding: '8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  background: testResults[tool.id].success ? '#d4edda' : '#f8d7da',
                  color: testResults[tool.id].success ? '#155724' : '#721c24',
                  marginBottom: '12px'
                }}>
                  <strong>Test Result:</strong> {testResults[tool.id].message}
                  {testResults[tool.id].error && (
                    <div style={{ marginTop: '4px', fontSize: '11px' }}>
                      Error: {testResults[tool.id].error}
                    </div>
                  )}
                </div>
              )}

              {/* Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {tool.tags.map(tag => (
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

        {filteredTools.length === 0 && (
          <div style={{
            textAlign: 'center',
            color: '#6c757d',
            fontSize: '16px',
            padding: '40px'
          }}>
            No tools found matching your criteria.
          </div>
        )}
      </div>

      {/* Create Tool Modal */}
      {showCreateModal && (
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
            maxWidth: '600px',
            maxHeight: '80%',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}>
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #dee2e6',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                Create New Tool
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
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

            <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 12px 0' }}>Choose a Template:</h4>
                <div style={{ display: 'grid', gap: '8px' }}>
                  <button
                    onClick={() => handleCreateTool()}
                    style={{
                      padding: '12px',
                      border: '1px solid #dee2e6',
                      borderRadius: '6px',
                      background: '#fff',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <strong>Blank Tool</strong>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>
                      Start with an empty tool template
                    </div>
                  </button>
                  
                  {TOOL_TEMPLATES.map((template, index) => (
                    <button
                      key={index}
                      onClick={() => handleCreateTool(template)}
                      style={{
                        padding: '12px',
                        border: '1px solid #dee2e6',
                        borderRadius: '6px',
                        background: '#fff',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <strong>{template.name}</strong>
                      <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '2px' }}>
                        {template.description}
                      </div>
                      <div style={{ fontSize: '10px', color: '#868e96', marginTop: '4px' }}>
                        Category: {template.category} | Type: {template.type}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tool Editor Modal - This would be a separate component in a real implementation */}
      {editingTool && (
        <ToolEditorModal
          tool={editingTool}
          onSave={handleSaveTool}
          onCancel={() => setEditingTool(null)}
        />
      )}
    </div>
  );
};

// Simplified Tool Editor Modal (would be a separate component)
const ToolEditorModal: React.FC<{
  tool: ToolDefinition;
  onSave: (tool: ToolDefinition) => void;
  onCancel: () => void;
}> = ({ tool, onSave, onCancel }) => {
  const [editedTool, setEditedTool] = useState<ToolDefinition>({ ...tool });

  return (
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
        width: '90%',
        maxWidth: '800px',
        height: '80%',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
      }}>
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #dee2e6',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
            Edit Tool: {editedTool.name}
          </h3>
          <button
            onClick={onCancel}
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

        <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                Tool Name *
              </label>
              <input
                type="text"
                value={editedTool.name}
                onChange={(e) => setEditedTool({ ...editedTool, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                Description *
              </label>
              <textarea
                value={editedTool.description}
                onChange={(e) => setEditedTool({ ...editedTool, description: e.target.value })}
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                  Category
                </label>
                <select
                  value={editedTool.category}
                  onChange={(e) => setEditedTool({ ...editedTool, category: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  {TOOL_CATEGORIES.filter(cat => cat !== 'All').map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                  Type
                </label>
                <select
                  value={editedTool.type}
                  onChange={(e) => setEditedTool({ ...editedTool, type: e.target.value as any })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  <option value="function">Function</option>
                  <option value="code_execution">Code Execution</option>
                  <option value="search">Search</option>
                  <option value="file_operation">File Operation</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                Function Declaration (JSON)
              </label>
              <textarea
                value={JSON.stringify(editedTool.function_declaration, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    setEditedTool({ ...editedTool, function_declaration: parsed });
                  } catch (error) {
                    // Invalid JSON, don't update
                  }
                }}
                rows={10}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontFamily: 'Monaco, Menlo, monospace',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>
        </div>

        <div style={{
          padding: '20px',
          borderTop: '1px solid #dee2e6',
          display: 'flex',
          gap: '8px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              background: '#6c757d',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(editedTool)}
            style={{
              padding: '8px 16px',
              background: '#0066cc',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Save Tool
          </button>
        </div>
      </div>
    </div>
  );
};

export default GlobalToolsManager;