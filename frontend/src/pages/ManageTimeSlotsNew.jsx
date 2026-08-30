import React from "react";
import PageHeader from "../components/ui/PageHeader";
import TimeSlotForm from "../modules/timeslots/TimeSlotForm";
import { useTimeSlotApi } from "../modules/timeslots/useTimeSlotApi";

const ManageTimeSlotsNew = () => {
  const { addTimeSlot } = useTimeSlotApi();

  return (
    <div>
      <PageHeader title="Add Time Slot" backTo="/Manage/TimeSlots" />
      <div className="px-4 py-6 lg:px-8">
        <TimeSlotForm mode="create" onSubmit={addTimeSlot} />
      </div>
    </div>
  );
};

export default ManageTimeSlotsNew;
