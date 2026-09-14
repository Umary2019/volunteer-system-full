# Volunteer Management System Diagrams

These diagrams describe the current application structure and workflows. They use Mermaid and can be rendered by GitHub, GitLab, Mermaid Live, or a VS Code Mermaid preview extension.

## Image Files

1. [Use Case Diagram](diagrams-images/diagram-1.jpg)
2. [System Architecture Diagram](diagrams-images/diagram-2.jpg)
3. [ER Diagram](diagrams-images/diagram-3.jpg)
4. [DFD Level 0](diagrams-images/diagram-4.jpg)
5. [DFD Level 1](diagrams-images/diagram-5.jpg)
6. [Activity Diagram](diagrams-images/diagram-6.jpg)
7. [Sequence Diagram](diagrams-images/diagram-7.jpg)
8. [Class Diagram](diagrams-images/diagram-8.jpg)
9. [Flowchart](diagrams-images/diagram-9.jpg)

## 1. Use Case Diagram

```mermaid
flowchart LR
    Volunteer[User / Volunteer]
    Organizer[Approved Organizer]
    Admin[Administrator]

    subgraph VMS[Volunteer Management System]
        UC1((Register and verify email))
        UC2((Log in))
        UC3((Manage volunteer profile))
        UC4((Browse programs))
        UC5((Apply or cancel application))
        UC6((View application status))
        UC7((Scan attendance QR))
        UC8((View notifications and history))
        UC9((Request organizer profile))
        UC10((Create and manage programs))
        UC11((Review and manage applicants))
        UC12((Start attendance session))
        UC13((Rate volunteer))
        UC14((Review organizer requests))
        UC15((Manage users and view system data))
    end

    Volunteer --> UC1
    Volunteer --> UC2
    Volunteer --> UC3
    Volunteer --> UC4
    Volunteer --> UC5
    Volunteer --> UC6
    Volunteer --> UC7
    Volunteer --> UC8
    Volunteer --> UC9

    Organizer --> UC2
    Organizer --> UC4
    Organizer --> UC10
    Organizer --> UC11
    Organizer --> UC12
    Organizer --> UC13
    Organizer --> UC8

    Admin --> UC2
    Admin --> UC14
    Admin --> UC15
```

## 2. System Architecture Diagram

```mermaid
flowchart TB
    Browser[Web Browser]
    Frontend[React Frontend\nVite SPA]
    API[Express REST API\n/api/*]
    Auth[JWT Authentication\nProtect and Admin Middleware]
    Controllers[Controllers\nAuth, Profiles, Programs, Applications\nAttendance, Ratings, Notifications, Admin]
    Mongo[(MongoDB)]
    SMTP[SMTP Email Service]

    Browser --> Frontend
    Frontend -->|HTTP JSON and JWT| API
    API --> Auth
    Auth --> Controllers
    Controllers --> Mongo
    Controllers -->|OTP and account messages| SMTP
    API -->|Health endpoint| Browser
```

## 3. ER Diagram

