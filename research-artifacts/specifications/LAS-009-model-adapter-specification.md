# LAS-009 — Model Adapter Specification

**Document ID:** LAS-009  
**Title:** Model Adapter Protocol  
**Version:** 0.1  
**Status:** Draft  
**Layer:** Model Adapter (Layer 6)  
**Depends On:** LAS-008 (CEC Specification)  
**Used By:** LAS-010 (Runtime)

---

## 1. Purpose

This specification defines the **Model Adapter Protocol** — the layer that transforms a Compiled Execution Context (CEC) into a provider-specific execution package ready for consumption by a target LLM or agent framework.

The Model Adapter is the **only layer that changes when switching AI providers**. The Knowledge Graph, Compiler, and CEC remain completely unchanged. Only the adapter changes.

This is the core model-independence guarantee of Project Aether.

```
CEC (model-agnostic)
        │
        ▼
Model Adapter
  ├── OpenAI Adapter    → { system, developer, user, tools, response_format }
  ├── Anthropic Adapter → { system, messages, tools }
  ├── MCP Adapter       → { messages, resources, tool_calls }
  └── Agent Adapter     → { context, memory, goals, tools, execution_plan }
```

---

## 2. Adapter Input

Every adapter receives the same **AdapterInput** structure.

```typescript
interface AdapterInput {
  // Required
  cec: CompiledExecutionContext       // the compiled CEC (LAS-008)
  targetModel: ModelDescriptor        // what model is being targeted
  executionProfile: ExecutionProfile  // how the model should operate

  // Optional
  agentRole?: AgentRoleDescriptor     // for multi-agent scenarios
  toolRegistry?: ToolRegistry         // available tools
  runtimeConfig: RuntimeConfig        // execution preferences

  // Projection (multi-agent)
  projection?: CECProjection          // if this adapter is for one agent's slice
}
```

---

### 2.1 Model Descriptor

The ModelDescriptor is a **formal capability matrix** for each target model. It tells the adapter what the model can and cannot do.

```typescript
interface ModelDescriptor {
  id: ModelDescriptorId
  provider: ModelProvider
  modelId: string                     // e.g. "gpt-4o", "claude-opus-4-5", "gemini-2.0-flash"
  displayName: string

  capabilities: ModelCapabilities
  limits: ModelLimits
  formatPreferences: FormatPreferences
  specialization: ModelSpecialization
}

enum ModelProvider {
  OpenAI,
  Anthropic,
  Google,
  Meta,
  Mistral,
  Cohere,
  Local,             // local model (e.g. Ollama)
  AgentFramework     // LangChain, AutoGPT, CrewAI, etc.
}

interface ModelCapabilities {
  systemPrompt: boolean               // supports system-level instructions
  developerPrompt: boolean            // supports developer role (OpenAI-specific)
  functionCalling: boolean            // supports structured function/tool definitions
  jsonMode: boolean                   // can be constrained to JSON output
  xmlFormatting: boolean              // handles XML structure well (Anthropic)
  toolUse: boolean                    // can invoke tools during inference
  imageInput: boolean                 // accepts image inputs
  codeInterpreter: boolean            // has code execution capability
  largeContext: boolean               // supports >100k token context
  streaming: boolean                  // supports streaming output
  structuredOutput: boolean           // supports JSON schema-constrained output
  reasoning: boolean                  // has extended thinking/reasoning mode
  multiTurn: boolean                  // supports multi-turn conversation
}

interface ModelLimits {
  contextWindowTokens: int            // max input tokens
  maxOutputTokens: int                // max output tokens per request
  requestsPerMinute: int?
  tokensPerMinute: int?
}

interface FormatPreferences {
  preferredStructure: "XML" | "JSON" | "Markdown" | "PlainText"
  systemPromptStyle: "Instruction" | "Role" | "Context" | "Persona"
  listStyle: "Bulleted" | "Numbered" | "Structured"
  codeBlockStyle: "Fenced" | "Indented" | "Inline"
}
```

### 2.2 Built-in Model Descriptors

Project Aether ships with descriptor definitions for common models.

**OpenAI GPT-4o**
```json
{
  "provider": "OpenAI",
  "modelId": "gpt-4o",
  "capabilities": {
    "systemPrompt": true,
    "developerPrompt": true,
    "functionCalling": true,
    "jsonMode": true,
    "xmlFormatting": false,
    "toolUse": true,
    "imageInput": true,
    "largeContext": true,
    "streaming": true,
    "structuredOutput": true,
    "reasoning": false
  },
  "limits": { "contextWindowTokens": 128000, "maxOutputTokens": 16384 },
  "formatPreferences": {
    "preferredStructure": "JSON",
    "systemPromptStyle": "Instruction",
    "listStyle": "Numbered"
  }
}
```

