import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { X } from "lucide-react";
import FormField, { inputClass } from "../../components/ui/FormField";
import Button from "../../components/ui/Button";
import Section from "../../components/ui/Section";
import MultiSelectChips from "../../components/ui/MultiSelectChips";
import { WEATHER_CONDITIONS } from "../../constants/weatherConditions";
import { useItemTypesApi } from "../itemTypes/useItemTypesApi";
import { optimizedImageUrl } from "../../lib/media";

const buildFormData = (food) => {
  if (!food) {
    return {
      name: "",
      description: "",
      type: "",
      ingredients: [],
      special_ingredient: "",
      weatherConditions: [],
      image: null,
      sizes: [],
      prices: { R: "", S: "", M: "", L: "" },
    };
  }
  const newPrices = food.prices.reduce((acc, p) => ({ ...acc, [p.size]: p.price }), {});
  const newSizes = food.prices.map((p) => p.size);
  return {
    name: food.name || "",
    description: food.description || "",
    type: food.type?._id || "",
    ingredients: food.ingredients || [],
    special_ingredient: food.special_ingredient || "",
    weatherConditions: food.weatherConditions || [],
    image: null,
    sizes: newSizes,
    prices: { R: newPrices.R || "", S: newPrices.S || "", M: newPrices.M || "", L: newPrices.L || "" },
  };
};

