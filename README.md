# StudentSpend – Student Pocket Money & Expense Tracker

StudentSpend is a MERN stack web application that helps students manage their pocket money, track daily expenses, and monitor their remaining balance through a simple dashboard.

## Features

- **Budget Management:** Set and update your pocket money.
- **Expense Tracking:** Add expenses with a title, amount, category, and date.
- **Expense History:** View recorded expenses in a table.
- **Category Filtering:** Filter expenses by category.
- **Delete Expenses:** Remove unwanted expense records.
- **Live Dashboard Calculations:** Automatically calculate total expenses and remaining balance.
- **Data Persistence:** Store budget and expense records in MongoDB.

## Technology Stack

- **Frontend:** React.js, JavaScript, CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose
- **API Testing:** Postman (optional)

## Project Structure

```text
studentspend/
├── frontend/
│   └── src/
├── backend/
│   ├── models/
│   ├── routes/
│   ├── server.js
│   └── .env
├── .gitignore
└── README.md
```

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/NikitaNarvekar08/StudentSpend.git
cd StudentSpend
```

### 2. Set up the backend

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` folder with:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/studentspend
```

Start MongoDB locally, then run:

```bash
node server.js
```

### 3. Set up the frontend

Open a second terminal from the project root:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL shown in the terminal, usually `http://localhost:5173`.

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/budget` | Retrieve the budget |
| PUT | `/api/budget` | Update the budget |
| GET | `/api/expenses` | Retrieve expenses |
| POST | `/api/expenses` | Add an expense |
| DELETE | `/api/expenses/:id` | Delete an expense |

## How the Balance Is Calculated

**Total Expenses** = Sum of all recorded expense amounts

**Remaining Balance** = Pocket Money − Total Expenses

## Future Improvements

- User registration and login
- Monthly expense reports and charts
- Downloadable expense reports
- Spending limit alerts

## Author

Developed as a MERN Stack Full Stack Development academic project.
