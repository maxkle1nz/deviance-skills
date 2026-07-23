# Proof And Checkpoint Gates

Use this before claiming success, publishing docs, committing a major checkpoint, or telling the user that a generated system works.

## Proof Types

### Structural Proof

Use for schemas, manifests, docs-only changes, refactors, and SDK scaffolds. Evidence can be a validator result, structural diff snapshot, generated manifest, or invalid fixture failure.

### Build Proof

Use for compiled or bundled systems. Evidence can be a successful compile, typecheck, format check, package build, or generated artifact inspection.

### Runtime Proof

Use for claims that the program works. Evidence can be an API smoke, browser smoke, process transcript, database result, CLI output, screenshot, or proof JSON.

### Agent-Surface Proof

Use for claims that agents can consume the system. Evidence can be structured CLI JSON, MCP transcript, tool-call result, protocol response, or schema-conformant request/response pair.

### Adapter Proof

Use for external or side-effectful boundaries. Evidence must show both success and at least one failure mode if the adapter boundary is important.

## Causal Proof Rules

The proof must show that the new path ran. Prefer explicit fields or markers:

- `source`
- `executed`
- `kind`
- `operation_id`
- `profile`
- `adapter`
- `module_count`
- `selectors`
- `artifact_path`
- `verification`
- `error_class`

If the old path could satisfy the same test, add a force flag, a new fixture, a distinct marker, or a negative test.

## Checkpoint Close Checklist

Before closing a checkpoint, confirm:

- the contract exists and is discoverable;
- validation covers happy path and meaningful invalid path;
- build or implementation consumes the contract;
- runtime or structural proof exists;
- proof artifacts were inspected, not merely generated;
- docs and changelog match the proof;
- limitations are explicit;
- next step is structural, not just more customization;
- no private paths, personal data, or repo-local skill instructions leaked into universal docs.

## Language For Honest Status

Use precise status words:

- **Draft**: designed but not implemented.
- **Implemented**: code exists but proof is missing.
- **Structurally proven**: validation or generated artifacts prove shape.
- **Runtime proven**: the generated or implemented program ran.
- **Agent proven**: a tool or protocol surface exercised the path.
- **Checkpoint closed**: proof, docs, and evidence align.

Avoid saying "done", "works", "universal", or "production-ready" unless the artifacts support that exact claim.
