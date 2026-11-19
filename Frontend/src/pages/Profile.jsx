import { useState } from "react";
import { getErrorMessage } from "../api/client";
import { changePassword, updateMe } from "../api/services";
import {
  Alert,
  PageHeader,
  cardClass,
  inputClass,
  labelClass,
  primaryButton,
} from "../components/ui";

export default function Profile({ user, onUserUpdated }) {
  const isGuest = user.type === "guest";
  const [form, setForm] = useState({
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    phone: user.phone || "",
    nationality: user.nationality || "",
  });
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [profileStatus, setProfileStatus] = useState({ type: "", text: "" });
  const [passwordStatus, setPasswordStatus] = useState({ type: "", text: "" });
  const [busy, setBusy] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setBusy(true);
    setProfileStatus({ type: "", text: "" });
    try {
      // Staff can only change their name
      const body = isGuest
        ? form
        : { firstName: form.firstName, lastName: form.lastName };
      const updated = await updateMe(body);
      onUserUpdated({ ...updated, type: user.type, role: user.role });
      setProfileStatus({ type: "success", text: "Profile updated." });
    } catch (err) {
      setProfileStatus({ type: "error", text: getErrorMessage(err) });
    }
    setBusy(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setBusy(true);
    setPasswordStatus({ type: "", text: "" });
    try {
      await changePassword(passwords);
      setPasswords({ currentPassword: "", newPassword: "" });
      setPasswordStatus({ type: "success", text: "Password changed." });
    } catch (err) {
      setPasswordStatus({ type: "error", text: getErrorMessage(err) });
    }
    setBusy(false);
  };

  const changeForm = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const changePasswords = (e) =>
    setPasswords({ ...passwords, [e.target.name]: e.target.value });

  return (
    <section className="max-w-xl mx-auto space-y-6">
      <PageHeader
        eyebrow={isGuest ? "Guest account" : `Staff · ${user.role}`}
        title="Your profile"
      />

      <form onSubmit={handleSaveProfile} className={`${cardClass} space-y-4`}>
        <p className="text-sm text-slate-500">{user.email}</p>
        <Alert type={profileStatus.type || "error"}>{profileStatus.text}</Alert>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="profile-first-name" className={labelClass}>First name</label>
            <input id="profile-first-name" name="firstName" required value={form.firstName} onChange={changeForm} className={inputClass} />
          </div>
          <div>
            <label htmlFor="profile-last-name" className={labelClass}>Last name</label>
            <input id="profile-last-name" name="lastName" required value={form.lastName} onChange={changeForm} className={inputClass} />
          </div>
          {isGuest && (
            <>
              <div>
                <label htmlFor="profile-phone" className={labelClass}>Phone number</label>
                <input id="profile-phone" name="phone" type="tel" required value={form.phone} onChange={changeForm} className={inputClass} />
              </div>
              <div>
                <label htmlFor="profile-nationality" className={labelClass}>Nationality</label>
                <input id="profile-nationality" name="nationality" value={form.nationality} onChange={changeForm} className={inputClass} />
              </div>
            </>
          )}
        </div>

        <button type="submit" disabled={busy} className={primaryButton}>
          Save changes
        </button>
      </form>

      <form onSubmit={handleChangePassword} className={`${cardClass} space-y-4`}>
        <h2 className="font-bold text-slate-900">Change password</h2>
        <Alert type={passwordStatus.type || "error"}>{passwordStatus.text}</Alert>

        <div>
          <label htmlFor="current-password" className={labelClass}>Current password</label>
          <input id="current-password" name="currentPassword" type="password" required autoComplete="current-password" value={passwords.currentPassword} onChange={changePasswords} className={inputClass} />
        </div>
        <div>
          <label htmlFor="new-password" className={labelClass}>New password</label>
          <input id="new-password" name="newPassword" type="password" required autoComplete="new-password" value={passwords.newPassword} onChange={changePasswords} className={inputClass} />
          <p className="text-xs text-slate-400 mt-1">
            At least 8 characters, with a letter and a number.
          </p>
        </div>

        <button type="submit" disabled={busy} className={primaryButton}>
          Update password
        </button>
      </form>
    </section>
  );
}
