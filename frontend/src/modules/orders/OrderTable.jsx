import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PackageCheck, Clock, Truck } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import DataTable from "../../components/ui/DataTable";
import RowActions from "../../components/ui/RowActions";
import Badge from "../../components/ui/Badge";
import Tabs from "../../components/ui/Tabs";
import StatCard from "../../components/ui/StatCard";
import { useOrders } from "./useOrders";
import { formatMoney } from "../../lib/currency";

const statusTone = { Pending: "pending", Accepted: "accepted", Completed: "completed" };

const generateTimeSlots = () => {
  const timeSlots = [];
  for (let hour = 12; hour <= 22; hour++) {
    const hourString = hour < 10 ? `0${hour}` : `${hour}`;
    timeSlots.push(`${hourString}:00`);
  }
  return timeSlots;
};

const OrderTable = ({ orderType }) => {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Pending");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const basePath = orderType === "Delivery" ? "/Delivery" : "/DineIn";

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { orders, counts, loading, updateOrderStatus, deleteOrder } = useOrders({
    orderType,
    status,
    search: debouncedSearch,
    time: orderType === "Dine In" ? selectedTime : "",
  });

  const columns = [
    {
      key: "customer",
      header: "Customer",
      render: (o) => (
        <div>
          <p className="font-semibold">{o.phone}</p>
          <p className="text-xs text-gray">{o.email}</p>
        </div>
      ),
    },
    ...(orderType === "Dine In"
      ? [
          {
            key: "reservation",
            header: "Reservation",
            render: (o) => (
              <div className="text-sm">
                <p>{o.date} · {o.time}</p>
                <p className="text-xs text-gray">Table {o.tableNumber} · {o.people} people</p>
              </div>
            ),
          },
        ]
      : [
          {
            key: "address",
            header: "Address",
            render: (o) => <span className="line-clamp-1 max-w-xs">{o.address}</span>,
          },
        ]),
    { key: "items", header: "Items", render: (o) => `${o.cartItems?.length || 0} item(s)` },
    { key: "total", header: "Total", render: (o) => formatMoney(o.total?.toFixed(2)) },
    { key: "payment", header: "Payment", render: (o) => o.payment },
    {
      key: "status",
      header: "Status",
      render: (o) => <Badge tone={statusTone[o.status]}>{o.status}</Badge>,
    },
  ];

  const rowActionItems = (order) => {
    const items = [{ label: "View Details", onClick: () => navigate(`${basePath}/${order._id}`) }];
    if (order.status === "Pending") {
      items.push({ label: "Accept", onClick: () => updateOrderStatus(order._id, "Accepted") });
      items.push({ label: "Reject", danger: true, onClick: () => deleteOrder(order._id) });
    }
    if (order.status === "Accepted") {
      items.push({
        label: orderType === "Delivery" ? "Mark as Delivered" : "Mark as Completed",
        onClick: () => updateOrderStatus(order._id, "Completed"),
      });
    }
    return items;
  };

  return (
    <div>
      <PageHeader
        title={orderType === "Delivery" ? "Delivery Orders" : "Dine-In Orders"}
        description={
          orderType === "Delivery"
            ? "Track and fulfill delivery orders."
            : "Track dine-in orders by status, time slot, and phone."
        }
      />

      <div className="px-4 py-6 lg:px-8">
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Pending" value={counts.Pending} icon={Clock} />
          <StatCard label="Accepted" value={counts.Accepted} icon={Truck} />
          <StatCard label="Completed" value={counts.Completed} icon={PackageCheck} />
        </div>

        <div className="mb-4">
          <Tabs
            tabs={[
              { value: "Pending", label: "Pending" },
              { value: "Accepted", label: "Accepted" },
              { value: "Completed", label: "Completed" },
            ]}
            active={status}
            onChange={setStatus}
          />
        </div>

        {orderType === "Dine In" && (
          <div className="mb-4">
            <Tabs
              tabs={[{ value: "", label: "All Times" }, ...generateTimeSlots().map((t) => ({ value: t, label: t }))]}
              active={selectedTime}
              onChange={setSelectedTime}
            />
          </div>
        )}

        <DataTable
          columns={columns}
          data={orders}
          loading={loading}
          onRowClick={(order) => navigate(`${basePath}/${order._id}`)}
          actions={(order) => <RowActions items={rowActionItems(order)} />}
          emptyTitle="No orders here"
          emptyDescription={`There are no ${status.toLowerCase()} ${orderType.toLowerCase()} orders right now.`}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by phone number..."
        />
      </div>
    </div>
  );
};

export default OrderTable;
