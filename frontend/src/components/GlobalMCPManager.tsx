import React, { useState, useEffect } from 'react';

// MCP Interfaces based on Model Context Protocol specifications
interface MCPServerDefinition {
  id: string;
  name: string;
  description: string;
  server_url: string;
  protocol: 'http' | 'websocket' | 'stdio';
  authentication: MCPAuthConfig;
  capabilities: MCPCapability[];
  connection_status: 'disconnected' | 'connecting' | 'connected' | 'error';
  available_tools: MCPToolInfo[];
  available_resources: MCPResourceInfo[];
  enabled: boolean;
  auto_connect: boolean;
  timeout: number;
  retry_policy: RetryPolicy;
  created_at: string;
  updated_at: string;
}

interface MCPAuthConfig {
  type: 'none' | 'bearer' | 'api_key' | 'oauth';
  credentials: Record<string, string>;
}

interface MCPCapability {
  type: 'tools' | 'resources' | 'prompts' | 'sampling';
  version: string;
  features: string[];
}

interface MCPToolInfo {
  name: string;
  description: string;
  input_schema: JSONSchema;
  output_schema?: JSONSchema;
}

interface MCPResourceInfo {
  uri: string;
  name: string;
  description: string;
  mime_type: string;
}

interface RetryPolicy {
  max_retries: number;
  backoff_factor: number;
  max_delay: number;
}

interface JSONSchema {
  type: string;
  properties?: Record<string, any>;
  required?: string[];
  [key: string]: any;
}

interface MCPTestResult {
  success: boolean;
  message: string;
  capabilities?: MCPCapability[];
  tools?: MCPToolInfo[];
  resources?: MCPResourceInfo[];
  error?: string;
}

interface MCPConnectionResult {
  success: boolean;
  message: string;
  server_info?: any;
  error?: string;
}

interface GlobalMCPManagerProps {
  mcpServers: MCPServerDefinition[];
  onServerCreate: (server: MCPServerDefinition) => void;
  onServerUpdate: (id: string, server: MCPServerDefinition) => void;
  onServerDelete: (id: string) => void;
  onServerTest: (id: string) => Promise<MCPTestResult>;
  onServerConnect: (id: string) => Promise<MCPConnectionResult>;
}

const MCP_SERVER_TEMPLATES: Partial<MCPServerDefinition>[] = [
  {
    name: 'Local File System',
    description: 'Access local file system operations',
    server_url: 'http://localhost:8001',
    protocol: 'http',
    authentication: { type: 'none', credentials: {} },
    capabilities: [
      { type: 'tools', version: '1.0', features: ['file_read', 'file_write', 'directory_list'] },
      { type: 'resources', version: '1.0', features: ['file_access'] }
    ],
    enabled: true,
    auto_connect: true,
    timeout: 30,
    retry_policy: { max_retries: 3, backoff_factor: 2, max_delay: 60 }
  },
  {
    name: 'Web Search API',
    description: 'Web search capabilities via external API',
    server_url: 'https://api.websearch.example.com',
    protocol: 'http',
    authentication: { type: 'api_key', credentials: { api_key: '' } },
    capabilities: [
      { type: 'tools', version: '1.0', features: ['web_search', 'news_search'] }
    ],
    enabled: false,
    auto_connect: false,
    timeout: 15,
    retry_policy: { max_retries: 2, backoff_factor: 1.5, max_delay: 30 }
  },
  {
    name: 'Database Connector',
    description: 'Connect to databases for data operations',
    server_url: 'http://localhost:8002',
    protocol: 'http',
    authentication: { type: 'bearer', credentials: { token: '' } },
    capabilities: [
      { type: 'tools', version: '1.0', features: ['sql_query', 'table_info'] },
      { type: 'resources', version: '1.0', features: ['schema_access'] }
    ],
    enabled: false,
    auto_connect: false,
    timeout: 45,
    retry_policy: { max_retries: 3, backoff_factor: 2, max_delay: 120 }
  }
];

