import { NavLink, useNavigate } from "react-router-dom";
import "../styles.css";

export default function Navbar() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <h2>Payment Gateway</h2>
        <span className="email">test@example.com</span>
      </div>

      <nav className="navbar-right">
        <NavLink to="/dashboard" className="nav-btn">
          Dashboard
        </NavLink>
        <NavLink to="/transactions" className="nav-btn">
          Transactions
        </NavLink>
        <NavLink to="/dashboard/webhooks" className="nav-btn">
          Webhooks
        </NavLink>
        <NavLink to="/dashboard/docs" className="nav-btn">
          API Docs
        </NavLink>
        <button className="nav-btn logout" onClick={logout}>
          Logout
        </button>
      </nav>
    </header>
  );
}
