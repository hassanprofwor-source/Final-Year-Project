import React, { useState } from "react";
import { Check, X } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import DataTable from "../../components/ui/DataTable";
import RowActions from "../../components/ui/RowActions";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Button from "../../components/ui/Button";
import { inputClass } from "../../components/ui/FormField";
import { useItemTypesApi } from "./useItemTypesApi";

const ItemTypesList = () => {
  const { itemTypes, loading, addItemType, updateItemType, deleteItemType } = useItemTypesApi();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);

  const handleAdd = async (e) => {
    e.preventDefault();
    await addItemType(newName.trim());
    setNewName("");
  };

  const startEdit = (type) => {
    setEditingId(type._id);
    setEditValue(type.name);
  };

  const saveEdit = async () => {
    if (editValue.trim()) {
      await updateItemType(editingId, editValue.trim());
    }
    setEditingId(null);
  };

  const columns = [
    {
      key: "name",
      header: "Name",
      render: (type) =>
        editingId === type._id ? (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <input
              autoFocus
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveEdit()}
              className={`${inputClass} max-w-xs`}
            />
            <button type="button" onClick={saveEdit} className="text-green">
              <Check className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => setEditingId(null)} className="text-red">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          type.name
        ),
    },
  ];

  return (
    <div>
      <PageHeader title="Item Types" description="Manage the item types used to classify menu items." backTo="/Menu" />

      <div className="px-4 py-6 lg:px-8">
        <form onSubmit={handleAdd} className="mb-6 flex gap-2">
          <input
            placeholder="e.g. Burger, Pizza, Drink"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className={`${inputClass} max-w-xs`}
          />
          <Button type="submit">Add Type</Button>
        </form>

        <DataTable
          columns={columns}
          data={itemTypes}
          loading={loading}
          emptyTitle="No item types yet"
          emptyDescription="Add your first item type above."
          actions={(type) => (
            <RowActions
              items={[
                { label: "Edit", onClick: () => startEdit(type) },
                { label: "Delete", danger: true, onClick: () => setPendingDelete(type) },
              ]}
            />
          )}
        />
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => pendingDelete && deleteItemType(pendingDelete._id)}
        title="Delete this item type?"
        message={`"${pendingDelete?.name}" will be permanently removed. This will fail if any menu items still use it.`}
      />
    </div>
  );
};

export default ItemTypesList;
