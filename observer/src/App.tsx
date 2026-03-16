import { useCallback, useMemo } from 'react';
import { TopBar } from './components/TopBar';
import { NeuroStrip } from './components/NeuroStrip';
import { BrainFlow } from './components/BrainFlow';
import { BufferDrawer } from './components/BufferDrawer';
import { BackgroundAgents } from './components/BackgroundAgents';
import { useBrainState } from './hooks/useBrainState';
import { useWebSocket } from './hooks/useWebSocket';

export function App() {
  const [state, dispatch] = useBrainState();

  // WebSocket connection
  const { connected } = useWebSocket('ws://localhost:4100', (message) => {
    dispatch(message);
  });

  // Handle node click - dispatch SELECT_NODE action
  const handleNodeClick = useCallback((agent: string) => {
    dispatch({ type: 'SELECT_NODE', agent });
  }, [dispatch]);

  // Handle drawer close - dispatch SELECT_NODE with null
  const handleDrawerClose = useCallback(() => {
    dispatch({ type: 'SELECT_NODE', agent: null });
  }, [dispatch]);

  // Handle session view change - dispatch VIEW_SESSION action
  const handleViewSession = useCallback((sessionId: string | null) => {
    dispatch({ type: 'VIEW_SESSION', sessionId });
  }, [dispatch]);

  // Get selected node data
  const selectedNodeData = useMemo(() => {
    if (!state.selectedNode) return null;
    return state.nodes[state.selectedNode] || null;
  }, [state.selectedNode, state.nodes]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Top Bar */}
      <TopBar
        isLive={state.isLive}
        isConnected={connected}
        rePlanCount={state.rePlanCount}
        loopStartTs={state.loopStartTs}
        sessionHistory={state.sessionHistory}
        viewingSession={state.viewingSession}
        onSelectSession={handleViewSession}
      />

      {/* Neuromodulator Strip */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-3">
        <NeuroStrip levels={state.neuro} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Brain Flow Canvas */}
        <div className="flex-1">
          <BrainFlow state={state} onNodeClick={handleNodeClick} />
        </div>

        {/* Background Agents - Positioned at bottom-right */}
        <div className="absolute bottom-4 right-4 z-10">
          <BackgroundAgents status={state.backgroundAgents} />
        </div>

        {/* Buffer Drawer - Slides from right */}
        <BufferDrawer node={selectedNodeData} onClose={handleDrawerClose} />
      </div>
    </div>
  );
}
