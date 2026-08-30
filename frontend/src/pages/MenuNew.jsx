import React from "react";
import PageHeader from "../components/ui/PageHeader";
import MenuItemForm from "../modules/menu/MenuItemForm";
import { useMenuApi } from "../modules/menu/useMenuApi";

const MenuNew = () => {
  const { addFoodItem } = useMenuApi();

  return (
    <div>
      <PageHeader title="Add Menu Item" backTo="/Menu" />
      <div className="px-4 py-6 lg:px-8">
        <MenuItemForm mode="create" onSubmit={addFoodItem} />
      </div>
    </div>
  );
};

export default MenuNew;
