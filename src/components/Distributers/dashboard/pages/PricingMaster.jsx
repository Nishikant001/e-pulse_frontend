import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, X } from "lucide-react";
import { authFetch } from "../../../../utils/authFetch";

const PricingMaster = () => {
  const [pricing, setPricing] = useState([]);
  const [products, setProducts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    productId: "",
    customer_group_id: "",
    base_price: "",
    discount_percent: "",
    valid_from: "",
    valid_to: "",
  });

  // ================= FETCH DATA =================

  const fetchPricing = async () => {
    const data = await authFetch("/pricing");
    setPricing(Array.isArray(data) ? data : []);
  };

  const fetchProducts = async () => {
    const data = await authFetch("/product");
    setProducts(Array.isArray(data) ? data : []);
  };

  const fetchGroups = async () => {
    const data = await authFetch("/customergroup");
    setGroups(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    fetchPricing();
    fetchProducts();
    fetchGroups();
  }, []);

  // ================= MODAL =================

  const openModal = (item = null) => {
    if (item) {
      setEditing(item);
      setFormData({
        productId: item.productId,
        customer_group_id: item.customer_group_id,
        base_price: item.base_price,
        discount_percent: item.discount_percent,
        valid_from: item.valid_from?.split("T")[0],
        valid_to: item.valid_to?.split("T")[0] || "",
      });
    } else {
      setEditing(null);
      setFormData({
        productId: "",
        customer_group_id: "",
        base_price: "",
        discount_percent: "",
        valid_from: "",
        valid_to: "",
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
  };

  // ================= SUBMIT =================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editing) {
        await authFetch(`/pricing/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(formData),
        });
      } else {
        await authFetch("/pricing", {
          method: "POST",
          body: JSON.stringify(formData),
        });
      }

      fetchPricing();
      closeModal();
    } catch (err) {
      alert(err.message || "Failed to save pricing");
    }
  };

  // ================= DELETE =================

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this pricing?")) return;

    try {
      await authFetch(`/pricing/${id}`, {
        method: "DELETE",
      });
      fetchPricing();
    } catch (err) {
      alert(err.message);
    }
  };

  // ================= UI =================

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Pricing Master</h1>
            <p className="text-sm text-gray-600">
              Define selling price by product & customer group
            </p>
          </div>

          <button
            onClick={() => openModal()}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700"
          >
            <Plus size={16} />
            Add Pricing
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100 text-sm">
              <tr>
                <th className="px-6 py-3 text-left">Product</th>
                <th className="px-6 py-3 text-left">Customer Group</th>
                <th className="px-6 py-3 text-left">Base Price</th>
                <th className="px-6 py-3 text-left">Discount %</th>
                <th className="px-6 py-3 text-left">Valid From</th>
                <th className="px-6 py-3 text-left">Valid To</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {pricing.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">{p.product?.name}</td>
                  <td className="px-6 py-3">{p.customerGroup?.name}</td>
                  <td className="px-6 py-3">₹ {p.base_price}</td>
                  <td className="px-6 py-3">{p.discount_percent}%</td>
                  <td className="px-6 py-3">
                    {p.valid_from?.split("T")[0]}
                  </td>
                  <td className="px-6 py-3">
                    {p.valid_to?.split("T")[0] || "-"}
                  </td>
                  <td className="px-6 py-3 flex gap-2">
                    <button
                      onClick={() => openModal(p)}
                      className="text-blue-600"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg w-full max-w-lg">
              <div className="flex justify-between mb-4">
                <h2 className="font-bold text-lg">
                  {editing ? "Edit Pricing" : "Add Pricing"}
                </h2>
                <button onClick={closeModal}>
                  <X />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">

                <select
                  required
                  value={formData.productId}
                  onChange={(e) =>
                    setFormData({ ...formData, productId: e.target.value })
                  }
                  className="w-full border px-3 py-2 rounded"
                >
                  <option value="">Select Product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>

                <select
                  required
                  value={formData.customer_group_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      customer_group_id: e.target.value,
                    })
                  }
                  className="w-full border px-3 py-2 rounded"
                >
                  <option value="">Select Customer Group</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  placeholder="Base Price"
                  required
                  value={formData.base_price}
                  onChange={(e) =>
                    setFormData({ ...formData, base_price: e.target.value })
                  }
                  className="w-full border px-3 py-2 rounded"
                />

                <input
                  type="number"
                  placeholder="Discount %"
                  value={formData.discount_percent}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discount_percent: e.target.value,
                    })
                  }
                  className="w-full border px-3 py-2 rounded"
                />

                <input
                  type="date"
                  required
                  value={formData.valid_from}
                  onChange={(e) =>
                    setFormData({ ...formData, valid_from: e.target.value })
                  }
                  className="w-full border px-3 py-2 rounded"
                />

                <input
                  type="date"
                  value={formData.valid_to}
                  onChange={(e) =>
                    setFormData({ ...formData, valid_to: e.target.value })
                  }
                  className="w-full border px-3 py-2 rounded"
                />

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="border px-4 py-2 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-4 py-2 rounded"
                  >
                    Save
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PricingMaster;