const MenuItemForm = ({ mode, initialFood, onSubmit }) => {
  const navigate = useNavigate();
  const { itemTypes } = useItemTypesApi();
  const [formData, setFormData] = useState(() => buildFormData(initialFood));
  const [ingredientDraft, setIngredientDraft] = useState("");
  const [sizeOptions, setSizeOptions] = useState(() =>
    initialFood && initialFood.prices.some((p) => p.size !== "R") ? "SM" : "R"
  );
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    setFormData((prev) => ({ ...prev, image: e.target.files[0] }));
  };

  const addIngredient = () => {
    const value = ingredientDraft.trim();
    if (!value) return;
    if (formData.ingredients.includes(value)) {
      setIngredientDraft("");
      return;
    }
    setFormData((prev) => ({ ...prev, ingredients: [...prev.ingredients, value] }));
    setIngredientDraft("");
  };

  const removeIngredient = (ingredient) => {
    setFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((i) => i !== ingredient),
    }));
  };

  const handleIngredientKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addIngredient();
    }
  };

  const handleSizeChange = (e) => {
    setSizeOptions(e.target.value);
    if (e.target.value === "R") {
      setFormData((prev) => ({ ...prev, prices: { R: "", S: "", M: "", L: "" }, sizes: ["R"] }));
    } else {
      setFormData((prev) => ({ ...prev, prices: { R: "", S: "", M: "", L: "" }, sizes: [] }));
    }
  };

  const handlePriceChange = (size, price) => {
    setFormData((prev) => ({
      ...prev,
      prices: { ...prev.prices, [size]: price },
      sizes: sizeOptions !== "R" && price ? [...new Set([...prev.sizes, size])] : prev.sizes,
    }));
  };

  const validate = () => {
    if (mode === "create" && !formData.image) {
      toast.info("Please upload an image.");
      return false;
    }
    if (formData.ingredients.length === 0) {
      toast.error("Please add at least one ingredient.");
      return false;
    }
    const selectedSizes = formData.sizes;
    const filledPrices = selectedSizes.filter((size) => formData.prices[size]);

    if (sizeOptions === "R") {
      if (!formData.prices["R"]) {
        toast.error("Please enter the price for Regular size.");
        return false;
      }
    } else if (filledPrices.length < 2) {
      toast.error("Please enter prices for at least TWO of Small, Medium, or Large sizes.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await onSubmit(formData);
      navigate("/Menu");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Section title="Item details">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Item Name" htmlFor="name">
            <input
              id="name"
              name="name"
              placeholder="Name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className={inputClass}
            />
          </FormField>

          <FormField label="Item Type" htmlFor="type">
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              required
              className={inputClass}
            >
              <option value="">Select Type</option>
              {itemTypes.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Item Ingredients" htmlFor="ingredients">
            <div className="flex gap-2">
              <input
                id="ingredients"
                placeholder="Add an ingredient and press Enter"
                value={ingredientDraft}
                onChange={(e) => setIngredientDraft(e.target.value)}
                onKeyDown={handleIngredientKeyDown}
                className={inputClass}
              />
              <Button type="button" variant="secondary" onClick={addIngredient}>
                Add
              </Button>
            </div>
            {formData.ingredients.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.ingredients.map((ingredient) => (
                  <span
                    key={ingredient}
                    className="inline-flex items-center gap-1 rounded-full bg-gray/20 px-3 py-1 text-sm text-white"
                  >
                    {ingredient}
                    <button
                      type="button"
                      onClick={() => removeIngredient(ingredient)}
                      className="text-gray hover:text-white"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </FormField>

          <FormField label="Special Ingredient" htmlFor="special_ingredient">
            <input
              id="special_ingredient"
              name="special_ingredient"
              placeholder="Special Ingredient"
              value={formData.special_ingredient}
              onChange={handleInputChange}
              required
              className={inputClass}
            />
          </FormField>

          <FormField label="Weather Conditions" span={2}>
            <MultiSelectChips
              options={WEATHER_CONDITIONS}
              value={formData.weatherConditions}
              onChange={(next) => setFormData((prev) => ({ ...prev, weatherConditions: next }))}
            />
          </FormField>

          <FormField label="Item Description" htmlFor="description" span={2}>
            <textarea
              id="description"
              name="description"
              placeholder="Description"
              value={formData.description}
              onChange={handleInputChange}
              required
              className={inputClass}
            />
          </FormField>
        </div>
      </Section>

      <Section title="Image" description={mode === "edit" ? "Upload a new image to replace the current one." : "Required for new items."}>
        <div className="flex items-center gap-4">
          {mode === "edit" && initialFood?.image?.url && !formData.image && (
            <img src={optimizedImageUrl(initialFood.image.url, 128)} alt="" className="h-16 w-16 rounded-lg object-cover" />
          )}
          <input type="file" accept="image/*" onChange={handleImageChange} className={inputClass} />
        </div>
      </Section>

      <Section title="Sizes &amp; pricing">
        <div className="mb-4 flex items-center gap-4">
          <label className="flex items-center gap-2 text-white">
            <input type="radio" value="R" checked={sizeOptions === "R"} onChange={handleSizeChange} />
            Regular
          </label>
          <label className="flex items-center gap-2 text-white">
            <input type="radio" value="SM" checked={sizeOptions === "SM"} onChange={handleSizeChange} />
            Small/Medium/Large
          </label>
        </div>

        {sizeOptions === "R" ? (
          <input
            placeholder="Price (£ Regular)"
            value={formData.prices.R}
            onChange={(e) => handlePriceChange("R", e.target.value)}
            required
            className={`${inputClass} max-w-xs`}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <input
              placeholder="Price (£ Small)"
              value={formData.prices.S}
              onChange={(e) => handlePriceChange("S", e.target.value)}
              className={inputClass}
            />
            <input
              placeholder="Price (£ Medium)"
              value={formData.prices.M}
              onChange={(e) => handlePriceChange("M", e.target.value)}
              className={inputClass}
            />
            <input
              placeholder="Price (£ Large)"
              value={formData.prices.L}
              onChange={(e) => handlePriceChange("L", e.target.value)}
              className={inputClass}
            />
          </div>
        )}
      </Section>

      <div className="flex justify-end gap-3">
        <Button as="link" to="/Menu" variant="secondary">
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : mode === "create" ? "Add Item" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
};

export default MenuItemForm;
