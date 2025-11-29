import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { ConversationResponse, ConversationSession, ConversationContext } from '../../types/conversation';

/**
 * Working ConversationEngine - Uses Anthropic Claude
 *
 * Provides functional conversational interface with Claude AI
 * for superior reasoning and enterprise knowledge.
 */
export class ConversationEngine {
  private anthropic: Anthropic | null = null;
  private sessions: Map<string, ConversationSession> = new Map();

  constructor() {
    this.initializeAnthropic();
  }

  /**
   * Initialize Anthropic client
   */
  private initializeAnthropic(): void {
    try {
      const apiKey = process.env.ANTHROPIC_API_KEY;

      if (!apiKey) {
        logger.internal('info', 'Anthropic API key not found - conversation engine will use knowledge-based responses');
        return;
      }

      this.anthropic = new Anthropic({
        apiKey: apiKey,
        timeout: 30000, // 30 second timeout for conversations
        maxRetries: 2
      });

      logger.internal('info', 'Anthropic Claude initialized for conversational AI');

    } catch (error) {
      logger.internal('error', 'Failed to initialize Anthropic client', error);
      this.anthropic = null;
    }
  }

  /**
   * Start new conversation session
   */
  async startSession(
    sessionId: string,
    context?: Partial<any>
  ): Promise<ConversationResponse> {
    logger.info(`Starting conversation session: ${sessionId}`);

    const session: ConversationSession = {
      id: sessionId,
      messages: [],
      context: {
        industry: context?.industry || null,
        companySize: context?.companySize || 'unknown',
        technicalStack: context?.technicalStack || [],
        currentProject: context?.currentProject || null,
        urgency: context?.urgency || 'medium'
      },
      createdAt: new Date(),
      lastActivity: new Date()
    };

    this.sessions.set(sessionId, session);

    return {
      content: this.generateWelcomeMessage(context),
      intent: 'welcome',
      suggestions: this.generateInitialSuggestions(context),
      confidence: 1.0,
      requiresAction: false,
      sessionId: sessionId,
      context: session.context
    };
  }

  /**
   * Process user message
   */
  async processMessage(
    message: string,
    sessionId: string
  ): Promise<ConversationResponse> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      // Add user message to session
      session.messages.push(new HumanMessage(message));

      // Generate AI response
      const aiResponse = await this.generateAIResponse(message, session);

      // Add AI response to session
      session.messages.push(new AIMessage(aiResponse.content));

      session.lastActivity = new Date();

