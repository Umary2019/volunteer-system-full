import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api, { getErrorMessage } from "../api/client";
import QrScanner from "qr-scanner";
import "./Dashboard.css";

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString() : "Not set";
const formatDateTime = (program) =>
  `${formatDate(program.date)} · ${program.startTime || ""}-${program.endTime || ""}`;
const errorText = (err) => getErrorMessage(err);

const Shell = ({
  user,
  logout,
  active,
  setActive,
  organizerApproved,
  children,
}) => {
  const volunteerLinks = [
    ["programs", "Browse programs"],
    ["applications", "My applications"],
    ["attendance", "Attendance"],
    ["ratings", "My ratings"],
    ["notifications", "Notifications"],
  ];
  const organizerLinks = [
    ["organizer", "Organizer desk"],
    ["create", "Create program"],
  ];
  const adminLinks = [["admin", "Admin overview"]];
  const links =
    user?.role === "admin"
      ? adminLinks
      : [...volunteerLinks, ...(organizerApproved ? organizerLinks : [])];
  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <div className="app-kicker">Volunteer operations</div>
          <div className="app-brand">Campus Commons</div>
        </div>
        <div className="app-user">
          <span>{user?.email}</span>
          <button className="btn btn-quiet" onClick={logout}>
            Log out
          </button>
        </div>
      </header>
      <div className="app-layout">
        <nav className="app-nav">
          <div className="nav-label">Workspace</div>
          {links.map(([key, label]) => (
            <button
              key={key}
              className={`nav-button ${active === key ? "active" : ""}`}
              onClick={() => setActive(key)}
            >
              {label}
            </button>
          ))}
        </nav>
        <main className="app-main">{children}</main>
      </div>
    </div>
  );
};

const Heading = ({ title, text, action }) => (
  <div className="page-heading">
    <div>
      <h1>{title}</h1>
      {text && <p>{text}</p>}
    </div>
    {action}
  </div>
);
const Status = ({ value }) => (
  <span className={`status ${value}`}>{value}</span>
);
const ErrorBox = ({ error }) =>
  error ? <div className="alert-inline">{error}</div> : null;

const Programs = ({ user }) => {
  const [programs, setPrograms] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const load = async () => {
    try {
      const { data } = await api.get("/programs", {
        params: { search, category },
      });
      setPrograms(data.programs);
    } catch (err) {
      setError(errorText(err));
    }
  };
  useEffect(() => {
    load();
  }, []);
  const apply = async (id) => {
    setError("");
    setMessage("");
    try {
      await api.post(`/applications/program/${id}/apply`);
      setMessage("Application submitted.");
    } catch (err) {
      setError(errorText(err));
    }
  };
  return (
    <>
      <Heading
        title="Find a program"
        text="Opportunities are ordered by relevance when your volunteer profile is complete."
      />
      <div className="toolbar">
        <input
          className="text-input"
          placeholder="Search title or description"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          className="text-input"
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <button className="btn btn-primary" onClick={load}>
          Search
        </button>
      </div>
      <ErrorBox error={error} />
      {message && <div className="notice">{message}</div>}
      <div className="grid">
        {programs.length ? (
          programs.map((program) => (
            <article className="card" key={program._id}>
              <Status value={program.status} />
              <h3>{program.title}</h3>
              <p>{program.description}</p>
              <div className="card-meta">
                <span>{formatDateTime(program)}</span>
                <span>{program.venue}</span>
                <span>{program.category}</span>
                <span>{program.maxVolunteerCapacity} places</span>
              </div>
              <p>Apply by {formatDate(program.registrationDeadline)}</p>
              {user?.hasVolunteerProfile &&
                program.status === "open" &&
                program.applicationsOpen && (
                  <div className="card-actions">
                    <button
                      className="btn btn-gold"
                      onClick={() => apply(program._id)}
                    >
                      Apply now
                    </button>
                  </div>
                )}
            </article>
          ))
        ) : (
          <div className="empty">No programs match your search.</div>
        )}
      </div>
    </>
  );
};

