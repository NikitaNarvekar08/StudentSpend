
import { useCallback, useEffect, useState } from "react";
import "./App.css";
import Auth from "./Auth";
import Navbar from "./Navbar";
import SavingsGoals from "./SavingsGoals";
import AccountSettings from "./AccountSettings";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

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
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
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

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("studentSpendUser");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  function handleLogin(authData) {
    localStorage.setItem("studentSpendUser", JSON.stringify(authData));
    setCurrentUser(authData);
  }

  function handleLogout() {
    localStorage.removeItem("studentSpendUser");
    setCurrentUser(null);
  }

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
    } catch {
      setError(
        "Unable to load data. Make sure MongoDB and your backend server are running."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser, loadData]);

  const totalExpenses = expenses.reduce(
    (total, expense) => total + Number(expense.amount || 0),
    0
  );

  const remainingMoney = pocketMoney - totalExpenses;

  const categoryData = CATEGORIES.map((category) => ({
    name: category,
    value: expenses
      .filter((expense) => expense.category === category)
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0),
  })).filter((item) => item.value > 0);

  const chartColors = [
    "#7565e8",
    "#45b8ac",
    "#f4ad57",
    "#ed7796",
    "#6199e8",
    "#9b83c9",
  ];

  const monthlyData = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - (5 - index));

    const year = date.getFullYear();
    const month = date.getMonth();

    const total = expenses
      .filter((expense) => {
        const expenseDate = new Date(expense.date);

        return (
          expenseDate.getFullYear() === year &&
          expenseDate.getMonth() === month
        );
      })
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

    return {
      month: date.toLocaleDateString("en-IN", { month: "short" }),
      spending: total,
    };
  });

  const biggestCategory = categoryData.length
    ? categoryData.reduce((biggest, item) =>
        item.value > biggest.value ? item : biggest
      )
    : null;

  const budgetUsed =
    pocketMoney > 0 ? (totalExpenses / pocketMoney) * 100 : 0;

  const budgetProgress = Math.min(budgetUsed, 100);

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

    if (
      !form.amount.trim() ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
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

  // Show login/register until the user signs in.
  if (!currentUser) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="app-shell">
      {/* New top navigation with Dashboard, Explore and Profile menus */}
      <Navbar user={currentUser} onLogout={handleLogout} />

      <main className="main-content" id="dashboard">
      <header className="topbar" id="overview">
          <div>
            <p className="eyebrow">YOUR MONEY, YOUR CONTROL</p>
            <h1>
              Welcome back
              {currentUser.user?.name
                ? `, ${currentUser.user.name}`
                : ""}!
            </h1>
            <p className="subtitle">
              Track your spending, manage your budget and achieve your
              financial goals.
            </p>
          </div>

        </header>

        <section className="welcome-card">
          <div>
            <p className="welcome-tag">YOUR FINANCIAL SPACE</p>
            <h2>Hey, student! 👋</h2>
            <p>Small savings today, bigger goals tomorrow.</p>
          </div>

          <div className="welcome-art">₹</div>
        </section>

        {error && (
          <p className="feedback error-message" role="alert">
            {error}
          </p>
        )}

        {message && (
          <p className="feedback" role="status">
            {message}
          </p>
        )}

        {/* Dashboard overview cards */}
        <section className="summary-grid" id="overview">
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
            <p className="card-note">
              {expenses.length} recorded expenses
            </p>
          </div>

          <div className="summary-card">
            <div className="card-heading">
              <span>Money Left</span>
              <span className="card-icon">◉</span>
            </div>
            <h2>{loading ? "Loading..." : money(remainingMoney)}</h2>
            <p className="card-note">
              {remainingMoney < 0
                ? "You are over your budget"
                : "Pocket money minus expenses"}
            </p>
          </div>
        </section>

        {pocketMoney > 0 && remainingMoney <= 200 && (
          <div
            role="status"
            className="feedback error-message"
            style={{
              margin: "0 0 20px",
              padding: "12px 16px",
              borderRadius: "12px",
              background: "#fff1f2",
              border: "1px solid #fecdd3",
              color: "#be123c",
            }}
          >
            {remainingMoney <= 0
              ? "You have reached or exceeded your pocket-money budget. Review your expenses."
              : `Low balance warning: only ${money(remainingMoney)} remains.`}
          </div>
        )}

        {/* Charts, insights, budget and expense form */}
        <section className="content-grid">
          <section className="analytics-grid">
            <div className="panel chart-panel">
              <div className="panel-title">
                <div>
                  <h3>Spending by Category</h3>
                  <p>See which categories use your money.</p>
                </div>
                <span className="panel-emoji">📊</span>
              </div>

              {categoryData.length === 0 ? (
                <div className="chart-empty">
                  Add your first expense to see the chart.
                </div>
              ) : (
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        innerRadius={48}
                        paddingAngle={3}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell
                            key={entry.name}
                            fill={
                              chartColors[index % chartColors.length]
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => money(value)} />
                      <Legend
                        verticalAlign="middle"
                        align="right"
                        layout="vertical"
                        formatter={(value) => (
                          <span style={{ color: "#34416f", fontSize: "12px" }}>
                            {value}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="panel chart-panel">
              <div className="panel-title">
                <div>
                  <h3>Monthly Spending</h3>
                  <p>Your spending over the last six months.</p>
                </div>
                <span className="panel-emoji">📈</span>
              </div>

              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis dataKey="month" />
                    <YAxis
                      tickFormatter={(value) =>
                        value >= 1000
                          ? `₹${(value / 1000).toFixed(1)}k`
                          : `₹${value}`
                      }
                      width={65}
                    />
                    <Tooltip formatter={(value) => money(value)} />
                    <Bar
                      dataKey="spending"
                      name="Expenses"
                      fill="#7565e8"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="panel insight-panel">
              <div className="panel-title">
                <div>
                  <h3>Spending Insights</h3>
                  <p>A quick look at your money habits.</p>
                </div>
                <span className="panel-emoji">💡</span>
              </div>

              <div className="insight-item">
                <span className="insight-label">
                  Top spending category
                </span>
                <strong>
                  {biggestCategory
                    ? biggestCategory.name
                    : "No expenses yet"}
                </strong>
                <span className="insight-detail">
                  {biggestCategory
                    ? money(biggestCategory.value)
                    : "Add an expense to get started."}
                </span>
              </div>

              <div className="insight-item">
                <span className="insight-label">Budget used</span>
                <strong>{budgetUsed.toFixed(1)}%</strong>

                <div
                  className="progress-track"
                  role="progressbar"
                  aria-label="Budget used"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(budgetProgress)}
                >
                  <div
                    className="progress-fill"
                    style={{ width: `${budgetProgress}%` }}
                  />
                </div>

                <span className="insight-detail">
                  {pocketMoney > 0
                    ? `${money(Math.max(remainingMoney, 0))} remaining`
                    : "Set your pocket money to track your budget."}
                </span>
              </div>
            </div>
          </section>

          {/* Budget submenu destination */}
          <div className="panel" id="budget">
            <div className="panel-title">
              <div>
                <h3>Update Pocket Money</h3>
                <p>Enter the amount you receive.</p>
              </div>
              <span className="panel-emoji">💰</span>
            </div>

            <form onSubmit={updateBudget} className="budget-panel">
              <label htmlFor="newBudget">
                Pocket money amount (₹)
              </label>

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
                  <option key={category} value={category}>
                    {category}
                  </option>
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

              <button
                type="submit"
                disabled={savingExpense || loading}
              >
                {savingExpense ? "Saving..." : "Add Expense"}{" "}
                <span>＋</span>
              </button>
            </form>
          </div>
        </section>

        {/* Expenses submenu destination */}
        <section className="panel expense-history" id="expenses">
          <div className="panel-title history-heading">
            <div>
              <h3>Recent Expenses</h3>
              <p>Your latest recorded transactions.</p>
            </div>

            <button
              className="secondary-button"
              type="button"
              onClick={loadData}
            >
              ↻ Refresh
            </button>
          </div>

          <div className="filter-row">
            <label htmlFor="categoryFilter">
              Filter by category
            </label>

            <select
              id="categoryFilter"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              <option value="All">All categories</option>
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
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
                    <th>Date</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredExpenses.map((expense) => (
                    <tr key={expense._id}>
                      <td>
                        {new Date(expense.date).toLocaleDateString("en-IN")}
                      </td>
                      <td>{expense.title}</td>
                      <td>
                        <span className="category-pill">
                          {expense.category}
                        </span>
                      </td>
                      <td className="amount-cell">
                        {money(expense.amount)}
                      </td>
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

        {/* Savings Goals submenu destination */}
       <div id="savings-goals">
        <SavingsGoals />
        </div>

        {/* Explore submenu: About */}
        <section id="about" className="info-section">
          <p className="info-eyebrow">ABOUT STUDENTSPEND</p>
          <h2>Take control of your money</h2>
          <p>
            StudentSpend is a student-focused expense tracking and
            budgeting application. It helps students manage pocket
            money, understand spending habits, and work towards savings
            goals in one place.
          </p>

          <div className="info-feature-grid">
            <article>
              <h3>Expense Tracking</h3>
              <p>
                Record expenses and organise them by category.
              </p>
            </article>

            <article>
              <h3>Budget Management</h3>
              <p>
                Manage pocket money and monitor your remaining balance.
              </p>
            </article>

            <article>
              <h3>Savings Goals</h3>
              <p>
                Set savings targets and track your progress.
              </p>
            </article>
          </div>
        </section>

        {/* Explore submenu: Overview */}
        <section id="how-it-works" className="info-section">
          <p className="info-eyebrow">OVERVIEW</p>
          <h2>How StudentSpend works</h2>

          <ol>
            <li>Set your pocket money budget.</li>
            <li>Add expenses with their amount, date, and category.</li>
            <li>View your total spending and remaining balance.</li>
            <li>Use charts and insights to understand spending habits.</li>
            <li>Create savings goals and track your progress.</li>
          </ol>
        </section>

        {/* Profile submenu destinations */}
        <section id="profile" className="info-section">
          <p className="info-eyebrow">MY ACCOUNT</p>
          <h2>My Profile</h2>
          <p>
            {currentUser.user?.name
              ? `Name: ${currentUser.user.name}`
              : "Your StudentSpend account"}
          </p>
          <p>
            {currentUser.user?.email
              ? `Email: ${currentUser.user.email}`
              : ""}
          </p>
        </section>

       <section
  id="account-settings"
  className="account-settings-anchor"
>
  <AccountSettings user={currentUser} />
</section>

      <footer>Made for student life, with ♥ · StudentSpend</footer>
      </main>
    </div>
  );
}

export default App;
