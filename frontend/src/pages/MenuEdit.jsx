import React from "react";
import { useParams } from "react-router-dom";
import PageHeader from "../components/ui/PageHeader";
import EmptyState from "../components/ui/EmptyState";
import MenuItemForm from "../modules/menu/MenuItemForm";
import { useMenuApi } from "../modules/menu/useMenuApi";

const MenuEdit = () => {
  const { id } = useParams();
  const { foodData, loading, updateFoodItem } = useMenuApi();
  const food = foodData.find((f) => f._id === id);

  return (
    <div>
      <PageHeader title="Edit Menu Item" backTo="/Menu" />
      <div className="px-4 py-6 lg:px-8">
        {!loading && !food ? (
          <EmptyState title="Item not found" description="It may have already been deleted." />
        ) : food ? (
          <MenuItemForm mode="edit" initialFood={food} onSubmit={(formData) => updateFoodItem(id, formData)} />
        ) : null}
      </div>
    </div>
  );
};

export default MenuEdit;