const Applications = () => {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const load = async () => {
    try {
      const { data } = await api.get("/applications/mine");
      setItems(data.applications);
    } catch (err) {
      setError(errorText(err));
    }
  };
  useEffect(() => {
    load();
  }, []);
  const cancel = async (id) => {
    try {
      await api.delete(`/applications/${id}`);
      load();
    } catch (err) {
      setError(errorText(err));
    }
  };
  return (
    <>
      <Heading
        title="My applications"
        text="Track decisions and keep your commitments in one place."
      />
      <ErrorBox error={error} />
      <div className="grid">
        {items.length ? (
          items.map((item) => (
            <article className="card" key={item._id}>
              <Status value={item.status} />
              <h3>{item.program?.title || "Program unavailable"}</h3>
              <div className="card-meta">
                <span>{item.program && formatDateTime(item.program)}</span>
                <span>{item.assignedRole || "Role pending"}</span>
              </div>
              {item.rejectionReason && <p>Reason: {item.rejectionReason}</p>}
              {item.status === "pending" && (
                <button
                  className="btn btn-danger"
                  onClick={() => cancel(item._id)}
                >
                  Cancel application
                </button>
              )}
            </article>
          ))
        ) : (
          <div className="empty">You have not applied to a program yet.</div>
        )}
      </div>
    </>
  );
};

const Attendance = () => {
  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const [payload, setPayload] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const submit = async (value = payload) => {
    try {
      const data = JSON.parse(value);
      await api.post("/attendance/scan", data);
      setMessage("Attendance recorded successfully.");
      setError("");
      load();
    } catch (err) {
      setError(
        err instanceof SyntaxError
          ? "Paste the complete QR payload."
          : errorText(err),
      );
    }
  };
  const load = async () => {
    try {
      const { data } = await api.get("/attendance/mine");
      setHistory(data.history);
    } catch (err) {
      setError(errorText(err));
    }
  };
  useEffect(() => {
    load();
    return () => scannerRef.current?.stop();
  }, []);
  const start = async () => {
    setError("");
    scannerRef.current = new QrScanner(
      videoRef.current,
      (result) => {
        setPayload(result.data);
        scannerRef.current.stop();
        submit(result.data);
      },
      { returnDetailedScanResult: true },
    );
    try {
      await scannerRef.current.start();
    } catch (err) {
      setError(`Camera unavailable: ${err.message}`);
    }
  };
  return (
    <>
      <Heading
        title="Attendance"
        text="Scan the organizer QR code to check in to an approved program."
      />
      <div className="grid">
        <section className="card">
          <h3>Scan QR code</h3>
          <video className="scanner-video" ref={videoRef} muted playsInline />
          <div className="card-actions">
            <button className="btn btn-primary" onClick={start}>
              Start camera
            </button>
          </div>
          <p>Or paste the QR payload if you are using another scanner.</p>
          <textarea
            className="text-area"
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            placeholder='{"attendanceId":"...","token":"..."}'
          />
          <button className="btn btn-gold" onClick={() => submit()}>
            Check in
          </button>
        </section>
        <section className="card">
          <h3>My check-ins</h3>
          {history.length ? (
            history.map((item, index) => (
              <div className="card-meta" key={`${item.program?._id}-${index}`}>
                <span>{item.program?.title}</span>
                <span>{formatDate(item.checkedInAt)}</span>
              </div>
            ))
          ) : (
            <p>No check-ins yet.</p>
          )}
        </section>
      </div>
      <ErrorBox error={error} />
      {message && <div className="notice">{message}</div>}
    </>
  );
};

const Ratings = () => {
  const [data, setData] = useState({ ratings: [], overallRating: 0 });
  const [error, setError] = useState("");
  useEffect(() => {
    api
      .get("/ratings/mine")
      .then(({ data: result }) => setData(result))
      .catch((err) => setError(errorText(err)));
  }, []);
  return (
    <>
      <Heading
        title="My ratings"
        text="Feedback from organizers helps build your volunteer record."
      />
      <ErrorBox error={error} />
      <div className="card stat">
        <strong>{data.overallRating || "—"}</strong>
        <span>Overall rating out of 5</span>
      </div>
      <div className="grid" style={{ marginTop: "1rem" }}>
        {data.ratings.length ? (
          data.ratings.map((rating) => (
            <article className="card" key={rating._id}>
              <h3>{rating.program?.title}</h3>
              <div className="card-meta">
                <span>Overall {rating.overallRating}/5</span>
                <span>{formatDate(rating.createdAt)}</span>
              </div>
              <p>{rating.comments || "No written comments."}</p>
            </article>
          ))
        ) : (
          <div className="empty">No ratings yet.</div>
        )}
      </div>
    </>
  );
};

