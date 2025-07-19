import React, { useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Connection,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  NodeChange,
  EdgeChange,
  ConnectionMode,
} from 'reactflow';
import 'reactflow/dist/style.css';
import AgentNodeComponent from './AgentNode';

// Define the agent node data interface
export interface AgentNodeData {
  id: string;
  label: string;
  agent_type: 'agent' | 'workflow_agent';
  config: AgentConfiguration | WorkflowAgentConfiguration;
  status: 'idle' | 'running' | 'completed' | 'error' | 'streaming';
}

// Base Agent Configuration
export interface AgentConfiguration {
  name: string;
  description?: string;
  prompt: string;
  tools: ToolConfiguration[];
  mcps: MCPConfiguration[];
  model?: ModelConfiguration;
  timeout?: number;
}

// WorkflowAgent extends Agent with sub-agents and execution type
export interface WorkflowAgentConfiguration extends AgentConfiguration {
  sub_agents: AgentConfiguration[];
  execution_type: 'sequential' | 'loop' | 'parallel';
}

export interface MCPConfiguration {
  name: string;
  server_url: string;
  authentication?: MCPAuthConfig;
  capabilities: string[];
  auto_connect: boolean;
}

export interface MCPAuthConfig {
  type: 'bearer' | 'api_key' | 'oauth';
  credentials: Record<string, string>;
}

export interface ToolConfiguration {
  name: string;
  description: string;
  type: 'function' | 'mcp_tool';
  function_declaration?: any;
  mcp_server?: string;
  mcp_tool_name?: string;
  parameters: Record<string, any>;
  enabled: boolean;
}

export interface ModelConfiguration {
  model_name: string;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  max_output_tokens?: number;
}

// Define the custom node type
export interface AgentNode extends Node {
  data: AgentNodeData;
}

// Define node types for React Flow
const nodeTypes = {
  agentNode: AgentNodeComponent,
};

interface FlowCanvasProps {
  nodes: AgentNode[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  onNodeSelect?: (node: AgentNode | null) => void;
  onInit?: (instance: any) => void;
}

const FlowCanvas: React.FC<FlowCanvasProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeSelect,
  onInit,
}) => {
  const handleConnect = useCallback(
    (params: Connection) => {
      onConnect(params);
    },
    [onConnect]
  );

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const agentNode = node as AgentNode;
      onNodeSelect?.(agentNode);
    },
    [onNodeSelect]
  );

  const handlePaneClick = useCallback(() => {
    onNodeSelect?.(null);
  }, [onNodeSelect]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        onInit={onInit}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        attributionPosition="top-right"
      >
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </div>
  );
};

export default FlowCanvas;