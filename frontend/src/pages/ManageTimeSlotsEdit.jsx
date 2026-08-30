import React from "react";
import { useParams } from "react-router-dom";
import PageHeader from "../components/ui/PageHeader";
import EmptyState from "../components/ui/EmptyState";
import TimeSlotForm from "../modules/timeslots/TimeSlotForm";
import { useTimeSlotApi } from "../modules/timeslots/useTimeSlotApi";

const ManageTimeSlotsEdit = () => {
  const { id } = useParams();
  const { timeSlots, loading, updateTimeSlot } = useTimeSlotApi();
  const slot = timeSlots.find((item) => item._id === id);

  return (
    <div>
      <PageHeader title="Edit Time Slot" backTo="/Manage/TimeSlots" />
      <div className="px-4 py-6 lg:px-8">
        {!loading && !slot ? (
          <EmptyState title="Time slot not found" description="It may have already been deleted." />
        ) : slot ? (
          <TimeSlotForm mode="edit" initialSlot={slot} onSubmit={(data) => updateTimeSlot(id, data)} />
        ) : null}
      </div>
    </div>
  );
};

export default ManageTimeSlotsEdit;