const Notifications = () => {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const load = async () => {
    try {
      const { data } = await api.get("/notifications");
      setItems(data.notifications);
    } catch (err) {
      setError(errorText(err));
    }
  };
  useEffect(() => {
    load();
  }, []);
  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      load();
    } catch (err) {
      setError(errorText(err));
    }
  };
  return (
    <>
      <Heading
        title="Notifications"
        text="Updates about applications, organizer access, and program activity."
      />
      <ErrorBox error={error} />
      <div className="grid">
        {items.length ? (
          items.map((item) => (
            <article className="card" key={item._id}>
              <Status value={item.isRead ? "read" : "pending"} />
              <h3>{item.title}</h3>
              <p>{item.message}</p>
              <div className="card-meta">
                <span>{formatDate(item.createdAt)}</span>
                <span>{item.type}</span>
              </div>
              {!item.isRead && (
                <button
                  className="btn btn-quiet"
                  onClick={() => markRead(item._id)}
                >
                  Mark as read
                </button>
              )}
            </article>
          ))
        ) : (
          <div className="empty">You are all caught up.</div>
        )}
      </div>
    </>
  );
};

const ProgramForm = ({ onCreated }) => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    date: "",
    startTime: "09:00",
    endTime: "12:00",
    venue: "",
    maxVolunteerCapacity: 10,
    registrationDeadline: "",
    volunteerRoles: "",
    imageUrl: "",
  });
  const [error, setError] = useState("");
  const update = (key, value) => setForm({ ...form, [key]: value });
  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/programs", {
        ...form,
        volunteerRoles: form.volunteerRoles
          .split(",")
          .map((role) => role.trim())
          .filter(Boolean),
        maxVolunteerCapacity: Number(form.maxVolunteerCapacity),
      });
      setForm({ ...form, title: "", description: "" });
      setError("");
      onCreated?.();
    } catch (err) {
      setError(errorText(err));
    }
  };
  return (
    <form className="card form-card" onSubmit={submit}>
      <ErrorBox error={error} />
      <div className="form-grid">
        {[
          ["title", "Title"],
          ["category", "Category"],
          ["date", "Event date"],
          ["startTime", "Start time"],
          ["endTime", "End time"],
          ["venue", "Venue"],
          ["maxVolunteerCapacity", "Capacity"],
          ["registrationDeadline", "Application deadline"],
        ].map(([key, label]) => (
          <div className="form-row" key={key}>
            <label>{label}</label>
            <input
              className="text-input"
              type={
                key.includes("date") || key === "registrationDeadline"
                  ? "date"
                  : key === "maxVolunteerCapacity"
                    ? "number"
                    : key.includes("Time")
                      ? "time"
                      : "text"
              }
              value={form[key]}
              onChange={(e) => update(key, e.target.value)}
              required
            />
          </div>
        ))}
        <div className="form-row full">
          <label>Description</label>
          <textarea
            className="text-area"
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            required
          />
        </div>
        <div className="form-row full">
          <label>Volunteer roles, separated by commas</label>
          <input
            className="text-input"
            value={form.volunteerRoles}
            onChange={(e) => update("volunteerRoles", e.target.value)}
            placeholder="Registration, Logistics"
          />
        </div>
      </div>
      <button className="btn btn-primary" type="submit">
        Create draft
      </button>
    </form>
  );
};

