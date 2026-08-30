import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../components/ui/PageHeader";
import Section from "../../components/ui/Section";
import EmptyState from "../../components/ui/EmptyState";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { useOrders } from "./useOrders";
import { optimizedImageUrl } from "../../lib/media";

const statusTone = { Pending: "pending", Accepted: "accepted", Completed: "completed" };
const basePathFor = (orderType) => (orderType === "Delivery" ? "/Delivery" : "/DineIn");

const OrderDetail = ({ orderType }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { orders, loading, updateOrderStatus, deleteOrder } = useOrders();

  const order = orders.find((o) => o._id === id);

  if (!loading && !order) {
    return (
      <div>
        <PageHeader title="Order not found" backTo={basePathFor(orderType)} />
        <div className="px-4 py-6 lg:px-8">
          <EmptyState title="This order no longer exists" description="It may have already been removed." />
        </div>
      </div>
    );
  }

  if (!order) return null;

  const handleAccept = () => updateOrderStatus(order._id, "Accepted");
  const handleReject = () => {
    deleteOrder(order._id);
    navigate(basePathFor(orderType));
  };
  const handleDeliver = () => updateOrderStatus(order._id, "Completed");

  return (
    <div>
      <PageHeader
        title={`Order · ${order.phone}`}
        description={`${orderType} order`}
        backTo={basePathFor(orderType)}
        actions={<Badge tone={statusTone[order.status]}>{order.status}</Badge>}
      />

      <div className="grid grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-3 lg:px-8">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Section title="Customer">
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
              <div>
                <dt className="text-gray">Email</dt>
                <dd className="text-white">{order.email}</dd>
              </div>
              <div>
                <dt className="text-gray">Phone</dt>
                <dd className="text-white">{order.phone}</dd>
              </div>
              <div>
                <dt className="text-gray">Payment</dt>
                <dd className="text-white">{order.payment}</dd>
              </div>
              {orderType === "Delivery" && (
                <div className="sm:col-span-2">
                  <dt className="text-gray">Address</dt>
                  <dd className="text-white">{order.address}</dd>
                </div>
              )}
              {orderType === "Dine In" && (
                <>
                  <div>
                    <dt className="text-gray">Date &amp; Time</dt>
                    <dd className="text-white">{order.date} · {order.time}</dd>
                  </div>
                  <div>
                    <dt className="text-gray">Table / People</dt>
                    <dd className="text-white">Table {order.tableNumber} · {order.people} people</dd>
                  </div>
                </>
              )}
            </dl>
          </Section>

          <Section title="Items">
            <div className="flex flex-col gap-3">
              {order.cartItems.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <img
                    src={optimizedImageUrl(item.image, 96) || "/default-food.png"}
                    alt={item.name}
                    className="h-12 w-12 rounded border-2 border-red object-cover"
                    loading="lazy"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">
                      <span className="text-red">[{item.size?.toUpperCase()}]</span> {item.name} x{item.quantity}
                    </p>
                    <p className="text-xs text-gray">Rs {item.price.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t border-gray/20 pt-4 text-right">
              <span className="text-lg font-bold text-white">
                Total: <span className="text-red">Rs {order.total.toFixed(2)}</span>
              </span>
            </div>
          </Section>
        </div>

        <Section title="Actions" className="h-fit">
          <div className="flex flex-col gap-3">
            {order.status === "Pending" && (
              <>
                <Button onClick={handleAccept}>Accept Order</Button>
                <Button variant="outline" onClick={handleReject}>
                  Reject Order
                </Button>
              </>
            )}
            {order.status === "Accepted" && (
              <Button onClick={handleDeliver}>
                {orderType === "Delivery" ? "Mark as Delivered" : "Mark as Completed"}
              </Button>
            )}
            {order.status === "Completed" && (
              <Button variant="secondary" disabled>
                Completed ✔
              </Button>
            )}
          </div>
        </Section>
      </div>
    </div>
  );
};

export default OrderDetail;
