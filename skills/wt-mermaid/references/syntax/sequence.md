# Sequence Diagram Syntax Reference

Sequence diagrams model sequential interactions, communications, and message exchanges over time.

## 1. Declaration & Participants

Start with `sequenceDiagram`:

```mermaid
sequenceDiagram
    autonumber
    actor User as Client User
    participant App as Frontend SPA
    participant API as API Server
    participant DB as Postgres DB

    User->>App: Click Checkout
    App->>API: POST /api/orders
    API->>DB: INSERT order
    DB-->>API: order_id = 42
    API-->>App: 201 Created
    App-->>User: Show Confirmation
```

- `actor` displays a human silhouette icon.
- `participant` displays a rectangular box.
- Aliasing: `participant <id> as <Display Name>`
- `autonumber`: automatically numbers each interaction step.

## 2. Message Arrows

| Arrow Syntax | Type / Meaning |
|---|---|
| `A->B: msg` | Solid line without arrow |
| `A->>B: msg` | Solid line with arrowhead (synchronous request) |
| `A-->B: msg` | Dotted line without arrow |
| `A-->>B: msg` | Dotted line with arrowhead (asynchronous reply / response) |
| `A-x B: msg` | Solid line with cross at end (lost / failed message) |
| `A--x B: msg` | Dotted line with cross at end |
| `A-) B: msg` | Solid line with open arrow (async fire-and-forget) |
| `A--) B: msg` | Dotted line with open arrow |

## 3. Activations (Lifelines)

Show when a participant is actively processing:
- Explicit: `activate API` and `deactivate API`
- Shortcut on messages: `User->>+API: Request` (activate) and `API-->>-User: Response` (deactivate)

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    C->>+S: Process Payment
    S->>S: Validate Token
    S-->>-C: Payment Approved
```

## 4. Control Structures & Blocks

### Alt / Else (Conditionals)
```mermaid
sequenceDiagram
    participant App
    participant Auth
    App->>Auth: Verify JWT
    alt Token is valid
        Auth-->>App: 200 OK (claims)
    else Token expired
        Auth-->>App: 401 Unauthorized
    end
```

### Opt (Optional)
```mermaid
sequenceDiagram
    participant User
    participant Cart
    User->>Cart: View Checkout
    opt Has Coupon Code
        User->>Cart: Apply Discount
    end
```

### Loop (Repetition)
```mermaid
sequenceDiagram
    participant Worker
    participant Queue
    loop Every 5 seconds
        Worker->>Queue: Poll next job
    end
```

### Par (Parallel flows)
```mermaid
sequenceDiagram
    participant Core
    participant Email
    participant Analytics
    par Send notification
        Core->>Email: Send Welcome Email
    and Track event
        Core->>Analytics: Log User Registered
    end
```

### Critical / Option
```mermaid
sequenceDiagram
    critical Acquire DB lock
        API->>DB: SELECT FOR UPDATE
    option Lock timeout
        API-->>Client: 503 Busy
    end
```

## 5. Notes & Annotations

- Over a single participant: `Note left of App: Cached response` or `Note right of DB: Write ahead log`
- Spanning multiple participants: `Note over App,API: HTTPS / TLS 1.3 encrypted`

## 6. Rules & Gotchas for Static HTML / `htmlLabels: false`

- Do not use HTML tags (`<br>`, `<b>`). For line breaks in message text or notes, use newline within quotes:
  ```mermaid
  sequenceDiagram
      Client->>Server: "POST /login
  Content-Type: application/json"
  ```
- Keep participant IDs identifier-friendly (`User`, `API_Gateway`, `AuthService`).
- Avoid colon `:` inside message text without wrapping in quotes.