**Anthropic Claude Sonnet**
```json
{
  "provider": "Anthropic",
  "modelId": "claude-sonnet-4-5",
  "capabilities": {
    "systemPrompt": true,
    "developerPrompt": false,
    "functionCalling": false,
    "jsonMode": false,
    "xmlFormatting": true,
    "toolUse": true,
    "imageInput": true,
    "largeContext": true,
    "streaming": true,
    "structuredOutput": false,
    "reasoning": true
  },
  "limits": { "contextWindowTokens": 200000, "maxOutputTokens": 8192 },
  "formatPreferences": {
    "preferredStructure": "XML",
    "systemPromptStyle": "Role",
    "listStyle": "Bulleted"
  }
}
```

**Google Gemini 2.0 Flash**
```json
{
  "provider": "Google",
  "modelId": "gemini-2.0-flash",
  "capabilities": {
    "systemPrompt": true,
    "functionCalling": true,
    "jsonMode": true,
    "toolUse": true,
    "imageInput": true,
    "largeContext": true,
    "streaming": true,
    "structuredOutput": true
  },
  "limits": { "contextWindowTokens": 1000000, "maxOutputTokens": 8192 },
  "formatPreferences": {
    "preferredStructure": "JSON",
    "systemPromptStyle": "Instruction"
  }
}
```

---

### 2.3 Execution Profiles

An Execution Profile defines **how** the model should operate — its cognitive mode for this mission.

```typescript
interface ExecutionProfile {
  id: ProfileId
  name: string
  description: string
  primaryObjective: string           // one-line description of what the model should do
  outputFormat: OutputFormat         // expected output format
  detailLevel: "Concise" | "Detailed" | "Comprehensive"
  reasoningMode: "Direct" | "ChainOfThought" | "Exploratory"
  creativity: "Deterministic" | "Low" | "Medium" | "High"
  constraints: ProfileConstraint[]
}
```

**Standard Execution Profiles:**

| Profile | Primary Objective | Detail Level | Creativity |
|---------|------------------|-------------|------------|
| `CodeGeneration` | Generate production-ready code following all constraints | Comprehensive | Deterministic |
| `ArchitectureReview` | Evaluate architectural decisions against knowledge rules | Detailed | Low |
| `TestGeneration` | Create complete test suites for provided code | Comprehensive | Deterministic |
| `Documentation` | Generate technical documentation | Detailed | Low |
| `Refactoring` | Improve code structure while preserving behavior | Detailed | Low |
| `SecurityAudit` | Identify security violations against policy nodes | Concise | Deterministic |

---

### 2.4 Agent Role Descriptor

For multi-agent execution, the adapter projects the CEC into a role-specific context.

```typescript
interface AgentRoleDescriptor {
  roleId: RoleId
  roleName: string                   // e.g. "BackendAgent"
  responsibilities: string[]
  knowledgeDomains: string[]         // scopes this agent operates in
  outputOwnership: string[]          // output artifacts this agent owns
  coordinationProtocol: CoordinationProtocol
}

interface CoordinationProtocol {
  inputFrom: RoleId[]               // agents whose output this agent receives
  outputTo: RoleId[]                // agents who receive this agent's output
  synchronizationPoints: string[]   // events that synchronize agents
}
```

---

### 2.5 Tool Registry

```typescript
interface ToolRegistry {
  tools: ToolDefinition[]
}

interface ToolDefinition {
  id: ToolId
  name: string
  description: string
  inputSchema: JSONSchema            // JSON Schema for tool parameters
  outputSchema: JSONSchema           // JSON Schema for tool output
  availability: "Always" | "OnRequest" | "Conditional"
  permission: "ReadOnly" | "ReadWrite" | "Admin"
  category: "FileSystem" | "Git" | "Database" | "API" | "IDE" | "Cloud" | "Search"
}
```

---

### 2.6 Runtime Configuration

```typescript
interface RuntimeConfig {
  language: string                   // e.g. "Java", "TypeScript", "Python"
  framework: string                  // e.g. "Spring Boot", "Next.js", "FastAPI"
  outputFormat: "SourceFiles" | "Markdown" | "JSON" | "Mixed"
  targetEnvironment: "Development" | "Production" | "Testing"
  verbosityLevel: "Minimal" | "Standard" | "Verbose"
  maxRetries: int                    // max retries on model error
  timeoutMs: int
}
```

