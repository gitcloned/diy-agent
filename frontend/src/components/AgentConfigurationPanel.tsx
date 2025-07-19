import React, { useState, useEffect } from 'react';
import { AgentConfiguration, WorkflowAgentConfiguration, ModelConfiguration, ToolConfiguration, MCPConfiguration } from './FlowCanvas';
import PromptEditor from './PromptEditor';

interface AgentConfigurationPanelProps {
  selectedNode: any | null;
  onConfigUpdate: (nodeId: string, config: AgentConfiguration | WorkflowAgentConfiguration) => void;
  onClose: () => void;
}

const GEMINI_MODELS = [
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'gemini-1.0-pro',
  'gemini-1.0-pro-vision'
];

// Remove artificial agent type categories - there's just one base Agent type



const AgentConfigurationPanel: React.FC<AgentConfigurationPanelProps> = ({
  selectedNode,
  onConfigUpdate,
  onClose
}) => {
  const [config, setConfig] = useState<AgentConfiguration | WorkflowAgentConfiguration | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'basic' | 'prompt' | 'model' | 'tools' | 'mcps' | 'subagents'>('basic');


  useEffect(() => {
    if (selectedNode) {
      setConfig({ ...selectedNode.data.config });
    }
  }, [selectedNode]);

  const validateConfig = (configToValidate: AgentConfiguration | WorkflowAgentConfiguration): Record<string, string> => {
    const newErrors: Record<string, string> = {};
    
    if (!configToValidate.name.trim()) {
      newErrors.name = 'Agent name is required';
    }
    
    if (!configToValidate.prompt.trim()) {
      newErrors.prompt = 'Agent prompt is required';
    }
    
    if (configToValidate.model) {
      if (configToValidate.model.temperature !== undefined && 
          (configToValidate.model.temperature < 0 || configToValidate.model.temperature > 2)) {
        newErrors.temperature = 'Temperature must be between 0 and 2';
      }
      
      if (configToValidate.model.top_p !== undefined && 
          (configToValidate.model.top_p < 0 || configToValidate.model.top_p > 1)) {
        newErrors.top_p = 'Top P must be between 0 and 1';
      }
      
      if (configToValidate.model.top_k !== undefined && 
          (configToValidate.model.top_k < 1 || configToValidate.model.top_k > 100)) {
        newErrors.top_k = 'Top K must be between 1 and 100';
      }
    }
    
    return newErrors;
  };

  const handleSave = () => {
    if (!config || !selectedNode) return;
    
    const validationErrors = validateConfig(config);
    setErrors(validationErrors);
    
    if (Object.keys(validationErrors).length === 0) {
      onConfigUpdate(selectedNode.id, config);
      onClose();
    }
  };

  const updateConfig = (updates: Partial<AgentConfiguration | WorkflowAgentConfiguration>) => {
    if (!config) return;
    setConfig({ ...config, ...updates });
  };

  const updateModelConfig = (modelUpdates: Partial<ModelConfiguration>) => {
    if (!config) return;
    const currentModel = config.model || { model_name: 'gemini-1.5-pro' };
    updateConfig({ model: { ...currentModel, ...modelUpdates } });
  };

  const addTool = () => {
    if (!config) return;
    const newTool: ToolConfiguration = {
      name: `tool_${config.tools.length + 1}`,
      description: 'New tool',
      type: 'function',
      parameters: {},
      enabled: true
    };
    updateConfig({ tools: [...config.tools, newTool] });
  };

  const updateTool = (index: number, toolUpdates: Partial<ToolConfiguration>) => {
    if (!config) return;
    const updatedTools = [...config.tools];
    updatedTools[index] = { ...updatedTools[index], ...toolUpdates };
    updateConfig({ tools: updatedTools });
  };

  const removeTool = (index: number) => {
    if (!config) return;
    const updatedTools = config.tools.filter((_, i) => i !== index);
    updateConfig({ tools: updatedTools });
  };

  const addMCP = () => {
    if (!config) return;
    const newMCP: MCPConfiguration = {
      name: `mcp_${config.mcps.length + 1}`,
      server_url: 'http://localhost:8000',
      capabilities: ['tools'],
      auto_connect: true
    };
    updateConfig({ mcps: [...config.mcps, newMCP] });
  };

  const updateMCP = (index: number, mcpUpdates: Partial<MCPConfiguration>) => {
    if (!config) return;
    const updatedMCPs = [...config.mcps];
    updatedMCPs[index] = { ...updatedMCPs[index], ...mcpUpdates };
    updateConfig({ mcps: updatedMCPs });
  };

  const removeMCP = (index: number) => {
    if (!config) return;
    const updatedMCPs = config.mcps.filter((_, i) => i !== index);
    updateConfig({ mcps: updatedMCPs });
  };

  if (!selectedNode || !config) {
    return null;
  }

  const isWorkflowAgent = selectedNode.data.agent_type === 'workflow_agent';
  const workflowConfig = isWorkflowAgent ? config as WorkflowAgentConfiguration : null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '400px',
      height: '100vh',
      background: '#fff',
      borderLeft: '1px solid #dee2e6',
      boxShadow: '-2px 0 8px rgba(0,0,0,0.1)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #dee2e6',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
          Configure Agent
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          ×
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #dee2e6',
        background: '#f8f9fa'
      }}>
        {['basic', 'prompt', 'model', 'tools', 'mcps', ...(isWorkflowAgent ? ['subagents'] : [])].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: 'none',
              background: activeTab === tab ? '#fff' : 'transparent',
              borderBottom: activeTab === tab ? '2px solid #0066cc' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: activeTab === tab ? '600' : '400',
              textTransform: 'capitalize'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {activeTab === 'basic' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Agent Name */}
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                Agent Name *
              </label>
              <input
                type="text"
                value={config.name}
                onChange={(e) => updateConfig({ name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: `1px solid ${errors.name ? '#dc3545' : '#ced4da'}`,
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
              {errors.name && (
                <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>
                  {errors.name}
                </div>
              )}
            </div>

            {/* Agent Description */}
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                Description
              </label>
              <input
                type="text"
                value={config.description || ''}
                onChange={(e) => updateConfig({ description: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>



            {/* Timeout */}
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                Timeout (seconds)
              </label>
              <input
                type="number"
                value={config.timeout || ''}
                onChange={(e) => updateConfig({ timeout: e.target.value ? parseInt(e.target.value) : undefined })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>
        )}

        {activeTab === 'prompt' && (
          <PromptEditor
            prompt={config.prompt}
            onPromptChange={(prompt) => updateConfig({ prompt })}
            error={errors.prompt}
          />
        )}

        {activeTab === 'model' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Model Selection */}
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                Gemini Model
              </label>
              <select
                value={config.model?.model_name || 'gemini-1.5-pro'}
                onChange={(e) => updateModelConfig({ model_name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                {GEMINI_MODELS.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </div>

            {/* Temperature */}
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                Temperature ({config.model?.temperature || 0.7})
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={config.model?.temperature || 0.7}
                onChange={(e) => updateModelConfig({ temperature: parseFloat(e.target.value) })}
                style={{ width: '100%' }}
              />
              <div style={{ fontSize: '12px', color: '#6c757d' }}>
                Controls randomness. Lower values make output more focused and deterministic.
              </div>
              {errors.temperature && (
                <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>
                  {errors.temperature}
                </div>
              )}
            </div>

            {/* Top P */}
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                Top P ({config.model?.top_p || 0.95})
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={config.model?.top_p || 0.95}
                onChange={(e) => updateModelConfig({ top_p: parseFloat(e.target.value) })}
                style={{ width: '100%' }}
              />
              <div style={{ fontSize: '12px', color: '#6c757d' }}>
                Nucleus sampling. Consider tokens with cumulative probability up to this value.
              </div>
              {errors.top_p && (
                <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>
                  {errors.top_p}
                </div>
              )}
            </div>

            {/* Top K */}
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                Top K ({config.model?.top_k || 40})
              </label>
              <input
                type="range"
                min="1"
                max="100"
                step="1"
                value={config.model?.top_k || 40}
                onChange={(e) => updateModelConfig({ top_k: parseInt(e.target.value) })}
                style={{ width: '100%' }}
              />
              <div style={{ fontSize: '12px', color: '#6c757d' }}>
                Consider only the top K most likely tokens at each step.
              </div>
              {errors.top_k && (
                <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>
                  {errors.top_k}
                </div>
              )}
            </div>

            {/* Max Output Tokens */}
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                Max Output Tokens
              </label>
              <input
                type="number"
                value={config.model?.max_output_tokens || ''}
                onChange={(e) => updateModelConfig({ 
                  max_output_tokens: e.target.value ? parseInt(e.target.value) : undefined 
                })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
                placeholder="8192"
              />
              <div style={{ fontSize: '12px', color: '#6c757d' }}>
                Maximum number of tokens to generate in the response.
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tools' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0 }}>Tools ({config.tools.length})</h4>
              <button
                onClick={addTool}
                style={{
                  padding: '6px 12px',
                  background: '#0066cc',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Add Tool
              </button>
            </div>

            {config.tools.map((tool, index) => (
              <div key={index} style={{
                border: '1px solid #dee2e6',
                borderRadius: '6px',
                padding: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{ fontSize: '14px' }}>Tool {index + 1}</strong>
                  <button
                    onClick={() => removeTool(index)}
                    style={{
                      background: '#dc3545',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Remove
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Tool name"
                    value={tool.name}
                    onChange={(e) => updateTool(index, { name: e.target.value })}
                    style={{
                      padding: '6px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}
                  />
                  
                  <input
                    type="text"
                    placeholder="Tool description"
                    value={tool.description}
                    onChange={(e) => updateTool(index, { description: e.target.value })}
                    style={{
                      padding: '6px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}
                  />

                  <select
                    value={tool.type}
                    onChange={(e) => updateTool(index, { type: e.target.value as 'function' | 'mcp_tool' })}
                    style={{
                      padding: '6px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}
                  >
                    <option value="function">Function</option>
                    <option value="mcp_tool">MCP Tool</option>
                  </select>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                    <input
                      type="checkbox"
                      checked={tool.enabled}
                      onChange={(e) => updateTool(index, { enabled: e.target.checked })}
                    />
                    Enabled
                  </label>
                </div>
              </div>
            ))}

            {config.tools.length === 0 && (
              <div style={{
                textAlign: 'center',
                color: '#6c757d',
                fontSize: '14px',
                padding: '20px'
              }}>
                No tools configured. Click "Add Tool" to get started.
              </div>
            )}
          </div>
        )}

        {activeTab === 'mcps' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0 }}>MCP Servers ({config.mcps.length})</h4>
              <button
                onClick={addMCP}
                style={{
                  padding: '6px 12px',
                  background: '#0066cc',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Add MCP
              </button>
            </div>

            {config.mcps.map((mcp, index) => (
              <div key={index} style={{
                border: '1px solid #dee2e6',
                borderRadius: '6px',
                padding: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{ fontSize: '14px' }}>MCP Server {index + 1}</strong>
                  <button
                    onClick={() => removeMCP(index)}
                    style={{
                      background: '#dc3545',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Remove
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="MCP server name"
                    value={mcp.name}
                    onChange={(e) => updateMCP(index, { name: e.target.value })}
                    style={{
                      padding: '6px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}
                  />
                  
                  <input
                    type="text"
                    placeholder="Server URL"
                    value={mcp.server_url}
                    onChange={(e) => updateMCP(index, { server_url: e.target.value })}
                    style={{
                      padding: '6px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}
                  />

                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                    <input
                      type="checkbox"
                      checked={mcp.auto_connect}
                      onChange={(e) => updateMCP(index, { auto_connect: e.target.checked })}
                    />
                    Auto Connect
                  </label>
                </div>
              </div>
            ))}

            {config.mcps.length === 0 && (
              <div style={{
                textAlign: 'center',
                color: '#6c757d',
                fontSize: '14px',
                padding: '20px'
              }}>
                No MCP servers configured. Click "Add MCP" to get started.
              </div>
            )}
          </div>
        )}

        {activeTab === 'subagents' && isWorkflowAgent && workflowConfig && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                Execution Type
              </label>
              <select
                value={workflowConfig.execution_type}
                onChange={(e) => updateConfig({ 
                  execution_type: e.target.value as 'sequential' | 'loop' | 'parallel' 
                })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="sequential">Sequential</option>
                <option value="parallel">Parallel</option>
                <option value="loop">Loop</option>
              </select>
            </div>

            <div>
              <h4 style={{ margin: '0 0 8px 0' }}>Sub-agents ({workflowConfig.sub_agents.length})</h4>
              {workflowConfig.sub_agents.map((subAgent, index) => (
                <div key={index} style={{
                  border: '1px solid #dee2e6',
                  borderRadius: '6px',
                  padding: '12px',
                  marginBottom: '8px'
                }}>
                  <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                    {subAgent.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6c757d' }}>
                    {subAgent.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid #dee2e6',
        display: 'flex',
        gap: '8px',
        justifyContent: 'flex-end'
      }}>
        <button
          onClick={onClose}
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
          onClick={handleSave}
          style={{
            padding: '8px 16px',
            background: '#0066cc',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default AgentConfigurationPanel;