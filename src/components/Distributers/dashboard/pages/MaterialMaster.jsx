import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  Filter,
  X,
  Save,
  ArrowLeft,
  Upload,
} from "lucide-react";
import { authFetch } from "../../../../utils/authFetch";

const MaterialMaster = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState({});
  const [hsnList, setHsnList] = useState([]);

  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  });

  // Form state - updated to match backend model
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    unit: "",
    category: "",
    mfg_by: "",
    plant: "",
    weight: "",
    drug_licence_number: "",
    country_of_origin: "",
  hsn_code: "",

  });

  // Note: localStorage usage kept as per your request to not change API
  const api = {
  baseURL: "/product",

  async getAll() {
    return authFetch(this.baseURL);
  },

  async create(data) {
    return authFetch(this.baseURL, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(id, data) {
    return authFetch(`${this.baseURL}/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async delete(id) {
    return authFetch(`${this.baseURL}/${id}`, {
      method: "DELETE",
    });
  },

  async bulkUpload(file) {
    const formData = new FormData();
    formData.append("file", file);

    return authFetch(`${this.baseURL}/bulk-upload`, {
      method: "POST",
      body: formData,
      isFormData: true, // 👈 important
    });
  },
};

const fetchHSN = async () => {
  try {
    const data = await authFetch("/hsn");
    setHsnList(data || []);
  } catch (err) {
    console.error("Failed to fetch HSN");
  }
};

  useEffect(() => {
    fetchProducts();
    fetchHSN();
  }, []);

  useEffect(() => {
    const filtered = Array.isArray(products)
      ? products.filter(
          (product) =>
            product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.material_code
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            product.unit?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.category?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : [];

    setFilteredProducts(filtered);
  }, [products, searchTerm]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAll();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      showNotification("Failed to fetch products", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(
      () => setNotification({ show: false, message: "", type: "" }),
      3000
    );
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      unit: "",
      category: "",
      mfg_by: "",
      plant: "",
      weight: "",
      drug_licence_number: "",
      country_of_origin: "",
      gst: "",
      sgst: "",
      cgst: "",
      igst: "",
    });
    setErrors({});
    setCurrentProduct(null);
    setIsEditing(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name?.trim()) newErrors.name = "Product name is required";
    if (!formData.unit?.trim()) newErrors.unit = "Unit is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const productData = {
        ...formData,
     
      };

      if (isEditing) {
        const updated = await api.update(currentProduct.id, productData);
        setProducts((prev) =>
          prev.map((p) => (p.id === currentProduct.id ? updated : p))
        );
        showNotification("Product updated successfully", "success");
      } else {
        const newProduct = await api.create(productData);
        setProducts((prev) => [...prev, newProduct]);
        showNotification("Product created successfully", "success");
      }

      setShowModal(false);
      resetForm();
    } catch (error) {
      showNotification(error.message || "Operation failed", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (product) => {
    setCurrentProduct(product);
    setFormData({
      name: product.name || "",
      description: product.description || "",
      unit: product.unit || "",
      category: product.category || "",
      mfg_by: product.mfg_by || "",
      plant: product.plant || "",
      weight: product.weight || "",
      drug_licence_number: product.drug_licence_number || "",
      country_of_origin: product.country_of_origin || "",
      gst: product.gst || "",
      sgst: product.sgst || "",
      cgst: product.cgst || "",
      igst: product.igst || "",
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDelete = async (product) => {
    if (!window.confirm("Are you sure you want to delete this product?"))
      return;

    setIsLoading(true);
    try {
      await api.delete(product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      showNotification("Product deleted successfully", "success");
    } catch (error) {
      showNotification("Failed to delete product", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const result = await api.bulkUpload(file);
      showNotification(
        `${result.count} products uploaded successfully`,
        "success"
      );
      fetchProducts(); // Refresh the products list
    } catch (error) {
      showNotification("Failed to upload file", "error");
    } finally {
      setIsLoading(false);
      event.target.value = ""; // Reset file input
    }
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 mb-8">
          <div className="px-8 py-6 border-b border-slate-200/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Package className="h-12 w-12 text-blue-600" />
                <div>
                  <h1 className="text-3xl font-bold text-slate-800">
                    Material Master
                  </h1>
                  <p className="text-slate-600 mt-1">
                    Manage your product inventory
                  </p>
                </div>
              </div>
              <div className="flex space-x-3">
                <label className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2 cursor-pointer">
                  <Upload className="h-5 w-5" />
                  <span>Bulk Upload</span>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleBulkUpload}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={openCreateModal}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2"
                >
                  <Plus className="h-5 w-5" />
                  <span>Add Product</span>
                </button>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="px-8 py-6 bg-slate-50/50">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search products by name, material code, unit, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 bg-white"
                />
              </div>
              <button className="flex items-center space-x-2 px-6 py-3 border border-slate-200 rounded-xl hover:bg-white transition-all duration-200 bg-white/50">
                <Filter className="h-5 w-5 text-slate-600" />
                <span className="text-slate-700 font-medium">Filter</span>
              </button>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow">
          <table className="min-w-full bg-white">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                  Material Code
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                  Unit
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                  Manufacturer
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                  GST %
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading && products.length === 0 ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="h-4 bg-slate-200 rounded"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-slate-200 rounded"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-slate-200 rounded"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-slate-200 rounded"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-slate-200 rounded"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-slate-200 rounded"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-slate-200 rounded"></div>
                    </td>
                  </tr>
                ))
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-500">
                    No products found
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="border-t hover:bg-slate-50">
                    <td className="px-6 py-4 font-mono text-sm font-semibold text-blue-600">
                      {product.material_code}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {product.unit || "-"}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {product.category || "-"}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {product.mfg_by || "-"}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {product.hsn?.gst_rate ? `${product.hsn.gst_rate}%` : "-"}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1 rounded-lg text-sm font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product)}
                        className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1 rounded-lg text-sm font-semibold"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="px-8 py-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800">
                  {isEditing ? "Edit Product" : "Add New Product"}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-lg"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="px-8 py-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 ${
                        errors.name ? "border-red-500" : "border-slate-200"
                      }`}
                      placeholder="Enter product name"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                    )}
                  </div>
                  <div>
  <label className="block text-sm font-semibold text-slate-700 mb-2">
    HSN Code *
  </label>
  <select
    name="hsn_code"
    value={formData.hsn_code}
    onChange={handleInputChange}
    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
  >
    <option value="">Select HSN</option>
    {hsnList.map((h) => (
      <option key={h.hsn_code} value={h.hsn_code}>
        {h.hsn_code} - {h.description}
      </option>
    ))}
  </select>
</div>


                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Unit *
                    </label>
                    <input
                      type="text"
                      name="unit"
                      value={formData.unit}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 ${
                        errors.unit ? "border-red-500" : "border-slate-200"
                      }`}
                      placeholder="e.g., PCS, BOX, TAB, KG"
                    />
                    {errors.unit && (
                      <p className="text-red-500 text-sm mt-1">{errors.unit}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Category
                    </label>
                    <input
                      type="text"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                      placeholder="Product category"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Weight
                    </label>
                    <input
                      type="text"
                      name="weight"
                      value={formData.weight}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                      placeholder="Product weight"
                    />
                  </div>
                </div>
              </div>

              {/* Manufacturing Details */}
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">
                  Manufacturing Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Manufactured By
                    </label>
                    <input
                      type="text"
                      name="mfg_by"
                      value={formData.mfg_by}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                      placeholder="Manufacturer name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Plant
                    </label>
                    <input
                      type="text"
                      name="plant"
                      value={formData.plant}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                      placeholder="Manufacturing plant"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Drug Licence Number
                    </label>
                    <input
                      type="text"
                      name="drug_licence_number"
                      value={formData.drug_licence_number}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                      placeholder="Drug licence number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Country of Origin
                    </label>
                    <input
                      type="text"
                      name="country_of_origin"
                      value={formData.country_of_origin}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                      placeholder="Country of origin"
                    />
                  </div>
                </div>
              </div>

              

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 resize-none"
                  placeholder="Enter product description"
                />
              </div>

              <div className="flex space-x-4 pt-6 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span>Cancel</span>
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold disabled:opacity-50 transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <Save className="h-5 w-5" />
                  <span>
                    {isLoading
                      ? "Saving..."
                      : isEditing
                      ? "Update Product"
                      : "Create Product"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification.show && (
        <div
          className={`fixed top-6 right-6 px-6 py-4 rounded-xl shadow-lg z-50 transition-all duration-300 ${
            notification.type === "success"
              ? "bg-green-500 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          <p className="font-semibold">{notification.message}</p>
        </div>
      )}
    </div>
  );
};

export default MaterialMaster;
