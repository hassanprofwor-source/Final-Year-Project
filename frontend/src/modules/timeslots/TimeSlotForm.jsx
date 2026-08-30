import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import FormField, { inputClass } from "../../components/ui/FormField";
import Button from "../../components/ui/Button";
import Section from "../../components/ui/Section";

const TimeSlotForm = ({ mode, initialSlot, onSubmit }) => {
  const navigate = useNavigate();
  const [slotData, setSlotData] = useState({
    time: initialSlot?.time ?? "12:00",
    enabled: initialSlot?.enabled !== false,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(slotData);
      navigate("/Manage/TimeSlots");
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Section title="Time slot">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Time" htmlFor="time">
            <input
              id="time"
              name="time"
              type="time"
              value={slotData.time}
              onChange={(e) => setSlotData((prev) => ({ ...prev, time: e.target.value }))}
              required
              className={inputClass}
            />
          </FormField>

          <FormField label="Availability" htmlFor="enabled">
            <label className="flex items-center gap-3 py-2.5 text-sm text-white">
              <input
                id="enabled"
                type="checkbox"
                checked={slotData.enabled}
                onChange={(e) => setSlotData((prev) => ({ ...prev, enabled: e.target.checked }))}
                className="h-4 w-4 accent-red"
              />
              Available for booking
            </label>
          </FormField>
        </div>
      </Section>

      <div className="flex justify-end gap-3">
        <Button as="link" to="/Manage/TimeSlots" variant="secondary">
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : mode === "create" ? "Add Time Slot" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
};

export default TimeSlotForm;
