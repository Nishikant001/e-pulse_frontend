import React, { useEffect, useState } from "react";
import { Plus, Trash2, Upload, X } from "lucide-react";
import { authFetch } from "../../../../utils/authFetch";

const HSNMaster = () => {
  const [hsnList, setHsnList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    hsn_code: "",
    description: "",
    gst_rate: "",
  });

  const [file, setFile] = useState(null);

  // ================= FETCH =================
  const fetchHSN = async () => {
    setLoading(true);
    try {
      const data = await authFetch("/hsn");
      setHsnList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setHsnList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHSN();
  }, []);

  // ================= CREATE =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await authFetch("/hsn", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      fetchHSN();
      setShowModal(false);
      setFormData({ hsn_code: "", description: "", gst_rate: "" });
    } catch (err) {
      alert(err.message);
    }
  };

  // ================= DELETE =================
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this HSN?")) return;

    try {
      await authFetch(`/hsn/${id}`, {
        method: "DELETE",
      });
      fetchHSN();
    } catch (err) {
      alert(err.message);
    }
  };

  // ================= BULK UPLOAD =================
  const handleUpload = async () => {
    if (!file) return alert("Select file first");

    const formDataObj = new FormData();
    formDataObj.append("file", file);

    try {
      await authFetch("/hsn/bulk-upload", {
        method: "POST",
        body: formDataObj,
        isFormData: true,
      });

      alert("Bulk upload successful");
      setFile(null);
      fetchHSN();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">HSN Master</h1>
            <p className="text-sm text-gray-600">
              Manage HSN codes & GST rates
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus size={16} /> Add HSN
          </button>
        </div>

        {/* Bulk Upload */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex items-center gap-4">
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={(e) => setFile(e.target.files[0])}
          />
          <button
            onClick={handleUpload}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Upload size={16} /> Upload Excel
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6 text-center">Loading...</div>
          ) : hsnList.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No HSN found
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-100 text-left text-sm">
                <tr>
                  <th className="px-6 py-3">HSN Code</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3">GST %</th>
                  <th className="px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {hsnList.map((h) => (
                  <tr key={h.id}>
                    <td className="px-6 py-3">{h.hsn_code}</td>
                    <td className="px-6 py-3">{h.description}</td>
                    <td className="px-6 py-3">{h.gst_rate}%</td>
                    <td className="px-6 py-3">
                      <button
                        onClick={() => handleDelete(h.id)}
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg w-full max-w-md">
              <div className="flex justify-between mb-4">
                <h2 className="font-bold text-lg">Add HSN</h2>
                <button onClick={() => setShowModal(false)}>
                  <X />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  placeholder="HSN Code"
                  required
                  value={formData.hsn_code}
                  onChange={(e) =>
                    setFormData({ ...formData, hsn_code: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                />

                <input
                  type="text"
                  placeholder="Description"
                  required
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                />

                <input
                  type="number"
                  placeholder="GST Rate"
                  required
                  value={formData.gst_rate}
                  onChange={(e) =>
                    setFormData({ ...formData, gst_rate: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                />

                <button
                  type="submit"
                  className="w-full bg-indigo-600 text-white py-2 rounded"
                >
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

export default HSNMaster;
