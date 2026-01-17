import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Transactions from "./pages/Transactions";
import WebhookConfig from "./pages/WebhookConfig";
import ApiDocs from "./pages/ApiDocs";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/webhooks" element={<WebhookConfig />} />
        <Route path="/dashboard/docs" element={<ApiDocs />} />
        <Route path="/transactions" element={<Transactions />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
