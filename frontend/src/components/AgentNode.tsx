import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { AgentNodeData, WorkflowAgentConfiguration } from './FlowCanvas';

const AgentNode: React.FC<NodeProps<AgentNodeData>> = ({ data, selected }) => {
  const getNodeColor = (agentType: string, status: string) => {
    if (status === 'error') return '#ff6b6b';
    if (status === 'running' || status === 'streaming') return '#4ecdc4';
    if (status === 'completed') return '#51cf66';
    
    // Different colors for different agent types
    if (agentType === 'workflow_agent') return '#ffd43b'; // Yellow for workflow agents
    return '#74c0fc'; // Blue for regular agents
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return '⚡';
      case 'streaming': return '📡';
      case 'completed': return '✅';
      case 'error': return '❌';
      default: return data.agent_type === 'workflow_agent' ? '🔄' : '🤖';
    }
  };

  const getAgentTypeIcon = (agentType: string) => {
    return agentType === 'workflow_agent' ? '🔄' : '🤖';
  };

  const nodeColor = getNodeColor(data.agent_type, data.status);
  const statusIcon = getStatusIcon(data.status);
  const agentTypeIcon = getAgentTypeIcon(data.agent_type);

  const isWorkflowAgent = data.agent_type === 'workflow_agent';
  const workflowConfig = isWorkflowAgent ? data.config as WorkflowAgentConfiguration : null;

  return (
    <div
      style={{
        background: nodeColor,
        border: selected ? '2px solid #0066cc' : '1px solid #ddd',
        borderRadius: '8px',
        padding: '12px',
        minWidth: '180px',
        color: '#333',
        boxShadow: selected ? '0 4px 12px rgba(0,102,204,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
        transition: 'all 0.2s ease',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#555' }}
      />
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ fontSize: '16px' }}>{statusIcon}</span>
        <strong style={{ fontSize: '14px' }}>{data.label}</strong>
        <span style={{ fontSize: '12px', opacity: 0.6 }}>{agentTypeIcon}</span>
      </div>
      
      <div style={{ fontSize: '11px', opacity: 0.7, marginBottom: '4px' }}>
        Type: {data.agent_type === 'workflow_agent' ? 'Workflow Agent' : 'Agent'}
      </div>
      
      <div style={{ fontSize: '11px', opacity: 0.7, marginBottom: '4px' }}>
        Tools: {data.config.tools.length} | MCPs: {data.config.mcps.length}
      </div>
      
      {isWorkflowAgent && workflowConfig && (
        <>
          <div style={{ fontSize: '11px', opacity: 0.7, marginBottom: '4px' }}>
            Sub-agents: {workflowConfig.sub_agents.length}
          </div>
          <div style={{ fontSize: '11px', opacity: 0.7, marginBottom: '4px' }}>
            Execution: {workflowConfig.execution_type}
          </div>
        </>
      )}
      
      {data.config.model && (
        <div style={{ fontSize: '11px', opacity: 0.7 }}>
          Model: {data.config.model.model_name}
        </div>
      )}
      
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#555' }}
      />
    </div>
  );
};

export default AgentNode;