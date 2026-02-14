"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useSession } from "next-auth/react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    businessName: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (session?.user) {
      setFormData((prev) => ({
        ...prev,
        businessName: session.user.businessName || "",
        email: session.user.email || "",
      }));
    }
  }, [session]);

  const handleUpdateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/settings/business", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName: formData.businessName }),
      });

      const result = await response.json();
      if (result.success) {
        setMessage("Business updated successfully");
      } else {
        setMessage("Error: " + result.error);
      }
    } catch (error) {
      setMessage("Failed to update business");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage("Passwords don't match");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/settings/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setMessage("Password updated successfully");
        setFormData((prev) => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));
      } else {
        setMessage("Error: " + result.error);
      }
    } catch (error) {
      setMessage("Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <h1>Settings</h1>

      {message && <div>{message}</div>}

      <section>
        <h2>Business Information</h2>
        <form onSubmit={handleUpdateBusiness}>
          <div>
            <label>Business Name:</label>
            <input
              type="text"
              value={formData.businessName}
              onChange={(e) =>
                setFormData({ ...formData, businessName: e.target.value })
              }
            />
          </div>
          <div>
            <label>Email:</label>
            <input type="email" value={formData.email} disabled />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Update Business"}
          </button>
        </form>
      </section>

      <section>
        <h2>Change Password</h2>
        <form onSubmit={handleChangePassword}>
          <div>
            <label>Current Password:</label>
            <input
              type="password"
              value={formData.currentPassword}
              onChange={(e) =>
                setFormData({ ...formData, currentPassword: e.target.value })
              }
            />
          </div>
          <div>
            <label>New Password:</label>
            <input
              type="password"
              value={formData.newPassword}
              onChange={(e) =>
                setFormData({ ...formData, newPassword: e.target.value })
              }
            />
          </div>
          <div>
            <label>Confirm New Password:</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? "Updating..." : "Change Password"}
          </button>
        </form>
      </section>
    </DashboardLayout>
  );
}