      return aiResponse;

    } catch (error) {
      logger.error('Error processing message:', error);
      return this.generateErrorResponse(error, sessionId);
    }
  }

  /**
   * Generate AI response (with fallback to mock)
   */
  private async generateAIResponse(
    message: string,
    session: ConversationSession
  ): Promise<ConversationResponse> {
    // If no Anthropic client, use mock response
    if (!this.anthropic) {
      return this.generateMockResponse(message, session);
    }

    try {
      const systemPrompt = this.buildSystemPrompt(session.context);
      const conversationHistory = session.messages.slice(-5); // Last 5 messages

      const completion = await this.anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        system: systemPrompt,
        messages: [
          ...conversationHistory.map(msg => ({
            role: msg._getType() === 'human' ? 'user' as const : 'assistant' as const,
            content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
          })),
          { role: 'user', content: message }
        ],
        max_tokens: 2048,
        temperature: 0.7
      });

      const aiContent = completion.content[0]?.type === 'text'
        ? completion.content[0].text
        : 'I apologize, but I couldn\'t generate a response.';

      return {
        content: aiContent,
        intent: this.analyzeIntent(message),
        suggestions: this.generateSuggestions(message, session.context),
        confidence: 0.8,
        requiresAction: this.shouldRequireAction(message),
        sessionId: session.id,
        context: session.context
      };

    } catch (error: any) {
      // Extract error information from Anthropic SDK error structure
      let errorMessage = 'Unknown error';
      let errorStatus: number | undefined;
      let errorDetails: string | undefined;

      // Anthropic SDK errors are TRIPLE nested: error.error.error.message
      if (error?.error?.error?.message) {
        errorMessage = error.error.error.message;
        errorDetails = error.error.error.type;
      }
      // Sometimes double nested: error.error.message
      else if (error?.error?.message) {
        errorMessage = error.error.message;
        errorDetails = error.error.type;
      }
      // Fallback to standard error.message
      else if (error?.message) {
        errorMessage = error.message;
      }
      // Last resort: convert error to string
      else if (error) {
        errorMessage = error.toString();
      }

      // Extract status code
      if (error?.status) {
        errorStatus = error.status;
      }

      // Log with full context
      logger.error(`Anthropic API error: ${errorMessage}${errorStatus ? ` (Status: ${errorStatus})` : ''}`, error);

      // Return mock response with error information embedded
      const mockResponse = this.generateMockResponse(message, session);
      mockResponse.error = {
        message: errorMessage,
        details: errorDetails,
        status: errorStatus
      };

      return mockResponse;
    }
  }

  /**
   * Generate mock response when Claude is not available
   */
  private generateMockResponse(
    message: string,
    session: ConversationSession
  ): ConversationResponse {
    const lowerMessage = message.toLowerCase();

    let mockContent = 'I understand you\'re interested in Hedera blockchain development. ';

    if (lowerMessage.includes('pharmaceutical') || lowerMessage.includes('fda')) {
      mockContent += 'For pharmaceutical applications, I recommend using HCS (Hedera Consensus Service) for FDA-compliant audit trails and HTS for drug serialization. This ensures full traceability and regulatory compliance.';
    } else if (lowerMessage.includes('financial') || lowerMessage.includes('payment')) {
      mockContent += 'For financial services, I suggest implementing HTS for tokenization and smart contracts for automated compliance. This provides SOX-compliant audit trails and secure transaction processing.';
    } else if (lowerMessage.includes('supply chain')) {
      mockContent += 'For supply chain tracking, I recommend combining HCS for immutable audit trails with HTS for asset tokenization. This creates end-to-end traceability with regulatory compliance.';
    } else {
      mockContent += 'I can help you build blockchain integrations on Hedera, Ethereum, Solana, or Base. What specific functionality do you need?';
    }

    return {
      content: mockContent,
      intent: this.analyzeIntent(message),
      suggestions: this.generateSuggestions(message, session.context),
      confidence: 0.7,
      requiresAction: this.shouldRequireAction(message),
      sessionId: session.id,
      context: session.context
    };
  }

  /**
   * Build system prompt for Claude
   */
  private buildSystemPrompt(context: any): string {
    return `You are APIX AI, a multi-chain blockchain development assistant.

You help developers choose the RIGHT blockchain for their specific use case. You are NEUTRAL and objective - you recommend based on the user's actual needs, not any preference.

SUPPORTED BLOCKCHAINS (treat all equally):
- Hedera: Enterprise-grade, lowest fees ($0.0001), native token service (HTS), governed by Google/IBM/Boeing
- Ethereum: Largest ecosystem, maximum decentralization, highest liquidity, most wallets
- Solana: Fastest (400ms finality, 3000 TPS), cheapest NFT minting, great for gaming/NFTs
- Base: Ethereum L2, Coinbase integration, low fees, easy fiat on-ramps

RECOMMENDATION GUIDELINES:
- NFTs/Gaming → Prefer Solana (fast, cheap minting) or Base (Coinbase wallet)
- Enterprise/Compliance → Prefer Hedera (governance, predictable fees)
- DeFi → Prefer Ethereum (liquidity) or Base (lower fees)
- Payments → Prefer Base (Coinbase) or Solana (speed)
- Tokens/Loyalty → Any chain works, recommend based on other factors

Current context:
- Selected chain: ${context.selectedChain || 'Not yet selected'}
- Use case: ${context.useCase || 'Not specified'}
- Project: ${context.currentProject || 'Not specified'}

IMPORTANT: If the user selected a chain, respect their choice and help them build on it.
Only suggest switching if they explicitly ask for recommendations or if there's a major issue.
Be specific, practical, and concise. Focus on helping them succeed with their chosen approach.`;
  }

  /**
   * Analyze user intent
   */
  private analyzeIntent(message: string): string {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('generate') || lowerMessage.includes('create') || lowerMessage.includes('build')) {
      return 'implementation-request';
    } else if (lowerMessage.includes('explain') || lowerMessage.includes('what') || lowerMessage.includes('how')) {
      return 'clarification-seeking';
    } else if (lowerMessage.includes('compare') || lowerMessage.includes('vs') || lowerMessage.includes('versus')) {
      return 'solution-exploration';
    } else if (lowerMessage.includes('compliance') || lowerMessage.includes('regulation')) {
      return 'requirement-gathering';
    } else {
      return 'general-inquiry';
    }
  }

  /**
   * Generate contextual suggestions
   */
  private generateSuggestions(message: string, context: any): string[] {
    const chain = context.selectedChain || 'blockchain';

    const baseSuggestions = [
      'Generate code for this requirement',
      'Explain the implementation approach',
      `Compare ${chain} with other options`,
      'Show best practices'
    ];

    if (context.industry === 'pharmaceutical') {
      return [
        'Generate FDA-compliant tracking system',
        'Implement supply chain tracking',
        'Create audit trail system',
        'Add regulatory reporting'
      ];
    } else if (context.industry === 'financial-services') {
      return [
        'Generate compliant payment system',
        'Implement tokenized assets',
        'Create audit trail compliance',
        'Add KYC/AML integration'
      ];
    }

    return baseSuggestions;
  }

  /**
   * Check if message requires action
   */
  private shouldRequireAction(message: string): boolean {
    const actionWords = ['generate', 'create', 'build', 'implement', 'deploy', 'setup'];
    return actionWords.some(word => message.toLowerCase().includes(word));
  }

  /**
   * Generate welcome message
   */
  private generateWelcomeMessage(context?: Partial<any>): string {
    const { logger, LogLevel } = require('../../utils/logger');
    const industryContext = context?.industry ? ` (${context.industry})` : '';

    // Minimal welcome message by default
    if (!logger.isLevelEnabled(LogLevel.VERBOSE)) {
      return `Hello! I'm APIX AI, your multi-chain blockchain assistant${industryContext}.\n\nI support Hedera, Ethereum, Solana, and Base. How can I help you today?`;
    }

    // Detailed welcome only in verbose mode
    return `Hello! I'm APIX AI, your multi-chain blockchain development assistant${industryContext}.

I can help you with:
• Chain Selection - Find the best blockchain for your use case (Hedera, Ethereum, Solana, Base)
• Code Generation - Create production-ready integrations with AI-powered customization
• Multi-Chain Support - Build on any supported blockchain with the same workflow
• Best Practices - Design scalable, secure blockchain solutions

What would you like to build today?`;
  }

  /**
   * Generate initial suggestions
   */
  private generateInitialSuggestions(context?: Partial<any>): string[] {
    const baseSuggestions = [
      'I need to create tokens for my business',
      'Help me build an NFT marketplace',
      'I want to integrate wallet functionality',
      'Which blockchain is best for my use case?'
    ];

    if (context?.industry === 'pharmaceutical') {
      return [
        'Implement FDA-compliant supply chain tracking',
        'Create drug serialization system',
        'Build clinical trial data integrity',
        ...baseSuggestions
      ];
    } else if (context?.industry === 'financial-services') {
      return [
        'Build regulatory-compliant payment system',
        'Implement KYC/AML verification',
        'Create cross-border payment solution',
        ...baseSuggestions
      ];
    }

    return baseSuggestions;
  }

  /**
   * Generate error response
   */
  private generateErrorResponse(error: any, sessionId: string): ConversationResponse {
    logger.error('Conversation error:', error);
    
    return {
      content: `I apologize, but I encountered an issue processing your request. This might be due to:

• Temporary connectivity issues with AI services
• Complex requirements that need more clarification
• Technical limitations in my current capabilities

Please try:
1. Rephrasing your question or breaking it into smaller parts
2. Providing more specific details about your requirements
3. Using the CLI commands directly if you have specific needs

I'm here to help once the issue is resolved!`,
      intent: 'error',
      suggestions: [
        'Try rephrasing your question',
        'Break down complex requirements',
        'Use specific CLI commands',
        'Check system status'
      ],
      confidence: 0.0,
      requiresAction: false,
      sessionId: sessionId,
      context: {
        industry: null,
        companySize: 'unknown',
        technicalStack: [],
        currentProject: null,
        urgency: 'medium'
      }
    };
  }

  /**
   * Save session to file
   */
  async saveSession(sessionId: string, filePath?: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const fs = await import('fs-extra');
    const sessionFile = filePath || `./apix-session-${sessionId}.json`;
    await fs.writeJSON(sessionFile, session, { spaces: 2 });
    
    logger.info(`Session saved to: ${sessionFile}`);
  }

  /**
   * Load session from file
   */
  async loadSession(filePath: string): Promise<string> {
    const fs = await import('fs-extra');
    const sessionData = await fs.readJSON(filePath);
    
    this.sessions.set(sessionData.id, sessionData);
    logger.info(`Session loaded from: ${filePath}`);
    
    return sessionData.id;
  }
}

// Supporting interfaces
interface SessionMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default ConversationEngine;