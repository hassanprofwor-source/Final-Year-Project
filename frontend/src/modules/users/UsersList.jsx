import React, { useMemo, useState } from "react";
import { Users as UsersIcon, User } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import DataTable from "../../components/ui/DataTable";
import StatCard from "../../components/ui/StatCard";
import { useUsersApi } from "./useUsersApi";
import { optimizedImageUrl } from "../../lib/media";

const UsersList = () => {
  const { users, loading } = useUsersApi();
  const [search, setSearch] = useState("");

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
      <PageHeader title="Users" description="Browse registered customer accounts." />

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
        />
      </div>
    </div>
  );
};

export default UsersList;
