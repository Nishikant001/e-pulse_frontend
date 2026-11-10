import React, { useEffect, useState, useRef } from "react";
import { Plus, Edit2, Trash2, X } from "lucide-react";
import { authFetch } from "../../../../utils/authFetch";

const ItemGroup = () => {
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
      const data = await authFetch("/itemgroup");
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

    const formDataObj = new FormData();
    formDataObj.append("file", file);

    try {
      setUploading(true);

      const result = await authFetch("/itemgroup/bulk-upload", {
        method: "POST",
        body: formDataObj,
        isFormData: true,
      });

      alert(
        `Upload Completed\nInserted: ${result.inserted}\nSkipped: ${result.skipped}`
      );

      fetchGroups();
    } catch (err) {
      alert(err.message || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  // ================= MODAL =================
  const openModal = (group = null) => {
    if (group) {
      setEditingGroup(group);
      setFormData({
        code: group.code,
        name: group.name,
      });
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

  // ================= SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingGroup) {
        await authFetch(`/itemgroup/${editingGroup.id}`, {
          method: "PUT",
          body: JSON.stringify({ name: formData.name }),
        });
      } else {
        await authFetch("/itemgroup", {
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
      alert(err.message || "Failed to save");
    }
  };

  // ================= DELETE =================
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this item group?")) return;

    try {
      await authFetch(`/itemgroup/${id}`, {
        method: "DELETE",
      });

      fetchGroups();
    } catch (err) {
      alert(err.message || "Delete failed");
    }
  };

  // ================= UI =================
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Item Groups
            </h1>
            <p className="text-gray-600 text-sm">
              Manage product categories
            </p>
          </div>

          <div className="flex gap-3">

            {/* Hidden File Input */}
            <input
              type="file"
              accept=".xlsx,.xls"
              ref={fileInputRef}
              onChange={handleExcelUpload}
              className="hidden"
            />

            {/* Upload Button */}
            <button
              onClick={() => fileInputRef.current.click()}
              disabled={uploading}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload Excel"}
            </button>

            {/* Add Button */}
            <button
              onClick={() => openModal()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
            >
              <Plus size={16} />
              Add Group
            </button>

          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6 text-center">Loading...</div>
          ) : groups.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No item groups found
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-100 text-left text-sm">
                <tr>
                  <th className="px-6 py-3">Code</th>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {groups.map((g) => (
                  <tr key={g.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-mono">{g.code}</td>
                    <td className="px-6 py-3">{g.name}</td>
                    <td className="px-6 py-3 flex gap-2">
                      <button
                        onClick={() => openModal(g)}
                        className="text-blue-600 hover:bg-blue-50 p-1 rounded"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(g.id)}
                        className="text-red-600 hover:bg-red-50 p-1 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">
                  {editingGroup ? "Edit Item Group" : "Add Item Group"}
                </h2>
                <button onClick={closeModal}>
                  <X />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!editingGroup && (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Group Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({ ...formData, code: e.target.value })
                      }
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Group Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

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

export default ItemGroup;
