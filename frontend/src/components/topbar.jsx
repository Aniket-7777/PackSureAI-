import {
  Bell,
  Search,
  ChevronDown,
  User,
  Settings,
  LogOut,
  ClipboardList,
  FileText,
  X
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState
} from "react";

import {
  useNavigate,
  useLocation
} from "react-router-dom";

import {
  getDashboardViolations
} from "../api";


export default function Topbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [profileOpen, setProfileOpen] =
    useState(false);

  const [notificationOpen, setNotificationOpen] =
    useState(false);

  const [notifications, setNotifications] =
    useState([]);

  const [loadingNotifications, setLoadingNotifications] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const profileRef = useRef(null);
  const notificationRef = useRef(null);


  /*
   * Load latest violations as notifications.
   */
  async function loadNotifications() {
    setLoadingNotifications(true);

    try {
      const response =
        await getDashboardViolations({
          limit: 5
        });

      setNotifications(
        Array.isArray(response?.data)
          ? response.data
          : []
      );
    } catch (error) {
      console.error(
        "Failed to load notifications:",
        error
      );

      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  }


  useEffect(() => {
    loadNotifications();
  }, [location.pathname]);


  /*
   * Close dropdowns when clicking outside.
   */
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        profileRef.current &&
        !profileRef.current.contains(
          event.target
        )
      ) {
        setProfileOpen(false);
      }

      if (
        notificationRef.current &&
        !notificationRef.current.contains(
          event.target
        )
      ) {
        setNotificationOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);


  /*
   * Search navigation.
   */
  function handleSearch(event) {
    event.preventDefault();

    const value = search.trim();

    if (!value) {
      return;
    }

    navigate(
      `/inspections?search=${encodeURIComponent(
        value
      )}`
    );
  }


  /*
   * Logout.
   */
  function handleLogout() {
    localStorage.removeItem(
      "packsureai_user"
    );

    localStorage.removeItem(
      "packsureai_session"
    );

    navigate("/login");
  }


  function openNotifications() {
    setNotificationOpen(
      (previous) => !previous
    );

    setProfileOpen(false);
  }


  function openProfile() {
    setProfileOpen(
      (previous) => !previous
    );

    setNotificationOpen(false);
  }


  function getNotificationTitle(
    violation
  ) {
    return (
      violation?.violation_title ||
      violation?.violation_code ||
      "Compliance violation detected"
    );
  }


  function getNotificationTime(
    violation
  ) {
    if (!violation?.created_at) {
      return "Recently";
    }

    const date =
      new Date(
        violation.created_at
      );

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "Recently";
    }

    return date.toLocaleString(
      "en-IN",
      {
        dateStyle: "short",
        timeStyle: "short"
      }
    );
  }


  return (
    <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-slate-200 bg-white/90 px-6 backdrop-blur-xl">

      {/* SEARCH */}

      <form
        onSubmit={handleSearch}
        className="relative hidden w-full max-w-md md:block"
      >

        <Search
          size={17}
          className="absolute left-3.5 top-3.5 text-slate-400"
        />

        <input
          type="text"
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value
            )
          }
          placeholder="Search inspections, products..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
        />

      </form>


      <div className="ml-auto flex items-center gap-3">


        {/* NOTIFICATIONS */}

        <div
          ref={notificationRef}
          className="relative"
        >

          <button
            type="button"
            onClick={
              openNotifications
            }
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-blue-600"
            title="Notifications"
          >

            <Bell size={18} />

            {notifications.length > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[8px] font-bold text-white ring-2 ring-white">
                {notifications.length >
                9
                  ? "9+"
                  : notifications.length}
              </span>
            )}

          </button>


          {notificationOpen && (
            <div className="absolute right-0 top-12 w-[360px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">

              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">

                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Notifications
                  </h3>

                  <p className="mt-0.5 text-[10px] text-slate-400">
                    Latest compliance alerts
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setNotificationOpen(
                      false
                    )
                  }
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X size={16} />
                </button>

              </div>


              <div className="max-h-[360px] overflow-y-auto">

                {loadingNotifications ? (
                  <div className="px-5 py-10 text-center text-xs text-slate-400">
                    Loading notifications...
                  </div>
                ) : notifications.length ===
                  0 ? (
                  <div className="px-5 py-10 text-center">

                    <Bell
                      size={25}
                      className="mx-auto text-slate-300"
                    />

                    <p className="mt-3 text-sm font-semibold text-slate-600">
                      No new alerts
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Compliance notifications will appear here.
                    </p>

                  </div>
                ) : (
                  notifications.map(
                    (violation) => (
                      <button
                        type="button"
                        key={
                          violation.id
                        }
                        onClick={() => {
                          setNotificationOpen(
                            false
                          );

                          if (
                            violation.inspection_id
                          ) {
                            navigate(
                              `/report?inspection_id=${encodeURIComponent(
                                violation.inspection_id
                              )}`
                            );
                          }
                        }}
                        className="flex w-full gap-3 border-b border-slate-50 px-5 py-4 text-left transition hover:bg-slate-50"
                      >

                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                          <FileText
                            size={15}
                          />
                        </div>

                        <div className="min-w-0 flex-1">

                          <p className="truncate text-xs font-semibold text-slate-800">
                            {getNotificationTitle(
                              violation
                            )}
                          </p>

                          <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-slate-500">
                            {violation.description ||
                              "Compliance issue detected during inspection."}
                          </p>

                          <p className="mt-2 text-[9px] text-slate-400">
                            {getNotificationTime(
                              violation
                            )}
                          </p>

                        </div>

                      </button>
                    )
                  )
                )}

              </div>


              <div className="border-t border-slate-100 p-3">

                <button
                  type="button"
                  onClick={() => {
                    setNotificationOpen(
                      false
                    );

                    navigate(
                      "/notifications"
                    );
                  }}
                  className="w-full rounded-lg bg-slate-50 py-2.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
                >
                  View all notifications
                </button>

              </div>

            </div>
          )}

        </div>


        {/* PROFILE */}

        <div
          ref={profileRef}
          className="relative"
        >

          <button
            type="button"
            onClick={openProfile}
            className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-slate-50"
          >

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
              AO
            </div>

            <div className="hidden text-left sm:block">

              <p className="text-xs font-semibold text-slate-800">
                Enforcement Officer
              </p>

              <p className="text-[10px] text-slate-400">
                Administrator
              </p>

            </div>

            <ChevronDown
              size={15}
              className={`text-slate-400 transition ${
                profileOpen
                  ? "rotate-180"
                  : ""
              }`}
            />

          </button>


          {profileOpen && (
            <div className="absolute right-0 top-12 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">

              <div className="border-b border-slate-100 px-4 py-4">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                    AO
                  </div>

                  <div className="min-w-0">

                    <p className="truncate text-sm font-semibold text-slate-800">
                      Enforcement Officer
                    </p>

                    <p className="truncate text-[10px] text-slate-400">
                      Administrator
                    </p>

                  </div>

                </div>

              </div>


              <div className="p-2">

                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(
                      false
                    );

                    navigate(
                      "/settings"
                    );
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                >

                  <Settings size={16} />

                  Settings

                </button>


                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(
                      false
                    );

                    navigate(
                      "/inspections"
                    );
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                >

                  <ClipboardList
                    size={16}
                  />

                  My Inspections

                </button>


                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(
                      false
                    );

                    navigate(
                      "/reports"
                    );
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                >

                  <FileText size={16} />

                  Reports

                </button>


                <div className="my-1 border-t border-slate-100" />


                <button
                  type="button"
                  onClick={
                    handleLogout
                  }
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-semibold text-red-600 transition hover:bg-red-50"
                >

                  <LogOut size={16} />

                  Sign out

                </button>

              </div>

            </div>
          )}

        </div>

      </div>

    </header>
  );
}