---

## 3. Execution Envelope (Canonical Intermediate)

Before rendering to a model-specific format, the adapter produces an **Execution Envelope** — a model-agnostic intermediate representation.

The Execution Envelope is the canonical "compiled prompt structure" — it represents everything the model needs to know without binding it to any provider's message format.

```typescript
interface ExecutionEnvelope {
  id: EnvelopeId
  cecId: CECId                       // which CEC this was produced from
  
  // Mission context
  mission: EnvelopeMission
  
  // Semantic context (what the model needs to know)
  context: SemanticContext
  
  // What the model must enforce
  constraints: EnvelopeConstraintSet
  
  // What the model should produce
  expectedOutput: EnvelopeOutputSpec
  
  // Available tools
  availableTools: EnvelopeTool[]
  
  // Execution instructions
  executionInstructions: ExecutionInstruction[]
  
  // Metadata
  estimatedTokens: int
  envelopeVersion: SemVer
}

interface EnvelopeMission {
  title: string
  objective: string
  role: string?                      // agent role perspective
  executionProfile: string           // profile name
  additionalContext: string?         // runtime-provided context
}

interface SemanticContext {
  capabilities: CapabilityBlock[]
  patterns: PatternBlock[]
  rules: RuleBlock[]
  constraints: ConstraintBlock[]
  examples: ExampleBlock[]
  technologies: TechBlock[]
}

interface EnvelopeConstraintSet {
  mandatory: ConstraintStatement[]   // MUST follow
  recommended: ConstraintStatement[] // SHOULD follow
  forbidden: ConstraintStatement[]   // MUST NOT do
  qualityGates: QualityGateStatement[]
}

interface EnvelopeOutputSpec {
  artifacts: ArtifactExpectation[]
  format: OutputFormat
  structure: string?                 // structural template if applicable
}

interface ExecutionInstruction {
  order: int
  instruction: string
  applies_to: string[]
}
```

---

## 4. Adapter Interface

All concrete adapters implement the following abstract interface:

```typescript
interface ModelAdapter {
  readonly adapterId: string
  readonly supportedProviders: ModelProvider[]
  readonly adapterVersion: SemVer

  // Primary method: transform AdapterInput into provider-specific execution package
  adapt(input: AdapterInput): AdapterOutput

  // Validate the adapter input before adaptation
  validateInput(input: AdapterInput): ValidationResult

  // Estimate token count for this adaptation
  estimateTokens(envelope: ExecutionEnvelope, model: ModelDescriptor): TokenEstimate

  // Verify that the output is well-formed for the target model
  verifyOutput(output: AdapterOutput, model: ModelDescriptor): VerificationResult

  // Build execution envelope from CEC (model-agnostic step)
  buildEnvelope(cec: CompiledExecutionContext, profile: ExecutionProfile, role?: AgentRoleDescriptor): ExecutionEnvelope

  // Render envelope into model-specific format (model-specific step)
  renderEnvelope(envelope: ExecutionEnvelope, model: ModelDescriptor, config: RuntimeConfig): ProviderPayload
}

interface AdapterOutput {
  adapterId: string
  cecId: CECId
  modelId: string
  envelope: ExecutionEnvelope        // the canonical intermediate
  providerPayload: ProviderPayload   // the model-specific rendering
  tokenEstimate: TokenEstimate
  renderedAt: ISO8601
}
```

---

## 5. Concrete Adapter Specifications

### 5.1 OpenAI Adapter

**Supported providers:** `OpenAI`  
**Output format:** OpenAI Chat Completions API format

#### Output Schema

```typescript
interface OpenAIPayload extends ProviderPayload {
  model: string                      // e.g. "gpt-4o"
  messages: OpenAIMessage[]
  tools?: OpenAIToolDefinition[]
  tool_choice?: "auto" | "none" | "required" | { type: "function", function: { name: string } }
  response_format?: { type: "json_object" } | { type: "json_schema", json_schema: JSONSchema }
  temperature?: number
  max_tokens?: number
  stream?: boolean
}

interface OpenAIMessage {
  role: "system" | "developer" | "user" | "assistant" | "tool"
  content: string | ContentBlock[]
  name?: string
  tool_call_id?: string
}
```

#### Rendering Algorithm

