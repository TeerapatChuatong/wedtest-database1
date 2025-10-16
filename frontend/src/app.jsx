import React, { useState, useEffect } from "react";

/* ================== CONFIG ================== */
const API_BASE_URL =
  (import.meta.env && import.meta.env.VITE_API_BASE) ||
  "http://localhost/crud/api/users";

const API_AUTH_BASE =
  (import.meta.env && import.meta.env.VITE_API_AUTH) ||
  "http://localhost/crud/api/auth";

/* helper fetch (กันพังเวลา API ล่ม) */
async function apiFetch(path, options = {}) {
  try {
    const res = await fetch(path, {
      credentials: "include",
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options,
    });
    const data = await res.json().catch(() => ({}));
    return data ?? {};
  } catch {
    return {};
  }
}

/* ================== APP ================== */
function App() {
  // เริ่มที่หน้า login
  const [currentPage, setCurrentPage] = useState("login");
  const [selectedUserId, setSelectedUserId] = useState(null);

  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    (async () => {
      try {
        const d = await apiFetch(`${API_AUTH_BASE}/me.php`);
        if (d?.user) {
          setUser(d.user);
          setCurrentPage(d.user.role === "admin" ? "list" : "home");
        } else {
          setCurrentPage("login");
        }
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  const navigateTo = (page, userId = null) => {
    setCurrentPage(page);
    setSelectedUserId(userId);
  };

  const handleLogout = async () => {
    await apiFetch(`${API_AUTH_BASE}/logout.php`, { method: "POST" });
    setUser(null);
    setCurrentPage("login");
  };

  return (
    <div className="min-h-dvh bg-gray-50">
      {/* Top bar */}
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div />
          <div className="flex items-center gap-2">
            {!user ? (
              <>
                <button
                  onClick={() => navigateTo("login")}
                  className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
                >
                  Login
                </button>
                <button
                  onClick={() => navigateTo("register")}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                <div className="hidden sm:flex items-center gap-3 pr-1">
                  <img
                    src={
                      user.avatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        (user.fname || "U") + " " + (user.lname || "")
                      )}`
                    }
                    onError={(e) => {
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        (user.fname || "U") + " " + (user.lname || "")
                      )}`;
                    }}
                    className="h-8 w-8 rounded-full ring-1 ring-gray-200 object-cover"
                  />
                  <div className="text-sm">
                    <div className="font-medium leading-4">
                      {user.fname} {user.lname}
                    </div>
                    <div className="text-gray-500 capitalize">{user.role}</div>
                  </div>
                </div>

                {/* ปุ่มเข้าเปลี่ยนรหัสผ่าน */}
                <button
                  onClick={() => navigateTo("change_password")}
                  className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
                >
                  Change password
                </button>

                <button
                  onClick={handleLogout}
                  className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6">
        {booting ? (
          <div className="py-16 text-center text-gray-500">Loading…</div>
        ) : (
          <>
            {/* Users: admin only */}
            {currentPage === "list" && isAdmin && (
              <UserList navigateTo={navigateTo} user={user} />
            )}
            {currentPage === "list" && !isAdmin && <ForbiddenCard />}

            {currentPage === "create" && isAdmin && (
              <CreateUser navigateTo={navigateTo} />
            )}
            {currentPage === "edit" && isAdmin && (
              <EditUser navigateTo={navigateTo} userId={selectedUserId} />
            )}

            {/* Auth pages */}
            {currentPage === "login" && (
              <Login
                navigateTo={navigateTo}
                setUser={(u) => {
                  setUser(u);
                  setCurrentPage(u.role === "admin" ? "list" : "home");
                }}
              />
            )}
            {currentPage === "register" && (
              <Register
                navigateTo={navigateTo}
                setUser={(u) => {
                  setUser(u);
                  setCurrentPage(u.role === "admin" ? "list" : "home");
                }}
              />
            )}

            {/* Home for normal user */}
            {currentPage === "home" && user && !isAdmin && <UserHome />}

            {/* Change password (ต้องล็อกอิน) */}
            {currentPage === "change_password" && user && (
              <ChangePassword navigateTo={navigateTo} />
            )}
          </>
        )}
      </main>
    </div>
  );
}

/* ================== ADMIN: LIST ================== */
function UserList({ navigateTo, user }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [keyword, setKeyword] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/read.php`);
      const data = await res.json();
      const rows = Array.isArray(data) ? data : data?.data ?? [];
      setUsers(Array.isArray(rows) ? rows : []);
      setIsSearching(false);
    } catch {
      alert("Error loading users");
    } finally {
      setLoading(false);
    }
  };

  const fetchSearch = async (kw) => {
    try {
      setLoading(true);
      const q = (kw ?? "").trim();
      if (!q) return fetchUsers();

      if (/^\d+$/.test(q)) {
        const res = await fetch(`${API_BASE_URL}/readone.php?id=${encodeURIComponent(q)}`);
        const item = await res.json();
        const rows = item?.id ? [item] : item?.data ? [item.data] : [];
        setUsers(rows);
        setIsSearching(true);
        return;
      }
      const res = await fetch(`${API_BASE_URL}/search.php?keyword=${encodeURIComponent(q)}`);
      const data = await res.json();
      const rows = Array.isArray(data) ? data : data?.data ?? [];
      setUsers(Array.isArray(rows) ? rows : []);
      setIsSearching(true);
    } catch {
      alert("Error searching users");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/delete.php`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
        credentials: "include",
      });
      const result = await res.json();
      if (result.status === "ok") {
        isSearching ? fetchSearch(keyword) : fetchUsers();
      } else {
        alert("Error deleting user");
      }
    } catch {
      alert("Error deleting user");
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchSearch(keyword);
  };
  const handleReset = () => {
    setKeyword("");
    fetchUsers();
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Users</h2>
          <p className="text-sm text-gray-500">
            {isSearching && keyword ? (
              <>
                Search results for <span className="font-medium">“{keyword}”</span>
              </>
            ) : (
              "Manage your user records"
            )}
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex w-full sm:w-auto items-center gap-2">
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
          <button type="submit" className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-gray-700 hover:bg-gray-50">
            <SearchIcon className="w-4 h-4" /> Search
          </button>
          {isSearching && (
            <button type="button" onClick={handleReset} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-gray-600 hover:bg-gray-50">
              <XIcon className="w-4 h-4" /> Reset
            </button>
          )}
          {isAdmin && (
            <button
              type="button"
              onClick={() => navigateTo("create")}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 shadow-sm"
            >
              <PlusIcon className="w-4 h-4" /> Create
            </button>
          )}
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
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3"><div className="h-4 w-10 bg-gray-200 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-10 w-10 bg-gray-200 rounded-full" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-24 bg-gray-200 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-24 bg-gray-200 rounded" /></td>
                    <td className="px-4 py-3 text-right"><div className="h-8 w-28 bg-gray-200 rounded-lg inline-block" /></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10">
                    <EmptyState
                      isSearching={isSearching}
                      onReset={handleReset}
                      onCreate={() => navigateTo("create")}
                      canCreate={isAdmin}
                    />
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/60">
                    <td className="px-4 py-3">{u.id}</td>
                    <td className="px-4 py-3">
                      <img
                        src={
                          u.avatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            (u.fname || "U") + " " + (u.lname || "")
                          )}`
                        }
                        alt={u.fname || "avatar"}
                        className="h-10 w-10 rounded-full object-cover ring-1 ring-gray-200"
                        onError={(e) => {
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            (u.fname || "U") + " " + (u.lname || "")
                          )}`;
                        }}
                      />
                    </td>
                    <td className="px-4 py-3">{u.fname}</td>
                    <td className="px-4 py-3">{u.lname}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigateTo("edit", u.id)}
                          className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                          <PencilIcon className="w-4 h-4" /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-3 py-1.5 text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                        >
                          <TrashIcon className="w-4 h-4" /> Del
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