```mermaid
erDiagram
    USER ||--o| VOLUNTEER_PROFILE : has
    USER ||--o| ORGANIZER_PROFILE : has
    USER ||--o{ OTP : receives
    ORGANIZER_PROFILE ||--o{ PROGRAM : organizes
    VOLUNTEER_PROFILE ||--o{ APPLICATION : submits
    PROGRAM ||--o{ APPLICATION : receives
    PROGRAM ||--o{ ATTENDANCE : has_sessions
    APPLICATION ||--o{ ATTENDANCE_CHECKIN : records
    VOLUNTEER_PROFILE ||--o{ ATTENDANCE_CHECKIN : makes
    APPLICATION ||--o| RATING : earns
    VOLUNTEER_PROFILE ||--o{ RATING : receives
    PROGRAM ||--o{ RATING : gets
    USER ||--o{ RATING : writes
    USER ||--o{ NOTIFICATION : receives
    PROGRAM ||--o{ NOTIFICATION : relates_to
    APPLICATION ||--o{ NOTIFICATION : relates_to
    USER ||--o{ ORGANIZER_PROFILE : reviews

    USER {
        ObjectId _id PK
        string email UK
        string password
        boolean isEmailVerified
        string role
        ObjectId volunteerProfile FK
        ObjectId organizerProfile FK
        boolean isActive
    }
    VOLUNTEER_PROFILE {
        ObjectId _id PK
        ObjectId user FK,UK
        string fullName
        string matricNumber
        string department
        string faculty
        string level
        string phoneNumber
        string areasOfInterest
        number overallRating
        number attendanceRate
        number programsCompleted
    }
    ORGANIZER_PROFILE {
        ObjectId _id PK
        ObjectId user FK,UK
        string name
        string department
        string faculty
        string organization
        string position
        string status
        ObjectId reviewedBy FK
    }
    OTP {
        ObjectId _id PK
        string email
        string code
        string purpose
        date expiresAt
        boolean isUsed
    }
    PROGRAM {
        ObjectId _id PK
        ObjectId organizer FK
        string title
        string description
        string category
        date date
        string startTime
        string endTime
        string venue
        number maxVolunteerCapacity
        date registrationDeadline
        string volunteerRoles
        string status
        boolean applicationsOpen
    }
    APPLICATION {
        ObjectId _id PK
        ObjectId volunteer FK
        ObjectId program FK
        string status
        string assignedRole
        string rejectionReason
        string removedReason
        boolean isRemoved
    }
    ATTENDANCE {
        ObjectId _id PK
        ObjectId program FK
        string qrToken
        date qrExpiresAt
        boolean isActive
    }
    ATTENDANCE_CHECKIN {
        ObjectId application FK
        ObjectId volunteer FK
        date checkedInAt
    }
    RATING {
        ObjectId _id PK
        ObjectId application FK,UK
        ObjectId volunteer FK
        ObjectId program FK
        ObjectId ratedBy FK
        number punctuality
        number commitment
        number teamwork
        number communication
        number taskCompletion
        number overallRating
        string comments
    }
    NOTIFICATION {
        ObjectId _id PK
        ObjectId user FK
        string type
        string title
        string message
        boolean isRead
        ObjectId relatedProgram FK
        ObjectId relatedApplication FK
    }
```

## 4. DFD Level 0

```mermaid
flowchart LR
    Volunteer[Volunteer / User]
    Organizer[Organizer]
    Admin[Administrator]
    System((Volunteer Management System))
    Email[SMTP Email Service]

    Volunteer -->|Registration, profile, applications, scans| System
    System -->|Programs, statuses, notifications, history| Volunteer
    Organizer -->|Profile request, programs, applicant decisions, attendance, ratings| System
    System -->|Applicant data, program data, reports| Organizer
    Admin -->|Approvals, user controls, administration queries| System
    System -->|Requests, users, programs, applications, statistics| Admin
    System -->|OTP and notifications| Email
    Email -->|Delivery result| System
```

## 5. DFD Level 1

```mermaid
flowchart LR
    Volunteer[Volunteer]
    Organizer[Organizer]
    Admin[Administrator]
    Email[SMTP Service]

    P1((1.0 Authenticate Users))
    P2((2.0 Manage Profiles))
    P3((3.0 Manage Programs))
    P4((4.0 Process Applications))
    P5((5.0 Track Attendance))
    P6((6.0 Record Ratings))
    P7((7.0 Manage Notifications))
    P8((8.0 Administer System))

    D1[(Users and OTPs)]
    D2[(Volunteer and Organizer Profiles)]
    D3[(Programs)]
    D4[(Applications)]
    D5[(Attendance)]
    D6[(Ratings)]
    D7[(Notifications)]

    Volunteer -->|Register, verify, login| P1
    Organizer -->|Login| P1
    Admin -->|Login| P1
    P1 <--> D1
    P1 -->|OTP email| Email
    P1 -->|JWT session| Volunteer
    P1 -->|JWT session| Organizer
    P1 -->|JWT session| Admin

    Volunteer -->|Create and view volunteer profile| P2
    Organizer -->|Submit organizer profile| P2
    P2 <--> D2
    Admin -->|Approve or reject organizer| P8
    P8 <--> D2

    Volunteer -->|Browse programs| P3
    Organizer -->|Create, edit, open, cancel| P3
    P3 <--> D3

    Volunteer -->|Apply or cancel| P4
    Organizer -->|Rank, approve, reject, assign, remove| P4
    P4 <--> D4
    P4 -->|Status notification| P7
    P7 --> D7

    Organizer -->|Start QR session and view attendance| P5
    Volunteer -->|Scan QR token| P5
    P5 <--> D5
    P5 -->|Attendance information| P7

    Organizer -->|Submit volunteer rating| P6
    P6 <--> D6
    P6 -->|Update volunteer statistics| D2

    Volunteer -->|Read and mark notifications| P7
    Organizer -->|Read and mark notifications| P7
    P7 <--> D7

    Admin -->|View stats and manage users| P8
    P8 <--> D1
    P8 <--> D3
    P8 <--> D4
```

