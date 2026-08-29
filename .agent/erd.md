erDiagram
    USER ||--o{ ORDER : places
    USER {
        string id PK
        string email
        string name
        string role
    }
    CATEGORY ||--o{ PRODUCT : contains
    CATEGORY {
        string id PK
        string name
        string slug
    }
    PRODUCT ||--o{ ORDER_ITEM : ordered_in
    PRODUCT {
        string id PK
        string name
        int price
        int stock
        string image_url
    }
    ORDER ||--|{ ORDER_ITEM : contains
    ORDER {
        string id PK
        string user_id FK
        int total_amount
        string status
        string payment_id
    }