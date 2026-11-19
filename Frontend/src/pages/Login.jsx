import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { getErrorMessage } from "../api/client";
import { login, staffLogin } from "../api/services";
import {
  Alert,
  PageHeader,
  cardClass,
  inputClass,
  labelClass,
  primaryButton,
} from "../components/ui";

export default function Login({ onLoggedIn }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [isStaff, setIsStaff] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { token, user } = isStaff
        ? await staffLogin(form)
        : await login(form);
      onLoggedIn(token, {
        ...user,
        type: isStaff ? "staff" : "guest",
        role: isStaff ? user.role : "guest",
      });
      // Go back to the page that asked for login, if there was one
      const nextPage = location.state?.from || (isStaff ? "/staff" : "/");
      navigate(nextPage, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <section className="max-w-md mx-auto space-y-6">
      <PageHeader
        eyebrow={isStaff ? "Hotel staff" : "Welcome back"}
        title="Log in"
      />

      <form onSubmit={handleSubmit} className={`${cardClass} space-y-4`}>
        <Alert>{error}</Alert>

        <div>
          <label htmlFor="login-email" className={labelClass}>
            Email
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="login-password" className={labelClass}>
            Password
          </label>
          <input
            id="login-password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            value={form.password}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`${primaryButton} w-full`}
        >
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>

      <div className="text-center text-xs text-slate-500 space-y-2">
        {!isStaff && (
          <p>
            New here?{" "}
            <Link
              to="/register"
              state={location.state}
              className="font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Create an account
            </Link>
          </p>
        )}
        <button
          type="button"
          onClick={() => {
            setIsStaff(!isStaff);
            setError("");
          }}
          className="font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          {isStaff ? "Are you a guest? Log in here" : "Hotel staff? Log in here"}
        </button>
      </div>
    </section>
  );
}