```
ALGORITHM: OpenAIAdapter.renderEnvelope(envelope, model, config)

messages = []

// 1. System message: identity + mission context + execution profile
systemContent = render_system_block(envelope.mission, executionProfile)
messages.append({ role: "system", content: systemContent })

// 2. Developer message (if supported): knowledge context
IF model.capabilities.developerPrompt:
  devContent = render_knowledge_block(envelope.context, envelope.constraints)
  messages.append({ role: "developer", content: devContent })
ELSE:
  // Fold knowledge context into system message
  messages[0].content += "\n\n" + render_knowledge_block(envelope.context, envelope.constraints)

// 3. User message: the actual mission task
userContent = render_mission_task(envelope.mission, envelope.expectedOutput)
messages.append({ role: "user", content: userContent })

// 4. Tools (if available and model supports function calling)
tools = null
IF model.capabilities.functionCalling AND envelope.availableTools.length > 0:
  tools = envelope.availableTools.map(t => renderOpenAITool(t))

// 5. Response format
response_format = null
IF model.capabilities.structuredOutput AND config.outputFormat == "JSON":
  response_format = { type: "json_schema", json_schema: deriveSchemaFromOutputSpec(envelope.expectedOutput) }
ELSE IF model.capabilities.jsonMode:
  response_format = { type: "json_object" }

RETURN OpenAIPayload { model, messages, tools, response_format, temperature: profileTemperature(executionProfile) }
```

#### System Block Template

```
You are an expert software engineer executing the following mission.

## Mission
{mission.title}
{mission.objective}

## Your Role
{role.roleName if agent role, else "Principal Engineer"}

## Execution Profile
{executionProfile.primaryObjective}

## Instructions
{executionInstructions rendered as numbered list}
```

#### Knowledge Block Template (Developer/System)

```
## Engineering Context

### Capabilities Required
{capabilities rendered as structured list}

### Mandatory Constraints (MUST follow)
{mandatory constraints as enumerated rules}

### Recommended Patterns (SHOULD follow)
{patterns as structured descriptions}

### Forbidden Patterns (MUST NOT do)
{forbidden constraints}

### Technology Stack
{dependencies as name@version list}

### Quality Gates (success criteria)
{qualityGates as measurable criteria}
```

---

### 5.2 Anthropic Adapter

**Supported providers:** `Anthropic`  
**Output format:** Anthropic Messages API format

#### Output Schema

```typescript
interface AnthropicPayload extends ProviderPayload {
  model: string                      // e.g. "claude-sonnet-4-5"
  system: string | ContentBlock[]    // system instructions
  messages: AnthropicMessage[]
  tools?: AnthropicTool[]
  tool_choice?: AnthropicToolChoice
  max_tokens: number
  thinking?: { type: "enabled", budget_tokens: number }  // extended thinking
}

interface AnthropicMessage {
  role: "user" | "assistant"
  content: string | AnthropicContentBlock[]
}
```

#### Rendering Algorithm

```
ALGORITHM: AnthropicAdapter.renderEnvelope(envelope, model, config)

// 1. System block: Anthropic prefers all context in system
systemParts = []
systemParts.append(render_identity_and_mission(envelope.mission))
systemParts.append(render_xml_knowledge_block(envelope.context, envelope.constraints))
systemParts.append(render_output_instructions(envelope.expectedOutput))

system = systemParts.join("\n\n")

// 2. User message: clean task statement (context already in system)
userMessage = render_clean_task(envelope.mission, envelope.expectedOutput)

messages = [{ role: "user", content: userMessage }]

// 3. Tools
tools = null
IF model.capabilities.toolUse AND envelope.availableTools.length > 0:
  tools = envelope.availableTools.map(t => renderAnthropicTool(t))

// 4. Extended thinking (if reasoning profile)
thinking = null
IF executionProfile.reasoningMode == "ChainOfThought" AND model.capabilities.reasoning:
  thinking = { type: "enabled", budget_tokens: 10000 }

RETURN AnthropicPayload { model, system, messages, tools, max_tokens: model.limits.maxOutputTokens, thinking }
```

#### XML Knowledge Block Format (Anthropic-preferred)