function EmptyState({ isSearching, onReset, onCreate, canCreate }) {
  return (
    <div className="text-center text-gray-600">
      <div className="mx-auto mb-2 w-10 h-10 rounded-full bg-gray-100 grid place-items-center">
        <InboxIcon className="w-5 h-5" />
      </div>
      <div className="font-medium">{isSearching ? "No results" : "No users found"}</div>
      <div className="text-sm text-gray-500">
        {isSearching ? "Try a different keyword or reset the search." : "Create your first user to get started."}
      </div>
      <div className="mt-4 flex items-center justify-center gap-2">
        {isSearching ? (
          <button onClick={onReset} className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 hover:bg-gray-50">
            <XIcon className="w-4 h-4" /> Reset
          </button>
        ) : (
          canCreate && (
            <button onClick={onCreate} className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 hover:bg-gray-50">
              <PlusIcon className="w-4 h-4" /> New user
            </button>
          )
        )}
      </div>
    </div>
  );
}

/* ================== SIMPLE SCREENS ================== */
function ForbiddenCard() {
  return (
    <section className="max-w-md mx-auto">
      <div className="rounded-2xl border bg-white p-6 shadow-sm text-center">
        <div className="text-2xl mb-2">⛔</div>
        <h2 className="text-lg font-semibold">Access denied</h2>
        <p className="text-sm text-gray-500">Only administrators can view this page.</p>
      </div>
    </section>
  );
}

