```mermaid
erDiagram
    USER_ACCOUNT ||--o| TENANT : "linked to"
    APARTMENT ||--o{ TENANT : "occupies"
    TENANT ||--o{ PAYMENT : "makes"
    TENANT ||--o{ MONTHLY_BILL : "is issued"
    MONTHLY_RECORD ||--o{ MONTHLY_BILL : "contains"
    MONTHLY_RECORD ||--o{ PAYMENT : "tracks"
    MONTHLY_RECORD ||--o{ EXPENSE : "incurs"
    MAINTENANCE_FUND ||--o{ FUND_TRANSACTION : "logs"

    USER_ACCOUNT {
        string UserID PK
        string Email
        string Role "Admin | Tenant"
    }

    APARTMENT {
        string ApartmentID PK
        int FloorNumber
        string UnitNumber
    }

    TENANT {
        string TenantID PK
        string ApartmentID FK
        string Name
        string PhoneNumber
        float StandardMonthlyFee "Custom baseline fee per tenant"
    }

    MONTHLY_RECORD {
        string MonthID PK "e.g., 2023-10"
        int Year
        int Month
    }

    MONTHLY_BILL {
        string BillID PK
        string MonthID FK
        string TenantID FK
        float AmountDue "Pulled from StandardMonthlyFee"
        float AmountPaid "Sum of related payments"
        string Status "Green | Yellow | Red"
    }

    PAYMENT {
        string PaymentID PK
        string TenantID FK
        string MonthID FK "Used if purpose is Monthly Fee"
        float Amount
        date PaymentDate
        string Purpose "Monthly Fee | Maintenance Fund"
    }

    EXPENSE {
        string ExpenseID PK
        string MonthID FK
        string Type "Standard | Non-standard"
        string Description
        float Amount
        date ExpenseDate
    }

    MAINTENANCE_FUND {
        string FundID PK
        float CurrentBalance
        date LastUpdated
    }

    FUND_TRANSACTION {
        string TransactionID PK
        string FundID FK
        string PaymentID FK "Linked if tenant contribution"
        string Type "Contribution | Repair Expense"
        float Amount
        date TransactionDate
    }