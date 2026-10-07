# Entity Relationship (ER) Diagram Syntax Reference

ER diagrams visualize relational database schemas, tables, fields, keys, and cardinality.

## 1. Declaration

Start with `erDiagram`:

```mermaid
erDiagram
    USERS ||--o{ ORDERS : places
    ORDERS ||--|{ ORDER_ITEMS : contains
    PRODUCTS ||--o{ ORDER_ITEMS : ordered_in
```

## 2. Cardinality Connectors

Cardinality specifies the quantity relationship between two entities:

| Syntax | Left Side | Right Side | Meaning |
|---|---|---|---|
| `\|o--o\|` | Zero or one | Zero or one | Optional one-to-one |
| `\|\|--\|\|` | Exactly one | Exactly one | Mandatory one-to-one |
| `\|o--o{` | Zero or one | Zero or more | Optional one-to-many |
| `\|\|--o{` | Exactly one | Zero or more | Mandatory one-to-many |
| `\|\|--\|{` | Exactly one | One or more | Mandatory one-to-at-least-one |
| `}o--o{` | Zero or more | Zero or more | Many-to-many |

Cardinality markers:
- `|o`: Zero or one
- `||`: Exactly one
- `}o`: Zero or more
- `}|`: One or more

## 3. Entity Attributes & Keys

Define table columns with data types, column names, key constraints, and comments:

```mermaid
erDiagram
    USER {
        uuid id PK "Primary key"
        string email UK "Unique email address"
        string password_hash
        datetime created_at
    }

    PROFILE {
        uuid id PK
        uuid user_id FK "References USER(id)"
        string full_name
        string avatar_url
    }

    USER ||--o| PROFILE : has
```

### Supported Keys
- `PK`: Primary Key
- `FK`: Foreign Key
- `UK`: Unique Key

## 4. Complex Relationships & Comments

```mermaid
erDiagram
    ORGANIZATION ||--|{ MEMBER : employs
    MEMBER }|--|| ROLE : assigned

    ORGANIZATION {
        bigint id PK
        string slug UK
        string name
        boolean is_active
    }

    MEMBER {
        bigint id PK
        bigint org_id FK
        bigint user_id FK
        bigint role_id FK
        timestamp joined_at
    }

    ROLE {
        bigint id PK
        string role_name "admin, editor, viewer"
    }
```

## 5. Rules & Gotchas for Static HTML / `htmlLabels: false`

- Keep entity names uppercase or PascalCase (`USER`, `OrderItem`) without spaces.
- Datatypes should be standard alphanumeric (`string`, `uuid`, `int`, `datetime`, `boolean`). Avoid spaces in datatypes (use `varchar_255` instead of `varchar(255)`).
- Relationship labels (e.g. `: places`) should not contain punctuation or spaces unless enclosed in quotes.
- Wrap attribute comments in double quotes: `uuid id PK "Primary key"`.