const OrganizerDesk = () => {
  const [programs, setPrograms] = useState([]);
  const [selected, setSelected] = useState(null);
  const [apps, setApps] = useState([]);
  const [ranked, setRanked] = useState(false);
  const [qr, setQr] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [error, setError] = useState("");
  const load = async () => {
    try {
      const { data } = await api.get("/programs/mine");
      setPrograms(data.programs);
    } catch (err) {
      setError(errorText(err));
    }
  };
  useEffect(() => {
    load();
  }, []);
  const choose = async (program) => {
    setSelected(program);
    setError("");
    try {
      const { data } = await api.get(`/applications/program/${program._id}`);
      setApps(data.applications);
    } catch (err) {
      setError(errorText(err));
    }
  };
  const toggle = async () => {
    try {
      const { data } = await api.patch(`/programs/${selected._id}/applications`, {
        open: !selected.applicationsOpen,
      });
      setSelected(data.program);
      setRanked(false);
      choose(data.program);
      load();
    } catch (err) {
      setError(errorText(err));
    }
  };
  const review = async (id, action) => {
    try {
      if (action === "approve")
        await api.patch(`/applications/${id}/approve`, {});
      else {
        const reason = window.prompt("Why is this application being rejected?");
        if (!reason) return;
        await api.patch(`/applications/${id}/reject`, {
          reason,
        });
      }
      choose(selected);
    } catch (err) {
      setError(errorText(err));
    }
  };
  const manageProgram = async (action) => {
    try {
      if (action === "cancel") {
        if (!window.confirm("Cancel this program?")) return;
        await api.delete(`/programs/${selected._id}`);
      } else {
        const title = window.prompt("Program title", selected.title);
        if (!title) return;
        await api.put(`/programs/${selected._id}`, { title });
      }
      setSelected(null);
      load();
    } catch (err) {
      setError(errorText(err));
    }
  };
  const loadAttendance = async () => {
    try {
      const { data } = await api.get(`/attendance/program/${selected._id}`);
      setAttendance(data.sessions);
    } catch (err) {
      setError(errorText(err));
    }
  };
  const applicantAction = async (item, action) => {
    try {
      if (action === "assign") {
        const role = window.prompt("Assign a role", item.assignedRole || "");
        if (!role) return;
        await api.patch(`/applications/${item._id}/assign-role`, { role });
      } else {
        const reason = window.prompt("Why is this volunteer being removed?");
        if (!reason) return;
        await api.patch(`/applications/${item._id}/remove`, { reason });
      }
      choose(selected);
    } catch (err) {
      setError(errorText(err));
    }
  };
  const startQr = async () => {
    try {
      const { data } = await api.post(
        `/attendance/program/${selected._id}/start`,
      );
      setQr(data);
    } catch (err) {
      setError(errorText(err));
    }
  };
  return (
    <>
      <Heading
        title="Organizer desk"
        text="Run your programs, review applicants, and manage attendance."
      />
      <ErrorBox error={error} />
      <div className="grid">
        <section>
          <h3>Your programs</h3>
          {programs.length ? (
            programs.map((program) => (
              <button
                className={`card nav-button ${selected?._id === program._id ? "active" : ""}`}
                style={{ marginBottom: ".7rem" }}
                key={program._id}
                onClick={() => choose(program)}
              >
                <Status value={program.status} />
                <h3>{program.title}</h3>
                <p>{formatDateTime(program)}</p>
              </button>
            ))
          ) : (
            <div className="empty">
              No programs yet. Create a draft to get started.
            </div>
          )}
        </section>
        {selected && (
          <section className="card">
            <Status value={selected.status} />
            <h3>{selected.title}</h3>
            <div className="card-actions">
              <button className="btn btn-gold" onClick={toggle}>
                {selected.applicationsOpen
                  ? "Close applications"
                  : "Open applications"}
              </button>
              <button className="btn btn-quiet" onClick={startQr}>
                Start attendance
              </button>
              <button className="btn btn-quiet" onClick={loadAttendance}>
                View check-ins
              </button>
              <button className="btn btn-quiet" onClick={() => manageProgram("edit")}>
                Edit title
              </button>
              <button className="btn btn-danger" onClick={() => manageProgram("cancel")}>
                Cancel program
              </button>
              <button
                className="btn btn-quiet"
                onClick={async () => {
                  try {
                    const { data } = await api.get(
                      `/applications/program/${selected._id}/ranked`,
                    );
                    setApps(data.ranked.map((item) => item.application));
                    setRanked(true);
                  } catch (err) {
                    setError(errorText(err));
                  }
                }}
              >
                Rank applicants
              </button>
            </div>
            {qr && (
              <>
                <p>
                  Show this QR code to approved volunteers. It expires at{" "}
                  {formatDate(qr.expiresAt)}.
                </p>
                <img
                  className="qr-image"
                  src={qr.qrCodeDataUrl}
                  alt="Attendance QR code"
                />
              </>
            )}
            {attendance.length > 0 && <div className="notice">{attendance.reduce((count, session) => count + session.checkIns.length, 0)} check-ins across {attendance.length} attendance sessions.</div>}
            <h3>{ranked ? "Ranked pending applicants" : "Applicants"}</h3>
            {apps.length ? (
              apps.map((item) => (
                <div
                  className="card"
                  style={{ marginTop: ".7rem", boxShadow: "none" }}
                  key={item._id}
                >
                  <strong>{item.volunteer?.fullName || "Volunteer"}</strong>
                  <p>
                    {item.volunteer?.department} · {item.volunteer?.level}
                  </p>
                  <Status value={item.status} />
                  <div className="card-actions">
                    {item.status === "pending" && (
                      <>
                        <button
                          className="btn btn-gold"
                          onClick={() => review(item._id, "approve")}
                        >
                          Approve
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => review(item._id, "reject")}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {item.status === "approved" && (
                      <><button className="btn btn-quiet" onClick={() => applicantAction(item, "assign")}>Assign role</button><button className="btn btn-danger" onClick={() => applicantAction(item, "remove")}>Remove</button><RatingForm applicationId={item._id} /></>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p>No applicants yet.</p>
            )}
          </section>
        )}
      </div>
    </>
  );
};

const RatingForm = ({ applicationId }) => {
  const [values, setValues] = useState({
    punctuality: 5,
    commitment: 5,
    teamwork: 5,
    communication: 5,
    taskCompletion: 5,
    comments: "",
  });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const submit = async () => {
    try {
      await api.post(`/ratings/application/${applicationId}`, {
        ...values,
        ...Object.fromEntries(
          Object.entries(values)
            .slice(0, 5)
            .map(([key, value]) => [key, Number(value)]),
        ),
      });
      setSent(true);
    } catch (err) {
      setError(errorText(err));
    }
  };
  return sent ? (
    <span className="status completed">Rated</span>
  ) : (
    <>
      <div className="rating-fields">
        {Object.keys(values)
          .slice(0, 5)
          .map((key) => (
            <label key={key}>
              {key}
              <select
                className="select-input"
                value={values[key]}
                onChange={(e) =>
                  setValues({ ...values, [key]: e.target.value })
                }
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
          ))}
      </div>
      <textarea className="text-area" placeholder="Optional feedback" value={values.comments} onChange={(e) => setValues({ ...values, comments: e.target.value })} />
      <button className="btn btn-primary" onClick={submit}>
        Submit rating
      </button>
      <ErrorBox error={error} />
    </>
  );
};

const CreateProgram = () => (
  <>
    <Heading
      title="Create a program"
      text="New programs begin as drafts. Open applications when the details are ready."
    />
    <ProgramForm
      onCreated={() =>
        window.alert(
          "Draft created. Open Organizer desk to publish applications.",
        )
      }
    />
  </>
);

const Admin = () => {
  const [data, setData] = useState({
    stats: {},
    requests: [],
    users: [],
    programs: [],
    applications: [],
  });
  const [error, setError] = useState("");
  const [section, setSection] = useState("overview");
  const [userSearch, setUserSearch] = useState("");
  const [programFilter, setProgramFilter] = useState("all");
  const load = async () => {
    try {
      const results =
        await Promise.allSettled(
          [
            "/admin/stats",
            "/admin/organizer-requests",
            "/admin/users",
            "/admin/programs",
            "/admin/applications",
          ].map((path) => api.get(path)),
        );
      const [stats, requests, users, programs, applications] = results;
      setData({
        stats: stats.status === "fulfilled" ? stats.value.data.stats : {},
        requests: requests.status === "fulfilled" ? requests.value.data.requests : [],
        users: users.status === "fulfilled" ? users.value.data.users : [],
        programs: programs.status === "fulfilled" ? programs.value.data.programs : [],
        applications: applications.status === "fulfilled" ? applications.value.data.applications : [],
      });
      if (results.some((result) => result.status === "rejected")) setError("Some admin data could not be loaded.");
    } catch (err) {
      setError(errorText(err));
    }
  };
  useEffect(() => {
    load();
  }, []);
  const decision = async (id, action) => {
    try {
      await api.patch(
        `/admin/organizer-requests/${id}/${action}`,
        action === "reject"
          ? { reason: "Please provide more information." }
          : {},
      );
      load();
    } catch (err) {
      setError(errorText(err));
    }
  };
  const toggle = async (id) => {
    try {
      await api.patch(`/admin/users/${id}/toggle-active`);
      load();
    } catch (err) {
      setError(errorText(err));
    }
  };
  const filteredUsers = data.users.filter((person) => person.email.toLowerCase().includes(userSearch.toLowerCase()));
  const filteredPrograms = data.programs.filter((program) => programFilter === "all" || program.status === programFilter);
  const pendingRequests = data.requests.filter((request) => request.status === "pending");
  const recentPrograms = [...data.programs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  return (
    <>
      <div className="admin-hero">
        <div><div className="app-kicker">Control center</div><h1>Admin workspace</h1><p>Monitor the community, review access, and keep programs moving.</p></div>
        <button className="btn btn-gold" onClick={load}>Refresh data</button>
      </div>
      <ErrorBox error={error} />
      <div className="stat-grid">
        {[
          ["totalUsers", "Users"],
          ["totalPrograms", "Programs"],
          ["totalApplications", "Applications"],
          ["pendingOrganizerRequests", "Pending organizer requests"],
        ].map(([key, label]) => (
          <div className="card stat" key={key}>
            <strong>{data.stats[key] || 0}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <div className="admin-tabs" role="tablist" aria-label="Admin workspace sections">
        {[['overview', 'Overview'], ['requests', `Requests${pendingRequests.length ? ` · ${pendingRequests.length}` : ''}`], ['users', 'Users'], ['activity', 'Platform activity']].map(([key, label]) => <button key={key} role="tab" aria-selected={section === key} className={`admin-tab ${section === key ? 'active' : ''}`} onClick={() => setSection(key)}>{label}</button>)}
      </div>
      {section === "overview" && <div className="admin-overview-grid"><section className="card"><div className="section-heading"><div><span className="app-kicker">Needs attention</span><h2>Pending organizer requests</h2></div><button className="btn btn-quiet" onClick={() => setSection("requests")}>View all</button></div>{pendingRequests.length ? pendingRequests.slice(0, 4).map((request) => <div className="admin-request" key={request._id}><div><strong>{request.organization}</strong><p>{request.user?.email} · {request.position}</p></div><Status value={request.status}/></div>) : <div className="empty">No requests need review.</div>}</section><section className="card"><div className="section-heading"><div><span className="app-kicker">Latest activity</span><h2>Recently added programs</h2></div><button className="btn btn-quiet" onClick={() => setSection("activity")}>View all</button></div>{recentPrograms.length ? recentPrograms.map((program) => <div className="admin-request" key={program._id}><div><strong>{program.title}</strong><p>{formatDate(program.date)} · {program.organizer?.organization || "Organizer"}</p></div><Status value={program.status}/></div>) : <div className="empty">No programs yet.</div>}</section></div>}
      {section === "requests" && <section className="card">
        <div className="section-heading"><div><span className="app-kicker">Access review</span><h2>Organizer requests</h2><p>Approve trusted organizers or request more information before access is granted.</p></div></div>
        <h3>Organizer requests</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Organization</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.requests.map((request) => (
                <tr key={request._id}>
                  <td>{request.user?.email}</td>
                  <td>
                    {request.organization}
                    <br />
                    {request.position}
                  </td>
                  <td>
                    <Status value={request.status} />
                  </td>
                  <td>
                    {request.status === "pending" && (
                      <>
                        <button
                          className="btn btn-gold"
                          onClick={() => decision(request._id, "approve")}
                        >
                          Approve
                        </button>{" "}
                        <button
                          className="btn btn-danger"
                          onClick={() => decision(request._id, "reject")}
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>}
      {section === "users" && <section className="card">
        <div className="section-heading"><div><span className="app-kicker">People</span><h2>User directory</h2><p>Search accounts and manage access without touching administrator accounts.</p></div><input className="text-input admin-search" placeholder="Search by email" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} /></div>
        <h3>Users</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Verified</th>
                <th>Active</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((person) => (
                <tr key={person._id}>
                  <td>{person.email}</td>
                  <td>{person.role}</td>
                  <td>{person.isEmailVerified ? "Yes" : "No"}</td>
                  <td>{person.isActive ? "Yes" : "No"}</td>
                  <td>
                    {person.role !== "admin" && (
                      <button
                        className="btn btn-quiet"
                        onClick={() => toggle(person._id)}
                      >
                        {person.isActive ? "Deactivate" : "Activate"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>}
      {section === "activity" && <section className="card">
        <div className="section-heading"><div><span className="app-kicker">Platform activity</span><h2>Programs and applications</h2><p>Review the current health of programs and volunteer demand.</p></div><select className="select-input admin-search" value={programFilter} onChange={(e) => setProgramFilter(e.target.value)}><option value="all">All program statuses</option><option value="draft">Draft</option><option value="open">Open</option><option value="closed">Closed</option><option value="cancelled">Cancelled</option><option value="completed">Completed</option></select></div>
        <h3>Programs and applications</h3>
        <p>{data.programs.length} programs · {data.applications.length} applications recorded.</p>
        <div className="table-wrap" style={{ marginTop: "1rem" }}><table><thead><tr><th>Program</th><th>Status</th><th>Event date</th><th>Organizer</th></tr></thead><tbody>{filteredPrograms.map((program) => <tr key={program._id}><td>{program.title}</td><td><Status value={program.status}/></td><td>{formatDate(program.date)}</td><td>{program.organizer?.organization || program.organizer?.name || "-"}</td></tr>)}</tbody></table></div>
        <div className="table-wrap" style={{ marginTop: "1rem" }}><table><thead><tr><th>Volunteer</th><th>Program</th><th>Status</th><th>Role</th></tr></thead><tbody>{data.applications.map((application) => <tr key={application._id}><td>{application.volunteer?.fullName || "-"}</td><td>{application.program?.title || "-"}</td><td><Status value={application.status}/></td><td>{application.assignedRole || "-"}</td></tr>)}</tbody></table></div>
      </section>}
    </>
  );
};

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [active, setActive] = useState(
    user?.role === "admin" ? "admin" : "programs",
  );
  const [organizerApproved, setOrganizerApproved] = useState(false);
  useEffect(() => {
    if (user?.role === "admin" || !user?.hasOrganizerProfile) return;
    api
      .get("/profiles/organizer")
      .then(({ data }) =>
        setOrganizerApproved(data.profile.status === "approved"),
      )
      .catch(() => setOrganizerApproved(false));
  }, [user]);
  const content =
    active === "programs" ? (
      <Programs user={user} />
    ) : active === "applications" ? (
      <Applications />
    ) : active === "attendance" ? (
      <Attendance />
    ) : active === "ratings" ? (
      <Ratings />
    ) : active === "notifications" ? (
      <Notifications />
    ) : active === "create" ? (
      <CreateProgram />
    ) : active === "organizer" ? (
      <OrganizerDesk />
    ) : (
      <Admin />
    );
  return (
    <Shell
      user={user}
      logout={logout}
      active={active}
      setActive={setActive}
      organizerApproved={organizerApproved}
    >
      {content}
    </Shell>
  );
};

export default Dashboard;
