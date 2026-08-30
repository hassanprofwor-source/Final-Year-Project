import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, UtensilsCrossed, Tags } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import DataTable from "../../components/ui/DataTable";
import RowActions from "../../components/ui/RowActions";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Button from "../../components/ui/Button";
import StatCard from "../../components/ui/StatCard";
import Badge from "../../components/ui/Badge";
import { useMenuApi } from "./useMenuApi";
import { optimizedImageUrl } from "../../lib/media";

const formatPrice = (food) => {
  const prices = food.prices?.map((p) => Number(p.price)).filter((n) => !Number.isNaN(n)) || [];
  if (prices.length === 0) return "—";
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? `Rs ${min}` : `Rs ${min} - ${max}`;
};

const MAX_WEATHER_BADGES = 2;

const MenuList = () => {
  const navigate = useNavigate();
  const { foodData, loading, deleteFoodItem } = useMenuApi();
  const [search, setSearch] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return foodData;
    return foodData.filter(
      (food) =>
        food.name?.toLowerCase().includes(term) ||
        food.type?.name?.toLowerCase().includes(term)
    );
  }, [foodData, search]);

  const columns = [
    {
      key: "image",
      header: "",
      className: "w-16",
      render: (food) => (
        <img src={optimizedImageUrl(food.image?.url, 96)} alt="" loading="lazy" className="h-12 w-12 rounded-lg object-cover" />
      ),
    },
    { key: "name", header: "Name" },
    { key: "type", header: "Type", render: (food) => food.type?.name || "—" },
    {
      key: "weather",
      header: "Weather",
      render: (food) => {
        const tags = food.weatherConditions || [];
        if (tags.length === 0) return "—";
        const visible = tags.slice(0, MAX_WEATHER_BADGES);
        const overflow = tags.length - visible.length;
        return (
          <div className="flex flex-wrap gap-1">
            {visible.map((tag) => (
              <Badge key={tag} tone="neutral">
                {tag}
              </Badge>
            ))}
            {overflow > 0 && <Badge tone="neutral">+{overflow}</Badge>}
          </div>
        );
      },
    },
    { key: "price", header: "Price", render: (food) => formatPrice(food) },
  ];

  return (
    <div>
      <PageHeader
        title="Menu"
        description="Manage the food and drink items available on Skyplate."
        actions={
          <>
            <Button as="link" to="/Menu/Types" variant="secondary">
              <Tags className="h-4 w-4" /> Manage Types
            </Button>
            <Button as="link" to="/Menu/new">
              <Plus className="h-4 w-4" /> Add Menu Item
            </Button>
          </>
        }
      />

      <div className="px-4 py-6 lg:px-8">
        <div className="mb-6">
          <StatCard label="Total Items" value={foodData.length} icon={UtensilsCrossed} />
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          loading={loading}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by name or type..."
          emptyTitle="No menu items yet"
          emptyDescription="Add your first item to start building the menu."
          emptyAction={
            <Button as="link" to="/Menu/new">
              <Plus className="h-4 w-4" /> Add Menu Item
            </Button>
          }
          onRowClick={(food) => navigate(`/Menu/${food._id}/edit`)}
          actions={(food) => (
            <RowActions
              items={[
                { label: "Edit", onClick: () => navigate(`/Menu/${food._id}/edit`) },
                { label: "Delete", danger: true, onClick: () => setPendingDelete(food) },
              ]}
            />
          )}
        />
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => pendingDelete && deleteFoodItem(pendingDelete._id)}
        title="Delete this item?"
        message={`"${pendingDelete?.name}" will be permanently removed from the menu.`}
      />
    </div>
  );
};

export default MenuList;
