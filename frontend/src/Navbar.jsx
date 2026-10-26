
import { useState } from "react";
import "./Navbar.css";

export default function Navbar({ user, onLogout }) {
  const [openMenu, setOpenMenu] = useState("");

  const name = user?.user?.name || "Student";
  const initial = name.charAt(0).toUpperCase();

  
function goToSection(id) {
  setOpenMenu("");

  if (id === "dashboard") {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  // Wait for the menu to close, then scroll to the section.
  requestAnimationFrame(() => {
    const section = document.getElementById(id);

    if (section) {
      section.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    } else {
      console.warn(`Section with id "${id}" was not found.`);
    }
  });
}


  function logout() {
    setOpenMenu("");
    onLogout?.();
  }

  function toggleMenu(menu) {
    setOpenMenu((current) => (current === menu ? "" : menu));
  }

  function sectionButton(label, id, icon) {
    return (
      <button
        type="button"
        className="navbar-menu-button nav-direct-link"
        onClick={() => goToSection(id)}
        key={label}
      >
        <span className="nav-icon">{icon}</span>
        {label}
      </button>
    );
  }

  return (
    <nav className="top-navbar">
      <button
        type="button"
        className="navbar-brand"
        onClick={() => goToSection("dashboard")}
        aria-label="StudentSpend home"
      >
        <span className="brand-icon">₹</span>
        <span className="brand-name">
          Student<span className="brand-purple">Spend</span>
        </span>
      </button>

     
<div className="navbar-menu">
 <button
  type="button"
  className={`navbar-menu-button ${
    openMenu === "Dashboard" ? "selected" : ""
  }`}
  onClick={() => toggleMenu("Dashboard")}
  aria-expanded={openMenu === "Dashboard"}
>
  Dashboard
  <span className="menu-chevron">
    {openMenu === "Dashboard" ? "▴" : "▾"}
  </span>
</button>

  {openMenu === "Dashboard" && (
    <div className="navbar-dropdown">
      <button
        type="button"
        className="navbar-dropdown-item"
        onClick={() => goToSection("dashboard")}
      >
        Overview
      </button>
      <button
        type="button"
        className="navbar-dropdown-item"
        onClick={() => goToSection("expenses")}
      >
        Expenses
      </button>
      <button
        type="button"
        className="navbar-dropdown-item"
        onClick={() => goToSection("budget")}
      >
        Budget
      </button>
      <button
        type="button"
        className="navbar-dropdown-item"
        onClick={() => goToSection("savings-goals")}
      >
        Savings Goals
      </button>
    </div>
  )}

        <div className="navbar-menu">
         <button
  type="button"
  className={`navbar-menu-button ${
    openMenu === "About" ? "selected" : ""
  }`}
  onClick={() => toggleMenu("About")}
  aria-expanded={openMenu === "About"}
>
  About
  <span className="menu-chevron">
    {openMenu === "About" ? "▴" : "▾"}
  </span>
</button>

          {openMenu === "About" && (
            <div className="navbar-dropdown">
              <button
                type="button"
                className="navbar-dropdown-item"
                onClick={() => goToSection("about")}
              >
                About StudentSpend
              </button>
              <button
                type="button"
                className="navbar-dropdown-item"
                onClick={() => goToSection("how-it-works")}
              >
                How It Works
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="navbar-right">
        <span className="edition-badge">✦ Student Edition</span>

        <div className="navbar-menu profile-menu">
          <button
            type="button"
            className="navbar-user"
            onClick={() => toggleMenu("Profile")}
            aria-expanded={openMenu === "Profile"}
          >
            <span className="user-avatar">{initial}</span>
            <span className="user-name">{name}</span>
            <span className="menu-chevron">⌄</span>
          </button>

          {openMenu === "Profile" && (
            <div className="navbar-dropdown profile-dropdown">
              <button
                type="button"
                className="navbar-dropdown-item"
                onClick={() => goToSection("profile")}
              >
                My Profile
              </button>
              <button
                type="button"
                className="navbar-dropdown-item"
                onClick={() => goToSection("account-settings")}
              >
                Account Settings
              </button>

              <div className="dropdown-divider" />

              <button
                type="button"
                className="navbar-dropdown-item logout-item"
                onClick={logout}
              >
                ↪ Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
