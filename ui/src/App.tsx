
import { useState, useEffect, useCallback } from 'react';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { Request, Notification, Result } from '@modelcontextprotocol/sdk/types.js';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge"; // I'll add this component later

const SERVER_URL = 'http://192.168.2.56:8081/mcp';
const AUTH_TOKEN = 'Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

function App() {
  const [client, setClient] = useState<Client<Request, Notification, Result> | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [results, setResults] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const connect = useCallback(async () => {
    setConnectionStatus('connecting');
    try {
      const mcpClient = new Client<Request, Notification, Result>({
        name: 'gemini-ui-client',
        version: '1.0.0',
      });

      const transport = new StreamableHTTPClientTransport(new URL(SERVER_URL), {
        sessionId: undefined,
        requestInit: {
          headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
        }
      });

      await mcpClient.connect(transport);
      setClient(mcpClient);
      setConnectionStatus('connected');
    } catch (error) {
      console.error("Connection failed:", error);
      setConnectionStatus('error');
    }
  }, []);

  const disconnect = useCallback(async () => {
    setClient(prevClient => {
      prevClient?.close();
      return null;
    });
    setConnectionStatus('disconnected');
  }, []);

  useEffect(() => {
    // Automatically connect on component mount
    connect();
    // Disconnect on component unmount
    return () => {
      disconnect();
    };
  }, []);

  const callTool = async (toolName: string, params: object) => {
    if (!client) {
      setResults(prev => ({ ...prev, [toolName]: 'Error: Client not connected.' }));
      return;
    }
    setLoading(prev => ({ ...prev, [toolName]: true }));
    try {
      const result = await client.request({
        method: 'tools/call',
        params: { name: toolName, arguments: params },
      });
      setResults(prev => ({ ...prev, [toolName]: JSON.stringify(result, null, 2) }));
    } catch (error) {
      console.error(`Error calling tool ${toolName}:`, error);
      setResults(prev => ({ ...prev, [toolName]: `Error: ${(error as Error).message}` }));
    } finally {
      setLoading(prev => ({ ...prev, [toolName]: false }));
    }
  };

  const tools = [
    { name: 'debugContext', params: { message: 'Hello from UI' } },
    { name: 'synchronousExampleToolEnhanced', params: { data: 'UI test data', delayMs: 100 } },
    { name: 'asynchronousTaskSimulatorEnhanced', params: { durationMs: 500, value1: 10, value2: 20 } },
  ];

  const getStatusBadgeVariant = () => {
    switch (connectionStatus) {
      case 'connected': return 'success';
      case 'connecting': return 'secondary';
      case 'error': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto p-4">
        <header className="flex justify-between items-center mb-6 p-4 bg-white rounded-lg shadow-sm">
          <h1 className="text-3xl font-bold text-gray-800">MCP Tool Interface</h1>
          <div className="flex items-center gap-4">
            <Badge variant={getStatusBadgeVariant()} className="capitalize text-lg">
              {connectionStatus}
            </Badge>
            <Button onClick={connectionStatus === 'connected' ? disconnect : connect} disabled={connectionStatus === 'connecting'}>
              {connectionStatus === 'connected' ? 'Disconnect' : 'Connect'}
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {tools.map(tool => (
            <Card key={tool.name} className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-xl">{tool.name}</CardTitle>
                <CardDescription>Click the button to execute this tool.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-mono text-gray-500 mb-2">Parameters:</p>
                <pre className="bg-gray-100 p-3 rounded-md text-xs overflow-auto mb-4">
                  {JSON.stringify(tool.params, null, 2)}
                </pre>
                <p className="text-sm font-mono text-gray-500 mb-2">Result:</p>
                <pre className="bg-gray-900 text-white p-3 rounded-md overflow-auto h-56 text-xs">
                  {results[tool.name] || 'Awaiting execution...'}
                </pre>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => callTool(tool.name, tool.params)} 
                  disabled={loading[tool.name] || connectionStatus !== 'connected'}
                  className="w-full"
                >
                  {loading[tool.name] ? 'Executing...' : 'Call Tool'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
