import { useEffect, useState } from "react";
import apiClient from "../../lib/apiClient";
import { toast } from "react-toastify";
import { CURRENCY_SYMBOL } from "../../lib/currency";

const apiUrl = import.meta.env.VITE_SERVER_URL;

export const useMenuApi = () => {
  const [foodData, setFoodData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFoodData = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`${apiUrl}/api/v1/menu/getFood`);
      if (response.data.success) {
        setFoodData(response.data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFoodData();
  }, []);

  const addFoodItem = async (formData) => {
    const formDataPayload = new FormData();
    formDataPayload.append("foodimage", formData.image);
    formDataPayload.append("name", formData.name);
    formDataPayload.append("description", formData.description);
    formDataPayload.append("type", formData.type);
    formDataPayload.append("ingredients", JSON.stringify(formData.ingredients));
    formDataPayload.append("weatherConditions", JSON.stringify(formData.weatherConditions));
    formDataPayload.append("special_ingredient", formData.special_ingredient);
    formDataPayload.append(
      "prices",
      JSON.stringify(
        formData.sizes.map((size) => ({
          size,
          price: formData.prices[size],
          currency: CURRENCY_SYMBOL,
        }))
      )
    );

    await apiClient.post(`${apiUrl}/api/v1/menu/addFood`, formDataPayload, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    toast.success("Food item added successfully!");
    fetchFoodData();
  };

  const updateFoodItem = async (id, formData) => {
    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("description", formData.description);
    formDataToSend.append("type", formData.type);
    formDataToSend.append("ingredients", JSON.stringify(formData.ingredients));
    formDataToSend.append("special_ingredient", formData.special_ingredient);
    formDataToSend.append("weatherConditions", JSON.stringify(formData.weatherConditions));
    formDataToSend.append(
      "prices",
      JSON.stringify(
        formData.sizes.map((size) => ({
          size,
          price: formData.prices[size],
          currency: CURRENCY_SYMBOL,
        }))
      )
    );
    if (formData.image) {
      formDataToSend.append("foodimage", formData.image);
    }

    await apiClient.put(`${apiUrl}/api/v1/menu/updateFood/${id}`, formDataToSend, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    toast.success("Item Updated successfully!");
    fetchFoodData();
  };

  const deleteFoodItem = async (id) => {
    try {
      await apiClient.delete(`${apiUrl}/api/v1/menu/deleteFood/${id}`);
      toast.success("Food Item Deleted successfully!");
      fetchFoodData();
    } catch (error) {
      console.error(error);
      toast.error(error.response.data.message);
    }
  };

  return { foodData, loading, fetchFoodData, addFoodItem, updateFoodItem, deleteFoodItem };
};
