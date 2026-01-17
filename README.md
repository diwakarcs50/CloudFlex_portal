# CloudFlex Portal

A modern project management system built with Next.js 15 and PostgreSQL, featuring role-based access control and real-time collaboration.

## � Test Credentials

### Admin User
- **Email**: admin@test.com
- **Password**: Test123!
- **Role**: admin
- **User ID**: 860f602d-75f4-42fc-b7cd-64073f0be791

### Member User
- **Email**: member@test.com
- **Password**: Test123!
- **Role**: member
- **User ID**: b9e10454-fd51-46f2-b9b3-eaf617fc579c

### To register a new User:


- This is a Test Company
- **Client ID**: 63942789-98d4-4586-bb95-5c694730cb96




## �🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd CloudFlex_portal

# Install dependencies
npm install

# Set up environment variables
create a .env setup with 
DB_HOST=***
DB_PORT=5432
DB_USER=***
DB_PASSWORD=***
DB_NAME=***

# JWT Configuration
JWT_SECRET=***
JWT_EXPIRES_IN=***

# Initialize database
npx tsx scripts/init-db.ts

# Run development server
npm run dev
```

Visit `http://localhost:3000` and login with:
- **Email**: admin@test.com
- **Password**: Test123!

---

## 📚 API Documentation

### Authentication Endpoints

#### `POST /api/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "clientId": "uuid-of-company"
}
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "member",
    "clientId": "uuid-of-company"
  }
}
```

---

#### `POST /api/auth/login`
Authenticate and receive session cookie.

**Request Body:**
```json
{
  "email": "admin@test.com",
  "password": "Test123!"
}
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": "uuid",
    "email": "admin@test.com",
    "role": "admin",
    "clientId": "uuid"
  }
}
```

**Note:** Authentication token is set as HTTP-only cookie.

---

#### `GET /api/auth/me`
Get current authenticated user information.

**Headers:** Cookie with auth token (automatic)

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "email": "admin@test.com",
  "role": "admin",
  "clientId": "uuid",
  "createdAt": "2026-01-17T10:00:00.000Z",
  "updatedAt": "2026-01-17T10:00:00.000Z"
}
```

---

#### `POST /api/auth/logout`
End current session and clear cookies.

**Response:** `204 No Content`

---

### Project Endpoints

#### `GET /api/projects`
List all accessible projects.

**Access:**
- **Admins**: See all company projects
- **Members**: See only assigned projects

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "name": "Mobile App",
    "description": "iOS and Android app",
    "clientId": "uuid",
    "createdAt": "2026-01-15T10:00:00.000Z",
    "updatedAt": "2026-01-15T10:00:00.000Z",
    "teamMemberCount": 5,
    "userRole": "owner"
  }
]
```

---

#### `POST /api/projects`
Create a new project (admin only).

**Request Body:**
```json
{
  "name": "New Project",
  "description": "Optional description"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "name": "New Project",
  "description": "Optional description",
  "clientId": "uuid",
  "createdAt": "2026-01-17T10:00:00.000Z",
  "updatedAt": "2026-01-17T10:00:00.000Z"
}
```

**Note:** Creator is automatically assigned as project owner.

---

#### `GET /api/projects/:id`
Get detailed project information with team members.

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "Mobile App",
  "description": "iOS and Android app",
  "clientId": "uuid",
  "createdAt": "2026-01-15T10:00:00.000Z",
  "updatedAt": "2026-01-15T10:00:00.000Z",
  "teamMembers": [
    {
      "userId": "uuid",
      "email": "developer@test.com",
      "role": "developer",
      "assignedAt": "2026-01-15T10:00:00.000Z"
    }
  ]
}
```

---

#### `PUT /api/projects/:id`
Update project details.

**Access:** Owner, Developer, or Admin

**Request Body:**
```json
{
  "name": "Updated Project Name",
  "description": "New description"
}
```

**Response:** `200 OK` (returns updated project)

---

#### `DELETE /api/projects/:id`
Delete a project and all assignments.

**Access:** Owner or Admin only

**Response:** `204 No Content`

---

### Team Management Endpoints

#### `GET /api/projects/:id/users`
List all team members assigned to a project.

**Response:** `200 OK`
```json
[
  {
    "userId": "uuid",
    "email": "dev@test.com",
    "role": "developer",
    "assignedAt": "2026-01-15T10:00:00.000Z"
  }
]
```

---

#### `POST /api/projects/:id/users`
Assign a user to a project with a specific role.

**Access:** Owner or Admin only

**Request Body:**
```json
{
  "userId": "uuid",
  "role": "developer"
}
```

**Roles:**
- `owner` - Full project control, can manage team
- `developer` - Can edit project details
- `viewer` - Read-only access

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "projectId": "uuid",
  "userId": "uuid",
  "role": "developer",
  "assignedAt": "2026-01-17T10:00:00.000Z"
}
```

---

#### `PUT /api/projects/:id/users/:userId`
Update a user's role in a project.

**Access:** Owner or Admin only

**Request Body:**
```json
{
  "role": "owner"
}
```

**Response:** `200 OK` (returns updated assignment)

**Note:** Cannot change role of global admins (creator badge users).

---

#### `DELETE /api/projects/:id/users/:userId`
Remove a user from a project.

**Access:** Owner or Admin only

**Response:** `204 No Content`

**Rules:**
- Cannot remove the last owner (at least one must remain)
- Global admins can remove any owner

---

### User Endpoints

#### `GET /api/users`
List all users in the same company.

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "email": "user@test.com",
    "role": "member",
    "clientId": "uuid",
    "createdAt": "2026-01-15T10:00:00.000Z",
    "updatedAt": "2026-01-15T10:00:00.000Z"
  }
]
```

---

