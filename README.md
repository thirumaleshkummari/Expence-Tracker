Personal Expense Tracker API
A RESTful API built with Node.js, Express, and SQLite to help users manage their personal financial records. The API allows users to record income and expenses, retrieve past transactions, and generate summaries.

Features
User registration and login with password encryption using bcrypt
JWT-based authentication for protected routes
CRUD operations for managing transactions
Categories management for transactions
Summarization of total income, expenses, and balance with optional filtering by date or category
Technologies Used
Node.js
Express.js
SQLite (Database)
bcrypt (Password hashing)
JWT (JSON Web Tokens) for authentication
Setup Instructions
Prerequisites
Node.js installed on your machine
SQLite (for database)
Installation
Clone the repository to your local machine:
bash
Copy code
git clone https://github.com/thirumaleshkummari/expense-tracker.git
Navigate into the project directory:
bash
Copy code
cd expense-tracker
Install the required dependencies:
bash
Copy code
npm install
Run the server:
bash
Copy code
node index.js
The server will be running at http://localhost:3000/.

Database Setup
The database (expense-tracker.db) and required tables (users, transactions, categories) will be automatically created when the server starts for the first time.

API Endpoints
User Authentication
Register a new user
POST /register/
Request Body:

json
Copy code
{
  "username": "thirumalesh_kummari",
  "password": "thiru@333",
  "name": "Thirumalesh Kummari",
  "gender": "male"
}
Response:

200 OK: "User created successfully"
400 Bad Request: "User already exists" or "Password is too short"
Login
POST /login/
Request Body:

json
Copy code
{
  "username": "thirumalesh_kummari",
  "password": "thiru@333",
}
Response:

200 OK: { "jwtToken": "token" }
400 Bad Request: "Invalid user" or "Invalid password"
Transaction Management (Requires JWT Token)
Add a new transaction
POST /transactions/
Request Body:

json
Copy code
{
  "type": "income",
  "category": "salary",
  "amount": 5000,
  "date": "2024-10-22",
  "description": "October salary"
}
Response:

201 Created: { "id": 1 }
Get all transactions
GET /transactions/
Response:

json
Copy code
{
  "transactions": [
    { "id": 1, "type": "income", "category": "salary", "amount": 5000, "date": "2024-10-22", "description": "October salary" }
  ]
}
Get transaction by ID
GET /transactions/:id/
Response:

json
Copy code
{
  "id": 1,
  "type": "income",
  "category": "salary",
  "amount": 5000,
  "date": "2024-10-22",
  "description": "October salary"
}
Update a transaction
PUT /transactions/:id/
Request Body:

json
Copy code
{
  "type": "expense",
  "category": "groceries",
  "amount": 150,
  "date": "2024-10-23",
  "description": "Weekly groceries"
}
Response:

200 OK: { "message": "Transaction updated", "changes": 1 }
Delete a transaction
DELETE /transactions/:id/
Response:

200 OK: { "message": "Transaction deleted", "changes": 1 }
Transaction Summary
Get summary of transactions
GET /summary/
Query Parameters: startDate, endDate, category (optional)
Response:
json
Copy code
{
  "income": 5000,
  "expense": 150,
  "balance": 4850
}