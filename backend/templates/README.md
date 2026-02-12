# backend/templates/

This directory contains the **Jinja2 templates** used by Mission Control to provision and sync **OpenClaw agent workspaces** onto a Gateway (generating the agent’s `*.md` files like `TOOLS.md`, `HEARTBEAT.md`, etc.).

At runtime (in the backend container), these templates are copied to `/app/templates`.

## What these templates are for

Mission Control renders these templates to produce the files that an agent will read inside its provisioned workspace. In other words:

- You edit templates in `backend/templates/`.
- The backend renders them with per-agent/per-gateway context.
- The rendered markdown becomes the actual workspace files (e.g. `HEARTBEAT.md`) that govern agent behavior.

These templates are **not** email templates and **not** frontend UI templates.

## How templates are rendered

Rendering happens in the backend provisioning code:

- Code path: `backend/app/services/openclaw/provisioning.py` → `_render_agent_files()`
- Engine: **Jinja2**

### Special case: `HEARTBEAT.md`

`HEARTBEAT.md` is not rendered directly from a same-named template. Instead it is rendered from one of:

- `HEARTBEAT_LEAD.md` (for the board lead agent)
- `HEARTBEAT_AGENT.md` (for normal board agents)

The selection is done in `_heartbeat_template_name(agent)` and applied by `_render_agent_files()`.

### Overrides

Provisioning supports a few override mechanisms:

- `agent.identity_template` → overrides `IDENTITY.md` content (rendered from string)
- `agent.soul_template` → overrides `SOUL.md` content (rendered from string)
- `template_overrides` map → can point a target file name at an alternate template file (notably used for `HEARTBEAT.md`)

## Available templates

Common workspace files:

- `AGENTS.md` — agent collaboration/board operating rules
- `AUTONOMY.md` — how the agent decides when to act vs ask
- `IDENTITY.md` — role/persona for the agent (can be overridden per agent)
- `SOUL.md` — general behavior guidelines (can be overridden per agent)
- `TASK_SOUL.md` — per-task lens (usually edited by the agent while working)
- `TOOLS.md` — connection details for Mission Control API, workspace paths, etc.
- `USER.md` — human/user profile fields the agent may need
- `SELF.md` — evolving agent preferences
- `MEMORY.md` — long-term curated memory

Boot/bootstrapping:

- `BOOT.md`, `BOOTSTRAP.md`

Heartbeat templates:

- `HEARTBEAT_AGENT.md`
- `HEARTBEAT_LEAD.md`

“Main session” variants (used for Gateway main session provisioning):

- `MAIN_AGENTS.md`, `MAIN_BOOT.md`, `MAIN_HEARTBEAT.md`, `MAIN_TOOLS.md`, `MAIN_USER.md`

## Template context (variables)

The backend assembles a context dict used to render templates. Key variables include:

- `agent_name`
- `agent_id`
- `session_key`
- `base_url`
- `auth_token`
- `main_session_key`
- `workspace_root`

Plus additional identity/user context fields (see `provisioning.py` for the authoritative list).

## Safe editing guidelines

These templates directly influence agent behavior and connectivity, so:

- Avoid removing or renaming required fields without a corresponding backend change.
- Treat `auth_token` and any secrets as sensitive: **do not log rendered files** or paste them into issues/PRs.
- Keep instructions deterministic and testable.
- Prefer additive changes; preserve backward compatibility.

## Local preview / testing

Recommended basic checks after editing templates:

1) Run backend type checks/tests as usual.
2) Exercise the “templates sync” endpoint (if available in your dev environment) to verify rendered files look correct for a sample agent.

Where to look:

- Backend container should have templates at `/app/templates`.
- Rendered agent workspace files appear under the configured gateway workspace root.
