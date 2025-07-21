import React, { useCallback, useState, useRef } from 'react';
import { ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';
import './App.css';

import FlowCanvas, { AgentNode, AgentNodeData, AgentConfiguration, WorkflowAgentConfiguration } from './components/FlowCanvas';
import AgentPalette from './components/AgentPalette';
import AgentConfigurationPanel from './components/AgentConfigurationPanel';
import GlobalToolsManager from './components/GlobalToolsManager';
import GlobalMCPManager from './components/GlobalMCPManager';

// Initial empty state
const initialNodes: AgentNode[] = [];
const initialEdges: any[] = [];

let nodeId = 0;
const getId = () => `node_${nodeId++}`;

function App() {
  const [nodes, setNodes] = useState<AgentNode[]>(initialNodes);
  const [edges, setEdges] = useState<any[]>(initialEdges);
  const [selectedNode, setSelectedNode] = useState<AgentNode | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'workflow' | 'tools' | 'mcps'>('workflow');

  // Global Tools State - Google ADK Compliant
  const [functionTools, setFunctionTools] = useState<any[]>([]);
  const [builtInTools, setBuiltInTools] = useState<any[]>([
    { tool_name: 'code_execution', enabled: false, config: {} },
    { tool_name: 'google_search', enabled: false, config: {} },
    { tool_name: 'google_search_retrieval', enabled: false, config: {} }
  ]);
  const [thirdPartyTools, setThirdPartyTools] = useState<any[]>([]);
  
  // Global MCP Servers State
  const [globalMCPServers, setGlobalMCPServers] = useState<any[]>([]);

  const onNodesChange = useCallback((changes: any[]) => {
    setNodes((nds) => {
      const updatedNodes = [...nds];
      changes.forEach((change) => {
        const nodeIndex = updatedNodes.findIndex((node) => node.id === change.id);
        if (nodeIndex !== -1) {
          if (change.type === 'position' && change.position) {
            updatedNodes[nodeIndex] = { ...updatedNodes[nodeIndex], position: change.position };
          } else if (change.type === 'remove') {
            updatedNodes.splice(nodeIndex, 1);
          }
        }
      });
      return updatedNodes;
    });
  }, []);

  const onEdgesChange = useCallback((changes: any[]) => {
    setEdges((eds) => {
      const updatedEdges = [...eds];
      changes.forEach((change) => {
        const edgeIndex = updatedEdges.findIndex((edge) => edge.id === change.id);
        if (edgeIndex !== -1 && change.type === 'remove') {
          updatedEdges.splice(edgeIndex, 1);
        }
      });
      return updatedEdges;
    });
  }, []);

  const onConnect = useCallback((connection: any) => {
    const newEdge = {
      id: `edge_${edges.length}`,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
    };
    setEdges((eds) => [...eds, newEdge]);
  }, [edges.length]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const agentData = event.dataTransfer.getData('application/reactflow');

      if (typeof agentData === 'undefined' || !agentData || !reactFlowBounds) {
        return;
      }

      const agentTemplate = JSON.parse(agentData);
      const position = reactFlowInstance?.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      }) || { x: 100, y: 100 };

      const newNode: AgentNode = {
        id: getId(),
        type: 'agentNode',
        position,
        data: {
          id: getId(),
          label: agentTemplate.label,
          agent_type: agentTemplate.agent_type,
          config: agentTemplate.config,
          status: 'idle',
        } as AgentNodeData,
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [reactFlowInstance]
  );

  const onDragStart = useCallback((event: React.DragEvent, agentTemplate: any) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(agentTemplate));
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  const onNodeSelect = useCallback((node: AgentNode | null) => {
    setSelectedNode(node);
  }, []);

  const onConfigUpdate = useCallback((nodeId: string, config: AgentConfiguration | WorkflowAgentConfiguration) => {
    setNodes((nds) => 
      nds.map((node) => 
        node.id === nodeId 
          ? { ...node, data: { ...node.data, config } }
          : node
      )
    );
  }, []);

  const onCloseConfigPanel = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Function Tools Handlers
  const handleFunctionToolCreate = useCallback((tool: any) => {
    setFunctionTools(prev => [...prev, tool]);
  }, []);

  const handleFunctionToolUpdate = useCallback((id: string, tool: any) => {
    setFunctionTools(prev => prev.map(t => t.id === id ? tool : t));
  }, []);

  const handleFunctionToolDelete = useCallback((id: string) => {
    setFunctionTools(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleFunctionToolTest = useCallback(async (id: string) => {
    // Mock implementation - would connect to backend
    return new Promise<any>((resolve) => {
      setTimeout(() => {
        resolve({
          success: Math.random() > 0.3,
          message: Math.random() > 0.3 ? 'Function tool test successful' : 'Function tool test failed',
          output: { result: 'Mock test result' }
        });
      }, 1000);
    });
  }, []);

  // Built-in Tools Handlers
  const handleBuiltInToolToggle = useCallback((toolName: string, enabled: boolean) => {
    setBuiltInTools(prev => prev.map(t => 
      t.tool_name === toolName ? { ...t, enabled } : t
    ));
  }, []);

  const handleBuiltInToolConfigure = useCallback((toolName: string, config: Record<string, any>) => {
    setBuiltInTools(prev => prev.map(t => 
      t.tool_name === toolName ? { ...t, config } : t
    ));
  }, []);

  // Third-party Tools Handlers
  const handleThirdPartyToolCreate = useCallback((tool: any) => {
    setThirdPartyTools(prev => [...prev, tool]);
  }, []);

  const handleThirdPartyToolUpdate = useCallback((id: string, tool: any) => {
    setThirdPartyTools(prev => prev.map(t => t.id === id ? tool : t));
  }, []);

  const handleThirdPartyToolDelete = useCallback((id: string) => {
    setThirdPartyTools(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleThirdPartyToolTest = useCallback(async (id: string) => {
    // Mock implementation - would connect to backend
    return new Promise<any>((resolve) => {
      setTimeout(() => {
        resolve({
          success: Math.random() > 0.3,
          message: Math.random() > 0.3 ? 'Third-party tool test successful' : 'Third-party tool test failed',
          output: { result: 'Mock API response' }
        });
      }, 1500);
    });
  }, []);

  // Global MCP Handlers
  const handleMCPCreate = useCallback((server: any) => {
    setGlobalMCPServers(prev => [...prev, server]);
  }, []);

  const handleMCPUpdate = useCallback((id: string, server: any) => {
    setGlobalMCPServers(prev => prev.map(s => s.id === id ? server : s));
  }, []);

  const handleMCPDelete = useCallback((id: string) => {
    setGlobalMCPServers(prev => prev.filter(s => s.id !== id));
  }, []);

  const handleMCPTest = useCallback(async (id: string) => {
    // Mock implementation - would connect to backend
    return new Promise<any>((resolve) => {
      setTimeout(() => {
        resolve({
          success: Math.random() > 0.3,
          message: Math.random() > 0.3 ? 'MCP server test successful' : 'MCP server test failed',
          capabilities: [
            { type: 'tools', version: '1.0', features: ['example_tool'] }
          ]
        });
      }, 1500);
    });
  }, []);

  const handleMCPConnect = useCallback(async (id: string) => {
    // Mock implementation - would connect to backend
    return new Promise<any>((resolve) => {
      setTimeout(() => {
        resolve({
          success: Math.random() > 0.2,
          message: Math.random() > 0.2 ? 'Connected successfully' : 'Connection failed',
          server_info: { version: '1.0', name: 'Mock MCP Server' }
        });
      }, 2000);
    });
  }, []);

  return (
    <div className="App">
      <div className="app-header">
        <h1>Visual Agent Flow Builder</h1>
        
        {/* GitHub-style Tab Navigation */}
        <nav style={{
          borderBottom: '1px solid #d1d9e0',
          marginTop: '16px'
        }}>
          <div style={{
            display: 'flex',
            gap: '0'
          }}>
            {[
              { key: 'workflow', label: 'Workflow', icon: '🔄' },
              { key: 'tools', label: 'Tools', icon: '🔧' },
              { key: 'mcps', label: 'MCP Servers', icon: '🔌' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  border: 'none',
                  background: 'transparent',
                  color: activeTab === tab.key ? '#24292f' : '#656d76',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  borderBottom: activeTab === tab.key ? '2px solid #fd8c73' : '2px solid transparent',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.key) {
                    e.currentTarget.style.color = '#24292f';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.key) {
                    e.currentTarget.style.color = '#656d76';
                  }
                }}
              >
                <span style={{ fontSize: '16px' }}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </nav>
      </div>
      
      <div className="app-content" style={{ height: 'calc(100vh - 120px)' }}>
        {activeTab === 'workflow' && (
          <ReactFlowProvider>
            <div className="flow-container" style={{ height: '100%' }}>
              <AgentPalette onDragStart={onDragStart} />
              
              <div 
                className="canvas-container" 
                ref={reactFlowWrapper}
                onDrop={onDrop}
                onDragOver={onDragOver}
                style={{ flex: 1, height: '100%' }}
              >
                <FlowCanvas
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  onNodeSelect={onNodeSelect}
                  onInit={setReactFlowInstance}
                />
              </div>
            </div>
            
            {selectedNode && (
              <AgentConfigurationPanel
                selectedNode={selectedNode}
                onConfigUpdate={onConfigUpdate}
                onClose={onCloseConfigPanel}
              />
            )}
          </ReactFlowProvider>
        )}

        {activeTab === 'tools' && (
          <GlobalToolsManager
            functionTools={functionTools}
            builtInTools={builtInTools}
            thirdPartyTools={thirdPartyTools}
            onFunctionToolCreate={handleFunctionToolCreate}
            onFunctionToolUpdate={handleFunctionToolUpdate}
            onFunctionToolDelete={handleFunctionToolDelete}
            onFunctionToolTest={handleFunctionToolTest}
            onBuiltInToolToggle={handleBuiltInToolToggle}
            onBuiltInToolConfigure={handleBuiltInToolConfigure}
            onThirdPartyToolCreate={handleThirdPartyToolCreate}
            onThirdPartyToolUpdate={handleThirdPartyToolUpdate}
            onThirdPartyToolDelete={handleThirdPartyToolDelete}
            onThirdPartyToolTest={handleThirdPartyToolTest}
          />
        )}

        {activeTab === 'mcps' && (
          <GlobalMCPManager
            mcpServers={globalMCPServers}
            onServerCreate={handleMCPCreate}
            onServerUpdate={handleMCPUpdate}
            onServerDelete={handleMCPDelete}
            onServerTest={handleMCPTest}
            onServerConnect={handleMCPConnect}
          />
        )}
      </div>
    </div>
  );
}

export default App;