import React from "react";
import PageHeader from "../components/ui/PageHeader";
import TableForm from "../modules/tables/TableForm";
import { useTableApi } from "../modules/tables/useTableApi";

const ManageTablesNew = () => {
  const { addTable } = useTableApi();

  return (
    <div>
      <PageHeader title="Add Table" backTo="/Manage/Tables" />
      <div className="px-4 py-6 lg:px-8">
        <TableForm mode="create" onSubmit={addTable} />
      </div>
    </div>
  );
};

export default ManageTablesNew;
