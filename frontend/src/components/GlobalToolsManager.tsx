import React, { useState } from "react";

// Google ADK Tool Interfaces - Properly separated by type
interface FunctionToolDefinition {
  id: string;
  name: string;
  description: string;
  function_declaration: GoogleFunctionDeclaration;
  implementation: string; // Python/JavaScript code
  language: 'python' | 'javascript';
  enabled: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface GoogleFunctionDeclaration {
  name: string;
  description: string;
  parameters: JSONSchema;
}

interface JSONSchema {
  type: string;
  properties?: Record<string, any>;
  required?: string[];
  [key: string]: any;
}

interface BuiltInToolConfig {
  tool_name: "code_execution" | "google_search" | "google_search_retrieval";
  enabled: boolean;
  config: Record<string, any>;
}

interface ThirdPartyToolDefinition {
  id: string;
  name: string;
  description: string;
  service_type: "openapi" | "rest_api" | "webhook";
  endpoint_url: string;
  authentication: ThirdPartyAuthConfig;
  headers?: Record<string, string>;
  api_spec?: any; // OpenAPI spec
  enabled: boolean;
  connection_status: 'untested' | 'connected' | 'failed';
  created_at: string;
  updated_at: string;
}

interface ThirdPartyAuthConfig {
  type: "none" | "api_key" | "bearer" | "oauth2";
  credentials: Record<string, string>;
}

interface ToolTestResult {
  success: boolean;
  message: string;
  output?: any;
  error?: string;
}

interface GlobalToolsManagerProps {
  functionTools: FunctionToolDefinition[];
  builtInTools: BuiltInToolConfig[];
  thirdPartyTools: ThirdPartyToolDefinition[];
  onFunctionToolCreate: (tool: FunctionToolDefinition) => void;
  onFunctionToolUpdate: (id: string, tool: FunctionToolDefinition) => void;
  onFunctionToolDelete: (id: string) => void;
  onFunctionToolTest: (id: string) => Promise<ToolTestResult>;
  onBuiltInToolToggle: (toolName: string, enabled: boolean) => void;
  onBuiltInToolConfigure: (
    toolName: string,
    config: Record<string, any>
  ) => void;
  onThirdPartyToolCreate: (tool: ThirdPartyToolDefinition) => void;
  onThirdPartyToolUpdate: (id: string, tool: ThirdPartyToolDefinition) => void;
  onThirdPartyToolDelete: (id: string) => void;
  onThirdPartyToolTest: (id: string) => Promise<ToolTestResult>;
}

// Google ADK Built-in Tools Configuration
const BUILTIN_TOOLS = [
  {
    tool_name: "code_execution" as const,
    display_name: "Code Execution",
    description:
      "Execute code in various programming languages (Python, JavaScript, etc.)",
    config_schema: {
      timeout: {
        type: "number",
        description: "Execution timeout in seconds",
        default: 30,
      },
      allowed_languages: {
        type: "array",
        description: "Allowed programming languages",
        default: ["python", "javascript"],
      },
    },
  },
  {
    tool_name: "google_search" as const,
    display_name: "Google Search",
    description: "Search Google for current information and web results",
    config_schema: {
      api_key: {
        type: "string",
        description: "Google Search API key",
        required: true,
      },
      search_engine_id: {
        type: "string",
        description: "Custom Search Engine ID",
        required: true,
      },
      max_results: {
        type: "number",
        description: "Maximum search results",
        default: 10,
      },
    },
  },
  {
    tool_name: "google_search_retrieval" as const,
    display_name: "Google Search Retrieval",
    description: "Advanced Google search with content retrieval and analysis",
    config_schema: {
      api_key: {
        type: "string",
        description: "Google Search API key",
        required: true,
      },
      search_engine_id: {
        type: "string",
        description: "Custom Search Engine ID",
        required: true,
      },
      retrieval_depth: {
        type: "number",
        description: "Content retrieval depth",
        default: 3,
      },
    },
  },
];

const GlobalToolsManager: React.FC<GlobalToolsManagerProps> = ({
  functionTools,
  builtInTools,
  thirdPartyTools,
  onFunctionToolCreate,
  onFunctionToolUpdate,
  onFunctionToolDelete,
  onFunctionToolTest,
  onBuiltInToolToggle,
  onBuiltInToolConfigure,
  onThirdPartyToolCreate,
  onThirdPartyToolUpdate,
  onThirdPartyToolDelete,
  onThirdPartyToolTest,
}) => {
  const [activeToolType, setActiveToolType] = useState<
    "function" | "builtin" | "thirdparty"
  >("function");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingFunctionTool, setEditingFunctionTool] = useState<FunctionToolDefinition | null>(null);
  const [editingThirdPartyTool, setEditingThirdPartyTool] = useState<ThirdPartyToolDefinition | null>(null);

