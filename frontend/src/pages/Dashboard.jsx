import { useEffect, useState } from "react";
import { getDashboardStats } from "../api";
import Navbar from "../components/Navbar";
import "../styles.css";
import { useNavigate } from "react-router-dom";

 
export default function Dashboard() {
  const navigate=useNavigate();
  const [stats, setStats] = useState(null);
  const apiKey = localStorage.getItem("API_KEY");
const apiSecret = localStorage.getItem("API_SECRET");

useEffect(() => {
  if (!apiKey || !apiSecret) {
    navigate("/");
  }
}, []);
  useEffect(() => {
    getDashboardStats().then(setStats);
  }, []);

  if (!stats) return <p>Loading...</p>;

  return (
    <>
      <Navbar />

      <div className="container" data-test-id="dashboard">
        <h1>Dashboard</h1>

        <div className="card" data-test-id="api-credentials">
          <div>
            API Key: <span data-test-id="api-key">key_test_abc123</span>
          </div>
          <div>
            API Secret:{" "}
            <span data-test-id="api-secret">secret_test_xyz789</span>
          </div>
        </div>

        <div className="stats" data-test-id="stats-container">
          <div className="stat" data-test-id="total-transactions">
            {stats.total_transactions}
          </div>
          <div className="stat" data-test-id="total-amount">
            ₹{stats.total_amount}
          </div>
          <div className="stat" data-test-id="success-rate">
            {stats.success_rate}%
          </div>
        </div>

        <a href="/transactions" className="button secondary">
          View Transactions
        </a>
      </div>
    </>
  );
}
