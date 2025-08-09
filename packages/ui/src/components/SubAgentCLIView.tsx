
import React, { useEffect, useState, useRef } from 'react';

interface SubAgentCLIViewProps {
  jobId: string;
}

const SubAgentCLIView: React.FC<SubAgentCLIViewProps> = ({ jobId }) => {
  const [output, setOutput] = useState<{ type: string, content: string }[]>([]);
  const cliOutputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!jobId) return;

    const eventSource = new EventSource(`/api/chat/stream/${jobId}`);
    setOutput([]); // Clear previous output

    eventSource.onmessage = (event) => {
      if (event.data === 'heartbeat') {
        return;
      }
      try {
        const data = JSON.parse(event.data);
        setOutput((prevOutput) => [...prevOutput, data]);
      } catch (error) {
        // Handle non-JSON data, maybe just display it as raw text
        setOutput((prevOutput) => [...prevOutput, { type: 'raw', content: event.data }]);
      }
    };

    eventSource.onerror = () => {
      setOutput((prevOutput) => [...prevOutput, { type: 'error', content: 'Connection to stream lost.' }]);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [jobId]);

  useEffect(() => {
    // Auto-scroll to the bottom
    if (cliOutputRef.current) {
      cliOutputRef.current.scrollTop = cliOutputRef.current.scrollHeight;
    }
  }, [output]);

  const renderLine = (line: { type: string, content: string }, index: number) => {
    let colorClass = 'text-gray-300'; // Default for stdout
    if (line.type === 'stderr' || line.type === 'error') {
      colorClass = 'text-red-500';
    } else if (line.type === 'status') {
      colorClass = 'text-yellow-500';
    }

    return (
      <div key={index} className={`whitespace-pre-wrap ${colorClass}`}>
        <span className="mr-2">{`$`}</span>
        {line.content}
      </div>
    );
  };

  return (
    <div className="bg-black text-white font-mono text-sm rounded-lg p-4 h-96 overflow-y-auto" ref={cliOutputRef}>
      <div className="border-b border-gray-700 mb-2 pb-2">
        <h3 className="text-lg font-bold text-green-400">GForce Agent Delegation</h3>
        <p className="text-xs text-gray-500">Streaming output for Job ID: {jobId}</p>
      </div>
      {output.map(renderLine)}
    </div>
  );
};

export default SubAgentCLIView;