## 6. Activity Diagram

```mermaid
flowchart TD
    Start([Start]) --> Register[Register account]
    Register --> Verify{Email verified?}
    Verify -- No --> Resend[Resend OTP]
    Resend --> Verify
    Verify -- Yes --> Login[Log in]
    Login --> Role{Choose workflow}

    Role -- Volunteer --> VolunteerProfile{Volunteer profile exists?}
    VolunteerProfile -- No --> CreateVolunteer[Create volunteer profile]
    VolunteerProfile -- Yes --> Browse[Browse open programs]
    CreateVolunteer --> Browse
    Browse --> Apply[Submit application]
    Apply --> Decision{Application approved?}
    Decision -- No --> Status[View pending or rejected status]
    Status --> End([End])
    Decision -- Yes --> Attend[Scan active attendance QR]
    Attend --> Complete[Participation completed]
    Complete --> ViewHistory[View attendance and rating history]
    ViewHistory --> End

    Role -- Organizer --> OrganizerProfile{Organizer approved?}
    OrganizerProfile -- No --> Request[Submit organizer profile request]
    Request --> AdminReview[Admin reviews request]
    AdminReview --> Approved{Approved?}
    Approved -- No --> Rejected[View rejection reason]
    Rejected --> End
    Approved -- Yes --> CreateProgram[Create program]
    OrganizerProfile -- Yes --> CreateProgram
    CreateProgram --> Open[Open applications]
    Open --> Review[Review and rank applicants]
    Review --> Select[Approve, reject, and assign roles]
    Select --> StartAttendance[Start attendance QR session]
    StartAttendance --> Rate[Rate completed volunteers]
    Rate --> End

    Role -- Administrator --> AdminTasks[Review organizers, users, programs, applications]
    AdminTasks --> End
```

## 7. Sequence Diagram

```mermaid
sequenceDiagram
    actor Volunteer
    participant UI as React Frontend
    participant API as Express API
    participant Auth as Auth Middleware
    participant DB as MongoDB
    participant Email as SMTP Service
    actor Organizer

    Volunteer->>UI: Submit registration
    UI->>API: POST /api/auth/register
    API->>DB: Create User and OTP
    API->>Email: Send verification code
    Email-->>Volunteer: OTP email
    Volunteer->>UI: Enter OTP
    UI->>API: POST /api/auth/verify-otp
    API->>DB: Mark OTP used and verify user
    API-->>UI: Verification result

    Volunteer->>UI: Apply to program
    UI->>API: POST /api/applications/program/:id/apply
    API->>Auth: Validate JWT and user profile
    Auth-->>API: Authenticated user
    API->>DB: Check program and duplicate application
    API->>DB: Create Application
    API->>DB: Create organizer Notification
    API-->>UI: Application created

    Organizer->>UI: Approve application
    UI->>API: PATCH /api/applications/:id/approve
    API->>Auth: Validate JWT and organizer ownership
    Auth-->>API: Authorized organizer
    API->>DB: Update Application status
    API->>DB: Create volunteer Notification
    API-->>UI: Updated application

    Organizer->>UI: Start attendance
    UI->>API: POST /api/attendance/program/:id/start
    API->>DB: Create active QR session
    API-->>UI: QR token and expiry
    Volunteer->>UI: Scan QR token
    UI->>API: POST /api/attendance/scan
    API->>DB: Validate token and approved application
    API->>DB: Add check-in
    API-->>UI: Attendance recorded
```

