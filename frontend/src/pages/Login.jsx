
export default function Login() {
  const handleSubmit = (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    if (email !== "test@example.com") {
      alert("Invalid merchant email");
      return;
    }

    localStorage.setItem("API_KEY", "key_test_abc123");
    localStorage.setItem("API_SECRET", "secret_test_xyz789");

    window.location.href = "/dashboard";
  };

  return (
    <div className="login-wrapper">
      <form
        className="login-form"
        data-test-id="login-form"
        onSubmit={handleSubmit}
      >
        <h2>Merchant Login</h2>

        <input
          data-test-id="email-input"
          name="email"
          type="email"
          placeholder="Email"
          required
        />

        <input
          data-test-id="password-input"
          name="password"
          type="password"
          placeholder="Password"
          required
        />

        <button data-test-id="login-button">Login</button>
      </form>
    </div>
  );
}
