import { useCallback, useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:5000/api/savings-goals";

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

export default function SavingsGoals() {
  const [goals, setGoals] = useState([]);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [saved, setSaved] = useState("0");
  const [deadline, setDeadline] = useState("");
  const [amounts, setAmounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadGoals = useCallback(async () => {
    try {
      setError("");
      const response = await fetch(API);
      if (!response.ok) throw new Error("Unable to load savings goals.");

      const data = await response.json();
      if (!Array.isArray(data)) throw new Error("Unexpected savings-goals response.");
      setGoals(data);
      setAmounts((previous) => {
        const next = { ...previous };
        data.forEach((goal) => {
          if (!(goal._id in next)) next[goal._id] = String(goal.savedAmount ?? 0);
        });
        Object.keys(next).forEach((id) => {
          if (!data.some((goal) => goal._id === id)) delete next[id];
        });
        return next;
      });
    } catch (err) {
      setError(err.message || "Check that your backend server and MongoDB are running.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  async function addGoal(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const targetValue = Number(target);
    const savedValue = Number(saved);

    if (!name.trim()) return setError("Enter a goal name.");
    if (target.trim() === "" || !Number.isFinite(targetValue) || targetValue <= 0) {
      return setError("Target amount must be greater than zero.");
    }
    if (saved.trim() === "" || !Number.isFinite(savedValue) ||
        savedValue < 0 || savedValue > targetValue) {
      return setError("Saved amount must be between zero and the target.");
    }
    if (deadline && Number.isNaN(new Date(`${deadline}T00:00:00`).getTime())) {
      return setError("Enter a valid target date.");
    }

    try {
      setBusy(true);
      const response = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goalName: name.trim(),
          targetAmount: targetValue,
          savedAmount: savedValue,
          deadline: deadline || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not create goal.");

      setName("");
      setTarget("");
      setSaved("0");
      setDeadline("");
      setMessage("Savings goal created successfully.");
      await loadGoals();
    } catch (err) {
      setError(err.message || "Could not create goal.");
    } finally {
      setBusy(false);
    }
  }

  async function updateGoal(goal) {
    setError("");
    setMessage("");
    const value = amounts[goal._id];

    if (value === "" || !Number.isFinite(Number(value)) ||
        Number(value) < 0 || Number(value) > Number(goal.targetAmount)) {
      setError("Saved amount must be between zero and the target.");
      return;
    }

    try {
      setUpdatingId(goal._id);
      const response = await fetch(`${API}/${goal._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ savedAmount: Number(value) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not update goal.");

      setMessage("Savings progress updated.");
      await loadGoals();
    } catch (err) {
      setError(err.message || "Could not update goal.");
    } finally {
      setUpdatingId("");
    }
  }

  async function deleteGoal(goal) {
    if (!window.confirm(`Delete "${goal.goalName}"?`)) return;

    setError("");
    setMessage("");
    try {
      setDeletingId(goal._id);
      const response = await fetch(`${API}/${goal._id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not delete goal.");

      setMessage("Savings goal deleted.");
      await loadGoals();
    } catch (err) {
      setError(err.message || "Could not delete goal.");
    } finally {
      setDeletingId("");
    }
  }

  const totalSaved = goals.reduce((sum, goal) => sum + Number(goal.savedAmount || 0), 0);
  const totalTarget = goals.reduce((sum, goal) => sum + Number(goal.targetAmount || 0), 0);
  const completedGoals = goals.filter(
    (goal) => Number(goal.targetAmount) > 0 &&
      Number(goal.savedAmount) >= Number(goal.targetAmount)
  ).length;

  return (
    <section className="savings-section" id="savings-goals">
      <div className="savings-heading">
        <div>
          <p className="savings-eyebrow">PLAN YOUR FUTURE</p>
          <h2>Savings Goals</h2>
          <p className="savings-subtitle">Set a target and track your savings progress.</p>
        </div>
        <div className="savings-icon" aria-hidden="true">◎</div>
      </div>

      <div className="savings-summary">
        <div className="savings-stat">
          <span className="savings-stat-icon" aria-hidden="true">₹</span>
          <div><span>Total saved</span><strong>{money(totalSaved)}</strong></div>
        </div>
        <div className="savings-stat">
          <span className="savings-stat-icon" aria-hidden="true">🎯</span>
          <div><span>Total target</span><strong>{money(totalTarget)}</strong></div>
        </div>
        <div className="savings-stat">
          <span className="savings-stat-icon" aria-hidden="true">✓</span>
          <div><span>Goals completed</span><strong>{completedGoals} / {goals.length}</strong></div>
        </div>
      </div>

      <div className="savings-panel">
        <div className="savings-panel-heading">
          <div>
            <h3>Create a savings goal</h3>
            <p>Give your next big purchase a plan.</p>
          </div>
          <span aria-hidden="true">✦</span>
        </div>
        <form className="savings-form" onSubmit={addGoal}>
          <label>
            Goal name
            <input value={name} onChange={(e) => setName(e.target.value)}
              maxLength={80} placeholder="e.g. New laptop" required />
          </label>
          <label>
            Target amount (₹)
            <input type="number" min="0.01" step="0.01"
              value={target} onChange={(e) => setTarget(e.target.value)}
              placeholder="10000" required />
          </label>
          <label>
            Already saved (₹)
            <input type="number" min="0" step="0.01"
              value={saved} onChange={(e) => setSaved(e.target.value)}
              required />
          </label>
          <label>
            Target date <span className="savings-optional">(optional)</span>
            <input type="date" value={deadline} min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDeadline(e.target.value)} />
          </label>
          <button className="savings-create-button" type="submit" disabled={busy}>
            {busy ? "Creating goal..." : "+ Create Goal"}
          </button>
        </form>
      </div>

      {error && <p className="savings-alert savings-error" role="alert">{error}</p>}
      {message && <p className="savings-alert savings-success" role="status">{message}</p>}

      <div className="savings-list-heading">
        <div><h3>Your goals</h3><p>Every little bit adds up.</p></div>
        <span className="savings-total-pill">{goals.length} {goals.length === 1 ? "goal" : "goals"}</span>
      </div>

      {loading ? (
        <div className="savings-empty"><p>Loading your goals...</p></div>
      ) : goals.length === 0 ? (
        <div className="savings-empty">
          <div className="savings-empty-icon" aria-hidden="true">✦</div>
          <h3>No savings goals yet</h3>
          <p>Create your first goal above and start building your future.</p>
        </div>
      ) : (
        <div className="savings-goals-grid">
          {goals.map((goal) => {
            const targetValue = Number(goal.targetAmount);
            const savedValue = Number(goal.savedAmount);
            const progress = targetValue > 0 ? Math.min(100, (savedValue / targetValue) * 100) : 0;
            const complete = progress >= 100;

            return (
              <article className="savings-goal-card" key={goal._id}>
                <div className="savings-goal-top">
                  <div className="savings-goal-symbol" aria-hidden="true">{complete ? "✓" : "◎"}</div>
                  <span className={complete ? "goal-status complete" : "goal-status"}>
                    {complete ? "Completed" : "In progress"}
                  </span>
                </div>
                <h3 className="savings-goal-name">{goal.goalName}</h3>
                {goal.deadline && (
                  <p className="savings-deadline">
                    <span aria-hidden="true">◷</span> Target date: {new Date(goal.deadline).toLocaleDateString("en-IN")}
                  </p>
                )}
                <div className="savings-progress-label">
                  <strong>{money(savedValue)}</strong><span>of {money(targetValue)}</span>
                </div>
                <div className="savings-progress-track" role="progressbar"
                  aria-label={`${goal.goalName} progress`} aria-valuemin={0}
                  aria-valuemax={100} aria-valuenow={Math.round(progress)}>
                  <div className="savings-progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <div className="savings-progress-bottom">
                  <span>{Math.round(progress)}% saved</span>
                  <span>{complete ? "Goal reached!" : `${money(Math.max(targetValue - savedValue, 0))} to go`}</span>
                </div>
                <label className="savings-update-label">
                  Update saved amount (₹)
                  <input type="number" min="0" max={targetValue} step="0.01"
                    value={amounts[goal._id] ?? String(savedValue)}
                    onChange={(e) => setAmounts((previous) => ({ ...previous, [goal._id]: e.target.value }))} />
                </label>
                <div className="savings-card-actions">
                  <button type="button" className="savings-update-button"
                    disabled={updatingId === goal._id || deletingId === goal._id}
                    onClick={() => updateGoal(goal)}>
                    {updatingId === goal._id ? "Saving..." : "Save Progress"}
                  </button>
                  <button type="button" className="savings-delete-button"
                    disabled={deletingId === goal._id || updatingId === goal._id}
                    onClick={() => deleteGoal(goal)}>
                    {deletingId === goal._id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
