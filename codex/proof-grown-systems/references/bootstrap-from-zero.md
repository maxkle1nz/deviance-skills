# Bootstrap From Zero

Use this when the user wants to recreate the method from nothing: a fresh repo, a new product idea, a research project, or a prototype that needs to become a proof-grown system.

## Zero-to-One Sequence

1. **Name the north star**
   - Write one sentence for the durable target.
   - Separate universal structure from domain-specific customization.

2. **Choose the first proof**
   - Pick a proof small enough to finish in one loop.
   - Prefer a real runtime path over a large design document.
   - Example shape: "Given one SSOT, generate one build, run it, and save proof."

3. **Create the first SSOT**
   - Include project metadata.
   - Include the minimum domain blocks needed for the proof.
   - Include runtime expectations and output locations when useful.
   - Keep optional future ambitions out of the first SSOT unless they affect validation.

4. **Create the validator**
   - Reject missing required fields.
   - Reject unknown contract kinds.
   - Reject references to non-existent entities, fields, modules, operations, adapters, or files.
   - Emit structured JSON when possible.

5. **Create the builder**
   - Generate or implement the smallest useful output from the SSOT.
   - Keep generated artifacts deterministic.
   - Preserve compatibility for inputs that do not use the new feature.

6. **Create runtime proof**
   - Run the generated or implemented output.
   - Save proof that the new path executed.
   - Include enough fields for another agent to inspect without reading chat history.

7. **Close the checkpoint**
   - Only after proof exists, update docs, changelog, status, or checkpoint files.
   - Record capability unlocked, limits, proof artifacts, and next structural step.

8. **Repeat through a new boundary**
   - Add new capability through a contract surface: profile, operation, adapter, module, bundle, tool, or proof gate.
   - Avoid hardcoding custom behavior into the trunk.

## Minimal Contract Skeleton

Use this shape as a starting point, then adapt to repo conventions:

```json
{
  "project": {
    "name": "example-system",
    "version": "0.1.0",
    "description": "Smallest provable build"
  },
  "capabilities": [],
  "domain": {},
  "runtime": {},
  "proof": {
    "expected_markers": []
  }
}
```

## First Checkpoint Acceptance

A first checkpoint is real when:

- a contract exists;
- a validator rejects at least one invalid case;
- a build or implementation consumes the contract;
- a runtime or structural proof artifact exists;
- the public claim matches the proof exactly.

If any item is missing, call it a draft, prototype, or partial proof.
