import React, { useEffect, useState, useRef } from "react";
import { Plus, Edit2, Trash2, X } from "lucide-react";
import { authFetch } from "../../../../utils/authFetch";

const VendorGroup = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    code: "",
    name: "",
  });

  // ================= FETCH =================
  const fetchGroups = async () => {
    setLoading(true);
    try {
      const data = await authFetch("/vendorgroup");
      setGroups(Array.isArray(data) ? data : []);
    } catch (err) {
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // ================= BULK UPLOAD =================
  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      const result = await authFetch("/vendorgroup/bulk-upload", {
        method: "POST",
        body: formData,
        isFormData: true,
      });

      alert(
        `Inserted: ${result.inserted}\nSkipped: ${result.skipped}`
      );

      fetchGroups();
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const openModal = (group = null) => {
    if (group) {
      setEditingGroup(group);
      setFormData(group);
    } else {
      setEditingGroup(null);
      setFormData({ code: "", name: "" });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingGroup(null);
    setFormData({ code: "", name: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingGroup) {
        await authFetch(`/vendorgroup/${editingGroup.id}`, {
          method: "PUT",
          body: JSON.stringify({ name: formData.name }),
        });
      } else {
        await authFetch("/vendorgroup", {
          method: "POST",
          body: JSON.stringify({
            code: formData.code.toUpperCase(),
            name: formData.name,
          }),
        });
      }

      fetchGroups();
      closeModal();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this vendor group?")) return;

    await authFetch(`/vendorgroup/${id}`, {
      method: "DELETE",
    });

    fetchGroups();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6 flex justify-between items-center">
          <h1 className="text-xl font-bold">Vendor Groups</h1>

          <div className="flex gap-3">

            <input
              type="file"
              accept=".xlsx,.xls"
              ref={fileInputRef}
              onChange={handleExcelUpload}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current.click()}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              {uploading ? "Uploading..." : "Upload Excel"}
            </button>

            <button
              onClick={() => openModal()}
              className="bg-blue-600 text-white px-4 py-2 rounded flex gap-2 items-center"
            >
              <Plus size={16} />
              Add
            </button>

          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded shadow">
          <table className="w-full">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-3">Code</th>
                <th className="p-3">Name</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <tr key={g.id} className="border-t">
                  <td className="p-3">{g.code}</td>
                  <td className="p-3">{g.name}</td>
                  <td className="p-3 flex gap-2">
                    <Edit2
                      size={16}
                      className="cursor-pointer text-blue-600"
                      onClick={() => openModal(g)}
                    />
                    <Trash2
                      size={16}
                      className="cursor-pointer text-red-600"
                      onClick={() => handleDelete(g.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">
            <div className="bg-white p-6 rounded w-96">
              <div className="flex justify-between mb-4">
                <h2 className="font-bold">
                  {editingGroup ? "Edit" : "Add"} Vendor Group
                </h2>
                <X onClick={closeModal} className="cursor-pointer" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!editingGroup && (
                  <input
                    type="text"
                    placeholder="Code"
                    required
                    className="w-full border p-2 rounded"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                  />
                )}

                <input
                  type="text"
                  placeholder="Name"
                  required
                  className="w-full border p-2 rounded"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />

                <button className="bg-blue-600 text-white w-full py-2 rounded">
                  Save
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorGroup;
