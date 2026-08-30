import React, { useEffect, useState } from "react";
import Modal from "../../components/ui/Modal";

const ReplyModal = ({ review, onClose, onSubmit }) => {
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setReplyText("");
  }, [review?._id]);

  if (!review) return null;

  const isCompleted = review.completed === true;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit(review, replyText);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={!!review} onClose={onClose} title={isCompleted ? "Review" : "Reply to Review"}>
      <div className="flex flex-col gap-3 text-left text-sm text-white">
        <p>
          <strong className="text-red">Email:</strong> {review.email}
        </p>
        <p>
          <strong className="text-red">Phone:</strong> {review.phone}
        </p>
        <p>
          <strong className="text-red">Review:</strong> {review.feedback}
        </p>

        {isCompleted ? (
          <p>
            <strong className="text-red">Reply:</strong> {review.response}
          </p>
        ) : (
          <>
            <textarea
              placeholder="Reply to customer..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="h-24 w-full resize-none rounded-xl border border-white/10 bg-elevated p-3 text-sm text-white placeholder:text-gray/70 focus:outline-none focus:ring-2 focus:ring-red/60"
            />
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="ml-auto rounded-xl bg-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-red/90"
            >
              {submitting ? "Sending..." : "Send Reply"}
            </button>
          </>
        )}
      </div>
    </Modal>
  );
};

export default ReplyModal;