## 8. Class Diagram

```mermaid
classDiagram
    class User {
        +ObjectId id
        +String email
        +String password
        +Boolean isEmailVerified
        +String role
        +Boolean isActive
        +register()
        +login()
    }
    class VolunteerProfile {
        +ObjectId id
        +String fullName
        +String matricNumber
        +String department
        +String faculty
        +String level
        +String[] areasOfInterest
        +Number overallRating
        +Number attendanceRate
        +Number programsCompleted
        +updateStats()
    }
    class OrganizerProfile {
        +ObjectId id
        +String name
        +String organization
        +String position
        +String status
        +submitRequest()
    }
    class Program {
        +ObjectId id
        +String title
        +String description
        +Date date
        +String status
        +Boolean applicationsOpen
        +isModifiable()
    }
    class Application {
        +ObjectId id
        +String status
        +String assignedRole
        +Boolean isRemoved
        +apply()
        +approve()
        +reject()
        +remove()
    }
    class Attendance {
        +ObjectId id
        +String qrToken
        +Date qrExpiresAt
        +Boolean isActive
        +startSession()
        +recordCheckIn()
    }
    class Rating {
        +ObjectId id
        +Number overallRating
        +Number punctuality
        +Number commitment
        +Number teamwork
        +Number communication
        +Number taskCompletion
        +rateVolunteer()
    }
    class Notification {
        +ObjectId id
        +String type
        +String title
        +String message
        +Boolean isRead
        +markRead()
    }
    class Otp {
        +String email
        +String code
        +String purpose
        +Date expiresAt
        +Boolean isUsed
        +verify()
    }

    User "1" o-- "0..1" VolunteerProfile : owns
    User "1" o-- "0..1" OrganizerProfile : owns
    User "1" --> "0..*" Otp : receives
    OrganizerProfile "1" --> "0..*" Program : creates
    VolunteerProfile "1" --> "0..*" Application : submits
    Program "1" --> "0..*" Application : contains
    Program "1" --> "0..*" Attendance : schedules
    Application "1" --> "0..1" Rating : receives
    VolunteerProfile "1" --> "0..*" Rating : earns
    User "1" --> "0..*" Rating : writes
    User "1" --> "0..*" Notification : receives
```

## 9. Flowchart

```mermaid
flowchart TD
    A([User opens application]) --> B{Has account?}
    B -- No --> C[Register]
    C --> D[Receive OTP email]
    D --> E[Verify email]
    E --> F{Verification successful?}
    F -- No --> G[Resend OTP]
    G --> E
    F -- Yes --> H[Log in]
    B -- Yes --> H
    H --> I{Authenticated?}
    I -- No --> H
    I -- Yes --> J{Available profile}

    J -- Volunteer --> K[Browse programs]
    K --> L{Applications open and capacity available?}
    L -- No --> K
    L -- Yes --> M[Submit application]
    M --> N{Organizer decision}
    N -- Pending --> O[Wait for notification]
    O --> N
    N -- Rejected --> K
    N -- Approved --> P[Attend program and scan QR]
    P --> Q{QR valid and application approved?}
    Q -- No --> P
    Q -- Yes --> R[Record attendance]
    R --> S[View history]
    S --> T([Finish])

    J -- Organizer request --> U[Submit organizer profile]
    U --> V{Admin decision}
    V -- Rejected --> U
    V -- Approved --> W[Create program]
    W --> X[Open applications]
    X --> Y[Review applicants]
    Y --> Z[Approve, reject, or assign role]
    Z --> AA[Start QR attendance]
    AA --> AB[Rate volunteers]
    AB --> T

    J -- Admin --> AC[Review requests and system data]
    AC --> T
```
