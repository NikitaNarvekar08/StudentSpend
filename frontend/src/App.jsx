
import { useCallback, useEffect, useState } from "react";
import "./App.css";

const BUDGET_API = "http://localhost:5000/api/budget";
const EXPENSE_API = "http://localhost:5000/api/expenses";

const CATEGORIES = [
  "Food",
  "Travel",
  "Education",
  "Shopping",
  "Entertainment",
  "Other",
];

const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const emptyForm = {
  title: "",
  amount: "",
  category: "Food",
  date: today(),
};

function money(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

function App() {
  const [pocketMoney, setPocketMoney] = useState(0);
  const [newBudget, setNewBudget] = useState("");
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [savingExpense, setSavingExpense] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [budgetResponse, expenseResponse] = await Promise.all([
        fetch(BUDGET_API),
        fetch(EXPENSE_API),
      ]);

      if (!budgetResponse.ok || !expenseResponse.ok) {
        throw new Error("Could not load dashboard data.");
      }

      const budgetData = await budgetResponse.json();
      const expenseData = await expenseResponse.json();

      setPocketMoney(Number(budgetData.pocketMoney) || 0);
      setExpenses(Array.isArray(expenseData) ? expenseData : []);
    } catch (err) {
      setError(
        "Unable to load data. Make sure MongoDB and your backend server are running."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalExpenses = expenses.reduce(
    (total, expense) => total + Number(expense.amount || 0),
    0
  );

  const remainingMoney = pocketMoney - totalExpenses;

  const filteredExpenses =
    filter === "All"
      ? expenses
      : expenses.filter((expense) => expense.category === filter);

  async function updateBudget(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (newBudget.trim() === "") {
      setError("Please enter your pocket money amount.");
      return;
    }

    const amount = Number(newBudget);

    if (!Number.isFinite(amount) || amount < 0) {
      setError("Enter a valid, non-negative amount.");
      return;
    }

    try {
      const response = await fetch(BUDGET_API, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pocketMoney: amount }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not update pocket money.");
      }

      setPocketMoney(Number(data.pocketMoney));
      setNewBudget("");
      setMessage("Pocket money updated successfully!");
    } catch (err) {
      setError(err.message || "Could not update pocket money.");
    }
  }

  async function addExpense(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    const amount = Number(form.amount);

    if (!form.title.trim()) {
      setError("Please enter an expense name.");
      return;
    }

    if (!form.amount.trim() || !Number.isFinite(amount) || amount <= 0) {
      setError("Expense amount must be greater than zero.");
      return;
    }

    if (!form.date) {
      setError("Please select the expense date.");
      return;
    }

    setSavingExpense(true);

    try {
      const response = await fetch(EXPENSE_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          amount,
          category: form.category,
          date: form.date,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not save expense.");
      }

      setExpenses((current) =>
        [data, ...current].sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        )
      );
      setForm({ ...emptyForm, date: today() });
      setMessage("Expense added successfully!");
    } catch (err) {
      setError(err.message || "Could not save expense.");
    } finally {
      setSavingExpense(false);
    }
  }

  async function deleteExpense(id) {
    if (!window.confirm("Are you sure you want to delete this expense?")) {
      return;
    }

    setMessage("");
    setError("");

    try {
      const response = await fetch(`${EXPENSE_API}/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not delete expense.");
      }

      setExpenses((current) =>
        current.filter((expense) => expense._id !== id)
      );
      setMessage("Expense deleted successfully.");
    } catch (err) {
      setError(err.message || "Could not delete expense.");
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">₹</span>
          <span>StudentSpend</span>
        </div>

        <p className="menu-label">MENU</p>
        <a className="nav-item active" href="#dashboard">▦ <span>Dashboard</span></a>
        <a className="nav-item" href="#expenses">↗ <span>Expenses</span></a>
        <a className="nav-item" href="#budget">◷ <span>Budget</span></a>

        <div className="sidebar-bottom">
          <div className="avatar">S</div>
          <div>
            <strong>Student</strong>
            <p>My account</p>
          </div>
        </div>
      </aside>

      <main className="main-content" id="dashboard">
        <header className="topbar">
          <div>
            <p className="eyebrow">YOUR MONEY, YOUR CONTROL</p>
            <h1>Dashboard</h1>
            <p className="subtitle">
              Keep track of your pocket money, one day at a time.
            </p>
          </div>
          <div className="date-chip">✦ Student Edition</div>
        </header>

        <section className="welcome-card">
          <div>
            <p className="welcome-tag">YOUR FINANCIAL SPACE</p>
            <h2>Hey, student! 👋</h2>
            <p>Small savings today, bigger goals tomorrow.</p>
          </div>
          <div className="welcome-art">₹</div>
        </section>

        {error && <p className="feedback error-message" role="alert">{error}</p>}
        {message && <p className="feedback" role="status">{message}</p>}

        <section className="summary-grid">
          <div className="summary-card balance-card">
            <div className="card-heading">
              <span>Total Pocket Money</span>
              <span className="card-icon">₹</span>
            </div>
            <h2>{loading ? "Loading..." : money(pocketMoney)}</h2>
            <p className="card-note">Your saved budget</p>
          </div>

          <div className="summary-card">
            <div className="card-heading">
              <span>Total Expenses</span>
              <span className="card-icon">↗</span>
            </div>
            <h2>{loading ? "Loading..." : money(totalExpenses)}</h2>
            <p className="card-note">{expenses.length} recorded expenses</p>
          </div>

          <div className="summary-card">
            <div className="card-heading">
              <span>Money Left</span>
              <span className="card-icon">◉</span>
            </div>
            <h2>{loading ? "Loading..." : money(remainingMoney)}</h2>
            <p className="card-note">
              {remainingMoney < 0 ? "You are over your budget" : "Pocket money minus expenses"}
            </p>
          </div>
        </section>

        <section className="content-grid">
          <div className="panel" id="budget">
            <div className="panel-title">
              <div>
                <h3>Update Pocket Money</h3>
                <p>Enter the amount you receive.</p>
              </div>
              <span className="panel-emoji">💰</span>
            </div>

            <form onSubmit={updateBudget} className="budget-panel">
              <label htmlFor="newBudget">Pocket money amount (₹)</label>
              <input
                id="newBudget"
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 5000"
                value={newBudget}
                onChange={(event) => setNewBudget(event.target.value)}
              />
              <button type="submit" disabled={loading}>
                Save Pocket Money <span>→</span>
              </button>
            </form>
          </div>

          <div className="panel" id="add-expense">
            <div className="panel-title">
              <div>
                <h3>Add an Expense</h3>
                <p>Record where your money goes.</p>
              </div>
              <span className="panel-emoji">🧾</span>
            </div>

            <form onSubmit={addExpense} className="budget-panel">
              <label htmlFor="expenseTitle">Expense name</label>
              <input
                id="expenseTitle"
                type="text"
                maxLength="100"
                placeholder="e.g. Lunch"
                value={form.title}
                onChange={(event) =>
                  setForm({ ...form, title: event.target.value })
                }
              />

              <label htmlFor="expenseAmount">Amount (₹)</label>
              <input
                id="expenseAmount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="e.g. 150"
                value={form.amount}
                onChange={(event) =>
                  setForm({ ...form, amount: event.target.value })
                }
              />

              <label htmlFor="expenseCategory">Category</label>
              <select
                id="expenseCategory"
                value={form.category}
                onChange={(event) =>
                  setForm({ ...form, category: event.target.value })
                }
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              <label htmlFor="expenseDate">Date</label>
              <input
                id="expenseDate"
                type="date"
                max={today()}
                value={form.date}
                onChange={(event) =>
                  setForm({ ...form, date: event.target.value })
                }
              />

              <button type="submit" disabled={savingExpense || loading}>
                {savingExpense ? "Saving..." : "Add Expense"} <span>＋</span>
              </button>
            </form>
          </div>
        </section>

        <section className="panel expense-history" id="expenses">
          <div className="panel-title history-heading">
            <div>
              <h3>Expense History</h3>
              <p>Your recorded spending, newest first.</p>
            </div>
            <button className="secondary-button" type="button" onClick={loadData}>
              ↻ Refresh
            </button>
          </div>

          <div className="filter-row">
            <label htmlFor="categoryFilter">Filter by category</label>
            <select
              id="categoryFilter"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              <option value="All">All categories</option>
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <p className="empty-state">Loading expenses...</p>
          ) : filteredExpenses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✦</div>
              <strong>No expenses found</strong>
              <p>Add an expense above to see it in your history.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="expense-table">
                <thead>
                  <tr>
                    <th>Expense</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((expense) => (
                    <tr key={expense._id}>
                      <td>{expense.title}</td>
                      <td><span className="category-pill">{expense.category}</span></td>
                      <td>{new Date(expense.date).toLocaleDateString("en-IN")}</td>
                      <td className="amount-cell">{money(expense.amount)}</td>
                      <td>
                        <button
                          className="delete-button"
                          type="button"
                          onClick={() => deleteExpense(expense._id)}
                          aria-label={`Delete ${expense.title}`}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer>Made for student life, with ♥ · StudentSpend</footer>
      </main>
    </div>
  );
}

export default App;
