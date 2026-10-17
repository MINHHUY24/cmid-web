/*
 * Vai trò: Khung Admin: sidebar, topbar, notification Helpdesk, responsive và animation chuyển màn.
 */
import {
  CaretLeftIcon,
  ArrowRightIcon,
  BellIcon,
  CaretRightIcon,
  ListBulletsIcon,
  SignOutIcon,
  XIcon,
} from "@phosphor-icons/react";
import {
  createContext,
  useEffect,
  useContext,
  useRef,
  useState,
  type FocusEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";
import logoImage from "../../../models/assets/images/logo.webp";
import type { AdminSession } from "./XacThucQuanTri";
import {
  adminMenuGroups,
  adminViewMeta,
  type AdminView,
} from "./DieuHuongQuanTri";
import { canAccessAdminView, hasPermission } from "./PhanQuyenQuanTri";
import type { AdminActivity } from "./CoSoDuLieuQuanTri";
import { useAdminCopy } from "./NguCanhNgonNguQuanTri";
import {
  getHelpdeskNotifications,
  markHelpdeskNotificationsRead,
  type HelpdeskNotification,
} from "../../../services/helpdesk.service";
import { subscribeToHelpdeskEvents } from "../../../services/helpdesk-realtime.service";

const SIDEBAR_COLLAPSED_STORAGE_KEY = "cmid-admin-sidebar-collapsed";

type HelpdeskNotificationContextValue = {
  unreadTicketIds: string[];
  markTicketAsRead: (ticketId: string) => void;
};

const HelpdeskNotificationContext =
  createContext<HelpdeskNotificationContextValue>({
    unreadTicketIds: [],
    markTicketAsRead: () => undefined,
  });

export function useHelpdeskNotifications() {
  return useContext(HelpdeskNotificationContext);
}

function getProfileInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return (
    (words.length > 1 ? words.slice(-2) : words.slice(0, 1))
      .map((word) => word.charAt(0).toLocaleUpperCase("vi-VN"))
      .join("") || "CM"
  );
}

function getStoredSidebarCollapsed() {
  if (typeof window === "undefined") return false;
  try {
    return (
      window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === "true"
    );
  } catch {
    return false;
  }
}

interface AdminLayoutProps {
  session: AdminSession;
  activeView: AdminView;
  activities: AdminActivity[];
  onNavigate: (view: AdminView) => void;
  onOpenHelpdeskTicket: (ticketId: string) => void;
  onSignOut: () => void;
  badges?: Partial<Record<AdminView, number>>;
  children: ReactNode;
}

