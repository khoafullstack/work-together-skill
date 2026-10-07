# Class Diagram Syntax Reference

Class diagrams model object-oriented software structures, classes, interfaces, attributes, methods, and relationships.

## 1. Declaration

Start with `classDiagram`:

```mermaid
classDiagram
    class BankAccount {
        +String accountNumber
        -Decimal balance
        +deposit(amount: Decimal) bool
        +withdraw(amount: Decimal) bool
    }
```

## 2. Members & Visibility

Prefix attribute and method names with visibility indicators:
- `+` Public
- `-` Private
- `#` Protected
- `~` Package / Internal
- Classifier suffixes:
  - `*` Abstract: `+render()* void`
  - `$` Static: `+createId()$ String`

## 3. Relationships

| Syntax | Relationship | Meaning |
|---|---|---|
| `<|--` | Inheritance / Generalization | `Animal <|-- Duck` |
| `<\|..` | Implementation / Realization | `ILogger <|.. ConsoleLogger` |
| `*--` | Composition (strong ownership) | `Order *-- OrderItem` |
| `o--` | Aggregation (weak ownership) | `Department o-- Employee` |
| `-->` | Association / Directed | `Controller --> Service` |
| `..>` | Dependency | `ReportService ..> PdfGenerator` |
| `--` | Link / Solid line | `User -- Profile` |
| `..` | Link / Dashed line | `NodeA .. NodeB` |

### Multiplicity & Labels
Add cardinality and labels:

```mermaid
classDiagram
    Customer "1" --> "*" Order : places
    Order "1" *-- "1..*" LineItem : contains
    Order --> "1" PaymentStatus : state
```

## 4. Interfaces, Annotations & Generics

```mermaid
classDiagram
    class IRepository~T~ {
        <<interface>>
        +findById(id: String) T
        +save(entity: T) void
    }

    class UserRepository {
        <<service>>
        -DbContext db
        +findById(id: String) User
        +save(entity: User) void
    }

    IRepository~User~ <|.. UserRepository
```

Common annotations: `<<interface>>`, `<<abstract>>`, `<<service>>`, `<<enumeration>>`.

### Enumerations
```mermaid
classDiagram
    class OrderStatus {
        <<enumeration>>
        PENDING
        PAID
        SHIPPED
        CANCELLED
    }
```

## 5. Rules & Gotchas for Static HTML / `htmlLabels: false`

- Generic types: Use `~T~` syntax (e.g., `List~String~`, `IRepository~User~`). Do not use raw angle brackets `<T>` directly on class names as they trigger XML/HTML parsing errors.
- Annotations: Always wrap in `<<` and `>>`, e.g., `<<interface>>`.
- Method signatures: Wrap complex types in quotes if they contain commas or brackets.
- Do not use HTML formatting tags.
