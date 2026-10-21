
import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000/api/budget";

function App() {
  const [pocketMoney, setPocketMoney] = useState(0);
  const [newAmount, setNewAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(API_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Could not load budget");
        }
        return response.json();
      })
      .then((data) => {
        setPocketMoney(data.pocketMoney);
        setLoading(false);
      })
      .catch(() => {
        setMessage("Cannot connect to backend. Check that your server is running.");
        setLoading(false);
      });
  }, []);

  async function updateBudget(event) {
    event.preventDefault();
    setMessage("");

    const amount = Number(newAmount);

    if (newAmount.trim() === "" || !Number.isFinite(amount) || amount < 0) {
      setMessage("Please enter a valid amount.");
      return;
    }

    try {
      const response = await fetch(API_URL, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pocketMoney: amount }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update budget");
      }

      setPocketMoney(data.pocketMoney);
      setNewAmount("");
      setMessage("Pocket money updated successfully!");
    } catch (error) {
      setMessage(error.message || "Something went wrong.");
    }
  }

  function formatRupees(amount) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">₹</span>
          <span>StudentSpend</span>
        </div>

        <p className="menu-label">MENU</p>
        <div className="nav-item active">▦ <span>Dashboard</span></div>
        <div className="nav-item">↗ <span>Expenses</span></div>
        <div className="nav-item">◷ <span>Budget</span></div>

        <div className="sidebar-bottom">
          <div className="avatar">S</div>
          <div>
            <strong>Student</strong>
            <p>My account</p>
          </div>
        </div>
      </aside>

      <main className="main-content">
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

        <section className="summary-grid">
          <div className="summary-card balance-card">
            <div className="card-heading">
              <span>Total Pocket Money</span>
              <span className="card-icon">₹</span>
            </div>
            <h2>{loading ? "Loading..." : formatRupees(pocketMoney)}</h2>
            <p className="card-note">Your saved available budget</p>
          </div>

          <div className="summary-card">
            <div className="card-heading">
              <span>Total Expenses</span>
              <span className="card-icon">↗</span>
            </div>
            <h2>₹0.00</h2>
            <p className="card-note">Expense tracking comes next</p>
          </div>

          <div className="summary-card">
            <div className="card-heading">
              <span>Money Left</span>
              <span className="card-icon">◉</span>
            </div>
            <h2>{loading ? "Loading..." : formatRupees(pocketMoney)}</h2>
            <p className="card-note">Before recording expenses</p>
          </div>
        </section>

        <section className="content-grid">
          <div className="panel budget-panel">
            <div className="panel-title">
              <div>
                <h3>Update Pocket Money</h3>
                <p>Enter the amount you receive.</p>
              </div>
              <span className="panel-emoji">💰</span>
            </div>

            <form onSubmit={updateBudget}>
              <label htmlFor="amount">Pocket money amount (₹)</label>
              <input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 5000"
                value={newAmount}
                onChange={(event) => setNewAmount(event.target.value)}
              />
              <button type="submit" disabled={loading}>
                Save Pocket Money <span>→</span>
              </button>
            </form>

            {message && (
              <p className="feedback" role="status">{message}</p>
            )}
          </div>

          <div className="panel activity-panel">
            <div className="panel-title">
              <div>
                <h3>Recent Activity</h3>
                <p>Your money journey starts here.</p>
              </div>
              <span className="activity-icon">↻</span>
            </div>

            <div className="empty-state">
              <div className="empty-icon">✦</div>
              <strong>No activity yet</strong>
              <p>Once you start tracking expenses, they will appear here.</p>
            </div>
          </div>
        </section>

        <footer>Made for student life, with ♥ · StudentSpend</footer>
      </main>
    </div>
  );
}

export default App;
