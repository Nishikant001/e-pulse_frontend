import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Package, Search, X, MapPin } from "lucide-react";
import { authFetch } from "../../../../utils/authFetch";

const Vendor = () => {
  const [vendors, setVendors] = useState([]);
  const [vendorCount, setVendorCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [vendorGroups, setVendorGroups] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    taxNumber: "",
    phone: "",
    email: "",
    vendor_group: "",

    city: "",
    region: "",
    country: "",
    street1: "",
    street2: "",
    postalCode: "",
    addresses: [
      {
        type: "sold_to_party",
        street1: "",
        street2: "",
        street3: "",
        street4: "",
        city: "",
        region: "",
        postalCode: "",
        country: "",
        pincode: "",
      },
    ],
  });

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const data = await authFetch("/vendor");
      setVendors(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendorCount = async () => {
    try {
      const data = await authFetch("/vendor/count");
      setVendorCount(data.vendorCount || 0);
    } catch (error) {
      console.error("Error fetching vendor count:", error);
      setVendorCount(0);
    }
  };
  const fetchVendorGroups = async () => {
    try {
      const data = await authFetch("/vendorgroup");
      setVendorGroups(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching vendor groups:", error);
      setVendorGroups([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name) {
      alert("Vendor name is required");
      return;
    }

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
        vendor_group: formData.vendor_group,

        taxNumber: formData.taxNumber,
        phone: formData.phone,
        email: formData.email,
        city: formData.city,
        region: formData.region,
        country: formData.country,
        street1: formData.street1,
        street2: formData.street2,
        postalCode: formData.postalCode,
        addresses: filteredAddresses,
      };

      await authFetch(
        editingVendor ? `/vendor/${editingVendor.id}` : "/vendor",
        {
          method: editingVendor ? "PUT" : "POST",
          body: JSON.stringify(payload),
        },
      );

      fetchVendors();
      fetchVendorCount();
      resetForm();
    } catch (error) {
      console.error("Error saving vendor:", error);
      alert(error.message || "Failed to save vendor");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this vendor?")) return;

    setLoading(true);
    try {
      await authFetch(`/vendor/${id}`, {
        method: "DELETE",
      });

      fetchVendors();
      fetchVendorCount();
    } catch (error) {
      console.error("Error deleting vendor:", error);
      alert(error.message || "Failed to delete vendor");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      taxNumber: "",
      phone: "",
      email: "",
      city: "",
      vendor_group: "",

      region: "",
      country: "",
      street1: "",
      street2: "",
      postalCode: "",
      addresses: [
        {
          type: "sold_to_party",
          street1: "",
          street2: "",
          street3: "",
          street4: "",
          city: "",
          region: "",
          postalCode: "",
          country: "",
          pincode: "",
        },
      ],
    });
    setEditingVendor(null);
    setShowModal(false);
  };

  const openModal = (vendor = null) => {
    if (vendor) {
      setFormData({
        name: vendor.name || "",
        taxNumber: vendor.taxNumber || "",
        vendor_group: vendor.vendor_group || "",

        phone: vendor.phone || "",
        email: vendor.email || "",
        city: vendor.city || "",
        region: vendor.region || "",
        country: vendor.country || "",
        street1: vendor.street1 || "",
        street2: vendor.street2 || "",
        postalCode: vendor.postalCode || "",
        addresses:
          vendor.addresses && vendor.addresses.length > 0
            ? vendor.addresses
            : [
                {
                  type: "sold_to_party",
                  street1: "",
                  street2: "",
                  street3: "",
                  street4: "",
                  city: "",
                  region: "",
                  postalCode: "",
                  country: "",
                  pincode: "",
                },
              ],
      });
      setEditingVendor(vendor);
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleAddressChange = (index, field, value) => {
    const updated = [...formData.addresses];
    updated[index][field] = value;
    setFormData({ ...formData, addresses: updated });
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
          region: "",
          postalCode: "",
          country: "",
          pincode: "",
        },
      ],
    });
  };

  const removeAddress = (index) => {
    if (formData.addresses.length > 1) {
      const updated = formData.addresses.filter((_, i) => i !== index);
      setFormData({ ...formData, addresses: updated });
    }
  };

  useEffect(() => {
    fetchVendors();
    fetchVendorCount();
    fetchVendorGroups();
  }, []);

  const filteredVendors = Array.isArray(vendors)
    ? vendors.filter(
        (vendor) =>
          vendor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          vendor.vendor_code
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          vendor.taxNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          vendor.phone?.includes(searchTerm) ||
          vendor.email?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : [];

  const renderAddressDisplay = (vendor) => {
    if (!vendor.addresses || vendor.addresses.length === 0) {
      return "No address";
    }

    const primaryAddress =
      vendor.addresses.find((addr) => addr.type === "sold_to_party") ||
      vendor.addresses[0];
    const hasMultiple = vendor.addresses.length > 1;

    const addressParts = [];
    if (primaryAddress.street1) addressParts.push(primaryAddress.street1);
    if (primaryAddress.city) addressParts.push(primaryAddress.city);
    if (primaryAddress.region) addressParts.push(primaryAddress.region);
    if (primaryAddress.pincode) addressParts.push(primaryAddress.pincode);

    return (
      <div>
        <div className="max-w-xs truncate">{addressParts.join(", ")}</div>
        {hasMultiple && (
          <span className="text-xs text-green-600">
            +{vendor.addresses.length - 1} more
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
                Vendor Management
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your vendor database with multiple addresses
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-green-50 px-4 py-2 rounded-lg flex items-center space-x-2">
                <Package className="w-5 h-5 text-green-600" />
                <span className="text-green-800 font-semibold">
                  {vendorCount} Vendors
                </span>
              </div>
              <button
                onClick={() => openModal()}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Vendor</span>
              </button>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search vendors by name, code, tax number, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : filteredVendors.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No vendors found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vendor Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vendor Group
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
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
                  {filteredVendors.map((vendor) => (
                    <tr key={vendor.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-mono text-sm text-gray-900">
                          {vendor.vendor_code}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-mono text-sm text-gray-900">
                          {vendor.vendor_group}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {vendor.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {vendor.phone || "-"}
                        <div className="text-xs text-gray-500">
                          {vendor.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {renderAddressDisplay(vendor)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openModal(vendor)}
                            className="text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded"
                            title="Edit vendor"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(vendor.id)}
                            className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
                            title="Delete vendor"
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
                  {editingVendor ? "Edit Vendor" : "Add New Vendor"}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vendor Group *
                    </label>
                    <select
                      required
                      value={formData.vendor_group}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          vendor_group: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Select Vendor Group</option>
                      {vendorGroups.map((group) => (
                        <option key={group.code} value={group.code}>
                          {group.name}
                        </option>
                      ))}
                    </select>
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) =>
                        setFormData({ ...formData, country: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
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
                      className="text-green-600 hover:text-green-700 text-sm flex items-center space-x-1"
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
                              handleAddressChange(index, "type", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                              handleAddressChange(
                                index,
                                "street1",
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                              handleAddressChange(
                                index,
                                "street2",
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                              handleAddressChange(
                                index,
                                "street3",
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                              handleAddressChange(
                                index,
                                "street4",
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                              handleAddressChange(index, "city", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                              handleAddressChange(
                                index,
                                "pincode",
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                              handleAddressChange(
                                index,
                                "postalCode",
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                              handleAddressChange(
                                index,
                                "region",
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                              handleAddressChange(
                                index,
                                "country",
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                  >
                    {loading && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    )}
                    <span>{editingVendor ? "Update" : "Create"} Vendor</span>
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

export default Vendor;