## 🔐 Authorization Levels

### Global Roles
- **Admin**: Full system access, can create projects, see all company projects
- **Member**: Limited access, sees only assigned projects

### Project Roles
- **Owner**: Can edit project, manage team, delete project
- **Developer**: Can edit project details
- **Viewer**: Read-only access

---

## 🗃️ Database Schema

### Tables
- **clients** - Companies/organizations
- **users** - User accounts with global roles
- **projects** - Projects belonging to a company
- **project_users** - Team assignments with project-level roles

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React, TypeScript
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT with HTTP-only cookies
- **Styling**: Inline React styles

---

## 📝 Development

### Build for Production
```bash
npm run build
```

### Run Production Server
```bash
npm start
```

### Environment Variables
```

---

## 🚢 Deployment

1. Set up PostgreSQL database on your hosting platform
2. Configure environment variables
3. Run database initialization: `npx tsx scripts/init-db.ts`
4. Create admin user: `npx tsx scripts/create-admin-user.ts`
5. Deploy to Vercel, Railway, or any Node.js platform

---

## 📄 License

MIT License - feel free to use this project for your own purposes.

---

## 🤝 Support

For issues or questions, please open an issue in the repository.

### Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   # Create .env file with your database connection
   DATABASE_URL=postgresql://...
   JWT_SECRET=your-secret-key
   ```

3. **Initialize database**
   ```bash
   npm run db:init
   ```

4. **Create test data**
   ```bash
   npm run create-test-data
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Test the API**
   - See `TESTING-QUICK-REFERENCE.md` for credentials
   - See `docs/API-TESTING-GUIDE.md` for full documentation

## 🧪 Testing

### Test Data
```bash
# Create test company, users, and projects
npm run create-test-data

# Clean up test data
npm run clean-test-data
```

### API Testing
- Import `thunder-collection.json` into Thunder Client (VS Code)
- Or use Postman, curl, or any HTTP client
- See `docs/API-TESTING-GUIDE.md` for examples

## 📁 Project Structure

```
CloudFlex_portal/
├── app/                          # Next.js App Router
│   └── api/                      # API Routes
│       ├── auth/                 # Authentication endpoints
│       ├── clients/              # Client management
│       ├── users/                # User management
│       └── projects/             # Project & team management
├── entities/                     # TypeORM entities
│   ├── Client.ts
│   ├── User.ts
│   ├── Project.ts
│   └── ProjectUser.ts
├── lib/                          # Shared utilities
│   ├── auth.ts                   # JWT & password handling
│   ├── db.ts                     # Database connection
│   └── middleware.ts             # Auth & RBAC middleware
├── scripts/                      # Utility scripts
│   ├── init-db.ts               # Database initialization
│   ├── create-test-data.ts      # Create test data
│   └── clean-test-data.ts       # Clean test data
└── docs/                         # Documentation
    ├── API-TESTING-GUIDE.md     # Complete API documentation
    └── PHASE-5-COMPLETE.md      # Testing phase summary
```

## 🔐 Authentication & Authorization

### Authentication
- JWT tokens in HTTP-only cookies
- Secure password hashing with bcrypt
- Token refresh on valid requests

### Authorization Levels

**Global Roles:**
- `admin` - Full system access (manage clients, users, all projects)
- `member` - Standard user (manage own projects)

**Project Roles:**
- `owner` - Full project control (manage team, edit, delete)
- `developer` - Can edit project, view team
- `viewer` - Read-only access

## 🏗️ Tech Stack

- **Framework:** Next.js 15+ (App Router)
- **Database:** PostgreSQL with TypeORM 0.3.28
- **Authentication:** JWT with HTTP-only cookies
- **Language:** TypeScript
- **Runtime:** Node.js 18+

## 📚 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Clients
- `GET /api/clients` - List all clients
- `POST /api/clients` - Create client (admin only)
- `GET /api/clients/[id]` - Get client
- `PUT /api/clients/[id]` - Update client (admin only)
- `DELETE /api/clients/[id]` - Delete client (admin only)

### Users
- `GET /api/users` - List users (same company)
- `POST /api/users` - Create user (admin only)
- `GET /api/users/[id]` - Get user
- `PUT /api/users/[id]` - Update user (admin only)
- `DELETE /api/users/[id]` - Delete user (admin only)

### Projects
- `GET /api/projects` - List projects (user's company)
- `POST /api/projects` - Create project (becomes owner)
- `GET /api/projects/[id]` - Get project
- `PUT /api/projects/[id]` - Update project (owner/admin)
- `DELETE /api/projects/[id]` - Delete project (owner/admin)

### Project Team
- `GET /api/projects/[id]/users` - List team members
- `POST /api/projects/[id]/users` - Assign user (owner/admin)
- `PUT /api/projects/[id]/users/[userId]` - Update role (owner/admin)
- `DELETE /api/projects/[id]/users/[userId]` - Remove user (owner/admin)

## 🎯 Features

 **Multi-Tenancy**
- Complete client isolation
- Users can only access their company's data
- Prevents cross-company data leaks

 **Role-Based Access Control**
- Global roles (admin, member)
- Project-level roles (owner, developer, viewer)
- Granular permission checks

 **Complete CRUD Operations**
- Clients, Users, Projects, Team Assignments
- Full validation and error handling
- Business rule enforcement

 **Security**
- JWT-based authentication
- HTTP-only cookies
- Password hashing with bcrypt
- SQL injection protection (TypeORM)

  **Business Rules**
- At least one owner per project
- Automatic owner assignment on project creation
- Email uniqueness validation
- Proper foreign key relationships


## 🧹 NPM Scripts

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run db:init          # Initialize database
npm run create-test-data # Create test data
npm run clean-test-data  # Remove test data
```

## 📄 License

MIT

