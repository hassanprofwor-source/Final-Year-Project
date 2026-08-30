import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Plus } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import DataTable from "../../components/ui/DataTable";
import RowActions from "../../components/ui/RowActions";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import StatCard from "../../components/ui/StatCard";
import ManageSubNav from "../tables/ManageSubNav";
import { useTimeSlotApi } from "./useTimeSlotApi";

const TimeSlotsList = () => {
  const navigate = useNavigate();
  const { timeSlots, loading, updateTimeSlot, deleteTimeSlot } = useTimeSlotApi();
  const [pendingDelete, setPendingDelete] = useState(null);

  const columns = [
    { key: "time", header: "Time" },
    {
      key: "enabled",
      header: "Status",
      render: (slot) => (
        <Badge tone={slot.enabled ? "completed" : "neutral"}>{slot.enabled ? "Available" : "Disabled"}</Badge>
      ),
    },
  ];

  const availableCount = timeSlots.filter((slot) => slot.enabled).length;

  return (
    <div>
      <PageHeader
        title="Manage"
        description="Manage tables, reservations, and time slots."
        actions={
          <Button as="link" to="/Manage/TimeSlots/new">
            <Plus className="h-4 w-4" /> Add Time Slot
          </Button>
        }
      />

      <div className="flex flex-col gap-6 px-4 py-6 lg:px-8">
        <ManageSubNav />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard label="Total Time Slots" value={timeSlots.length} icon={Clock} />
          <StatCard label="Available for booking" value={availableCount} icon={Clock} />
        </div>

        <DataTable
          columns={columns}
          data={timeSlots}
          loading={loading}
          emptyTitle="No time slots yet"
          emptyDescription="Add the hours customers can book a table."
          emptyAction={
            <Button as="link" to="/Manage/TimeSlots/new">
              <Plus className="h-4 w-4" /> Add Time Slot
            </Button>
          }
          onRowClick={(slot) => navigate(`/Manage/TimeSlots/${slot._id}/edit`)}
          actions={(slot) => (
            <RowActions
              items={[
                { label: "Edit", onClick: () => navigate(`/Manage/TimeSlots/${slot._id}/edit`) },
                {
                  label: slot.enabled ? "Disable" : "Enable",
                  onClick: () => updateTimeSlot(slot._id, { time: slot.time, enabled: !slot.enabled }),
                },
                { label: "Delete", danger: true, onClick: () => setPendingDelete(slot) },
              ]}
            />
          )}
        />
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => pendingDelete && deleteTimeSlot(pendingDelete._id)}
        title="Delete this time slot?"
        message={`${pendingDelete?.time} will no longer be offered for reservations.`}
      />
    </div>
  );
};

export default TimeSlotsList;
