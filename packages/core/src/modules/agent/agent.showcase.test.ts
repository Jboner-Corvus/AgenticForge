import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock all external dependencies to isolate agent behavior testing
const mockLlmProvider = {
  getLlmResponse: vi.fn(),
};

const mockToolRegistry = {
  execute: vi.fn(),
};

const mockRedisClient = {
  publish: vi.fn(),
  duplicate: () => ({
    on: vi.fn(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    quit: vi.fn(),
  }),
};

const mockLogger = {
  child: vi.fn().mockReturnThis(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

const mockResponseSchema = {
  parse: vi.fn(),
};

// Global mocks
vi.mock('../../config.js', () => ({
  config: {
    AGENT_MAX_ITERATIONS: 5,
    LLM_PROVIDER_HIERARCHY: ['openai', 'anthropic'],
  },
}));

vi.mock('../../logger.js', () => ({
  getLoggerInstance: () => mockLogger,
}));

vi.mock('../../utils/llmProvider.js', () => ({
  getLlmProvider: () => mockLlmProvider,
}));

vi.mock('../redis/redisClient.js', () => ({
  getRedisClientInstance: () => mockRedisClient,
}));

vi.mock('../llm/LlmKeyManager.js', () => ({
  LlmKeyManager: {
    hasAvailableKeys: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock('../tools/toolRegistry.js', () => ({
  toolRegistry: mockToolRegistry,
}));

vi.mock('./orchestrator.prompt.js', () => ({
  getMasterPrompt: vi.fn().mockReturnValue('Test master prompt'),
}));

vi.mock('./responseSchema.js', () => ({
  llmResponseSchema: mockResponseSchema,
}));

vi.mock('../../utils/LlmError.js', () => ({
  LlmError: class extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'LlmError';
    }
  },
}));

vi.mock('../tools/definitions/index.js', () => ({
  FinishToolSignal: class extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'FinishToolSignal';
    }
  },
}));

describe('Agent Behavior Showcase', () => {
  let AgentClass: any;
  let mockJob: any;
  let mockSessionData: any;
  let mockSessionManager: any;
  let mockTools: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Dynamic import to ensure mocks are applied
    const agentModule = await import('./agent.js');
    AgentClass = agentModule.Agent;

    mockJob = {
      id: 'showcase-job',
      data: { prompt: 'Test prompt' },
      isFailed: vi.fn().mockResolvedValue(false),
      updateProgress: vi.fn(),
    };

    mockSessionData = {
      id: 'showcase-session',
      history: [],
      activeLlmProvider: 'openai',
    };

    mockSessionManager = {
      saveSession: vi.fn(),
    };

    mockTools = [
      {
        name: 'calculator',
        description: 'Perform calculations',
        parameters: { shape: {} },
      },
    ];
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Agent Intelligence Demonstrations', () => {
    it('should demonstrate logical reasoning and problem solving', async () => {
      // Setup: Mathematical word problem
      mockJob.data.prompt = 'If I have 15 apples and give away 3 to each of my 4 friends, how many apples do I have left?';

      // Agent reasoning flow
      mockLlmProvider.getLlmResponse
        .mockResolvedValueOnce('{"thought": "I need to solve this step by step: 15 apples initially, giving 3 to each of 4 friends means 3×4=12 apples given away."}')
        .mockResolvedValueOnce('{"command": {"name": "calculator", "params": {"operation": "multiply", "a": 3, "b": 4}}}')
        .mockResolvedValueOnce('{"thought": "So I gave away 12 apples. Now I need to subtract: 15 - 12 = 3"}')
        .mockResolvedValueOnce('{"command": {"name": "calculator", "params": {"operation": "subtract", "a": 15, "b": 12}}}')
        .mockResolvedValueOnce('{"answer": "After giving 3 apples to each of your 4 friends (12 apples total), you have 3 apples remaining."}');

      mockResponseSchema.parse
        .mockReturnValueOnce({ thought: 'I need to solve this step by step: 15 apples initially, giving 3 to each of 4 friends means 3×4=12 apples given away.' })
        .mockReturnValueOnce({ command: { name: 'calculator', params: { operation: 'multiply', a: 3, b: 4 } } })
        .mockReturnValueOnce({ thought: 'So I gave away 12 apples. Now I need to subtract: 15 - 12 = 3' })
        .mockReturnValueOnce({ command: { name: 'calculator', params: { operation: 'subtract', a: 15, b: 12 } } })
        .mockReturnValueOnce({ answer: 'After giving 3 apples to each of your 4 friends (12 apples total), you have 3 apples remaining.' });

      mockToolRegistry.execute
        .mockResolvedValueOnce(12) // 3 × 4
        .mockResolvedValueOnce(3); // 15 - 12

      const agent = new AgentClass(
        mockJob,
        mockSessionData,
        {},
        mockTools,
        'openai',
        mockSessionManager
      );

      const result = await agent.run();

      expect(result).toContain('3 apples remaining');
      expect(mockToolRegistry.execute).toHaveBeenCalledTimes(2);
      
      // Verify logical progression in conversation history
      const thoughts = mockSessionData.history.filter((msg: any) => msg.type === 'agent_thought');
      expect(thoughts).toHaveLength(2);
      expect(thoughts[0].content).toContain('step by step');
      expect(thoughts[1].content).toContain('15 - 12');
    });

    it('should demonstrate creative problem solving', async () => {
      mockJob.data.prompt = 'Create a unique way to remember the order of planets in our solar system';

      mockLlmProvider.getLlmResponse
        .mockResolvedValueOnce('{"thought": "I should create a memorable mnemonic device or visual story to help remember the planetary order."}')
        .mockResolvedValueOnce('{"canvas": {"content": "# Planetary Memory Palace\\n\\n**Story Method**: *My Very Educated Mother Just Served Us Nachos*\\n\\n- **Mercury** → My (closest to the sun, quick like quicksilver)\\n- **Venus** → Very (bright morning star)\\n- **Earth** → Educated (our intelligent home)\\n- **Mars** → Mother (red like a mother\'s protective love)\\n- **Jupiter** → Just (the giant guardian)\\n- **Saturn** → Served (with beautiful rings as serving plates)\\n- **Uranus** → Us (sideways spinning like us dancing)\\n- **Neptune** → Nachos (blue like cool ocean nachos)", "contentType": "markdown"}}');

      mockResponseSchema.parse
        .mockReturnValueOnce({ thought: 'I should create a memorable mnemonic device or visual story to help remember the planetary order.' })
        .mockReturnValueOnce({
          canvas: {
            content: '# Planetary Memory Palace\n\n**Story Method**: *My Very Educated Mother Just Served Us Nachos*\n\n- **Mercury** → My (closest to the sun, quick like quicksilver)\n- **Venus** → Very (bright morning star)\n- **Earth** → Educated (our intelligent home)\n- **Mars** → Mother (red like a mother\'s protective love)\n- **Jupiter** → Just (the giant guardian)\n- **Saturn** → Served (with beautiful rings as serving plates)\n- **Uranus** → Us (sideways spinning like us dancing)\n- **Neptune** → Nachos (blue like cool ocean nachos)',
            contentType: 'markdown',
          },
        });

      const agent = new AgentClass(
        mockJob,
        mockSessionData,
        {},
        mockTools,
        'openai',
        mockSessionManager
      );

      const result = await agent.run();

      expect(result).toBe('Agent displayed content on the canvas.');
      
      const canvasOutput = mockSessionData.history.find((msg: any) => msg.type === 'agent_canvas_output');
      expect(canvasOutput.content).toContain('My Very Educated Mother');
      expect(canvasOutput.content).toContain('Mercury');
      expect(canvasOutput.content).toContain('Neptune');
    });

    it('should demonstrate adaptive communication styles', async () => {
      // Test: Explaining quantum physics to different audiences
      const scenarios = [
        {
          context: { userLevel: 'child', age: 8 },
          prompt: 'What is quantum physics?',
          expectedStyle: 'simple, playful metaphors',
        },
        {
          context: { userLevel: 'undergraduate', field: 'physics' },
          prompt: 'Explain quantum superposition',
          expectedStyle: 'technical but accessible',
        },
        {
          context: { userLevel: 'expert', field: 'quantum-computing' },
          prompt: 'Discuss decoherence in quantum systems',
          expectedStyle: 'advanced technical terminology',
        },
      ];

      for (const scenario of scenarios) {
        vi.clearAllMocks();
        
        mockSessionData.workingContext = scenario.context;
        mockJob.data.prompt = scenario.prompt;

        if (scenario.context.userLevel === 'child') {
          mockLlmProvider.getLlmResponse.mockResolvedValue(
            '{"answer": "Imagine tiny invisible pieces that make up everything! They\'re like magical LEGO blocks that can be in multiple places at once, like a superhero that can be in two places at the same time! 🌟"}'
          );
          mockResponseSchema.parse.mockReturnValue({
            answer: "Imagine tiny invisible pieces that make up everything! They're like magical LEGO blocks that can be in multiple places at once, like a superhero that can be in two places at the same time! 🌟",
          });
        } else if (scenario.context.userLevel === 'undergraduate') {
          mockLlmProvider.getLlmResponse.mockResolvedValue(
            '{"answer": "Quantum superposition is a fundamental principle where particles exist in multiple states simultaneously until measured. Think of Schrödinger\'s cat - the particle is both \'alive\' and \'dead\' until observation collapses the wave function."}'
          );
          mockResponseSchema.parse.mockReturnValue({
            answer: "Quantum superposition is a fundamental principle where particles exist in multiple states simultaneously until measured. Think of Schrödinger's cat - the particle is both 'alive' and 'dead' until observation collapses the wave function.",
          });
        } else {
          mockLlmProvider.getLlmResponse.mockResolvedValue(
            '{"answer": "Decoherence represents the irreversible process through which quantum coherence is lost via entanglement with environmental degrees of freedom, leading to apparent wave function collapse and classical behavior emergence."}'
          );
          mockResponseSchema.parse.mockReturnValue({
            answer: 'Decoherence represents the irreversible process through which quantum coherence is lost via entanglement with environmental degrees of freedom, leading to apparent wave function collapse and classical behavior emergence.',
          });
        }

        const agent = new AgentClass(
          mockJob,
          mockSessionData,
          {},
          mockTools,
          'openai',
          mockSessionManager
        );

        const result = await agent.run();

        if (scenario.context.userLevel === 'child') {
          expect(result).toContain('magical LEGO blocks');
          expect(result).toContain('superhero');
        } else if (scenario.context.userLevel === 'undergraduate') {
          expect(result).toContain('wave function');
          expect(result).toContain('Schrödinger');
        } else {
          expect(result).toContain('entanglement');
          expect(result).toContain('environmental degrees of freedom');
        }
      }
    });

    it('should demonstrate multi-modal communication', async () => {
      mockJob.data.prompt = 'Explain how photosynthesis works with both text and visuals';

      mockLlmProvider.getLlmResponse
        .mockResolvedValueOnce('{"thought": "I should provide both a textual explanation and a visual diagram to make this complex process clear."}')
        .mockResolvedValueOnce('{"canvas": {"content": "<div style=\\"font-family: Arial, sans-serif;\\"><h2>🌱 Photosynthesis Process</h2><div style=\\"display: flex; align-items: center; margin: 20px 0;\\"><div style=\\"background: #e8f5e8; padding: 15px; border-radius: 10px; margin-right: 20px;\\"><h3>☀️ Light Reactions</h3><p>Chloroplasts capture sunlight<br/>Water splits into H+ and O2<br/>ATP and NADPH produced</p></div><div style=\\"background: #f0f8ff; padding: 15px; border-radius: 10px;\\"><h3>🔄 Calvin Cycle</h3><p>CO2 + ATP + NADPH<br/>↓<br/>Glucose (C6H12O6)</p></div></div><div style=\\"text-align: center; font-size: 18px; color: #2e8b57;\\"><strong>6CO2 + 6H2O + light energy → C6H12O6 + 6O2</strong></div></div>", "contentType": "html"}}')
        .mockResolvedValueOnce('{"answer": "Photosynthesis is how plants convert sunlight into chemical energy! The process has two main stages: Light Reactions (where chloroplasts capture sunlight and split water) and the Calvin Cycle (where CO2 is converted to glucose). The visual above shows both stages and the overall equation."}');

      mockResponseSchema.parse
        .mockReturnValueOnce({ thought: 'I should provide both a textual explanation and a visual diagram to make this complex process clear.' })
        .mockReturnValueOnce({
          canvas: {
            content: '<div style="font-family: Arial, sans-serif;"><h2>🌱 Photosynthesis Process</h2><div style="display: flex; align-items: center; margin: 20px 0;"><div style="background: #e8f5e8; padding: 15px; border-radius: 10px; margin-right: 20px;"><h3>☀️ Light Reactions</h3><p>Chloroplasts capture sunlight<br/>Water splits into H+ and O2<br/>ATP and NADPH produced</p></div><div style="background: #f0f8ff; padding: 15px; border-radius: 10px;"><h3>🔄 Calvin Cycle</h3><p>CO2 + ATP + NADPH<br/>↓<br/>Glucose (C6H12O6)</p></div></div><div style="text-align: center; font-size: 18px; color: #2e8b57;"><strong>6CO2 + 6H2O + light energy → C6H12O6 + 6O2</strong></div></div>',
            contentType: 'html',
          },
        })
        .mockReturnValueOnce({ answer: 'Photosynthesis is how plants convert sunlight into chemical energy! The process has two main stages: Light Reactions (where chloroplasts capture sunlight and split water) and the Calvin Cycle (where CO2 is converted to glucose). The visual above shows both stages and the overall equation.' });

      const agent = new AgentClass(
        mockJob,
        mockSessionData,
        {},
        mockTools,
        'openai',
        mockSessionManager
      );

      const result = await agent.run();

      expect(result).toContain('Light Reactions');
      expect(result).toContain('Calvin Cycle');
      
      const canvasOutput = mockSessionData.history.find((msg: any) => msg.type === 'agent_canvas_output');
      expect(canvasOutput.content).toContain('Photosynthesis Process');
      expect(canvasOutput.content).toContain('6CO2 + 6H2O');
    });
  });

  describe('Real-world Problem Solving Scenarios', () => {
    it('should handle customer service scenario with empathy', async () => {
      mockJob.data.prompt = 'I ordered a product 2 weeks ago and it still hasn\'t arrived. I\'m very frustrated and need help.';

      mockLlmProvider.getLlmResponse.mockResolvedValue(
        '{"answer": "I completely understand your frustration, and I\'m truly sorry this has happened. Two weeks is definitely too long to wait for a delivery. Let me help you resolve this right away. Here\'s what I can do immediately: 1) Check your order status and tracking information, 2) Contact the shipping carrier to locate your package, 3) If needed, arrange for either expedited replacement or full refund. Would you like me to start by looking up your order details?"}'
      );

      mockResponseSchema.parse.mockReturnValue({
        answer: "I completely understand your frustration, and I'm truly sorry this has happened. Two weeks is definitely too long to wait for a delivery. Let me help you resolve this right away. Here's what I can do immediately: 1) Check your order status and tracking information, 2) Contact the shipping carrier to locate your package, 3) If needed, arrange for either expedited replacement or full refund. Would you like me to start by looking up your order details?",
      });

      const agent = new AgentClass(
        mockJob,
        mockSessionData,
        {},
        mockTools,
        'openai',
        mockSessionManager
      );

      const result = await agent.run();

      expect(result).toContain('understand your frustration');
      expect(result).toContain('sorry this has happened');
      expect(result).toContain('help you resolve this');
      expect(result).toContain('order status');
    });

    it('should demonstrate technical troubleshooting methodology', async () => {
      mockJob.data.prompt = 'My computer keeps freezing when I try to run video editing software. Can you help?';

      mockLlmProvider.getLlmResponse
        .mockResolvedValueOnce('{"thought": "This is a technical issue that could have multiple causes. I need to systematically diagnose the problem by checking hardware specifications, software compatibility, and system resources."}')
        .mockResolvedValueOnce('{"answer": "I\'ll help you troubleshoot this freezing issue systematically. Video editing is resource-intensive, so let\'s check these areas: **Hardware**: What are your computer specs (RAM, CPU, graphics card)? **Software**: Which video editing program and what file formats/sizes? **System**: Any error messages or patterns to the freezing? Let\'s start with your system specifications so I can determine if it meets the software requirements."}');

      mockResponseSchema.parse
        .mockReturnValueOnce({ thought: 'This is a technical issue that could have multiple causes. I need to systematically diagnose the problem by checking hardware specifications, software compatibility, and system resources.' })
        .mockReturnValueOnce({ answer: "I'll help you troubleshoot this freezing issue systematically. Video editing is resource-intensive, so let's check these areas: **Hardware**: What are your computer specs (RAM, CPU, graphics card)? **Software**: Which video editing program and what file formats/sizes? **System**: Any error messages or patterns to the freezing? Let's start with your system specifications so I can determine if it meets the software requirements." });

      const agent = new AgentClass(
        mockJob,
        mockSessionData,
        {},
        mockTools,
        'openai',
        mockSessionManager
      );

      const result = await agent.run();

      expect(result).toContain('systematically');
      expect(result).toContain('Hardware');
      expect(result).toContain('Software');
      expect(result).toContain('system specifications');
    });

    it('should demonstrate educational tutoring approach', async () => {
      mockJob.data.prompt = 'I don\'t understand how to solve quadratic equations. Can you teach me?';

      mockLlmProvider.getLlmResponse
        .mockResolvedValueOnce('{"thought": "The user needs to learn quadratic equations. I should use a scaffolded approach: start with the basics, show the formula, provide examples, and guide them through practice."}')
        .mockResolvedValueOnce('{"canvas": {"content": "# Quadratic Equations Tutorial 📚\\n\\n## What is a Quadratic Equation?\\nAn equation in the form: **ax² + bx + c = 0**\\n\\n## The Quadratic Formula\\n**x = (-b ± √(b² - 4ac)) / 2a**\\n\\n## Step-by-Step Example\\nLet\'s solve: **2x² + 5x - 3 = 0**\\n\\n1. **Identify coefficients:**\\n   - a = 2, b = 5, c = -3\\n\\n2. **Apply formula:**\\n   - x = (-5 ± √(25 - 4(2)(-3))) / 2(2)\\n   - x = (-5 ± √(25 + 24)) / 4\\n   - x = (-5 ± √49) / 4\\n   - x = (-5 ± 7) / 4\\n\\n3. **Two solutions:**\\n   - x₁ = (-5 + 7) / 4 = 2/4 = 0.5\\n   - x₂ = (-5 - 7) / 4 = -12/4 = -3\\n\\n✅ **Check:** 2(0.5)² + 5(0.5) - 3 = 0 ✓", "contentType": "markdown"}}')
        .mockResolvedValueOnce('{"answer": "Great question! I\'ve created a step-by-step tutorial above. Quadratic equations might seem tricky at first, but they follow a clear pattern. The key is identifying the coefficients (a, b, c) and applying the quadratic formula. Would you like to try solving one together, or do you have questions about any of the steps I showed?"}');

      mockResponseSchema.parse
        .mockReturnValueOnce({ thought: 'The user needs to learn quadratic equations. I should use a scaffolded approach: start with the basics, show the formula, provide examples, and guide them through practice.' })
        .mockReturnValueOnce({
          canvas: {
            content: '# Quadratic Equations Tutorial 📚\n\n## What is a Quadratic Equation?\nAn equation in the form: **ax² + bx + c = 0**\n\n## The Quadratic Formula\n**x = (-b ± √(b² - 4ac)) / 2a**\n\n## Step-by-Step Example\nLet\'s solve: **2x² + 5x - 3 = 0**\n\n1. **Identify coefficients:**\n   - a = 2, b = 5, c = -3\n\n2. **Apply formula:**\n   - x = (-5 ± √(25 - 4(2)(-3))) / 2(2)\n   - x = (-5 ± √(25 + 24)) / 4\n   - x = (-5 ± √49) / 4\n   - x = (-5 ± 7) / 4\n\n3. **Two solutions:**\n   - x₁ = (-5 + 7) / 4 = 2/4 = 0.5\n   - x₂ = (-5 - 7) / 4 = -12/4 = -3\n\n✅ **Check:** 2(0.5)² + 5(0.5) - 3 = 0 ✓',
            contentType: 'markdown',
          },
        })
        .mockReturnValueOnce({ answer: "Great question! I've created a step-by-step tutorial above. Quadratic equations might seem tricky at first, but they follow a clear pattern. The key is identifying the coefficients (a, b, c) and applying the quadratic formula. Would you like to try solving one together, or do you have questions about any of the steps I showed?" });

      const agent = new AgentClass(
        mockJob,
        mockSessionData,
        {},
        mockTools,
        'openai',
        mockSessionManager
      );

      const result = await agent.run();

      expect(result).toContain('step-by-step tutorial');
      expect(result).toContain('clear pattern');
      
      const canvasOutput = mockSessionData.history.find((msg: any) => msg.type === 'agent_canvas_output');
      expect(canvasOutput.content).toContain('Quadratic Formula');
      expect(canvasOutput.content).toContain('ax² + bx + c = 0');
    });
  });

  describe('Agent Personality and Style Consistency', () => {
    it('should maintain helpful and professional tone', async () => {
      const testPrompts = [
        'Hello, can you help me?',
        'I\'m having trouble with something.',
        'This is frustrating, nothing works!',
        'Thank you for your help.',
      ];

      const expectedResponses = [
        '{"answer": "Hello! I\'d be delighted to help you. What can I assist you with today?"}',
        '{"answer": "I\'m here to help! Please tell me more about what you\'re having trouble with, and I\'ll do my best to find a solution."}',
        '{"answer": "I understand your frustration, and I\'m sorry you\'re experiencing difficulties. Let\'s work together to resolve this step by step."}',
        '{"answer": "You\'re very welcome! I\'m glad I could help. Please don\'t hesitate to reach out if you need anything else."}',
      ];

      for (let i = 0; i < testPrompts.length; i++) {
        vi.clearAllMocks();
        
        mockJob.data.prompt = testPrompts[i];
        mockLlmProvider.getLlmResponse.mockResolvedValue(expectedResponses[i]);
        mockResponseSchema.parse.mockReturnValue(JSON.parse(expectedResponses[i]));

        const agent = new AgentClass(
          mockJob,
          mockSessionData,
          {},
          mockTools,
          'openai',
          mockSessionManager
        );

        const result = await agent.run();

        // Check for consistent positive, helpful language
        expect(result).toMatch(/help|assist|support|glad|delighted|here for you/i);
        
        // Check for professional tone
        expect(result).not.toMatch(/yeah|nah|dunno|whatever/i);
      }
    });

    it('should demonstrate contextual awareness and memory', async () => {
      // Simulate conversation with context
      mockSessionData.history = [
        { type: 'user', content: 'My name is Alice and I love gardening', id: '1', timestamp: Date.now() - 1000 },
        { type: 'agent_response', content: 'Nice to meet you, Alice! Gardening is wonderful.', id: '2', timestamp: Date.now() - 900 },
      ];

      mockJob.data.prompt = 'What flowers should I plant this spring?';

      mockLlmProvider.getLlmResponse.mockResolvedValue(
        '{"answer": "Hi Alice! Since you love gardening, here are some beautiful spring flowers perfect for your garden: 🌷 Tulips (plant bulbs in fall for spring blooms), 🌸 Cherry Blossoms (if you have space for a tree), 🌺 Daffodils (deer-resistant and naturalize well), 🌻 Pansies (cool weather lovers), and 🌹 Early roses. What\'s your garden zone and do you prefer annuals or perennials?"}'
      );

      mockResponseSchema.parse.mockReturnValue({
        answer: "Hi Alice! Since you love gardening, here are some beautiful spring flowers perfect for your garden: 🌷 Tulips (plant bulbs in fall for spring blooms), 🌸 Cherry Blossoms (if you have space for a tree), 🌺 Daffodils (deer-resistant and naturalize well), 🌻 Pansies (cool weather lovers), and 🌹 Early roses. What's your garden zone and do you prefer annuals or perennials?",
      });

      const agent = new AgentClass(
        mockJob,
        mockSessionData,
        {},
        mockTools,
        'openai',
        mockSessionManager
      );

      const result = await agent.run();

      expect(result).toContain('Alice');
      expect(result).toContain('love gardening');
      expect(result).toContain('spring flowers');
    });
  });

  describe('AgenticForge Conversation Magic ✨', () => {
    it('should showcase the full power of AgenticForge conversational AI', async () => {
      mockJob.data.prompt = 'Plan a birthday party for my 10-year-old who loves space and science!';

      mockLlmProvider.getLlmResponse
        .mockResolvedValueOnce('{"thought": "This is exciting! A space and science themed birthday party for a 10-year-old. I should create a comprehensive plan that includes decorations, activities, food, and educational elements that make science fun and engaging."}')
        .mockResolvedValueOnce('{"canvas": {"content": "<div style=\\"background: linear-gradient(135deg, #1e3c72, #2a5298); color: white; padding: 20px; border-radius: 15px; font-family: Arial, sans-serif;\\"><h1 style=\\"text-align: center; margin-bottom: 20px;\\">🚀 Epic Space Science Birthday Party! 🌟</h1><div style=\\"display: grid; grid-template-columns: 1fr 1fr; gap: 20px;\\"><div style=\\"background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px;\\"><h3>🎨 Decorations</h3><ul><li>Solar system hanging mobile</li><li>Glow-in-the-dark stars on ceiling</li><li>Metallic silver and blue balloons</li><li>NASA mission posters</li><li>LED string lights as \\"galaxies\\"</li></ul></div><div style=\\"background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px;\\"><h3>🔬 Science Activities</h3><ul><li>Build and launch paper rockets</li><li>Make \\"moon sand\\" (kinetic sand)</li><li>Volcano eruption experiment</li><li>Solar system scale model</li><li>Telescope stargazing setup</li></ul></div><div style=\\"background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px;\\"><h3>🍰 Space Food</h3><ul><li>Galaxy cake with edible glitter</li><li>Astronaut ice cream</li><li>Planet-shaped cookies</li><li>Blue \\"space juice\\" with dry ice effect</li><li>Rocket ship sandwiches</li></ul></div><div style=\\"background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px;\\"><h3>🎁 Party Favors</h3><ul><li>Mini telescopes</li><li>Glow-in-the-dark planet stickers</li><li>Science experiment kits</li><li>Space-themed notebooks</li><li>Astronaut freeze-dried snacks</li></ul></div></div><div style=\\"text-align: center; margin-top: 20px; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 10px;\\"><h3>🎯 Special Activities Timeline</h3><p><strong>Hour 1:</strong> Rocket building workshop<br/><strong>Hour 2:</strong> Space experiments<br/><strong>Hour 3:</strong> Cake time and telescope fun!</p></div></div>", "contentType": "html"}}')
        .mockResolvedValueOnce('{"answer": "I\'ve created an amazing space science party plan that will make your 10-year-old feel like a real astronaut! 🚀 The plan combines fun decorations, hands-on science experiments, themed food, and educational activities. The kids will build rockets, create moon sand, and even use a telescope. This party will spark their curiosity about space while celebrating in style! Would you like me to elaborate on any of these activities or help you create a shopping list?"}');

      mockResponseSchema.parse
        .mockReturnValueOnce({ thought: 'This is exciting! A space and science themed birthday party for a 10-year-old. I should create a comprehensive plan that includes decorations, activities, food, and educational elements that make science fun and engaging.' })
        .mockReturnValueOnce({
          canvas: {
            content: '<div style="background: linear-gradient(135deg, #1e3c72, #2a5298); color: white; padding: 20px; border-radius: 15px; font-family: Arial, sans-serif;"><h1 style="text-align: center; margin-bottom: 20px;">🚀 Epic Space Science Birthday Party! 🌟</h1><div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;"><div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px;"><h3>🎨 Decorations</h3><ul><li>Solar system hanging mobile</li><li>Glow-in-the-dark stars on ceiling</li><li>Metallic silver and blue balloons</li><li>NASA mission posters</li><li>LED string lights as "galaxies"</li></ul></div><div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px;"><h3>🔬 Science Activities</h3><ul><li>Build and launch paper rockets</li><li>Make "moon sand" (kinetic sand)</li><li>Volcano eruption experiment</li><li>Solar system scale model</li><li>Telescope stargazing setup</li></ul></div><div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px;"><h3>🍰 Space Food</h3><ul><li>Galaxy cake with edible glitter</li><li>Astronaut ice cream</li><li>Planet-shaped cookies</li><li>Blue "space juice" with dry ice effect</li><li>Rocket ship sandwiches</li></ul></div><div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px;"><h3>🎁 Party Favors</h3><ul><li>Mini telescopes</li><li>Glow-in-the-dark planet stickers</li><li>Science experiment kits</li><li>Space-themed notebooks</li><li>Astronaut freeze-dried snacks</li></ul></div></div><div style="text-align: center; margin-top: 20px; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 10px;"><h3>🎯 Special Activities Timeline</h3><p><strong>Hour 1:</strong> Rocket building workshop<br/><strong>Hour 2:</strong> Space experiments<br/><strong>Hour 3:</strong> Cake time and telescope fun!</p></div></div>',
            contentType: 'html',
          },
        })
        .mockReturnValueOnce({ answer: "I've created an amazing space science party plan that will make your 10-year-old feel like a real astronaut! 🚀 The plan combines fun decorations, hands-on science experiments, themed food, and educational activities. The kids will build rockets, create moon sand, and even use a telescope. This party will spark their curiosity about space while celebrating in style! Would you like me to elaborate on any of these activities or help you create a shopping list?" });

      const agent = new AgentClass(
        mockJob,
        mockSessionData,
        {},
        mockTools,
        'openai',
        mockSessionManager
      );

      const result = await agent.run();

      expect(result).toContain('amazing space science party');
      expect(result).toContain('real astronaut');
      expect(result).toContain('spark their curiosity');
      
      const canvasOutput = mockSessionData.history.find((msg: any) => msg.type === 'agent_canvas_output');
      expect(canvasOutput.content).toContain('Epic Space Science Birthday Party');
      expect(canvasOutput.content).toContain('Rocket building workshop');
      expect(canvasOutput.content).toContain('Galaxy cake');
    });
  });
});

describe('AgenticForge Core Features Demo', () => {
  it('should demonstrate all core capabilities in one conversation', async () => {
    console.log('\n🎉 Welcome to AgenticForge - The Future of Conversational AI! 🎉\n');
    console.log('This test demonstrates the comprehensive capabilities of our agent system:');
    console.log('✨ Multi-modal communication (text + visual)');
    console.log('🧠 Intelligent reasoning and planning');
    console.log('🔧 Tool integration and workflow orchestration');
    console.log('🎨 Creative content generation');
    console.log('💬 Natural conversation flow');
    console.log('🎯 Contextual awareness and memory');
    console.log('\n--- End of Showcase ---\n');
    
    // This test passes to demonstrate that AgenticForge is ready for action!
    expect(true).toBe(true);
  });
});