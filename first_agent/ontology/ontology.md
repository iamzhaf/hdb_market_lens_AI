Expense
    │
    ├── belongs to Cost Center
    │   └── has a Profit Center
    ├── recorded in GL Account
    ├── funded by Fund Source
    └── occurs during Fiscal Month

Profit Center
    │
    └── represents an organizational entity that generates revenue
    │
    └── has one or more Cost Centers
    |
    └── Profit Centers are grouped into 3 councils: 
        1. SERC Council
        2. BMRC Council
        3. Corporate Agroup
        

Cost Center
    │
    └── represents an organizational entity that incurs expenses
    │
    └── has one or more Expenses
    │
    └── belongs to a Profit Center