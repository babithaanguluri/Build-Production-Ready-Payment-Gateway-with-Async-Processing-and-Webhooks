import { useEffect, useState } from "react";
import { getTransactions } from "../api";
import Navbar from "../components/Navbar";
import "../styles.css";
import { useNavigate } from "react-router-dom";

export default function Transactions() {
  const [txs, setTxs] = useState([]);
const apiKey = localStorage.getItem("API_KEY");
const apiSecret = localStorage.getItem("API_SECRET");
const navigate=useNavigate(); 
useEffect(() => {
  if (!apiKey || !apiSecret) {
    navigate("/");
  }
}, []);
  useEffect(() => {
    getTransactions().then(data => {
      setTxs(data.transactions);
    });
  }, []);

  return (
    <>
    <Navbar></Navbar>
    <div className="container">
      <h1>Transactions</h1>

      <table data-test-id="transactions-table" width="100%">
        <thead>
          <tr>
            <th>Payment ID</th>
            <th>Order ID</th>
            <th>Amount</th>
            <th>Method</th>
            <th>Status</th>
            <th>Created</th>
          </tr>
        </thead>

        <tbody>
          {txs.map(tx => (
            <tr
              key={tx.id}
              data-test-id="transaction-row"
              data-payment-id={tx.id}
            >
              <td data-test-id="payment-id">{tx.id}</td>
              <td data-test-id="order-id">{tx.order_id}</td>
              <td data-test-id="amount">{tx.amount}</td>
              <td data-test-id="method">{tx.method}</td>
              <td data-test-id="status">{tx.status}</td>
              <td data-test-id="created-at">
                {new Date(tx.created_at).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="page-actions">
        <a className="button secondary" href="/dashboard">Back to Dashboard</a>
        </div>

    </div>
    </>
  );
}
