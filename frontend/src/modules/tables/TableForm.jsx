import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import FormField, { inputClass } from "../../components/ui/FormField";
import Button from "../../components/ui/Button";
import Section from "../../components/ui/Section";

const TableForm = ({ mode, initialTable, onSubmit }) => {
  const navigate = useNavigate();
  const [tableData, setTableData] = useState({
    number: initialTable?.number ?? "",
    capacity: initialTable?.capacity ?? "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTableData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(tableData);
      navigate("/Manage/Tables");
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Section title="Table details">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Table No." htmlFor="number">
            <input
              onKeyPress={(event) => {
                if (!/[0-9]/.test(event.key)) event.preventDefault();
              }}
              id="number"
              name="number"
              placeholder="Table Number"
              value={tableData.number}
              onChange={handleChange}
              required
              type="number"
              className={inputClass}
            />
          </FormField>

          <FormField label="Table Capacity" htmlFor="capacity">
            <input
              onKeyPress={(event) => {
                if (!/[0-9]/.test(event.key)) event.preventDefault();
              }}
              id="capacity"
              name="capacity"
              placeholder="Enter Capacity"
              value={tableData.capacity}
              onChange={handleChange}
              required
              className={inputClass}
            />
          </FormField>
        </div>
      </Section>

      <div className="flex justify-end gap-3">
        <Button as="link" to="/Manage/Tables" variant="secondary">
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : mode === "create" ? "Add Table" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
};

export default TableForm;
