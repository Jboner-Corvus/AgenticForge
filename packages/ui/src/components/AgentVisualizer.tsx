import { useStore } from '../lib/store';

export function AgentVisualizer() {
  const browserStatus = useStore((state) => state.browserStatus);

  return (
    <div className="p-4 border-l border-border">
      <h2 className="text-lg font-semibold mb-4">Agent Visualizer</h2>
      <div>
        <p>Browser Status: {browserStatus}</p>
      </div>
    </div>
  );
}
