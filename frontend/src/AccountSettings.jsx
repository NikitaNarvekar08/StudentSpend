
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import "./AccountSettings.css";

function AccountSettings({ user }) {
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get("token");

  const [activeTab, setActiveTab] = useState(
    resetToken ? "Password" : "Account"
  );

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [confirmResetPassword, setConfirmResetPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({
    type: "",
    message: "",
  });

  const userData = user?.user || user || {};

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
  };

  const request = async (endpoint, body, token = null) => {
    const response = await fetch(
      `http://localhost:5000/api/auth/${endpoint}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Something went wrong.");
    }

    return data;
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    setFeedback({ type: "", message: "" });

    if (newPassword.length < 8) {
      return showFeedback(
        "error",
        "Your new password must contain at least 8 characters."
      );
    }

    if (newPassword !== confirmPassword) {
      return showFeedback("error", "The new passwords do not match.");
    }

    if (!user?.token) {
      return showFeedback(
        "error",
        "Please log in again before changing your password."
      );
    }

    setLoading(true);

    try {
      const data = await request(
        "change-password",
        { currentPassword, newPassword },
        user.token
      );

      showFeedback("success", data.message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      showFeedback("error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (event) => {
    event.preventDefault();
    setFeedback({ type: "", message: "" });
    setLoading(true);

    try {
      const data = await request("forgot-password", {
        email: resetEmail,
      });

      showFeedback("success", data.message);
    } catch (error) {
      showFeedback("error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setFeedback({ type: "", message: "" });

    if (!resetToken) {
      return showFeedback("error", "Your password-reset link is invalid.");
    }

    if (resetPassword.length < 8) {
      return showFeedback(
        "error",
        "Your new password must contain at least 8 characters."
      );
    }

    if (resetPassword !== confirmResetPassword) {
      return showFeedback("error", "The new passwords do not match.");
    }

    setLoading(true);

    try {
      const data = await request("reset-password", {
        token: resetToken,
        newPassword: resetPassword,
      });

      showFeedback("success", data.message);
      setResetPassword("");
      setConfirmResetPassword("");
      searchParams.delete("token");
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}${searchParams.toString() ? `?${searchParams}` : ""}`
      );
    } catch (error) {
      showFeedback("error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const tabs = ["Account", "Password", "Notifications", "Help"];

  return (
    <div className="account-settings-page">
      <div className="settings-heading">
        <h1>Account Settings</h1>
        <p>Manage your profile and account preferences.</p>
      </div>

      <div className="settings-layout">
        <aside className="settings-sidebar">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              className={`settings-tab ${
                activeTab === tab ? "active" : ""
              }`}
              onClick={() => {
                setActiveTab(tab);
                setFeedback({ type: "", message: "" });
              }}
            >
              {tab}
            </button>
          ))}
        </aside>

        <section className="settings-content">
          {feedback.message && (
            <div
              className={`settings-feedback settings-${feedback.type}`}
              role="status"
            >
              {feedback.message}
            </div>
          )}

          {activeTab === "Account" && (
            <div>
              <h2>Account Information</h2>
              <p className="settings-description">
                Your profile information.
              </p>

              <div className="settings-info-card">
                <div className="settings-info-row">
                  <span>Name</span>
                  <strong>{userData.name || "Not available"}</strong>
                </div>

                <div className="settings-info-row">
                  <span>Email address</span>
                  <strong>{userData.email || "Not available"}</strong>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Password" && (
            <div>
              <h2>Password & Security</h2>
              <p className="settings-description">
                Change your password or request a reset link by email.
              </p>

              {resetToken ? (
                <form
                  className="settings-password-form"
                  onSubmit={handleResetPassword}
                >
                  <h3>Reset Your Password</h3>

                  <label htmlFor="reset-password">New password</label>
                  <input
                    id="reset-password"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    placeholder="Enter new password"
                  />

                  <label htmlFor="confirm-reset-password">
                    Confirm new password
                  </label>
                  <input
                    id="confirm-reset-password"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    value={confirmResetPassword}
                    onChange={(e) =>
                      setConfirmResetPassword(e.target.value)
                    }
                    placeholder="Confirm new password"
                  />

                  <button
                    className="settings-primary-button"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? "Resetting..." : "Reset Password"}
                  </button>
                </form>
              ) : (
                <>
                  <form
                    className="settings-password-form"
                    onSubmit={handleChangePassword}
                  >
                    <h3>Change Password</h3>

                    <label htmlFor="current-password">
                      Current password
                    </label>
                    <input
                      id="current-password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                    />

                    <label htmlFor="new-password">New password</label>
                    <input
                      id="new-password"
                      type="password"
                      autoComplete="new-password"
                      minLength={8}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                    />

                    <label htmlFor="confirm-password">
                      Confirm new password
                    </label>
                    <input
                      id="confirm-password"
                      type="password"
                      autoComplete="new-password"
                      minLength={8}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                    />

                    <button
                      className="settings-primary-button"
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? "Updating..." : "Update Password"}
                    </button>
                  </form>

                  <div className="settings-reset-section">
                    <h3>Forgot your password?</h3>
                    <p>
                      We'll send a password-reset link to your registered
                      email address.
                    </p>

                    <form
                      className="settings-password-form"
                      onSubmit={handleForgotPassword}
                    >
                      <label htmlFor="reset-email">Email address</label>
                      <input
                        id="reset-email"
                        type="email"
                        autoComplete="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="Enter your registered email"
                      />

                      <button
                        type="submit"
                        className="settings-primary-button"
                        disabled={loading}
                      >
                        {loading ? "Sending..." : "Send Reset Link"}
                      </button>
                    </form>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === "Notifications" && (
            <div>
              <h2>Notifications</h2>
              <p className="settings-description">
                Notification preferences will be available here in a future
                update.
              </p>
            </div>
          )}

          {activeTab === "Help" && (
            <div>
              <h2>Help & Support</h2>
              <p className="settings-description">
                Need help using StudentSpend? Check that your backend is
                running or contact your project administrator.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default AccountSettings;