const GlobalMCPManager: React.FC<GlobalMCPManagerProps> = ({
  mcpServers,
  onServerCreate,
  onServerUpdate,
  onServerDelete,
  onServerTest,
  onServerConnect
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingServer, setEditingServer] = useState<MCPServerDefinition | null>(null);
  const [testingServer, setTestingServer] = useState<string | null>(null);
  const [connectingServer, setConnectingServer] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, MCPTestResult>>({});
  const [connectionResults, setConnectionResults] = useState<Record<string, MCPConnectionResult>>({});

  const filteredServers = mcpServers.filter(server => {
    const matchesSearch = server.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         server.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || server.connection_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateServer = (template?: Partial<MCPServerDefinition>) => {
    const newServer: MCPServerDefinition = {
      id: `mcp_${Date.now()}`,
      name: template?.name || 'New MCP Server',
      description: template?.description || 'A new MCP server connection',
      server_url: template?.server_url || 'http://localhost:8000',
      protocol: template?.protocol || 'http',
      authentication: template?.authentication || { type: 'none', credentials: {} },
      capabilities: template?.capabilities || [],
      connection_status: 'disconnected',
      available_tools: [],
      available_resources: [],
      enabled: template?.enabled ?? true,
      auto_connect: template?.auto_connect ?? false,
      timeout: template?.timeout || 30,
      retry_policy: template?.retry_policy || { max_retries: 3, backoff_factor: 2, max_delay: 60 },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setEditingServer(newServer);
    setShowCreateModal(false);
  };

  const handleSaveServer = (server: MCPServerDefinition) => {
    if (mcpServers.find(s => s.id === server.id)) {
      onServerUpdate(server.id, { ...server, updated_at: new Date().toISOString() });
    } else {
      onServerCreate(server);
    }
    setEditingServer(null);
  };

  const handleTestServer = async (serverId: string) => {
    setTestingServer(serverId);
    try {
      const result = await onServerTest(serverId);
      setTestResults(prev => ({ ...prev, [serverId]: result }));
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        [serverId]: { 
          success: false, 
          message: 'Test failed', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        } 
      }));
    } finally {
      setTestingServer(null);
    }
  };

  const handleConnectServer = async (serverId: string) => {
    setConnectingServer(serverId);
    try {
      const result = await onServerConnect(serverId);
      setConnectionResults(prev => ({ ...prev, [serverId]: result }));
      
      // Update server status based on connection result
      const server = mcpServers.find(s => s.id === serverId);
      if (server) {
        onServerUpdate(serverId, {
          ...server,
          connection_status: result.success ? 'connected' : 'error',
          updated_at: new Date().toISOString()
        });
      }
    } catch (error) {
      setConnectionResults(prev => ({ 
        ...prev, 
        [serverId]: { 
          success: false, 
          message: 'Connection failed', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        } 
      }));
    } finally {
      setConnectingServer(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return '#28a745';
      case 'connecting': return '#ffc107';
      case 'error': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return '🟢';
      case 'connecting': return '🟡';
      case 'error': return '🔴';
      default: return '⚪';
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
            MCP Server Manager
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
            + Add Server
          </button>
        </div>

        {/* Search and Filter */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search MCP servers..."
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            <option value="all">All Status</option>
            <option value="connected">Connected</option>
            <option value="disconnected">Disconnected</option>
            <option value="connecting">Connecting</option>
            <option value="error">Error</option>
          </select>
        </div>
      </div>

      {/* Servers Grid */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
          gap: '16px'
        }}>
          {filteredServers.map(server => (
            <div
              key={server.id}
              style={{
                background: '#fff',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              {/* Server Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600' }}>
                    {server.name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{
                      background: getStatusColor(server.connection_status),
                      color: '#fff',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '500'
                    }}>
                      {getStatusIcon(server.connection_status)} {server.connection_status}
                    </span>
                    <span style={{
                      background: server.enabled ? '#d4edda' : '#f8d7da',
                      color: server.enabled ? '#155724' : '#721c24',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '500'
                    }}>
                      {server.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <span style={{
                      background: '#e9ecef',
                      color: '#495057',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '500'
                    }}>
                      {server.protocol.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => handleTestServer(server.id)}
                    disabled={testingServer === server.id}
                    style={{
                      padding: '4px 8px',
                      background: '#17a2b8',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: testingServer === server.id ? 'not-allowed' : 'pointer',
                      fontSize: '11px',
                      opacity: testingServer === server.id ? 0.6 : 1
                    }}
                  >
                    {testingServer === server.id ? '⏳' : '🧪'} Test
                  </button>
                  <button
                    onClick={() => handleConnectServer(server.id)}
                    disabled={connectingServer === server.id || server.connection_status === 'connected'}
                    style={{
                      padding: '4px 8px',
                      background: server.connection_status === 'connected' ? '#28a745' : '#ffc107',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: (connectingServer === server.id || server.connection_status === 'connected') ? 'not-allowed' : 'pointer',
                      fontSize: '11px',
                      opacity: (connectingServer === server.id || server.connection_status === 'connected') ? 0.6 : 1
                    }}
                  >
                    {connectingServer === server.id ? '⏳' : server.connection_status === 'connected' ? '✅' : '🔌'} 
                    {server.connection_status === 'connected' ? ' Connected' : ' Connect'}
                  </button>
                  <button
                    onClick={() => setEditingServer(server)}
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
                    onClick={() => onServerDelete(server.id)}
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

              {/* Server Description */}
              <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#6c757d', lineHeight: '1.4' }}>
                {server.description}
              </p>

              {/* Server URL */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>
                  Server URL:
                </div>
                <div style={{
                  background: '#f8f9fa',
                  padding: '6px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontFamily: 'Monaco, Menlo, monospace',
                  wordBreak: 'break-all'
                }}>
                  {server.server_url}
                </div>
              </div>

              {/* Capabilities */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>
                  Capabilities:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {server.capabilities.map((cap, index) => (
                    <span
                      key={index}
                      style={{
                        background: '#e7f3ff',
                        color: '#0066cc',
                        padding: '2px 6px',
                        borderRadius: '8px',
                        fontSize: '10px',
                        fontWeight: '500'
                      }}
                    >
                      {cap.type} v{cap.version}
                    </span>
                  ))}
                  {server.capabilities.length === 0 && (
                    <span style={{ fontSize: '11px', color: '#6c757d' }}>No capabilities defined</span>
                  )}
                </div>
              </div>

              {/* Available Tools & Resources */}
              {(server.available_tools.length > 0 || server.available_resources.length > 0) && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>
                    Available:
                  </div>
                  <div style={{ fontSize: '11px', color: '#6c757d' }}>
                    {server.available_tools.length > 0 && (
                      <div>🔧 {server.available_tools.length} tools</div>
                    )}
                    {server.available_resources.length > 0 && (
                      <div>📁 {server.available_resources.length} resources</div>
                    )}
                  </div>
                </div>
              )}

              {/* Test Results */}
              {testResults[server.id] && (
                <div style={{
                  padding: '8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  background: testResults[server.id].success ? '#d4edda' : '#f8d7da',
                  color: testResults[server.id].success ? '#155724' : '#721c24',
                  marginBottom: '8px'
                }}>
                  <strong>Test Result:</strong> {testResults[server.id].message}
                  {testResults[server.id].error && (
                    <div style={{ marginTop: '4px', fontSize: '11px' }}>
                      Error: {testResults[server.id].error}
                    </div>
                  )}
                </div>
              )}

              {/* Connection Results */}
              {connectionResults[server.id] && (
                <div style={{
                  padding: '8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  background: connectionResults[server.id].success ? '#d4edda' : '#f8d7da',
                  color: connectionResults[server.id].success ? '#155724' : '#721c24',
                  marginBottom: '8px'
                }}>
                  <strong>Connection:</strong> {connectionResults[server.id].message}
                  {connectionResults[server.id].error && (
                    <div style={{ marginTop: '4px', fontSize: '11px' }}>
                      Error: {connectionResults[server.id].error}
                    </div>
                  )}
                </div>
              )}

              {/* Authentication Info */}
              <div style={{ fontSize: '11px', color: '#6c757d' }}>
                Auth: {server.authentication.type} | Timeout: {server.timeout}s
                {server.auto_connect && ' | Auto-connect'}
              </div>
            </div>
          ))}
        </div>

        {filteredServers.length === 0 && (
          <div style={{
            textAlign: 'center',
            color: '#6c757d',
            fontSize: '16px',
            padding: '40px'
          }}>
            No MCP servers found matching your criteria.
          </div>
        )}
      </div>

      {/* Create Server Modal */}
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
                Add MCP Server
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
                    onClick={() => handleCreateServer()}
                    style={{
                      padding: '12px',
                      border: '1px solid #dee2e6',
                      borderRadius: '6px',
                      background: '#fff',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <strong>Custom Server</strong>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>
                      Start with a blank server configuration
                    </div>
                  </button>
                  
                  {MCP_SERVER_TEMPLATES.map((template, index) => (
                    <button
                      key={index}
                      onClick={() => handleCreateServer(template)}
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
                        Protocol: {template.protocol?.toUpperCase()} | Auth: {template.authentication?.type}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Server Editor Modal */}
      {editingServer && (
        <MCPServerEditorModal
          server={editingServer}
          onSave={handleSaveServer}
          onCancel={() => setEditingServer(null)}
        />
      )}
    </div>
  );
};

// Simplified MCP Server Editor Modal (would be a separate component)
const MCPServerEditorModal: React.FC<{
  server: MCPServerDefinition;
  onSave: (server: MCPServerDefinition) => void;
  onCancel: () => void;
}> = ({ server, onSave, onCancel }) => {
  const [editedServer, setEditedServer] = useState<MCPServerDefinition>({ ...server });

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
            Edit MCP Server: {editedServer.name}
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                  Server Name *
                </label>
                <input
                  type="text"
                  value={editedServer.name}
                  onChange={(e) => setEditedServer({ ...editedServer, name: e.target.value })}
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
                  Protocol
                </label>
                <select
                  value={editedServer.protocol}
                  onChange={(e) => setEditedServer({ ...editedServer, protocol: e.target.value as any })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  <option value="http">HTTP</option>
                  <option value="websocket">WebSocket</option>
                  <option value="stdio">STDIO</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                Description
              </label>
              <textarea
                value={editedServer.description}
                onChange={(e) => setEditedServer({ ...editedServer, description: e.target.value })}
                rows={2}
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

            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                Server URL *
              </label>
              <input
                type="url"
                value={editedServer.server_url}
                onChange={(e) => setEditedServer({ ...editedServer, server_url: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                  Authentication Type
                </label>
                <select
                  value={editedServer.authentication.type}
                  onChange={(e) => setEditedServer({ 
                    ...editedServer, 
                    authentication: { ...editedServer.authentication, type: e.target.value as any }
                  })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  <option value="none">None</option>
                  <option value="api_key">API Key</option>
                  <option value="bearer">Bearer Token</option>
                  <option value="oauth">OAuth</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                  Timeout (seconds)
                </label>
                <input
                  type="number"
                  value={editedServer.timeout}
                  onChange={(e) => setEditedServer({ ...editedServer, timeout: parseInt(e.target.value) || 30 })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    checked={editedServer.enabled}
                    onChange={(e) => setEditedServer({ ...editedServer, enabled: e.target.checked })}
                  />
                  Enabled
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    checked={editedServer.auto_connect}
                    onChange={(e) => setEditedServer({ ...editedServer, auto_connect: e.target.checked })}
                  />
                  Auto Connect
                </label>
              </div>
            </div>

            {editedServer.authentication.type !== 'none' && (
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                  Authentication Credentials (JSON)
                </label>
                <textarea
                  value={JSON.stringify(editedServer.authentication.credentials, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setEditedServer({ 
                        ...editedServer, 
                        authentication: { ...editedServer.authentication, credentials: parsed }
                      });
                    } catch (error) {
                      // Invalid JSON, don't update
                    }
                  }}
                  rows={4}
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
            )}
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
            onClick={() => onSave(editedServer)}
            style={{
              padding: '8px 16px',
              background: '#0066cc',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Save Server
          </button>
        </div>
      </div>
    </div>
  );
};

export default GlobalMCPManager;