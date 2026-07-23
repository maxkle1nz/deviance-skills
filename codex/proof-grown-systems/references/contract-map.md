# Contract Map

Use this when deciding what kind of structural boundary to add next.

## Universal Contract Types

### SSOT

The source of truth for product, domain, runtime, and proof intent. Use it when the system needs to generate or coordinate multiple surfaces from one declaration.

### Validator

The gate that prevents invalid truth from entering the builder. Every new SSOT block or manifest field should eventually have validation.

### Profile

The contract for a category of software or runtime path. Use profiles to represent "what kind of thing can be built" without changing central code for every domain.

### Runtime Bundle

The contract for execution dependencies and runtime capabilities. Use bundles to avoid hidden dependency assumptions.

### Design Pack

The contract for deterministic UI modules, visual systems, and interaction recipes. Use design packs to transform taste into reusable build structure.

### Operation

The contract for actions. Use operations when a user, agent, UI, CLI, or MCP tool should do something through a shared action grammar.

### Adapter

The boundary for external or side-effectful behavior. Use adapters for providers, commands, APIs, jobs, payments, email, LLM calls, webhooks, file processing, or any effect that should not live in the trunk.

### Proof Artifact

The structured evidence that a claim is true. Use proof artifacts to make future agents independent from chat memory.

### Checkpoint

The historical record of what changed, what was proven, what remains limited, and what the next structural move should be.

## Growth Ladder

1. **Prototype** - One useful path exists, but proof may be manual.
2. **Proof** - The path has repeatable evidence.
3. **Contract** - The path is driven by structured input.
4. **Generator** - The contract produces build artifacts.
5. **Runtime** - The generated output runs in a realistic local environment.
6. **Agent Surface** - CLI, tool, MCP, or protocol access exists.
7. **Modularity** - Profiles, bundles, modules, operations, or adapters can be added without trunk surgery.
8. **Governance** - Scorecards, checkpoints, release/preflight gates, and artifact checks keep claims honest.
9. **SDK** - New branches can be scaffolded from contracts.
10. **Ecosystem** - External contributors can add branches while the trunk remains stable.

## Choosing the Next Boundary

Pick the boundary that removes the most repeated manual work:

- Repeated domains: improve SSOT schema and validation.
- Repeated build categories: add profile packs.
- Repeated dependencies: add runtime bundles.
- Repeated UI shapes: add design packs or modules.
- Repeated actions: add operation contracts.
- Repeated side effects: add adapters.
- Repeated acceptance debates: add proof and checkpoint gates.

Do not add a boundary only because it sounds elegant. Add it when it prevents drift, unlocks reuse, or makes proof stronger.
