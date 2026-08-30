import React from "react";
import { useParams } from "react-router-dom";
import PageHeader from "../components/ui/PageHeader";
import EmptyState from "../components/ui/EmptyState";
import TableForm from "../modules/tables/TableForm";
import { useTableApi } from "../modules/tables/useTableApi";

const ManageTablesEdit = () => {
  const { id } = useParams();
  const { tables, loading, updateTable } = useTableApi();
  const table = tables.find((t) => t._id === id);

  return (
    <div>
      <PageHeader title="Edit Table" backTo="/Manage/Tables" />
      <div className="px-4 py-6 lg:px-8">
        {!loading && !table ? (
          <EmptyState title="Table not found" description="It may have already been deleted." />
        ) : table ? (
          <TableForm mode="edit" initialTable={table} onSubmit={(data) => updateTable(id, data)} />
        ) : null}
      </div>
    </div>
  );
};

export default ManageTablesEdit;
