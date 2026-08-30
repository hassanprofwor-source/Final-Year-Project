import React, { useMemo, useState } from "react";
import { MessageSquare, MessageSquareText } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import DataTable from "../../components/ui/DataTable";
import RowActions from "../../components/ui/RowActions";
import Badge from "../../components/ui/Badge";
import Tabs from "../../components/ui/Tabs";
import StatCard from "../../components/ui/StatCard";
import { useReviewsApi } from "./useReviewsApi";
import ReplyModal from "./ReplyModal";

const ReviewsList = () => {
  const { reviews, loading, replyToReview } = useReviewsApi();
  const [status, setStatus] = useState("pending");
  const [activeReview, setActiveReview] = useState(null);

  const pending = reviews.filter((r) => r.completed === false);
  const reviewed = reviews.filter((r) => r.completed === true);
  const data = status === "pending" ? pending : reviewed;

  const columns = useMemo(
    () => [
      {
        key: "customer",
        header: "Customer",
        render: (r) => (
          <div>
            <p className="font-semibold">{r.email}</p>
            <p className="text-xs text-gray">{r.phone}</p>
          </div>
        ),
      },
      {
        key: "rating",
        header: "Rating",
        render: (r) => <span className="font-semibold">{r.rating ? `${r.rating}/5` : "—"}</span>,
      },
      {
        key: "feedback",
        header: "Feedback",
        render: (r) => <span className="line-clamp-2 max-w-md">{r.feedback}</span>,
      },
      {
        key: "status",
        header: "Status",
        render: (r) => <Badge tone={r.completed ? "completed" : "pending"}>{r.completed ? "Replied" : "Pending"}</Badge>,
      },
    ],
    []
  );

  return (
    <div>
      <PageHeader title="Reviews" description="Read customer feedback and reply to open reviews." />

      <div className="px-4 py-6 lg:px-8">
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard label="Pending" value={pending.length} icon={MessageSquare} />
          <StatCard label="Replied" value={reviewed.length} icon={MessageSquareText} />
        </div>

        <div className="mb-4">
          <Tabs
            tabs={[
              { value: "pending", label: "Pending" },
              { value: "reviewed", label: "Reviewed" },
            ]}
            active={status}
            onChange={setStatus}
          />
        </div>

        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          onRowClick={(r) => setActiveReview(r)}
          actions={(r) => (
            <RowActions
              items={[{ label: r.completed ? "View Reply" : "Reply", onClick: () => setActiveReview(r) }]}
            />
          )}
          emptyTitle={status === "pending" ? "No pending reviews" : "No replied reviews yet"}
          emptyDescription={
            status === "pending" ? "New feedback will show up here." : "Replies you send will appear here."
          }
        />
      </div>

      <ReplyModal review={activeReview} onClose={() => setActiveReview(null)} onSubmit={replyToReview} />
    </div>
  );
};

export default ReviewsList;
