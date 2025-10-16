import React, { useState, useEffect } from "react";

/* ================== CONFIG ================== */
// ใช้ค่า .env ถ้าไม่มีให้ fallback ไป localhost
const API_BASE_URL =
  (import.meta.env && import.meta.env.VITE_API_BASE) ||
  "http://localhost/crud/api/users";

/* ================== APP ================== */
function App() {
  const [currentPage, setCurrentPage] = useState("list");
  const [selectedUserId, setSelectedUserId] = useState(null);

  const navigateTo = (page, userId = null) => {
    setCurrentPage(page);
    setSelectedUserId(userId);
  };

  return (
    <div className="min-h-dvh bg-gray-50">
      {/* Top Bar (ว่างไว้) */}
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight"></h1>
          {currentPage !== "list" && (
            <button
              onClick={() => navigateTo("list")}
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Back
            </button>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6">
        {currentPage === "list" && <UserList navigateTo={navigateTo} />}
        {currentPage === "create" && <CreateUser navigateTo={navigateTo} />}
        {currentPage === "edit" && (
          <EditUser navigateTo={navigateTo} userId={selectedUserId} />
        )}
      </main>
    </div>
  );
}

/* ================== LIST ================== */
function UserList({ navigateTo }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // [ADDED] state ของแถบค้นหา
  const [keyword, setKeyword] = useState("");          // ข้อความที่พิมพ์
  const [isSearching, setIsSearching] = useState(false); // flag ว่ากำลังดูผลค้นหาหรือไม่

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/read.php`);
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
      setIsSearching(false); // [ADDED] กลับสู่โหมดปกติ
    } catch (e) {
      console.error(e);
      alert("Error loading users");
    } finally {
      setLoading(false);
    }
  };

  // [ADDED] เรียกค้นหาฝั่งเซิร์ฟเวอร์ (search.php)
  const fetchSearch = async (kw) => {
    try {
      setLoading(true);
      const query = (kw ?? "").trim();
      if (!query) {
        await fetchUsers(); // ถ้าไม่ใส่คำค้น ให้โหลดทั้งหมด
        return;
      }
      const res = await fetch(
        `${API_BASE_URL}/search.php?keyword=${encodeURIComponent(query)}`
      );
      const data = await res.json();
      // รองรับทั้งรูปแบบ {status, data} หรือเป็น array ตรง ๆ
      const rows = Array.isArray(data) ? data : (data?.data ?? []);
      setUsers(Array.isArray(rows) ? rows : []);
      setIsSearching(true);
    } catch (e) {
      console.error(e);
      alert("Error searching users");
    } finally {
      setLoading(false);
    }
  };

  // [ADDED] กดปุ่ม Search หรือกด Enter
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchSearch(keyword);
  };

  // [ADDED] ปุ่ม Reset
  const handleReset = () => {
    setKeyword("");
    fetchUsers();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/delete.php`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const result = await res.json();
      if (result.status === "ok") {
        // [CHANGED] ถ้ายังอยู่โหมดค้นหา ให้รีเฟรชผลค้นหาเดิม
        if (isSearching) {
          fetchSearch(keyword);
        } else {
          fetchUsers();
        }
      } else {
        alert("Error deleting user");
      }
    } catch (e) {
      console.error(e);
      alert("Error deleting user");
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Users</h2>
          <p className="text-sm text-gray-500">
            {isSearching && keyword
              ? <>Search results for <span className="font-medium">“{keyword}”</span></>
              : "Manage your user records"}
          </p>
        </div>

        {/* [ADDED] แถบค้นหา */}
        <form
          onSubmit={handleSearchSubmit}
          className="flex w-full sm:w-auto items-center gap-2"
        >
          <div className="relative flex-1 sm:flex-initial sm:w-72">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <SearchIcon className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search name or email…"
              className="w-full rounded-lg border pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-gray-700 hover:bg-gray-50"
            disabled={loading}
          >
            <SearchIcon className="w-4 h-4" />
            Search
          </button>
          {isSearching && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-gray-600 hover:bg-gray-50"
            >
              <XIcon className="w-4 h-4" />
              Reset
            </button>
          )}
          <button
            type="button"
            onClick={() => navigateTo("create")}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 shadow-sm"
          >
            <PlusIcon className="w-4 h-4" />
            Create
          </button>
        </form>
      </div>

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr className="text-left">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Avatar</th>
                <th className="px-4 py-3">First Name</th>
                <th className="px-4 py-3">Last Name</th>
                <th className="px-4 py-3 text-right">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                // Skeleton rows
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3">
                      <div className="h-4 w-10 bg-gray-200 rounded" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-10 w-10 bg-gray-200 rounded-full" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-24 bg-gray-200 rounded" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-24 bg-gray-200 rounded" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="h-8 w-28 bg-gray-200 rounded-lg inline-block" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10">
                    <div className="text-center text-gray-600">
                      <div className="mx-auto mb-2 w-10 h-10 rounded-full bg-gray-100 grid place-items-center">
                        <InboxIcon className="w-5 h-5" />
                      </div>
                      <div className="font-medium">No users found</div>
                      <div className="text-sm text-gray-500">
                        {isSearching
                          ? "Try a different keyword or reset the search."
                          : "Create your first user to get started."}
                      </div>
                      <div className="mt-4 flex items-center justify-center gap-2">
                        {isSearching ? (
                          <button
                            onClick={handleReset}
                            className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 hover:bg-gray-50"
                          >
                            <XIcon className="w-4 h-4" />
                            Reset
                          </button>
                        ) : (
                          <button
                            onClick={() => navigateTo("create")}
                            className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 hover:bg-gray-50"
                          >
                            <PlusIcon className="w-4 h-4" />
                            New user
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/60">
                    <td className="px-4 py-3">{u.id}</td>
                    <td className="px-4 py-3">
                      <img
                        src={u.avatar}
                        alt={u.fname || "avatar"}
                        className="h-10 w-10 rounded-full object-cover ring-1 ring-gray-200"
                      />
                    </td>
                    <td className="px-4 py-3">{u.fname}</td>
                    <td className="px-4 py-3">{u.lname}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {/* EDIT = ปุ่มมีกรอบ (outlined) */}
                        <button
                          onClick={() => navigateTo("edit", u.id)}
                          className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                          <PencilIcon className="w-4 h-4" />
                          Edit
                        </button>
                        {/* DELETE = ปุ่มมีกรอบแดงอ่อน */}
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-3 py-1.5 text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                        >
                          <TrashIcon className="w-4 h-4" />
                          Del
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/* ================== CREATE ================== */
function CreateUser({ navigateTo }) {
  const [formData, setFormData] = useState({
    fname: "",
    lname: "",
    email: "",
    avatar: "",
  });

  const handleChange = (e) =>
    setFormData((s) => ({ ...s, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/create.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await res.json();
      if (result.status === "ok") {
        navigateTo("list");
      } else alert("Error creating user");
    } catch (e) {
      console.error(e);
      alert("Error creating user");
    }
  };

  return (
    <SectionCard title="Create user" subtitle="Add a new user to the list.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="First Name" name="fname" value={formData.fname} onChange={handleChange} required />
        <Field label="Last Name" name="lname" value={formData.lname} onChange={handleChange} required />
        <Field type="email" label="Email" name="email" value={formData.email} onChange={handleChange} required />
        <Field label="Avatar URL" name="avatar" value={formData.avatar} onChange={handleChange} placeholder="https://example.com/avatar.jpg" />

        <div className="flex gap-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 shadow-sm"
          >
            <CheckIcon className="w-4 h-4" />
            Submit
          </button>
          <button
            type="button"
            onClick={() => navigateTo("list")}
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 hover:bg-gray-50"
          >
            <XIcon className="w-4 h-4" />
            Cancel
          </button>
        </div>
      </form>
    </SectionCard>
  );
}

/* ================== EDIT ================== */
function EditUser({ navigateTo, userId }) {
  const [formData, setFormData] = useState({
    id: "",
    fname: "",
    lname: "",
    email: "",
    avatar: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/readone.php?id=${userId}`);
      const data = await res.json();
      setFormData(data);
    } catch (e) {
      console.error(e);
      alert("Error loading user");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) =>
    setFormData((s) => ({ ...s, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/update.php`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await res.json();
      if (result.status === "ok") {
        navigateTo("list");
      } else alert("Error updating user");
    } catch (e) {
      console.error(e);
      alert("Error updating user");
    }
  };

  if (loading) return <div className="py-10 text-center text-gray-600">Loading…</div>;

  return (
    <SectionCard title="Edit user" subtitle="Update user information.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <ReadOnlyField label="ID" value={formData.id} />
        <Field label="First Name" name="fname" value={formData.fname} onChange={handleChange} required />
        <Field label="Last Name" name="lname" value={formData.lname} onChange={handleChange} required />
        <Field type="email" label="Email" name="email" value={formData.email} onChange={handleChange} required />
        <Field label="Avatar URL" name="avatar" value={formData.avatar} onChange={handleChange} />

        <div className="flex gap-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 shadow-sm"
          >
            <CheckIcon className="w-4 h-4" />
            Save changes
          </button>
          <button
            type="button"
            onClick={() => navigateTo("list")}
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 hover:bg-gray-50"
          >
            <XIcon className="w-4 h-4" />
            Cancel
          </button>
        </div>
      </form>
    </SectionCard>
  );
}

/* ================== SMALL UI HELPERS ================== */
function SectionCard({ title, subtitle, children }) {
  return (
    <section className="max-w-2xl mx-auto">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
      <div className="rounded-2xl border bg-white p-6 shadow-sm">{children}</div>
    </section>
  );
}

function Field({ label, name, value, onChange, type = "text", placeholder, required }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium mb-1">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  );
}

function ReadOnlyField({ label, value }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        type="text"
        value={value ?? ""}
        disabled
        className="w-full rounded-xl border bg-gray-100 px-3 py-2 text-gray-700"
      />
    </div>
  );
}

/* ================== TINY SVG ICONS ================== */
function PlusIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={props.className}>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function PencilIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={props.className}>
      <path d="M4 21l4.5-1.2a2 2 0 0 0 .9-.5L19 9.7a2 2 0 0 0 0-2.8l-1.9-1.9a2 2 0 0 0-2.8 0L4.7 15.6a2 2 0 0 0-.5.9L3 21h1z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function TrashIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={props.className}>
      <path d="M3 6h18M8 6V4h8v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function ArrowLeftIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={props.className}>
      <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function CheckIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={props.className}>
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function XIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={props.className}>
      <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function InboxIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={props.className}>
      <path d="M3 13l2-7h14l2 7v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5zm0 0h6l1 2h4l1-2h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
// [ADDED] ไอคอนแว่นขยาย
function SearchIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={props.className}>
      <path d="M21 21l-4.35-4.35M10.5 18A7.5 7.5 0 1 1 10.5 3a7.5 7.5 0 0 1 0 15z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default App;
