import React, { useCallback, useState, useRef } from 'react';
import { ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';
import './App.css';

import FlowCanvas, { AgentNode, AgentNodeData, AgentConfiguration, WorkflowAgentConfiguration } from './components/FlowCanvas';
import AgentPalette from './components/AgentPalette';
import AgentConfigurationPanel from './components/AgentConfigurationPanel';

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

  return (
    <div className="App">
      <div className="app-header">
        <h1>Visual Agent Flow Builder</h1>
      </div>
      
      <div className="app-content">
        <ReactFlowProvider>
          <div className="flow-container">
            <AgentPalette onDragStart={onDragStart} />
            
            <div 
              className="canvas-container" 
              ref={reactFlowWrapper}
              onDrop={onDrop}
              onDragOver={onDragOver}
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
        </ReactFlowProvider>
        
        {selectedNode && (
          <AgentConfigurationPanel
            selectedNode={selectedNode}
            onConfigUpdate={onConfigUpdate}
            onClose={onCloseConfigPanel}
          />
        )}
      </div>
    </div>
  );
}

export default App;