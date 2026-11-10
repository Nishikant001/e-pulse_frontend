import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Users, Search, X, MapPin } from "lucide-react";
import { authFetch } from "../../../../utils/authFetch";
import { API_BASE_URL } from "../../../../config/api";

const Customer = () => {
  const [customers, setCustomers] = useState([]);
  const [customerCount, setCustomerCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [customerGroups, setCustomerGroups] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    customer_group: "",
    taxNumber: "",
    city: "",
    alternatePhone: "",
    pincode: "",
    postalCode: "",
    region: "",
    resignDescription: "",
    street1: "",
    street2: "",
    street3: "",
    street4: "",
    addresses: [
      {
        type: "sold_to_party",
        street1: "",
        street2: "",
        street3: "",
        street4: "",
        city: "",
        pincode: "",
        postalCode: "",
        region: "",
        country: "",
      },
    ],
  });

  // Mock API calls - replace with actual API endpoints
  const fetchCustomerGroups = async () => {
    try {
      const data = await authFetch("/customergroup");
      setCustomerGroups(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching customer groups", err);
      setCustomerGroups([]);
    }
  };

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await authFetch("/customer"); // ✅ direct data

      setCustomers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching customers:", error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerCount = async () => {
    try {
      const data = await authFetch("/customer/count"); // ✅ direct data

      setCustomerCount(data.customerCount || 0);
    } catch (error) {
      console.error("Error fetching customer count:", error);
      setCustomerCount(0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const filteredAddresses = formData.addresses.filter(
        (addr) =>
          addr.street1?.trim() ||
          addr.street2?.trim() ||
          addr.street3?.trim() ||
          addr.street4?.trim() ||
          addr.city?.trim() ||
          addr.region?.trim(),
      );

      const payload = {
        name: formData.name,
        customer_group_id: Number(formData.customer_group),
        customer_group:
          customerGroups.find(
            (group) => String(group.id) === String(formData.customer_group),
          )?.code || "",
        taxNumber: formData.taxNumber,
        city: formData.city,
        alternatePhone: formData.alternatePhone,
        pincode: formData.pincode,
        postalCode: formData.postalCode,
        region: formData.region,
        resignDescription: formData.resignDescription,
        street1: formData.street1,
        street2: formData.street2,
        street3: formData.street3,
        street4: formData.street4,
        addresses: filteredAddresses,
      };

      await authFetch(
        editingCustomer ? `/customer/${editingCustomer.id}` : "/customer",
        {
          method: editingCustomer ? "PUT" : "POST",
          body: JSON.stringify(payload),
        },
      );

      fetchCustomers();
      fetchCustomerCount();
      resetForm();
    } catch (error) {
      console.error("Error saving customer:", error);
      alert(error.message || "Failed to save customer");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this customer?"))
      return;

    setLoading(true);
    try {
      await authFetch(`/customer/${id}`, {
        method: "DELETE",
      });

      fetchCustomers();
      fetchCustomerCount();
    } catch (error) {
      console.error("Error deleting customer:", error);
      alert(error.message || "Failed to delete customer");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      customer_group: "",

      taxNumber: "",
      city: "",
      alternatePhone: "",
      pincode: "",
      postalCode: "",
      region: "",
      resignDescription: "",
      street1: "",
      street2: "",
      street3: "",
      street4: "",
      addresses: [
        {
          type: "sold_to_party",
          street1: "",
          street2: "",
          street3: "",
          street4: "",
          city: "",
          pincode: "",
          postalCode: "",
          region: "",
          country: "",
        },
      ],
    });
    setEditingCustomer(null);
    setShowModal(false);
  };

  const openModal = (customer = null) => {
    if (customer) {
      setFormData({
        name: customer.name || "",
        customer_group: String(
          customer.customer_group_id ||
            customerGroups.find(
              (group) => group.code === customer.customer_group,
            )?.id ||
            "",
        ),
        taxNumber: customer.taxNumber || "",
        city: customer.city || "",
        alternatePhone: customer.alternatePhone || "",
        pincode: customer.pincode || "",
        postalCode: customer.postalCode || "",
        region: customer.region || "",
        resignDescription: customer.resignDescription || "",
        street1: customer.street1 || "",
        street2: customer.street2 || "",
        street3: customer.street3 || "",
        street4: customer.street4 || "",
        addresses:
          customer.addresses && customer.addresses.length > 0
            ? customer.addresses
            : [
                {
                  type: "sold_to_party",
                  street1: "",
                  street2: "",
                  street3: "",
                  street4: "",
                  city: "",
                  pincode: "",
                  postalCode: "",
                  region: "",
                  country: "",
                },
              ],
      });
      setEditingCustomer(customer);
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const addAddress = () => {
    setFormData({
      ...formData,
      addresses: [
        ...formData.addresses,
        {
          type: "ship_to_party",
          street1: "",
          street2: "",
          street3: "",
          street4: "",
          city: "",
          pincode: "",
          postalCode: "",
          region: "",
          country: "",
        },
      ],
    });
  };

  const removeAddress = (index) => {
    if (formData.addresses.length > 1) {
      const newAddresses = formData.addresses.filter((_, i) => i !== index);
      setFormData({ ...formData, addresses: newAddresses });
    }
  };

  const updateAddress = (index, field, value) => {
    const newAddresses = [...formData.addresses];
    newAddresses[index] = { ...newAddresses[index], [field]: value };
    setFormData({ ...formData, addresses: newAddresses });
  };

  const filteredCustomers = Array.isArray(customers)
    ? customers.filter(
        (customer) =>
          customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.taxNumber
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          customer.alternatePhone?.includes(searchTerm) ||
          customer.customer_code
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()),
      )
    : [];

  useEffect(() => {
    fetchCustomers();
    fetchCustomerCount();
    fetchCustomerGroups();
  }, []);

  const renderAddressDisplay = (addresses) => {
    if (!addresses || addresses.length === 0) return "No address";

    const primaryAddress =
      addresses.find((addr) => addr.type === "sold_to_party") || addresses[0];
    const hasMultiple = addresses.length > 1;

    const addressParts = [];
    if (primaryAddress.street1) addressParts.push(primaryAddress.street1);
    if (primaryAddress.city) addressParts.push(primaryAddress.city);
    if (primaryAddress.region) addressParts.push(primaryAddress.region);
    if (primaryAddress.pincode) addressParts.push(primaryAddress.pincode);

    return (
      <div>
        <div className="max-w-xs truncate">{addressParts.join(", ")}</div>
        {hasMultiple && (
          <span className="text-xs text-blue-600">
            +{addresses.length - 1} more
          </span>
        )}
      </div>
    );
  };

  const getAddressTypeLabel = (type) => {
    const labels = {
      sold_to_party: "Sold To Party",
      ship_to_party: "Ship To Party",
      bill_to_party: "Bill To Party",
      payer: "Payer",
    };
    return labels[type] || type;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Customer Management
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your customer database
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-blue-50 px-4 py-2 rounded-lg flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-blue-800 font-semibold">
                  {customerCount} Customers
                </span>
              </div>
              <button
                onClick={() => openModal()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Customer</span>
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search customers by name, tax number, phone, or customer code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Customer List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No customers found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer Group
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tax Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-mono text-sm text-gray-900">
                          {customer.customer_code}
                        </div>
                      </td>
                   
<td className="px-6 py-4 whitespace-nowrap">
  <div className="font-mono text-sm text-gray-900">
    {customerGroups.find(
      (group) =>
        Number(group.id) === Number(customer.customer_group_id)
    )?.name ||
      customerGroups.find(
        (group) =>
          Number(group.id) === Number(customer.customer_group_id)
      )?.code ||
      customer.customer_group ||
      "—"}
  </div>
</td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {customer.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {customer.taxNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {customer.alternatePhone}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {renderAddressDisplay(customer.addresses)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openModal(customer)}
                            className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
                            title="Edit customer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(customer.id)}
                            className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
                            title="Delete customer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingCustomer ? "Edit Customer" : "Add New Customer"}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Customer Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer Group *
                    </label>
                    <select
                      required
                      value={formData.customer_group}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customer_group: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg
               focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Group</option>
                      {customerGroups.map((group) => (
                        <option key={group.id} value={String(group.id)}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tax Number
                    </label>
                    <input
                      type="text"
                      value={formData.taxNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, taxNumber: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.alternatePhone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          alternatePhone: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pincode
                    </label>
                    <input
                      type="text"
                      value={formData.pincode}
                      onChange={(e) =>
                        setFormData({ ...formData, pincode: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) =>
                        setFormData({ ...formData, postalCode: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Region
                    </label>
                    <input
                      type="text"
                      value={formData.region}
                      onChange={(e) =>
                        setFormData({ ...formData, region: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Street Address Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Street 1
                    </label>
                    <input
                      type="text"
                      value={formData.street1}
                      onChange={(e) =>
                        setFormData({ ...formData, street1: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Street 2
                    </label>
                    <input
                      type="text"
                      value={formData.street2}
                      onChange={(e) =>
                        setFormData({ ...formData, street2: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Street 3
                    </label>
                    <input
                      type="text"
                      value={formData.street3}
                      onChange={(e) =>
                        setFormData({ ...formData, street3: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Street 4
                    </label>
                    <input
                      type="text"
                      value={formData.street4}
                      onChange={(e) =>
                        setFormData({ ...formData, street4: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.resignDescription}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        resignDescription: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Additional customer information..."
                  />
                </div>

                {/* Additional Addresses Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <MapPin className="w-5 h-5 mr-2" />
                      Additional Addresses
                    </h3>
                    <button
                      type="button"
                      onClick={addAddress}
                      className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Address</span>
                    </button>
                  </div>

                  {formData.addresses.map((address, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4 mb-4"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-800">
                          {getAddressTypeLabel(address.type)} Address{" "}
                          {index + 1}
                        </h4>
                        {formData.addresses.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeAddress(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Address Type
                          </label>
                          <select
                            value={address.type}
                            onChange={(e) =>
                              updateAddress(index, "type", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="sold_to_party">Sold To Party</option>
                            <option value="ship_to_party">Ship To Party</option>
                            <option value="bill_to_party">Bill To Party</option>
                            <option value="payer">Payer</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Street 1
                          </label>
                          <input
                            type="text"
                            value={address.street1}
                            onChange={(e) =>
                              updateAddress(index, "street1", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Street address line 1"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Street 2
                          </label>
                          <input
                            type="text"
                            value={address.street2}
                            onChange={(e) =>
                              updateAddress(index, "street2", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Street address line 2"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Street 3
                          </label>
                          <input
                            type="text"
                            value={address.street3}
                            onChange={(e) =>
                              updateAddress(index, "street3", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Street address line 3"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Street 4
                          </label>
                          <input
                            type="text"
                            value={address.street4}
                            onChange={(e) =>
                              updateAddress(index, "street4", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Street address line 4"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            City
                          </label>
                          <input
                            type="text"
                            value={address.city}
                            onChange={(e) =>
                              updateAddress(index, "city", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="City"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Pincode
                          </label>
                          <input
                            type="text"
                            value={address.pincode}
                            onChange={(e) =>
                              updateAddress(index, "pincode", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Pincode"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Postal Code
                          </label>
                          <input
                            type="text"
                            value={address.postalCode}
                            onChange={(e) =>
                              updateAddress(index, "postalCode", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Postal code"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Region
                          </label>
                          <input
                            type="text"
                            value={address.region}
                            onChange={(e) =>
                              updateAddress(index, "region", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Region"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Country
                          </label>
                          <input
                            type="text"
                            value={address.country}
                            onChange={(e) =>
                              updateAddress(index, "country", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Country"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                  >
                    {loading && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    )}
                    <span>
                      {editingCustomer ? "Update" : "Create"} Customer
                    </span>
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

export default Customer;
