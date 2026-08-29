---
name: graphify
description: >-
  Builds, maintains, and queries a persistent architectural and codebase Knowledge Graph.
  Use this skill to map relationships between database schemas, API routes, frontend components,
  and state stores to ensure coherent multi-agent execution without context hallucinations.
---

# Graphify: Codebase & Architecture Knowledge Graph Skill

Graphify equips the AI agent team with an AST-level and architectural relational graph of the entire project.

## Core Directives

1. **Schema & Model Mapping**:
   - Always map Prisma / SQL schemas into graph nodes (`(Model) -[:RELATION]-> (RelatedModel)`).
   - Track foreign keys, cascading deletes, indexes, and field constraints.

2. **API Route to Controller to DB Graph**:
   - Route Node: `[Method] /api/v1/resource` ➔ Controller ➔ Service ➔ Database Query.
   - Map request validation schemas (Zod / TypeScript types) and response contracts.

3. **Frontend Component Dependency Graph**:
   - Track Page (Route) ➔ Container ➔ Presentational Component ➔ UI Primitives (21st.dev / Shadcn).
   - Track State Providers (Zustand Cart Store, Auth Context) ➔ Consuming Components.

## Graph Extraction & Verification Protocol

When creating or modifying features:
1. **Query Existing Graph**: Check existing models and contracts before writing new code.
2. **Atomic Updates**: When a schema or API changes, update all downstream nodes in the graph (DB ➔ API ➔ Types ➔ UI).
3. **No Orphan Nodes**: Ensure every new component or API endpoint is connected to a parent route or navigation item.