```xml
<engineering_context>
  <capabilities>
    <capability name="Authentication" mandatory="true">
      <description>...</description>
      <rules>
        <rule priority="mandatory">MUST use JWT for token-based authentication</rule>
        <rule priority="mandatory">MUST apply rate limiting on auth endpoints</rule>
      </rules>
    </capability>
  </capabilities>

  <constraints>
    <constraint type="forbidden" impact="critical">
      MUST NOT place business logic in Controller layer
    </constraint>
    <constraint type="required" impact="critical">
      MUST use Repository Pattern for all data access
    </constraint>
  </constraints>

  <patterns>
    <pattern name="Repository Pattern" type="Design">
      <applicability>When: layer = DataAccess</applicability>
      <structure>Interface → Implementation → JPA Repository</structure>
    </pattern>
  </patterns>

  <technology_stack>
    <dependency name="spring-security" version="^6.2.0" required="true"/>
    <dependency name="jjwt" version="^0.11.5" required="true"/>
  </technology_stack>

  <quality_gates>
    <gate name="Test Coverage" threshold=">=80%" blocking="true"/>
    <gate name="No SQL in Controller" threshold="=0 occurrences" blocking="true"/>
  </quality_gates>
</engineering_context>
```

---

### 5.3 MCP Adapter

**Supported providers:** `AgentFramework` (MCP-compatible)  
**Output format:** Model Context Protocol (MCP) message format

MCP (Model Context Protocol) is a standardized protocol for tool-using agents. The MCP adapter renders the CEC as MCP resources and messages.

#### Output Schema

```typescript
interface MCPPayload extends ProviderPayload {
  protocol: "mcp"
  version: "2024-11-05"
  initialize: MCPInitialize
  resources: MCPResource[]
  tools: MCPTool[]
  messages: MCPMessage[]
}

interface MCPInitialize {
  capabilities: {
    resources: { read: boolean, list: boolean },
    tools: { call: boolean }
  }
}

interface MCPResource {
  uri: string                        // e.g. "aether://cec/constraints"
  name: string
  mimeType: string
  content: string
}

interface MCPMessage {
  role: "user" | "assistant"
  content: MCPContentBlock[]
}
```

#### Rendering Algorithm

```
ALGORITHM: MCPAdapter.renderEnvelope(envelope, model, config)

// 1. Register CEC sections as resources
resources = [
  MCPResource {
    uri: "aether://cec/mission",
    name: "Mission Context",
    mimeType: "application/json",
    content: JSON.stringify(envelope.mission)
  },
  MCPResource {
    uri: "aether://cec/constraints",
    name: "Engineering Constraints",
    mimeType: "application/json",
    content: JSON.stringify(envelope.constraints)
  },
  MCPResource {
    uri: "aether://cec/patterns",
    name: "Architecture Patterns",
    mimeType: "application/json",
    content: JSON.stringify(envelope.context.patterns)
  },
  MCPResource {
    uri: "aether://cec/quality-gates",
    name: "Quality Gates",
    mimeType: "application/json",
    content: JSON.stringify(envelope.constraints.qualityGates)
  }
]

// 2. Register tools
tools = envelope.availableTools.map(t => renderMCPTool(t))

// 3. Initial message: mission statement
messages = [MCPMessage {
  role: "user",
  content: [{ type: "text", text: render_mcp_task(envelope.mission, envelope.expectedOutput) }]
}]

RETURN MCPPayload { resources, tools, messages }
```

---

### 5.4 Agent Framework Adapter

**Supported providers:** LangChain, AutoGPT, CrewAI, custom agent frameworks  
**Output format:** Generic agent initialization context

#### Output Schema

```typescript
interface AgentFrameworkPayload extends ProviderPayload {
  agentContext: AgentContext
  memory: AgentMemory
  goals: AgentGoal[]
  tools: AgentTool[]
  executionPlan: AgentExecutionPlan
}

interface AgentContext {
  identity: string                   // who/what this agent is
  mission: string                    // what it's doing
  knowledgeBase: KnowledgeBlock[]    // compiled knowledge for this agent
  constraints: ConstraintBlock[]
}

interface AgentMemory {
  workingMemory: MemoryEntry[]       // immediate context
  episodicMemory: MemoryEntry[]?     // past interactions if available
  semanticMemory: KnowledgeBlock[]   // compiled knowledge (same as knowledgeBase)
}

interface AgentGoal {
  id: string
  description: string
  priority: int
  successCriteria: string[]
  subgoals: AgentGoal[]
}

interface AgentExecutionPlan {
  steps: ExecutionStep[]
  parallelizable: boolean
  maxDepth: int
  checkpointStrategy: "AfterEachStep" | "OnQualityGatePass" | "AtCompletion"
}
```

#### Rendering Algorithm

