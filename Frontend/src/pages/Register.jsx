import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { getErrorMessage } from "../api/client";
import { register } from "../api/services";
import {
  Alert,
  PageHeader,
  cardClass,
  inputClass,
  labelClass,
  primaryButton,
} from "../components/ui";

const FIELDS = [
  { name: "firstName", label: "First name", type: "text", autoComplete: "given-name" },
  { name: "lastName", label: "Last name", type: "text", autoComplete: "family-name" },
  { name: "email", label: "Email", type: "email", autoComplete: "email" },
  { name: "phone", label: "Phone number", type: "tel", autoComplete: "tel" },
  { name: "password", label: "Password", type: "password", autoComplete: "new-password" },
];

export default function Register({ onLoggedIn }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { token, user } = await register(form);
      onLoggedIn(token, { ...user, type: "guest", role: "guest" });
      navigate(location.state?.from || "/", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <section className="max-w-md mx-auto space-y-6">
      <PageHeader eyebrow="Keyless Flow" title="Create your account" />

      <form onSubmit={handleSubmit} className={`${cardClass} space-y-4`}>
        <Alert>{error}</Alert>

        {FIELDS.map((field) => (
          <div key={field.name}>
            <label htmlFor={`register-${field.name}`} className={labelClass}>
              {field.label}
            </label>
            <input
              id={`register-${field.name}`}
              name={field.name}
              type={field.type}
              required
              autoComplete={field.autoComplete}
              value={form[field.name]}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
        ))}
        <p className="text-xs text-slate-400 -mt-2">
          At least 8 characters, with a letter and a number.
        </p>

        <button
          type="submit"
          disabled={loading}
          className={`${primaryButton} w-full`}
        >
          {loading ? "Creating account..." : "Sign up"}
        </button>
      </form>

      <p className="text-center text-xs text-slate-500">
        Already have an account?{" "}
        <Link
          to="/login"
          state={location.state}
          className="font-semibold text-indigo-600 hover:text-indigo-700"
        >
          Log in
        </Link>
      </p>
    </section>
  );
}
