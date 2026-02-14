"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    businessName: "",
    industry: "PHARMACY",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          businessName: formData.businessName,
          industry: formData.industry,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Signup failed");
        return;
      }

      // Redirect to login after successful signup
      router.push("/login");
    } catch (err) {
      setError("Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Sign Up for CreditLinker</h1>
      
      {error && <div style={{ color: "red" }}>{error}</div>}
      
      <form onSubmit={handleSignup}>
        <div>
          <label>Business Name:</label>
          <input
            type="text"
            value={formData.businessName}
            onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
            required
          />
        </div>

        <div>
          <label>Industry:</label>
          <select
            value={formData.industry}
            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
          >
            <option value="PHARMACY">Pharmacy</option>
            <option value="RETAIL">Retail</option>
            <option value="FOOD">Food & Beverage</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div>
          <label>Email:</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>

        <div>
          <label>Password:</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
        </div>

        <div>
          <label>Confirm Password:</label>
          <input
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Sign Up"}
        </button>
      </form>

      <p>
        Already have an account? <a href="/login">Login</a>
      </p>
    </div>
  );
}