```
ALGORITHM: AgentFrameworkAdapter.renderEnvelope(envelope, model, config)

// 1. Build agent identity and context
agentContext = AgentContext {
  identity: render_agent_identity(agentRole, executionProfile),
  mission: envelope.mission.objective,
  knowledgeBase: envelope.context.toKnowledgeBlocks(),
  constraints: envelope.constraints.toConstraintBlocks()
}

// 2. Goals from expected outputs
goals = envelope.expectedOutput.artifacts.map((artifact, i) => AgentGoal {
  id: "goal:" + i,
  description: "Produce " + artifact.name + " (" + artifact.artifactType + ")",
  priority: artifact.required ? 1 : 2,
  successCriteria: artifact.validatedBy.map(qg => qg.threshold),
  subgoals: deriveSubgoals(artifact, envelope.context)
})

// 3. Execution plan from execution instructions
plan = AgentExecutionPlan {
  steps: envelope.executionInstructions.map(i => ExecutionStep { order: i.order, description: i.instruction }),
  parallelizable: false,
  maxDepth: 10,
  checkpointStrategy: "OnQualityGatePass"
}

RETURN AgentFrameworkPayload { agentContext, memory: buildMemory(agentContext), goals, tools, executionPlan: plan }
```

---

## 6. Token Budget Management

The adapter must ensure the rendered payload fits within the model's context window.

```typescript
class TokenBudgetManager {
  estimateTokens(envelope: ExecutionEnvelope, model: ModelDescriptor): TokenEstimate
  fitToWindow(envelope: ExecutionEnvelope, model: ModelDescriptor): ExecutionEnvelope

  private priorityTrim(envelope: ExecutionEnvelope, budget: int): ExecutionEnvelope {
    // Trim in this order (least important first):
    // 1. Examples (always last to include, first to trim)
    // 2. Informational rules
    // 3. Recommended constraints (keep mandatory)
    // 4. Pattern details (keep names/summary)
    // 5. Provenance metadata
    // NEVER trim: mandatory constraints, quality gates, mission, expected outputs
  }
}

interface TokenEstimate {
  system: int
  context: int
  task: int
  tools: int
  total: int
  withinWindow: boolean
  utilizationPercent: float
}
```

---

## 7. Adapter Output Verification

Before dispatch, the adapter verifies its own output:

```typescript
class AdapterOutputVerifier {
  verify(output: AdapterOutput, model: ModelDescriptor): VerificationResult

  // Check: all mandatory constraints appear in rendered payload
  private checkConstraintPresence(output, cec): boolean

  // Check: mission objective appears in user/task message
  private checkMissionPresence(output): boolean

  // Check: payload is within token budget
  private checkTokenBudget(output, model): boolean

  // Check: tool definitions are valid for this model
  private checkToolCompatibility(output, model): boolean

  // Check: response_format is set when JSON output is expected
  private checkResponseFormat(output, model, config): boolean
}
```

---

## 8. Adapter Registry

A central registry manages all available adapters.

```typescript
class AdapterRegistry {
  private adapters: Map<string, ModelAdapter> = new Map()

  register(adapter: ModelAdapter): void
  
  resolve(model: ModelDescriptor): ModelAdapter {
    // Find best adapter for this model's provider
    adapter = this.adapters.get(model.provider)
    IF adapter == null:
      adapter = this.adapters.get("Generic")  // fallback generic adapter
    RETURN adapter
  }

  adapt(input: AdapterInput): AdapterOutput {
    adapter = this.resolve(input.targetModel)
    adapter.validateInput(input)
    envelope = adapter.buildEnvelope(input.cec, input.executionProfile, input.agentRole)
    payload = adapter.renderEnvelope(envelope, input.targetModel, input.runtimeConfig)
    adapter.verifyOutput({ envelope, payload }, input.targetModel)
    RETURN { adapterId: adapter.adapterId, cecId: input.cec.id, envelope, providerPayload: payload }
  }
}
```

---

## 9. Adapter Extension Points

New adapters can be implemented for future providers without changing any other component.

**Required steps to add a new adapter:**
1. Implement the `ModelAdapter` interface
2. Define the `ModelDescriptor` for the new provider
3. Register the adapter in `AdapterRegistry`
4. Implement `renderEnvelope()` for the new provider's API format
5. Implement `verifyOutput()` for the new provider's constraints

**The compiler, Knowledge Graph, CEC, and Runtime remain untouched.**

This is the architectural guarantee that ensures Project Aether's longevity as new AI models emerge.
