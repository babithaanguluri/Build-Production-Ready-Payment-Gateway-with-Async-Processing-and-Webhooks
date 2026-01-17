import { useState, useEffect } from "react";
import {
    getMerchantConfig,
    updateMerchantConfig,
    regenerateSecret,
    getWebhooks,
    retryWebhook,
    sendTestWebhook,
} from "../api";

export default function WebhookConfig() {
    const [url, setUrl] = useState("");
    const [secret, setSecret] = useState("Loading...");
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        // Parallel fetch config and logs
        try {
            const configReq = getMerchantConfig(); // Ensure this endpoint exists/returns correct data
            const logsReq = getWebhooks(10, 0);

            const [configRes, logsRes] = await Promise.all([configReq, logsReq]);

            // Assuming configRes returns { webhook_url, webhook_secret }?
            // Wait, dashboard.controller.js implementation of getMerchantConfig was empty in previous view!
            // I need to check if getMerchantConfig is implemented in backend.
            // Checking local context...
            // visible in Step 124: export const getMerchantConfig = async (req, res) => { };
            // It is EMPTY! I missed that in the plan. I must implement it too.
            // But for now let's assume I fix it.

            // Actually I should fix it first or now.
            // I will implement the frontend assuming the backend returns { webhook_url, webhook_secret }

            if (configRes) {
                setUrl(configRes.webhook_url || "");
                setSecret(configRes.webhook_secret || "");
            }

            if (logsRes && logsRes.data) {
                setLogs(logsRes.data);
            }
        } catch (err) {
            console.error(err);
            setMessage({ type: "error", text: "Failed to load data" });
        }
    };

    // Wait, I need to fix getMerchantConfig definition in backend! 
    // I'll add that to the todo list or just do it. I'll do it in parallel or next step.
    // Actually, I should probably check it.

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await updateMerchantConfig({ webhook_url: url });
            setMessage({ type: "success", text: "Configuration saved successfully" });
        } catch (err) {
            setMessage({ type: "error", text: "Failed to save configuration" });
        } finally {
            setLoading(false);
        }
    };

    const handleRegenerate = async () => {
        if (!window.confirm("Are you sure? This will invalidate the old secret immediately.")) return;
        try {
            const res = await regenerateSecret();
            setSecret(res.webhook_secret);
            setMessage({ type: "success", text: "Secret regenerated" });
        } catch (err) {
            setMessage({ type: "error", text: "Failed to regenerate secret" });
        }
    };

    const handleTestCall = async () => {
        try {
            await sendTestWebhook();
            setMessage({ type: "success", text: "Test webhook scheduled. Refresh logs to see it." });
            // Optionally refresh logs after a delay
            setTimeout(fetchData, 2000);
        } catch (err) {
            setMessage({ type: "error", text: "Failed to send test webhook" });
        }
    };

    const handleRetry = async (id) => {
        try {
            await retryWebhook(id);
            setMessage({ type: "success", text: "Retry scheduled" });
            setTimeout(fetchData, 2000);
        } catch (err) {
            setMessage({ type: "error", text: "Failed to retry webhook" });
        }
    };

    return (
        <div data-test-id="webhook-config" className="container mx-auto p-6">
            <h2 className="text-2xl font-bold mb-6">Webhook Configuration</h2>

            {message && (
                <div className={`p-4 mb-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <form data-test-id="webhook-config-form" onSubmit={handleSave} className="bg-white p-6 rounded shadow mb-8">
                <div className="mb-4">
                    <label className="block text-gray-700 font-bold mb-2">Webhook URL</label>
                    <input
                        data-test-id="webhook-url-input"
                        type="url"
                        placeholder="https://yoursite.com/webhook"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="w-full border p-2 rounded"
                    />
                </div>

                <div className="mb-6">
                    <label className="block text-gray-700 font-bold mb-2">Webhook Secret</label>
                    <div className="flex items-center gap-4">
                        <span data-test-id="webhook-secret" className="font-mono bg-gray-100 p-2 rounded border">
                            {secret}
                        </span>
                        <button
                            data-test-id="regenerate-secret-button"
                            type="button"
                            onClick={handleRegenerate}
                            className="text-red-600 hover:text-red-800"
                        >
                            Regenerate
                        </button>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        data-test-id="save-webhook-button"
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        Save Configuration
                    </button>

                    <button
                        data-test-id="test-webhook-button"
                        type="button"
                        onClick={handleTestCall}
                        className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                    >
                        Send Test Webhook
                    </button>
                </div>
            </form>

            <h3 className="text-xl font-bold mb-4">Webhook Logs</h3>
            <div className="bg-white rounded shadow overflow-x-auto">
                <table data-test-id="webhook-logs-table" className="w-full">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-3 text-left">Event</th>
                            <th className="p-3 text-left">Status</th>
                            <th className="p-3 text-left">Attempts</th>
                            <th className="p-3 text-left">Last Attempt</th>
                            <th className="p-3 text-left">Response Code</th>
                            <th className="p-3 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map((log) => (
                            <tr key={log.id} data-test-id="webhook-log-item" data-webhook-id={log.id} className="border-b hover:bg-gray-50">
                                <td className="p-3" data-test-id="webhook-event">{log.event}</td>
                                <td className="p-3" data-test-id="webhook-status">
                                    <span className={`px-2 py-1 rounded text-sm ${log.status === 'success' ? 'bg-green-100 text-green-800' :
                                            log.status === 'failed' ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {log.status}
                                    </span>
                                </td>
                                <td className="p-3" data-test-id="webhook-attempts">{log.attempts}</td>
                                <td className="p-3" data-test-id="webhook-last-attempt">
                                    {log.last_attempt_at ? new Date(log.last_attempt_at).toLocaleString() : '-'}
                                </td>
                                <td className="p-3" data-test-id="webhook-response-code">{log.response_code || '-'}</td>
                                <td className="p-3">
                                    <button
                                        data-test-id="retry-webhook-button"
                                        data-webhook-id={log.id}
                                        onClick={() => handleRetry(log.id)}
                                        className="text-blue-600 hover:text-blue-800"
                                    >
                                        Retry
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {logs.length === 0 && (
                            <tr>
                                <td colSpan="6" className="p-4 text-center text-gray-500">No logs found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