function UserHome() {
  return (
    <section className="max-w-md mx-auto">
      <div className="rounded-2xl border bg-white p-6 shadow-sm text-center">
        <h2 className="text-lg font-semibold">Welcome 👋</h2>
        <p className="text-sm text-gray-500">
          You are logged in. Ask an admin if you need additional permissions.
        </p>
      </div>
    </section>
  );
}

/* ================== CREATE / EDIT ================== */
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
        credentials: "include",
      });
      const result = await res.json();
      if (result.status === "ok") navigateTo("list");
      else alert("Error creating user");
    } catch {
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
          <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 shadow-sm">
            <Check2Icon className="w-4 h-4" /> Submit
          </button>
          <button type="button" onClick={() => navigateTo("list")} className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 hover:bg-gray-50">
            <XIcon className="w-4 h-4" /> Cancel
          </button>
        </div>
      </form>
    </SectionCard>
  );
}

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
  }, [userId]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/readone.php?id=${userId}`);
      const data = await res.json();
      setFormData(data?.data || data);
    } catch {
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
        credentials: "include",
      });
      const result = await res.json();
      if (result.status === "ok") navigateTo("list");
      else alert("Error updating user");
    } catch {
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
          <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 shadow-sm">
            <Check2Icon className="w-4 h-4" /> Save changes
          </button>
          <button type="button" onClick={() => navigateTo("list")} className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 hover:bg-gray-50">
            <XIcon className="w-4 h-4" /> Cancel
          </button>
        </div>
      </form>
    </SectionCard>
  );
}

/* ================== AUTH: LOGIN / REGISTER ================== */
function Login({ navigateTo, setUser }) {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData((s) => ({ ...s, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiFetch(`${API_AUTH_BASE}/login.php`, {
        method: "POST",
        body: JSON.stringify(formData),
      });
      if (res?.status === "ok" && res?.user) {
        setUser(res.user);
      } else {
        setError(res?.message || "Login failed");
      }
    } catch {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Login" subtitle="Welcome back! Please sign in to continue.">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}
        <Field label="Email" name="email" type="email" value={formData.email} onChange={handleChange} required />
        <Field label="Password" name="password" type="password" value={formData.password} onChange={handleChange} required />
        <button type="submit" disabled={loading} className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50">
          {loading ? "Signing in..." : "Sign in"}
        </button>
        <div className="text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <button type="button" onClick={() => navigateTo("register")} className="text-blue-600 hover:underline">
            Sign up
          </button>
        </div>
      </form>
    </AuthCard>
  );
}

function Register({ navigateTo, setUser }) {
  const [formData, setFormData] = useState({ fname: "", lname: "", email: "", password: "", avatar: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData((s) => ({ ...s, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiFetch(`${API_AUTH_BASE}/register.php`, {
        method: "POST",
        body: JSON.stringify(formData),
      });
      if (res?.status === "ok" && res?.user) {
        setUser(res.user);
      } else {
        setError(res?.message || "Registration failed");
      }
    } catch {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Sign up" subtitle="Create a new account to get started.">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}
        <Field label="First Name" name="fname" value={formData.fname} onChange={handleChange} required />
        <Field label="Last Name" name="lname" value={formData.lname} onChange={handleChange} required />
        <Field label="Email" name="email" type="email" value={formData.email} onChange={handleChange} required />
        <Field label="Password" name="password" type="password" value={formData.password} onChange={handleChange} required />
        <Field label="Avatar URL (optional)" name="avatar" value={formData.avatar} onChange={handleChange} placeholder="https://example.com/avatar.jpg" />
        <button type="submit" disabled={loading} className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50">
          {loading ? "Creating account..." : "Create account"}
        </button>
        <div className="text-center text-sm text-gray-600">
          Already have an account?{" "}
          <button type="button" onClick={() => navigateTo("login")} className="text-blue-600 hover:underline">
            Sign in
          </button>
        </div>
      </form>
    </AuthCard>
  );
}

/* ================== CHANGE PASSWORD ================== */
function ChangePassword({ navigateTo }) {
  const [form, setForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = (e) =>
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setOk("");
    if (form.new_password !== form.confirm_password) {
      setError("Password confirmation does not match");
      return;
    }
    if (form.new_password.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch(`${API_AUTH_BASE}/change_password.php`, {
        method: "POST",
        body: JSON.stringify({
          current_password: form.current_password,
          new_password: form.new_password,
        }),
      });
      if (res?.status === "ok") {
        setOk("Password updated successfully");
        setForm({ current_password: "", new_password: "", confirm_password: "" });
      } else {
        setError(res?.message || "Update failed");
      }
    } catch {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard title="Change password" subtitle="Update your account password.">
      <form onSubmit={submit} className="space-y-4">
        {error && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">{error}</div>}
        {ok && <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">{ok}</div>}

        <Field label="Current password" name="current_password" type="password" value={form.current_password} onChange={onChange} required />
        <Field label="New password" name="new_password" type="password" value={form.new_password} onChange={onChange} required />
        <Field label="Confirm new password" name="confirm_password" type="password" value={form.confirm_password} onChange={onChange} required />

        <div className="flex gap-2">
          <button type="submit" disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50">
            {loading ? "Saving..." : "Save"}
          </button>
          <button type="button" onClick={() => navigateTo("home")} className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </form>
    </SectionCard>
  );
}

/* ================== UI HELPERS ================== */
function AuthCard({ title, subtitle, children }) {
  return (
    <section className="max-w-md mx-auto">
      <div className="mb-4 text-center">
        <h2 className="text-xl font-semibold">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
      <div className="rounded-2xl border bg-white p-6 shadow-sm">{children}</div>
    </section>
  );
}
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
      <label htmlFor={name} className="block text-sm font-medium mb-1">{label}</label>
      <input
        id={name} name={name} type={type} value={value ?? ""} onChange={onChange}
        placeholder={placeholder} required={required}
        className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  );
}
function ReadOnlyField({ label, value }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input type="text" value={value ?? ""} disabled className="w-full rounded-lg border bg-gray-100 px-3 py-2 text-gray-700" />
    </div>
  );
}

/* ================== ICONS ================== */
function PlusIcon(props){return(<svg viewBox="0 0 24 24" fill="none" className={props.className}><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>);}
function PencilIcon(props){return(<svg viewBox="0 0 24 24" fill="none" className={props.className}><path d="M4 21l4.5-1.2a2 2 0 0 0 .9-.5L19 9.7a2 2 0 0 0 0-2.8l-1.9-1.9a2 2 0 0 0-2.8 0L4.7 15.6a2 2 0 0 0-.5.9L3 21h1z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>);}
function TrashIcon(props){return(<svg viewBox="0 0 24 24" fill="none" className={props.className}><path d="M3 6h18M8 6V4h8v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>);}
function XIcon(props){return(<svg viewBox="0 0 24 24" fill="none" className={props.className}><path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>);}
function InboxIcon(props){return(<svg viewBox="0 0 24 24" fill="none" className={props.className}><path d="M3 13l2-7h14l2 7v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5zm0 0h6l1 2h4l1-2h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>);}
function SearchIcon(props){return(<svg viewBox="0 0 24 24" fill="none" className={props.className}><path d="M21 21l-4.35-4.35M10.5 18A7.5 7.5 0 1 1 10.5 3a7.5 7.5 0 0 1 0 15z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>);}
function Check2Icon(props){return(<svg viewBox="0 0 24 24" fill="none" className={props.className}><path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>);}

export default App;
