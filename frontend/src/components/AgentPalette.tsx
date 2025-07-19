import React from 'react';
import { AgentConfiguration, WorkflowAgentConfiguration } from './FlowCanvas';

interface AgentTemplate {
  label: string;
  description: string;
  agent_type: 'agent' | 'workflow_agent';
  config: AgentConfiguration | WorkflowAgentConfiguration;
}

interface AgentPaletteProps {
  onDragStart: (event: React.DragEvent, agentTemplate: AgentTemplate) => void;
}

const agentTemplates: AgentTemplate[] = [
  {
    label: 'Basic Agent',
    description: 'A simple agent with customizable prompt',
    agent_type: 'agent',
    config: {
      name: 'Basic Agent',
      description: 'A basic agent for general tasks',
      prompt: 'You are a helpful assistant. Please help the user with their request.',
      tools: [],
      mcps: [],
    }
  },
  {
    label: 'Tool Agent',
    description: 'Agent with pre-configured tools',
    agent_type: 'agent',
    config: {
      name: 'Tool Agent',
      description: 'An agent equipped with tools for specific tasks',
      prompt: 'You are a helpful assistant with access to tools. Use them when needed to help the user.',
      tools: [
        {
          name: 'example_tool',
          description: 'An example tool',
          type: 'function',
          parameters: {},
          enabled: true
        }
      ],
      mcps: [],
    }
  },
  {
    label: 'MCP Agent',
    description: 'Agent with MCP integration',
    agent_type: 'agent',
    config: {
      name: 'MCP Agent',
      description: 'An agent that can use MCP servers',
      prompt: 'You are a helpful assistant with access to MCP servers. Use them to provide comprehensive assistance.',
      tools: [],
      mcps: [
        {
          name: 'example_mcp',
          server_url: 'http://localhost:8000',
          capabilities: ['tools', 'resources'],
          auto_connect: true
        }
      ],
    }
  },
  {
    label: 'Sequential Workflow Agent',
    description: 'WorkflowAgent that runs sub-agents sequentially',
    agent_type: 'workflow_agent',
    config: {
      name: 'Sequential Workflow Agent',
      description: 'A workflow agent that coordinates multiple sub-agents in sequence',
      prompt: 'You are a workflow orchestrator. Execute your sub-agents in sequential order to complete complex tasks.',
      tools: [],
      mcps: [],
      sub_agents: [
        {
          name: 'Sub Agent 1',
          description: 'First sub-agent in the sequence',
          prompt: 'You are the first sub-agent. Process the initial request.',
          tools: [],
          mcps: []
        },
        {
          name: 'Sub Agent 2', 
          description: 'Second sub-agent in the sequence',
          prompt: 'You are the second sub-agent. Process the output from the first agent.',
          tools: [],
          mcps: []
        }
      ],
      execution_type: 'sequential'
    } as WorkflowAgentConfiguration
  },
  {
    label: 'Parallel Workflow Agent',
    description: 'WorkflowAgent that runs sub-agents in parallel',
    agent_type: 'workflow_agent',
    config: {
      name: 'Parallel Workflow Agent',
      description: 'A workflow agent that coordinates multiple sub-agents in parallel',
      prompt: 'You are a workflow orchestrator. Execute your sub-agents in parallel to complete tasks efficiently.',
      tools: [],
      mcps: [],
      sub_agents: [
        {
          name: 'Parallel Sub Agent 1',
          description: 'First parallel sub-agent',
          prompt: 'You are a parallel sub-agent. Work on your part of the task independently.',
          tools: [],
          mcps: []
        },
        {
          name: 'Parallel Sub Agent 2',
          description: 'Second parallel sub-agent', 
          prompt: 'You are a parallel sub-agent. Work on your part of the task independently.',
          tools: [],
          mcps: []
        }
      ],
      execution_type: 'parallel'
    } as WorkflowAgentConfiguration
  },
  {
    label: 'Loop Workflow Agent',
    description: 'WorkflowAgent that runs sub-agents in a loop',
    agent_type: 'workflow_agent',
    config: {
      name: 'Loop Workflow Agent',
      description: 'A workflow agent that coordinates sub-agents in a loop until completion',
      prompt: 'You are a workflow orchestrator. Execute your sub-agents in a loop until the task is complete.',
      tools: [],
      mcps: [],
      sub_agents: [
        {
          name: 'Loop Sub Agent',
          description: 'Sub-agent that runs in a loop',
          prompt: 'You are a loop sub-agent. Continue processing until the task is complete.',
          tools: [],
          mcps: []
        }
      ],
      execution_type: 'loop'
    } as WorkflowAgentConfiguration
  }
];

const AgentPalette: React.FC<AgentPaletteProps> = ({ onDragStart }) => {
  return (
    <div style={{
      width: '250px',
      background: '#f8f9fa',
      borderRight: '1px solid #dee2e6',
      padding: '16px',
      height: '100%',
      overflowY: 'auto'
    }}>
      <h3 style={{ 
        margin: '0 0 16px 0', 
        color: '#495057',
        fontSize: '18px',
        fontWeight: '600'
      }}>
        Agent Palette
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {agentTemplates.map((template, index) => (
          <div
            key={index}
            draggable
            onDragStart={(event) => onDragStart(event, template)}
            style={{
              background: '#fff',
              border: '1px solid #dee2e6',
              borderRadius: '6px',
              padding: '12px',
              cursor: 'grab',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            }}
          >
            <div style={{ 
              fontWeight: '600', 
              color: '#212529',
              marginBottom: '4px',
              fontSize: '14px'
            }}>
              {template.label}
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: '#6c757d',
              lineHeight: '1.4'
            }}>
              {template.description}
            </div>
            <div style={{ 
              fontSize: '11px', 
              color: '#868e96',
              marginTop: '4px',
              fontStyle: 'italic'
            }}>
              Tools: {template.config.tools.length} | MCPs: {template.config.mcps.length}
              {template.agent_type === 'workflow_agent' && 
                ` | Sub-agents: ${(template.config as WorkflowAgentConfiguration).sub_agents.length}`
              }
            </div>
          </div>
        ))}
      </div>
      
      <div style={{ 
        marginTop: '24px', 
        padding: '12px',
        background: '#e9ecef',
        borderRadius: '6px',
        fontSize: '12px',
        color: '#495057'
      }}>
        <strong>Instructions:</strong><br />
        Drag agents from this palette onto the canvas to create your workflow. 
        Connect agents by dragging from output handles to input handles.
      </div>
    </div>
  );
};

export default AgentPalette;