  // Filter tools based on search
  const filteredFunctionTools = functionTools.filter(tool => 
    tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tool.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredThirdPartyTools = thirdPartyTools.filter(tool => 
    tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tool.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle creating new function tool
  const handleCreateFunctionTool = () => {
    const newTool: FunctionToolDefinition = {
      id: `func_${Date.now()}`,
      name: 'new_function',
      description: 'A new custom function tool',
      function_declaration: {
        name: 'new_function',
        description: 'A new custom function',
        parameters: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      implementation: `def new_function() -> dict:
    """
    A new custom function.
    
    Returns:
        dict: Function result
    """
    return {"message": "Hello from custom function!"}`,
      language: 'python',
      enabled: true,
      tags: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setEditingFunctionTool(newTool);
  };

  // Handle creating new third-party tool
  const handleCreateThirdPartyTool = () => {
    const newTool: ThirdPartyToolDefinition = {
      id: `third_party_${Date.now()}`,
      name: 'new_api_tool',
      description: 'A new external API integration',
      service_type: 'rest_api',
      endpoint_url: 'https://api.example.com',
      authentication: { type: 'none', credentials: {} },
      enabled: true,
      connection_status: 'untested',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setEditingThirdPartyTool(newTool);
  };

  // Handle saving function tool
  const handleSaveFunctionTool = (tool: FunctionToolDefinition) => {
    if (functionTools.find(t => t.id === tool.id)) {
      onFunctionToolUpdate(tool.id, { ...tool, updated_at: new Date().toISOString() });
    } else {
      onFunctionToolCreate(tool);
    }
    setEditingFunctionTool(null);
  };

  // Handle saving third-party tool
  const handleSaveThirdPartyTool = (tool: ThirdPartyToolDefinition) => {
    if (thirdPartyTools.find(t => t.id === tool.id)) {
      onThirdPartyToolUpdate(tool.id, { ...tool, updated_at: new Date().toISOString() });
    } else {
      onThirdPartyToolCreate(tool);
    }
    setEditingThirdPartyTool(null);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "#f8f9fa",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "20px",
          borderBottom: "1px solid #dee2e6",
          background: "#fff",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "600" }}>
          Global Tools Manager
        </h2>
        <p style={{ margin: "8px 0 0 0", color: "#6c757d", fontSize: "14px" }}>
          Manage Function Tools, Built-in Tools, and Third-party Tools according
          to Google ADK specifications
        </p>

        {/* Tool Type Tabs */}
        <div
          style={{
            display: "flex",
            gap: "0",
            marginTop: "16px",
            borderBottom: "1px solid #dee2e6",
          }}
        >
          {[
            {
              key: "function",
              label: "Function Tools",
              icon: "⚡",
              desc: "Custom functions with code",
            },
            {
              key: "builtin",
              label: "Built-in Tools",
              icon: "🔧",
              desc: "Google ADK built-in tools",
            },
            {
              key: "thirdparty",
              label: "Third-party Tools",
              icon: "🔌",
              desc: "External API integrations",
            },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveToolType(tab.key as any)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                border: "none",
                background: "transparent",
                color: activeToolType === tab.key ? "#24292f" : "#656d76",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                borderBottom:
                  activeToolType === tab.key
                    ? "2px solid #fd8c73"
                    : "2px solid transparent",
                transition: "color 0.2s ease",
              }}
              title={tab.desc}
            >
              <span style={{ fontSize: "16px" }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search tools..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "100%",
            padding: "8px 12px",
            border: "1px solid #ced4da",
            borderRadius: "4px",
            fontSize: "14px",
            marginTop: "16px",
          }}
        />
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto", padding: "20px", width: "100%" }}>
        {/* Function Tools */}
        {activeToolType === "function" && (
          <div>
            {/* Header with Create Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
                Function Tools ({filteredFunctionTools.length})
              </h3>
              <button
                onClick={handleCreateFunctionTool}
                style={{
                  padding: "8px 16px",
                  background: "#0066cc",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                + Create Function Tool
              </button>
            </div>

            {/* Function Tools Grid */}
            {filteredFunctionTools.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
                gap: '16px'
              }}>
                {filteredFunctionTools.map(tool => (
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600' }}>
                          ⚡ {tool.name}
                        </h4>
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
                      
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={() => onFunctionToolTest(tool.id)}
                          style={{
                            padding: '4px 8px',
                            background: '#28a745',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px'
                          }}
                        >
                          🧪 Test
                        </button>
                        <button
                          onClick={() => setEditingFunctionTool(tool)}
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
                          onClick={() => onFunctionToolDelete(tool.id)}
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

                    <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#6c757d', lineHeight: '1.4' }}>
                      {tool.description}
                    </p>

                    <div style={{ fontSize: '11px', color: '#6c757d' }}>
                      Language: {tool.language || 'python'} | Parameters: {Object.keys(tool.function_declaration.parameters.properties || {}).length}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚡</div>
                <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "600" }}>
                  No Function Tools Yet
                </h3>
                <p style={{ color: "#6c757d", fontSize: "14px", maxWidth: "400px", margin: "0 auto 20px" }}>
                  Create custom functions with Python/JavaScript code. These tools allow you to implement specific business logic and integrate with your applications.
                </p>
                <button
                  onClick={handleCreateFunctionTool}
                  style={{
                    padding: "12px 24px",
                    background: "#0066cc",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  + Create Your First Function Tool
                </button>
              </div>
            )}
          </div>
        )}

        {/* Built-in Tools */}
        {activeToolType === "builtin" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))",
              gap: "16px",
            }}
          >
            {BUILTIN_TOOLS.map((toolDef) => {
              const toolConfig = builtInTools.find(
                (t) => t.tool_name === toolDef.tool_name
              );
              const isEnabled = toolConfig?.enabled || false;

              return (
                <div
                  key={toolDef.tool_name}
                  style={{
                    background: "#fff",
                    border: "1px solid #dee2e6",
                    borderRadius: "8px",
                    padding: "20px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "16px",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <h3
                        style={{
                          margin: "0 0 8px 0",
                          fontSize: "18px",
                          fontWeight: "600",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        🔧 {toolDef.display_name}
                      </h3>
                      <span
                        style={{
                          background: isEnabled ? "#d4edda" : "#f8d7da",
                          color: isEnabled ? "#155724" : "#721c24",
                          padding: "4px 12px",
                          borderRadius: "16px",
                          fontSize: "12px",
                          fontWeight: "500",
                        }}
                      >
                        {isEnabled ? "✅ Enabled" : "❌ Disabled"}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() =>
                          onBuiltInToolToggle(toolDef.tool_name, !isEnabled)
                        }
                        style={{
                          padding: "6px 12px",
                          background: isEnabled ? "#dc3545" : "#28a745",
                          color: "#fff",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: "500",
                        }}
                      >
                        {isEnabled ? "Disable" : "Enable"}
                      </button>
                      {isEnabled && (
                        <button
                          onClick={() => {
                            const newConfig = { ...toolConfig?.config };
                            onBuiltInToolConfigure(
                              toolDef.tool_name,
                              newConfig
                            );
                          }}
                          style={{
                            padding: "6px 12px",
                            background: "#6c757d",
                            color: "#fff",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: "500",
                          }}
                        >
                          ⚙️ Configure
                        </button>
                      )}
                    </div>
                  </div>

                  <p
                    style={{
                      margin: "0 0 16px 0",
                      fontSize: "14px",
                      color: "#6c757d",
                      lineHeight: "1.5",
                    }}
                  >
                    {toolDef.description}
                  </p>

                  {/* Configuration Schema */}
                  <div style={{ marginBottom: "16px" }}>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: "600",
                        marginBottom: "8px",
                        color: "#495057",
                      }}
                    >
                      Configuration Options:
                    </div>
                    <div
                      style={{
                        background: "#f8f9fa",
                        padding: "12px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        border: "1px solid #e9ecef",
                      }}
                    >
                      {Object.entries(toolDef.config_schema).map(
                        ([key, schema]: [string, any]) => (
                          <div
                            key={key}
                            style={{
                              marginBottom: "8px",
                              paddingBottom: "8px",
                              borderBottom: "1px solid #e9ecef",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                marginBottom: "2px",
                              }}
                            >
                              <span
                                style={{ fontWeight: "600", color: "#212529" }}
                              >
                                {key}
                              </span>
                              <span
                                style={{
                                  background: "#e9ecef",
                                  color: "#495057",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  fontSize: "10px",
                                  fontWeight: "500",
                                }}
                              >
                                {schema.type}
                              </span>
                              {schema.required && (
                                <span
                                  style={{
                                    color: "#dc3545",
                                    fontSize: "10px",
                                    fontWeight: "600",
                                  }}
                                >
                                  REQUIRED
                                </span>
                              )}
                            </div>
                            {schema.description && (
                              <div
                                style={{
                                  fontSize: "11px",
                                  color: "#6c757d",
                                  marginLeft: "0px",
                                }}
                              >
                                {schema.description}
                              </div>
                            )}
                            {schema.default && (
                              <div
                                style={{
                                  fontSize: "10px",
                                  color: "#28a745",
                                  marginLeft: "0px",
                                }}
                              >
                                Default: {JSON.stringify(schema.default)}
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Current Configuration */}
                  {isEnabled &&
                    toolConfig?.config &&
                    Object.keys(toolConfig.config).length > 0 && (
                      <div>
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: "600",
                            marginBottom: "8px",
                            color: "#495057",
                          }}
                        >
                          Current Configuration:
                        </div>
                        <div
                          style={{
                            background: "#f8f9fa",
                            padding: "8px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontFamily: "Monaco, Menlo, monospace",
                            border: "1px solid #e9ecef",
                            maxHeight: "100px",
                            overflow: "auto",
                          }}
                        >
                          {JSON.stringify(toolConfig.config, null, 2)}
                        </div>
                      </div>
                    )}
                </div>
              );
            })}
          </div>
        )}

        {/* Third-party Tools */}
        {activeToolType === "thirdparty" && (
          <div>
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔌</div>
              <h3
                style={{
                  margin: "0 0 8px 0",
                  fontSize: "18px",
                  fontWeight: "600",
                }}
              >
                Third-party Tools
              </h3>
              <p
                style={{
                  color: "#6c757d",
                  fontSize: "14px",
                  maxWidth: "400px",
                  margin: "0 auto 20px",
                }}
              >
                Connect to external APIs and services. Integrate with REST APIs,
                OpenAPI specifications, and webhooks to extend your agent
                capabilities.
              </p>
              <button
                onClick={handleCreateThirdPartyTool}
                style={{
                  padding: "12px 24px",
                  background: "#0066cc",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                + Connect External API
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Function Tool Editor Modal */}
      {editingFunctionTool && (
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
            width: '95%',
            maxWidth: '1200px',
            height: '90%',
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
                {editingFunctionTool.id.startsWith('func_') ? 'Create Function Tool' : 'Edit Function Tool'}
              </h3>
              <button
                onClick={() => setEditingFunctionTool(null)}
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
              <div style={{ display: 'grid', gap: '20px' }}>
                {/* Basic Information */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                      Function Name *
                    </label>
                    <input
                      type="text"
                      value={editingFunctionTool.name}
                      onChange={(e) => setEditingFunctionTool({
                        ...editingFunctionTool,
                        name: e.target.value,
                        function_declaration: {
                          ...editingFunctionTool.function_declaration,
                          name: e.target.value
                        }
                      })}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                      Language
                    </label>
                    <select
                      value={editingFunctionTool.language}
                      onChange={(e) => setEditingFunctionTool({
                        ...editingFunctionTool,
                        language: e.target.value as 'python' | 'javascript'
                      })}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    >
                      <option value="python">Python</option>
                      <option value="javascript">JavaScript</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                    Description *
                  </label>
                  <textarea
                    value={editingFunctionTool.description}
                    onChange={(e) => setEditingFunctionTool({
                      ...editingFunctionTool,
                      description: e.target.value,
                      function_declaration: {
                        ...editingFunctionTool.function_declaration,
                        description: e.target.value
                      }
                    })}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {/* Function Parameters */}
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                    Function Parameters (JSON Schema)
                  </label>
                  <textarea
                    value={JSON.stringify(editingFunctionTool.function_declaration.parameters, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setEditingFunctionTool({
                          ...editingFunctionTool,
                          function_declaration: {
                            ...editingFunctionTool.function_declaration,
                            parameters: parsed
                          }
                        });
                      } catch (error) {
                        // Invalid JSON, don't update
                      }
                    }}
                    rows={10}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontFamily: 'Monaco, Menlo, monospace',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {/* Function Implementation */}
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                    Function Implementation ({editingFunctionTool.language})
                  </label>
                  <textarea
                    value={editingFunctionTool.implementation}
                    onChange={(e) => setEditingFunctionTool({
                      ...editingFunctionTool,
                      implementation: e.target.value
                    })}
                    rows={20}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontFamily: 'Monaco, Menlo, monospace',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {/* Settings */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
                    <input
                      type="checkbox"
                      checked={editingFunctionTool.enabled}
                      onChange={(e) => setEditingFunctionTool({
                        ...editingFunctionTool,
                        enabled: e.target.checked
                      })}
                    />
                    Enabled
                  </label>
                </div>
              </div>
            </div>

            <div style={{
              padding: '20px',
              borderTop: '1px solid #dee2e6',
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setEditingFunctionTool(null)}
                style={{
                  padding: '10px 20px',
                  background: '#6c757d',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveFunctionTool(editingFunctionTool)}
                style={{
                  padding: '10px 20px',
                  background: '#0066cc',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Save Function
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Third-party Tool Editor Modal */}
      {editingThirdPartyTool && (
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
                {editingThirdPartyTool.id.startsWith('third_party_') ? 'Connect External API' : 'Edit API Connection'}
              </h3>
              <button
                onClick={() => setEditingThirdPartyTool(null)}
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
              <div style={{ display: 'grid', gap: '20px' }}>
                {/* Basic Information */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                      API Name *
                    </label>
                    <input
                      type="text"
                      value={editingThirdPartyTool.name}
                      onChange={(e) => setEditingThirdPartyTool({
                        ...editingThirdPartyTool,
                        name: e.target.value
                      })}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                      Service Type
                    </label>
                    <select
                      value={editingThirdPartyTool.service_type}
                      onChange={(e) => setEditingThirdPartyTool({
                        ...editingThirdPartyTool,
                        service_type: e.target.value as any
                      })}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    >
                      <option value="rest_api">REST API</option>
                      <option value="openapi">OpenAPI</option>
                      <option value="webhook">Webhook</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                    Description
                  </label>
                  <textarea
                    value={editingThirdPartyTool.description}
                    onChange={(e) => setEditingThirdPartyTool({
                      ...editingThirdPartyTool,
                      description: e.target.value
                    })}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                    Endpoint URL *
                  </label>
                  <input
                    type="url"
                    value={editingThirdPartyTool.endpoint_url}
                    onChange={(e) => setEditingThirdPartyTool({
                      ...editingThirdPartyTool,
                      endpoint_url: e.target.value
                    })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                {/* Authentication */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                      Authentication Type
                    </label>
                    <select
                      value={editingThirdPartyTool.authentication.type}
                      onChange={(e) => setEditingThirdPartyTool({
                        ...editingThirdPartyTool,
                        authentication: {
                          ...editingThirdPartyTool.authentication,
                          type: e.target.value as any
                        }
                      })}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    >
                      <option value="none">None</option>
                      <option value="api_key">API Key</option>
                      <option value="bearer">Bearer Token</option>
                      <option value="oauth2">OAuth 2.0</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', paddingTop: '30px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
                      <input
                        type="checkbox"
                        checked={editingThirdPartyTool.enabled}
                        onChange={(e) => setEditingThirdPartyTool({
                          ...editingThirdPartyTool,
                          enabled: e.target.checked
                        })}
                      />
                      Enabled
                    </label>
                  </div>
                </div>

                {/* Authentication Credentials */}
                {editingThirdPartyTool.authentication.type !== 'none' && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                      Authentication Credentials (JSON)
                    </label>
                    <textarea
                      value={JSON.stringify(editingThirdPartyTool.authentication.credentials, null, 2)}
                      onChange={(e) => {
                        try {
                          const parsed = JSON.parse(e.target.value);
                          setEditingThirdPartyTool({
                            ...editingThirdPartyTool,
                            authentication: {
                              ...editingThirdPartyTool.authentication,
                              credentials: parsed
                            }
                          });
                        } catch (error) {
                          // Invalid JSON, don't update
                        }
                      }}
                      rows={6}
                      placeholder={`Example for ${editingThirdPartyTool.authentication.type}:\n${
                        editingThirdPartyTool.authentication.type === 'api_key' 
                          ? '{\n  "api_key": "your-api-key-here"\n}'
                          : editingThirdPartyTool.authentication.type === 'bearer'
                          ? '{\n  "token": "your-bearer-token-here"\n}'
                          : '{\n  "client_id": "your-client-id",\n  "client_secret": "your-client-secret"\n}'
                      }`}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontFamily: 'Monaco, Menlo, monospace',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div style={{
              padding: '20px',
              borderTop: '1px solid #dee2e6',
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setEditingThirdPartyTool(null)}
                style={{
                  padding: '10px 20px',
                  background: '#6c757d',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  // Test connection if enabled
                  if (editingThirdPartyTool.enabled && editingThirdPartyTool.authentication.type !== 'none') {
                    try {
                      await onThirdPartyToolTest(editingThirdPartyTool.id);
                    } catch (error) {
                      console.warn('Connection test failed:', error);
                    }
                  }
                  handleSaveThirdPartyTool(editingThirdPartyTool);
                }}
                style={{
                  padding: '10px 20px',
                  background: '#0066cc',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Save Connection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalToolsManager;
