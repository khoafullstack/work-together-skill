# State Diagram Syntax Reference

State diagrams model the finite state machines, entity lifecycles, and state transitions of a system.

## 1. Declaration

Always declare using `stateDiagram-v2` (version 2 provides enhanced layout and styling over legacy `stateDiagram`):

```mermaid
stateDiagram-v2
    [*] --> Draft
    Draft --> InReview: Submit
    InReview --> Approved: Accept
    InReview --> Draft: Request Changes
    Approved --> Published: Publish
    Published --> [*]
```

- `[*]` represents the initial state or terminal state.
- Transition syntax: `StateA --> StateB: Transition Event / Action`

## 2. Descriptions and Labels

Add descriptions to states using a colon `:`:

```mermaid
stateDiagram-v2
    state "Waiting For Payment" as WaitPay
    WaitPay: Customer must pay within 15 mins
    WaitPay: Send reminder at 10 mins

    [*] --> WaitPay
    WaitPay --> Paid: PaymentReceived
    WaitPay --> Cancelled: TimeoutExpired
    Paid --> [*]
    Cancelled --> [*]
```

## 3. Composite (Nested) States

Group nested states into parent states:

```mermaid
stateDiagram-v2
    [*] --> Active

    state Active {
        [*] --> Idle
        Idle --> Processing: New Job
        Processing --> Idle: Job Done
        Processing --> Error: Failure
        Error --> Idle: Retry / Reset
    }

    Active --> Terminated: Shutdown Signal
    Terminated --> [*]
```

## 4. Choice, Fork & Join

### Choice Pseudo-state (Decisions)
```mermaid
stateDiagram-v2
    state check_balance <<choice>>

    [*] --> Pending
    Pending --> check_balance: Process Payment
    check_balance --> Completed: if balance >= total
    check_balance --> Failed: if balance < total
```

### Fork & Join (Concurrency)
```mermaid
stateDiagram-v2
    state fork_state <<fork>>
    state join_state <<join>>

    [*] --> fork_state
    fork_state --> ValidateInventory
    fork_state --> AuthorizeCard

    ValidateInventory --> join_state
    AuthorizeCard --> join_state

    join_state --> OrderReady
    OrderReady --> [*]
```

## 5. Notes

- `note right of StateName: Note text`
- `note left of StateName: Note text`

```mermaid
stateDiagram-v2
    [*] --> Active
    note right of Active: Monitored by health check daemon
    Active --> [*]
```

## 6. Rules & Gotchas for Static HTML / `htmlLabels: false`

- Always use `stateDiagram-v2`.
- When state names have spaces, define an alias: `state "Long State Name" as StateAlias`.
- Do not use `<br>` in transition labels or descriptions. Use standard quoted newlines if multiline is required.
