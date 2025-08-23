# Agent/MCP Naming Design Document

## 1. Overview

This document outlines the design for maintaining "Agent" and "AgentMCP" naming conventions in the AgenticForge codebase, particularly in the frontend and other easily identifiable locations. The goal is to preserve the existing naming that aligns well with the project's architecture and Model Context Protocol (MCP) foundation.

## 2. Current State Analysis

Based on codebase analysis:

- The term "AgentMCP" is not explicitly used in the codebase
- The system uses "Agent" terminology throughout the frontend components
- MCP (Model Context Protocol) is referenced in documentation and some constants
- Agent-related components exist in the UI package with names like AgentMessage, AgentResponseBubble, etc.

## 3. Naming Strategy

### 3.1 Frontend Component Naming

The existing naming strategy using "Agent" is appropriate and should be maintained. The term "Agent" accurately reflects the autonomous nature of the system and aligns with the MCP protocol.

Components to keep as-is:
- AgentMessage
- AgentResponseBubble
- AgentThoughtBubble
- AgentVisualizer
- AgentOutputCanvas

### 3.2 Constants and Configuration Keys

Existing session storage keys and configuration references are appropriate and should be maintained:
- SESSION_KEYS.AUTH_DEBUGGER_STATE
- SESSION_KEYS.CLIENT_INFORMATION
- SESSION_KEYS.TOKENS

### 3.3 UI Text and Translations

UI text and translations appropriately use "Agent" terminology:
- "Agent"
- "Agent Avatar"
- "Agent content will appear here"

## 4. Implementation Plan

### 4.1 Component Naming Consistency
1. Ensure all agent-related components consistently use "Agent" naming
2. Verify MCP references are consistent throughout the codebase

### 4.2 Documentation Updates
1. Update documentation to clarify the use of "Agent" and "MCP" terminology
2. Ensure consistency in README files and comments

## 5. Impact Assessment

### 5.1 Files to be Reviewed
- UI Component files
- Constants files
- Documentation files

### 5.2 Dependencies
- All components using agent terminology should maintain consistency
- MCP references should be clear and consistent

## 6. Testing Strategy

### 6.1 Unit Tests
- Verify all existing component imports work correctly
- Ensure no broken references

### 6.2 Integration Tests
- Test UI rendering with existing component names
- Verify session storage works with existing keys

### 6.3 End-to-End Tests
- Verify agent messages display correctly
- Confirm agent thought processes are visible
- Ensure agent output canvas works as expected

## 7. Success Criteria

- All agent-related components maintain consistent naming
- No broken imports or references
- All tests pass
- UI displays correctly with existing naming
- Documentation is consistent