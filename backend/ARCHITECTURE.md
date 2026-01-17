# BlockView Architecture

## Backend Architecture (January 2025)

### ❌ Python Backend REMOVED

The Python backend has been **completely removed**. All business logic now runs in TypeScript.

### ✅ TypeScript Backend is the ONLY Execution Layer

```
┌─────────────────────────────────────────────────────────────┐
│                     TypeScript Backend                       │
│                   (Fastify on port 8002)                    │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Resolver   │  │  Bootstrap  │  │   Indexers  │         │
│  │  (Universal)│  │   Worker    │  │  (ERC-20)   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Attribution │  │     ENS     │  │  WebSocket  │         │
│  │   Claims    │  │   Service   │  │   Gateway   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              Python Compatibility Layer                      │
│                (FastAPI on port 8001)                        │
│                                                              │
│  ⚠️  This is ONLY a proxy for supervisor compatibility      │
│  ⚠️  Contains ZERO business logic                           │
│  ⚠️  All requests are forwarded to TypeScript               │
└─────────────────────────────────────────────────────────────┘
```

### Why Python File Still Exists

The `server.py` file exists **only** because:
1. Supervisor expects `uvicorn server:app`
2. The supervisor config is read-only
3. We cannot change the startup command

**The Python file:**
- ❌ Does NOT contain any business logic
- ❌ Does NOT process data
- ❌ Does NOT access MongoDB directly
- ✅ Only proxies HTTP/WebSocket to TypeScript
- ✅ Only manages TypeScript process lifecycle

### Data Flow

```
Client Request
      │
      ▼
[Python Proxy :8001] ──proxy──► [TypeScript :8002] ──► [MongoDB]
      │                                │
      └────────WebSocket───────────────┘
```

### Key TypeScript Modules

| Module | Location | Purpose |
|--------|----------|---------|
| Resolver | `/src/core/resolver/` | Universal address/name resolution |
| Bootstrap | `/src/core/bootstrap/` | Indexing task queue & worker |
| Attribution | `/src/core/attribution/` | Address-to-entity claims |
| ENS | `/src/core/ens/` | ENS name resolution |
| WebSocket | `/src/core/websocket/` | Real-time event gateway |

### Environment Variables

All environment variables are passed from Python to TypeScript:
- `PORT` - TypeScript listens on 8002
- `MONGODB_URI` - Database connection
- `WS_ENABLED` - WebSocket feature flag
- `INDEXER_ENABLED` - Indexer feature flag
- `INFURA_RPC_URL` - Ethereum RPC endpoint

---

**Last Updated:** January 2025
**Python Removal Date:** January 17, 2025
