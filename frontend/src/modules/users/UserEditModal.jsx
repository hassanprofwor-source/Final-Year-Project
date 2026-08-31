import React, { useEffect, useState } from "react";
import Modal from "../../components/ui/Modal";
import FormField, { inputClass } from "../../components/ui/FormField";
import Button from "../../components/ui/Button";

const emptyForm = {
  firstname: "",
  lastname: "",
  email: "",
  phone: "",
  gender: "",
  address: "",
};

const UserEditModal = ({ user, onClose, onSubmit }) => {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm({
      firstname: user.firstname || "",
      lastname: user.lastname || "",
      email: user.email || "",
      phone: user.phone || "",
      gender: user.gender || "",
      address: user.address || "",
    });
  }, [user]);

  if (!user) return null;

  const setField = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstname.trim() || !form.lastname.trim()) return;
    setSaving(true);
    try {
      await onSubmit(user._id, {
        firstname: form.firstname.trim(),
        lastname: form.lastname.trim(),
        phone: form.phone.trim(),
        gender: form.gender,
        address: form.address.trim(),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={!!user} onClose={onClose} title="Edit user">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="First name" htmlFor="user-firstname">
          <input
            id="user-firstname"
            required
            value={form.firstname}
            onChange={setField("firstname")}
            className={inputClass}
          />
        </FormField>
        <FormField label="Last name" htmlFor="user-lastname">
          <input
            id="user-lastname"
            required
            value={form.lastname}
            onChange={setField("lastname")}
            className={inputClass}
          />
        </FormField>
        <FormField label="Email" htmlFor="user-email" span={2}>
          <input id="user-email" value={form.email} readOnly className={`${inputClass} cursor-not-allowed opacity-70`} />
        </FormField>
        <FormField label="Phone" htmlFor="user-phone">
          <input
            id="user-phone"
            value={form.phone}
            onChange={setField("phone")}
            placeholder="0300-1234567"
            className={inputClass}
          />
        </FormField>
        <FormField label="Gender" htmlFor="user-gender">
          <select id="user-gender" value={form.gender} onChange={setField("gender")} className={inputClass}>
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </FormField>
        <FormField label="Address" htmlFor="user-address" span={2}>
          <textarea
            id="user-address"
            rows={3}
            value={form.address}
            onChange={setField("address")}
            className={`${inputClass} resize-none`}
          />
        </FormField>
        <div className="col-span-1 flex justify-end gap-2 sm:col-span-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default UserEditModal;