export function AdminLayout({
  session,
  activeView,
  activities,
  onNavigate,
  onOpenHelpdeskTicket,
  onSignOut,
  badges = {},
  children,
}: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    getStoredSidebarCollapsed,
  );
  const [sidebarTooltip, setSidebarTooltip] = useState<{
    label: string;
    left: number;
    top: number;
  } | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [helpdeskNotifications, setHelpdeskNotifications] = useState<
    HelpdeskNotification[]
  >([]);
  const [unreadHelpdeskCount, setUnreadHelpdeskCount] = useState(0);
  const { language, t } = useAdminCopy();
  const canAccessHelpdesk = hasPermission(
    session.permissions,
    "helpdesk.access",
  );

  function navigate(view: AdminView) {
    onNavigate(view);
    setSidebarOpen(false);
    setSidebarTooltip(null);
  }

  function toggleNotifications() {
    setNotificationsOpen((current) => !current);
  }

  function markTicketAsRead(ticketId: string) {
    const unreadForTicket = helpdeskNotifications.filter(
      (notification) =>
        notification.ticketId === ticketId && !notification.readAt,
    );
    if (!unreadForTicket.length) return;

    const readAt = new Date().toISOString();
    setHelpdeskNotifications((current) =>
      current.map((notification) =>
        notification.ticketId === ticketId && !notification.readAt
          ? { ...notification, readAt }
          : notification,
      ),
    );
    setUnreadHelpdeskCount((current) =>
      Math.max(0, current - unreadForTicket.length),
    );
    void markHelpdeskNotificationsRead(ticketId).catch(() => {
      void getHelpdeskNotifications()
        .then((result) => {
          setHelpdeskNotifications(result.notifications);
          setUnreadHelpdeskCount(result.unreadCount);
        })
        .catch(() => undefined);
    });
  }

  function showSidebarTooltip(
    event: MouseEvent<HTMLElement> | FocusEvent<HTMLElement>,
    label: string,
  ) {
    if (
      !sidebarCollapsed ||
      typeof window === "undefined" ||
      !window.matchMedia("(min-width: 1221px)").matches
    )
      return;
    const { right, top, height } = event.currentTarget.getBoundingClientRect();
    setSidebarTooltip({ label, left: right + 10, top: top + height / 2 });
  }

  useEffect(() => {
    if (!notificationsOpen) return undefined;
    const originalOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNotificationsOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [notificationsOpen]);

  useEffect(() => {
    if (!canAccessHelpdesk) {
      setHelpdeskNotifications([]);
      setUnreadHelpdeskCount(0);
      return undefined;
    }

    let isCurrent = true;
    void getHelpdeskNotifications()
      .then((result) => {
        if (!isCurrent) return;
        setHelpdeskNotifications(result.notifications);
        setUnreadHelpdeskCount(result.unreadCount);
      })
      .catch(() => {
        if (!isCurrent) return;
        setHelpdeskNotifications([]);
        setUnreadHelpdeskCount(0);
      });
    return () => {
      isCurrent = false;
    };
  }, [canAccessHelpdesk, session.email]);

  useEffect(() => {
    if (!canAccessHelpdesk) return undefined;

    return subscribeToHelpdeskEvents((event) => {
      if (event.type !== "notification.created" || !event.notification) return;
      setHelpdeskNotifications((current) =>
        [
          event.notification!,
          ...current.filter(
            (notification) => notification.id !== event.notification!.id,
          ),
        ].slice(0, 20),
      );
      setUnreadHelpdeskCount(
        (current) => current + (event.notification!.readAt ? 0 : 1),
      );
    });
  }, [canAccessHelpdesk]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        SIDEBAR_COLLAPSED_STORAGE_KEY,
        String(sidebarCollapsed),
      );
    } catch {
      // Private browsing or storage restrictions should not prevent admin navigation.
    }
  }, [sidebarCollapsed]);

  useEffect(() => {
    // The route supplies a neutral title during bootstrap. Set the staff role
    // after route effects have run so the tab always represents this session.
    const frame = window.requestAnimationFrame(() => {
      document.title = `CMID | ${session.roleName}`;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [session.roleName]);

  return (
    <div
      className={`admin-shell${sidebarCollapsed ? " admin-shell--sidebar-collapsed" : ""}`}
      lang={language}
    >
      <aside
        className={`admin-sidebar${sidebarOpen ? " is-open" : ""}${sidebarCollapsed ? " is-collapsed" : ""}`}
        aria-label={t("Mở điều hướng")}
      >
        <div className="admin-sidebar__brand">
          <div className="admin-brand">
            <img
              className="admin-brand__mark"
              src={logoImage}
              alt=""
              aria-hidden="true"
            />
            <span className="admin-brand__copy">
              <strong>CMID</strong>
              <span>STONE &amp; INTERIOR</span>
            </span>
          </div>
          <button
            className="admin-sidebar__collapse-toggle"
            type="button"
            onClick={() => {
              setSidebarTooltip(null);
              setSidebarCollapsed((current) => !current);
            }}
            onMouseEnter={(event) =>
              showSidebarTooltip(
                event,
                t(
                  sidebarCollapsed
                    ? "Mở rộng thanh điều hướng"
                    : "Thu gọn thanh điều hướng",
                ),
              )
            }
            onMouseLeave={() => setSidebarTooltip(null)}
            onFocus={(event) =>
              showSidebarTooltip(
                event,
                t(
                  sidebarCollapsed
                    ? "Mở rộng thanh điều hướng"
                    : "Thu gọn thanh điều hướng",
                ),
              )
            }
            onBlur={() => setSidebarTooltip(null)}
            aria-label={t(
              sidebarCollapsed
                ? "Mở rộng thanh điều hướng"
                : "Thu gọn thanh điều hướng",
            )}
            aria-pressed={sidebarCollapsed}
            title={t(
              sidebarCollapsed
                ? "Mở rộng thanh điều hướng"
                : "Thu gọn thanh điều hướng",
            )}
          >
            {sidebarCollapsed ? (
              <CaretRightIcon size={16} weight="bold" />
            ) : (
              <CaretLeftIcon size={16} weight="bold" />
            )}
          </button>
        </div>

        <nav className="admin-sidebar__nav">
          {adminMenuGroups.map((group) => {
            const permittedItems = group.items.filter((item) =>
              canAccessAdminView(session.permissions, item.id),
            );
            if (permittedItems.length === 0) return null;
            return (
              <section className="admin-nav-group" key={group.label}>
                <p>{t(group.label)}</p>
                {permittedItems.map((item) => {
                  const active =
                    activeView === item.id ||
                    (item.id === "products" && activeView === "product-editor");
                  const badge =
                    item.id === "helpdesk" && unreadHelpdeskCount > 0
                      ? unreadHelpdeskCount
                      : (badges[item.id] ?? item.badge);
                  return (
                    <button
                      className={active ? "is-active" : ""}
                      key={item.id}
                      type="button"
                      onClick={() => navigate(item.id)}
                      onMouseEnter={(event) =>
                        showSidebarTooltip(event, t(item.label))
                      }
                      onMouseLeave={() => setSidebarTooltip(null)}
                      onFocus={(event) =>
                        showSidebarTooltip(event, t(item.label))
                      }
                      onBlur={() => setSidebarTooltip(null)}
                      aria-label={t(item.label)}
                      data-tooltip={t(item.label)}
                    >
                      {item.icon}
                      <span>{t(item.label)}</span>
                      {badge ? (
                        <b
                          className={`admin-nav-badge${item.id === "helpdesk" && unreadHelpdeskCount > 0 ? " is-helpdesk-unread" : ""}`}
                        >
                          {badge}
                        </b>
                      ) : null}
                      {!badge ? (
                        <CaretRightIcon size={14} aria-hidden="true" />
                      ) : null}
                    </button>
                  );
                })}
              </section>
            );
          })}
        </nav>

        <div className="admin-sidebar__profile">
          <span
            className="admin-sidebar__avatar"
            onMouseEnter={(event) =>
              showSidebarTooltip(event, `${session.name} · ${session.roleName}`)
            }
            onMouseLeave={() => setSidebarTooltip(null)}
          >
            {getProfileInitials(session.name)}
          </span>
          <div>
            <strong>{session.name}</strong>
            <small>{session.roleName}</small>
          </div>
          <button
            type="button"
            onClick={() => {
              setSidebarTooltip(null);
              onSignOut();
            }}
            onMouseEnter={(event) => showSidebarTooltip(event, t("Đăng xuất"))}
            onMouseLeave={() => setSidebarTooltip(null)}
            onFocus={(event) => showSidebarTooltip(event, t("Đăng xuất"))}
            onBlur={() => setSidebarTooltip(null)}
            aria-label={t("Đăng xuất")}
          >
            <SignOutIcon size={19} />
          </button>
        </div>
      </aside>

      {sidebarCollapsed && sidebarTooltip ? (
        <span
          className="admin-sidebar-tooltip"
          role="tooltip"
          style={{ left: sidebarTooltip.left, top: sidebarTooltip.top }}
        >
          {sidebarTooltip.label}
        </span>
      ) : null}

      <div className="admin-workspace">
        <header className="admin-topbar">
          <button
            className="admin-menu-toggle"
            type="button"
            onClick={() => setSidebarOpen((current) => !current)}
            aria-label={t(sidebarOpen ? "Đóng điều hướng" : "Mở điều hướng")}
          >
            {sidebarOpen ? <XIcon size={21} /> : <ListBulletsIcon size={21} />}
          </button>

          <nav className="admin-breadcrumb" aria-label="Breadcrumb">
            <span>{t("Hệ thống")}</span>
            <CaretRightIcon size={14} aria-hidden="true" />
            <strong>{t(adminViewMeta[activeView].label)}</strong>
          </nav>

          <div className="admin-notification-wrap">
            <button
              className={`admin-icon-button${unreadHelpdeskCount ? " has-unread" : ""}`}
              type="button"
              aria-label={t("Thông báo")}
              aria-expanded={notificationsOpen}
              onClick={toggleNotifications}
            >
              <BellIcon size={19} />
              {unreadHelpdeskCount ? <i aria-hidden="true" /> : null}
            </button>
          </div>

          <Link className="admin-site-link" to="/" target="_blank">
            {t("Xem website")} <ArrowRightIcon size={15} />
          </Link>
        </header>

        <HelpdeskNotificationContext.Provider
          value={{
            unreadTicketIds: helpdeskNotifications
              .filter((notification) => !notification.readAt)
              .map((notification) => notification.ticketId),
            markTicketAsRead,
          }}
        >
          <main className="admin-main">
            <AdminPageTransition view={activeView}>
              {children}
            </AdminPageTransition>
          </main>
        </HelpdeskNotificationContext.Provider>
      </div>

      {sidebarOpen ? (
        <button
          type="button"
          className="admin-backdrop"
          aria-label={t("Đóng điều hướng")}
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <div
        className={`admin-notification-overlay${notificationsOpen ? " is-open" : ""}`}
      >
        <button
          className="admin-notification-overlay__backdrop"
          type="button"
          tabIndex={notificationsOpen ? 0 : -1}
          aria-label={t("Đóng thông báo")}
          onClick={() => setNotificationsOpen(false)}
        />
        <aside
          className="admin-notification-drawer"
          role="dialog"
          aria-modal={notificationsOpen}
          aria-labelledby="admin-notification-title"
        >
          <header>
            <div>
              <span>{t("Thông báo")}</span>
              <strong id="admin-notification-title">
                {t("Hoạt động mới")}
              </strong>
            </div>
            <button
              type="button"
              onClick={() => setNotificationsOpen(false)}
              aria-label={t("Đóng thông báo")}
            >
              <XIcon size={21} />
            </button>
          </header>
          <div className="admin-notification-drawer__list">
            {helpdeskNotifications.map((notification) => (
              <button
                className={`admin-notification-drawer__helpdesk-item${notification.readAt ? "" : " is-unread"}`}
                key={notification.id}
                type="button"
                onClick={() => {
                  markTicketAsRead(notification.ticketId);
                  onOpenHelpdeskTicket(notification.ticketId);
                  setNotificationsOpen(false);
                }}
              >
                <strong>{notification.title}</strong>
                <span>
                  {notification.ticketCode} · {notification.ticketSubject}
                </span>
                <small>
                  {formatRelativeTime(notification.createdAt, language)}
                </small>
              </button>
            ))}
            {activities.slice(0, 8).map((activity) => (
              <button
                key={activity.id}
                type="button"
                onClick={() => setNotificationsOpen(false)}
              >
                <strong>{t(activity.action)}</strong>
                <small>
                  {formatRelativeTime(activity.createdAt, language)}
                </small>
              </button>
            ))}
            {activities.length === 0 && helpdeskNotifications.length === 0 ? (
              <p>{t("Chưa có hoạt động mới.")}</p>
            ) : null}
          </div>
          <footer>
            <button
              type="button"
              onClick={() => {
                navigate("logs");
                setNotificationsOpen(false);
              }}
            >
              {t("Xem toàn bộ nhật ký")} <ArrowRightIcon size={17} />
            </button>
          </footer>
        </aside>
      </div>
    </div>
  );
}

function AdminPageTransition({
  view,
  children,
}: {
  view: AdminView;
  children: ReactNode;
}) {
  const [renderedPage, setRenderedPage] = useState({ view, children });
  const [phase, setPhase] = useState<"is-entering" | "is-leaving">(
    "is-entering",
  );
  const latestChildrenRef = useRef(children);
  const transitionTimerRef = useRef<number | null>(null);

  useEffect(() => {
    latestChildrenRef.current = children;
    if (view !== renderedPage.view) return;
    setRenderedPage((current) =>
      current.children === children ? current : { view, children },
    );
  }, [children, renderedPage.view, view]);

  useEffect(() => {
    if (view === renderedPage.view) return undefined;

    setPhase("is-leaving");
    if (transitionTimerRef.current !== null)
      window.clearTimeout(transitionTimerRef.current);
    transitionTimerRef.current = window.setTimeout(() => {
      setRenderedPage({ view, children: latestChildrenRef.current });
      setPhase("is-entering");
      transitionTimerRef.current = null;
    }, 130);

    return () => {
      if (transitionTimerRef.current !== null)
        window.clearTimeout(transitionTimerRef.current);
    };
  }, [renderedPage.view, view]);

  useEffect(
    () => () => {
      if (transitionTimerRef.current !== null)
        window.clearTimeout(transitionTimerRef.current);
    },
    [],
  );

  return (
    <div className={`admin-page-transition ${phase}`} key={renderedPage.view}>
      {renderedPage.children}
    </div>
  );
}

function formatRelativeTime(value: string, language: "vi" | "en") {
  const timestamp = new Date(value).getTime();
  const minutes = Math.max(1, Math.round((Date.now() - timestamp) / 60000));
  if (minutes < 60)
    return language === "en" ? `${minutes} min ago` : `${minutes} phút trước`;
  if (minutes < 1440)
    return language === "en"
      ? `${Math.round(minutes / 60)} hr ago`
      : `${Math.round(minutes / 60)} giờ trước`;
  return new Date(value).toLocaleDateString(
    language === "en" ? "en-GB" : "vi-VN",
  );
}
