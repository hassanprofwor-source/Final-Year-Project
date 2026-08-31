import React, { useMemo, useState } from "react";
import { Users as UsersIcon, User } from "lucide-react";
import { useUser } from "@clerk/react";
import PageHeader from "../../components/ui/PageHeader";
import DataTable from "../../components/ui/DataTable";
import StatCard from "../../components/ui/StatCard";
import RowActions from "../../components/ui/RowActions";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { useUsersApi } from "./useUsersApi";
import UserEditModal from "./UserEditModal";
import { optimizedImageUrl } from "../../lib/media";

const UsersList = () => {
  const { user: clerkUser } = useUser();
  const { users, loading, updateUser, deleteUser } = useUsersApi();
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const currentEmail = clerkUser?.primaryEmailAddress?.emailAddress?.toLowerCase();

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter((u) => {
      const name = `${u.firstname || ""} ${u.lastname || ""}`.toLowerCase();
      return name.includes(term) || u.email?.toLowerCase().includes(term);
    });
  }, [users, search]);

  const columns = [
    {
      key: "avatar",
      header: "",
      className: "w-14",
      render: (u) =>
        u.image?.url ? (
          <img src={optimizedImageUrl(u.image.url, 80)} alt="" loading="lazy" className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray/20">
            <User className="h-5 w-5 text-gray" />
          </div>
        ),
    },
    {
      key: "name",
      header: "Name",
      render: (u) => `${u.firstname || ""} ${u.lastname || ""}`.trim() || "—",
    },
    { key: "email", header: "Email" },
    { key: "phone", header: "Phone", render: (u) => u.phone || "—" },
    { key: "gender", header: "Gender", render: (u) => u.gender || "—" },
    { key: "address", header: "Address", render: (u) => u.address || "—" },
  ];

  return (
    <div>
      <PageHeader title="Users" description="View, edit, and remove customer accounts." />

      <div className="px-4 py-6 lg:px-8">
        <div className="mb-6">
          <StatCard label="Total Users" value={users.length} icon={UsersIcon} />
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          loading={loading}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by name or email..."
          emptyTitle="No users yet"
          emptyDescription="Registered customers will show up here."
          actions={(u) => {
            const isSelf = currentEmail && u.email?.toLowerCase() === currentEmail;
            return (
              <RowActions
                items={[
                  { label: "Edit", onClick: () => setEditingUser(u) },
                  ...(!isSelf ? [{ label: "Delete", danger: true, onClick: () => setPendingDelete(u) }] : []),
                ]}
              />
            );
          }}
        />
      </div>

      <UserEditModal user={editingUser} onClose={() => setEditingUser(null)} onSubmit={updateUser} />

      <ConfirmDialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => pendingDelete && deleteUser(pendingDelete._id)}
        title="Delete this user?"
        message={`${pendingDelete?.firstname || ""} ${pendingDelete?.lastname || ""} (${pendingDelete?.email || ""}) will be removed from Skyplate and Clerk. This cannot be undone.`}
      />
    </div>
  );
};

export default UsersList;
