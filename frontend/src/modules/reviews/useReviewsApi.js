import { useEffect, useState } from "react";
import apiClient from "../../lib/apiClient";
import { toast } from "react-toastify";

const apiUrl = import.meta.env.VITE_SERVER_URL;

export const useReviewsApi = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`${apiUrl}/api/v1/feedback/getfeedbacks`);
      setReviews(response.data.data);
    } catch (error) {
      console.error(error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const replyToReview = async (review, replyText) => {
    if (!replyText) {
      toast.error("Feedback Response is Empty");
      throw new Error("Feedback Response is Empty");
    }

    const subject = "Feedback Response";
    const message = `Dear Mr/Ms.\n${replyText}\n\nBest Regards,\nSkyplate\nTel:+92 309 1698674\nEmail: hassanprofwork@gmail.com`;

    try {
      const response = await apiClient.post(`${apiUrl}/api/v1/feedback/sendemail`, {
        email: review.email,
        subject,
        message,
      });

      if (!response.data.success) {
        toast.error("Failed to send email");
        throw new Error("Failed to send email");
      }
    } catch (error) {
      if (error.message !== "Failed to send email") {
        toast.error(error.response?.data?.message || "Failed to send email");
      }
      throw error;
    }

    try {
      await apiClient.put(
        `${apiUrl}/api/v1/feedback/updatefeedback/${review._id}`,
        { response: replyText },
        { headers: { "Content-Type": "application/json" } }
      );
      fetchFeedbacks();
      toast.success("Replied to the Feedback successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save reply");
      throw error;
    }
  };

  return { reviews, loading, fetchFeedbacks, replyToReview };
};
