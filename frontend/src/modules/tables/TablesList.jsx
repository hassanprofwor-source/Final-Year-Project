import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Table2, Users } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import DataTable from "../../components/ui/DataTable";
import RowActions from "../../components/ui/RowActions";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Button from "../../components/ui/Button";
import StatCard from "../../components/ui/StatCard";
import ManageSubNav from "./ManageSubNav";
import ReservationPanel from "./ReservationPanel";
import { useTableApi } from "./useTableApi";

const TablesList = () => {
  const navigate = useNavigate();
  const { tables, loading, deleteTable } = useTableApi();
  const [pendingDelete, setPendingDelete] = useState(null);

  const columns = [
    { key: "number", header: "Table No.", render: (t) => `Table ${t.number}` },
    { key: "capacity", header: "Capacity", render: (t) => `${t.capacity} seats` },
  ];

  const totalCapacity = tables.reduce((sum, t) => sum + Number(t.capacity || 0), 0);

  return (
    <div>
      <PageHeader
        title="Manage"
        description="Manage tables, reservations, and time slots."
        actions={
          <Button as="link" to="/Manage/Tables/new">
            <Plus className="h-4 w-4" /> Add Table
          </Button>
        }
      />

      <div className="flex flex-col gap-6 px-4 py-6 lg:px-8">
        <ManageSubNav />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard label="Total Tables" value={tables.length} icon={Table2} />
          <StatCard label="Total Seating Capacity" value={totalCapacity} icon={Users} />
        </div>

        <ReservationPanel tables={tables} />

        <div>
          <h2 className="mb-4 text-lg font-semibold text-white">All Tables</h2>
          <DataTable
            columns={columns}
            data={tables}
            loading={loading}
            emptyTitle="No tables yet"
            emptyDescription="Add your first table to start taking reservations."
            emptyAction={
              <Button as="link" to="/Manage/Tables/new">
                <Plus className="h-4 w-4" /> Add Table
              </Button>
            }
            onRowClick={(t) => navigate(`/Manage/Tables/${t._id}/edit`)}
            actions={(t) => (
              <RowActions
                items={[
                  { label: "Edit", onClick: () => navigate(`/Manage/Tables/${t._id}/edit`) },
                  { label: "Delete", danger: true, onClick: () => setPendingDelete(t) },
                ]}
              />
            )}
          />
        </div>
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => pendingDelete && deleteTable(pendingDelete._id)}
        title="Delete this table?"
        message={`Table ${pendingDelete?.number} will be permanently removed.`}
      />
    </div>
  );
};

export default TablesList;
