/*
 * Vai trò: Chi tiết ticket: hội thoại, internal note, SLA, attachment, assignee và hành động xử lý.
 */
import {
  ChatTextIcon,
  CircleNotchIcon,
  NotePencilIcon,
  PaperclipIcon,
  PaperPlaneTiltIcon,
  StarIcon,
  TrashIcon,
  UserCheckIcon,
  UserCircleIcon,
  XIcon,
} from "@phosphor-icons/react";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { AdminModalPortal } from "./ThanhPhanCoBanQuanTri";
import type {
  HelpdeskAgent,
  HelpdeskMessageType,
  HelpdeskTeam,
  HelpdeskTicket,
  HelpdeskTicketPriority,
  HelpdeskTicketStatus,
} from "../../../services/helpdesk.service";
import {
  categoryLabel,
  formatDateTime,
  formatMessageTime,
  helpdeskPriorities,
  helpdeskStages,
  initials,
  priorityLabel,
  priorityStars,
  slaLabel,
} from "./helpdesk-utils";
import { AdminDropdown } from "./DropdownQuanTri";

type DetailPanel = "INFO" | "REPLIES" | "INTERNAL" | "ATTACHMENTS";

interface HelpdeskTicketDetailProps {
  ticket: HelpdeskTicket;
  canManage: boolean;
  agents: HelpdeskAgent[];
  teams: HelpdeskTeam[];
  currentUserId: string | null;
  language: "vi" | "en";
  isUpdating: boolean;
  isSending: boolean;
  isDeleting: boolean;
  error: string | null;
  onClose: () => void;
  onDelete: () => Promise<boolean>;
  onUpdate: (patch: {
    status?: HelpdeskTicketStatus;
    priority?: HelpdeskTicketPriority;
    assigneeId?: number | null;
    teamId?: string | null;
  }) => Promise<void>;
  onSend: (type: HelpdeskMessageType, content: string) => Promise<boolean>;
}

export function HelpdeskTicketDetail({
  ticket,
  canManage,
  agents,
  teams,
  currentUserId,
  language,
  isUpdating,
  isSending,
  isDeleting,
  error,
  onClose,
  onDelete,
  onUpdate,
  onSend,
}: HelpdeskTicketDetailProps) {
  const [activePanel, setActivePanel] = useState<DetailPanel>("INFO");
  const [message, setMessage] = useState("");
  const [hoveredPriorityStars, setHoveredPriorityStars] = useState<
    number | null
  >(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const visibleDescription =
    ticket.description ?? ticket.messages?.[0]?.content ?? null;
  const ticketAttachments =
    ticket.attachments?.filter((attachment) => !attachment.messageId) ?? [];
  const allAttachments = [
    ...ticketAttachments,
    ...(ticket.messages?.flatMap((item) => item.attachments) ?? []),
  ];
  const replies =
    ticket.messages?.filter((item) => item.type === "REPLY") ?? [];
  const internalNotes =
    ticket.messages?.filter((item) => item.type === "INTERNAL_NOTE") ?? [];
  const assignedToMe = ticket.assignee?.id === currentUserId;
  const currentStageIndex = helpdeskStages.findIndex(
    (stage) => stage.value === ticket.status,
  );
  const isInternalPanel = activePanel === "INTERNAL";
  const isConversationPanel = activePanel === "REPLIES" || isInternalPanel;
  const activeMessages = isInternalPanel ? internalNotes : replies;
  const messageType: HelpdeskMessageType = isInternalPanel
    ? "INTERNAL_NOTE"
    : "REPLY";
  const activeTabId = `helpdesk-${ticket.id}-${activePanel.toLocaleLowerCase("en-US")}`;
  const selectedPriorityStars = priorityStars(ticket.priority);
  const shownPriorityStars = hoveredPriorityStars ?? selectedPriorityStars;
  const shownPriority =
    helpdeskPriorities.find((item) => item.stars === shownPriorityStars)
      ?.value ?? ticket.priority;
  const isRequester = ticket.requester.id === currentUserId;
  const canChangePriority = !isUpdating && (canManage || isRequester);
  const canChangeStatus = !isUpdating && (canManage || isRequester);
  const canDeleteTicket = canManage || isRequester;

  useEffect(() => {
    if (!isConversationPanel) return;
    const scrollToLatest = window.requestAnimationFrame(() => {
      const element = messagesRef.current;
      if (!element) return;
      element.scrollTo({ top: element.scrollHeight, behavior: "smooth" });
    });
    return () => window.cancelAnimationFrame(scrollToLatest);
  }, [activeMessages.length, activePanel, isConversationPanel]);

  function changePriority(stars: number) {
    const priority = helpdeskPriorities.find(
      (item) => item.stars === stars,
    )?.value;
    if (!priority || priority === ticket.priority) return;
    void onUpdate({ priority });
  }

  const panels: Array<{
    id: DetailPanel;
    label: string;
    count: number;
    icon: ReactNode;
  }> = [
    {
      id: "INFO",
      label: "Thông tin",
      count: 0,
      icon: <UserCircleIcon size={17} weight="regular" />,
    },
    {
      id: "REPLIES",
      label: "Trao đổi",
      count: replies.length,
      icon: <ChatTextIcon size={17} weight="regular" />,
    },
    ...(canManage
      ? [
          {
            id: "INTERNAL" as const,
            label: "Ghi chú nội bộ",
            count: internalNotes.length,
            icon: <NotePencilIcon size={17} weight="regular" />,
          },
        ]
      : []),
    {
      id: "ATTACHMENTS",
      label: "Tệp đính kèm",
      count: allAttachments.length,
      icon: <PaperclipIcon size={17} weight="regular" />,
    },
  ];

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = message.trim();
    if (!content) return;
    if (await onSend(messageType, content)) setMessage("");
  }

  async function confirmDelete() {
    if (await onDelete()) setIsDeleteConfirmOpen(false);
  }

  return (
    <>
      <aside
        className="admin-helpdesk-detail-drawer"
        aria-label={`Chi tiết ${ticket.code}`}
        aria-modal="true"
        role="dialog"
      >
        <header className="admin-helpdesk-detail-drawer__header">
          <div className="admin-helpdesk-detail-drawer__heading">
            <span>{ticket.code}</span>
            <h2>{ticket.subject}</h2>
          </div>
          <div className="admin-helpdesk-detail-drawer__header-actions">
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng chi tiết yêu cầu"
            >
              <XIcon size={21} />
            </button>
          </div>
          <div className="admin-helpdesk-detail-drawer__header-meta">
            <div className="admin-helpdesk-detail-requester">
              <PersonAvatar
                avatarUrl={ticket.requester.avatarUrl}
                name={ticket.requester.name}
              />
              <strong>{ticket.requester.name}</strong>
              <p>Tạo lúc {formatDateTime(ticket.createdAt, language)}</p>
              <p>Cập nhật {formatDateTime(ticket.updatedAt, language)}</p>
            </div>
            <div
              className={`admin-helpdesk-detail-priority is-${shownPriority.toLocaleLowerCase("en-US")}`}
              onMouseLeave={() => setHoveredPriorityStars(null)}
            >
              <div
                className="admin-helpdesk-detail-priority__stars"
                aria-label={`Mức độ ưu tiên: ${priorityLabel(shownPriority)}`}
                role="group"
              >
                {[1, 2, 3].map((value) => (
                  <button
                    aria-label={`Đặt mức ưu tiên ${priorityLabel(helpdeskPriorities.find((item) => item.stars === value)?.value ?? ticket.priority)} (${value} sao)`}
                    aria-pressed={selectedPriorityStars === value}
                    disabled={!canChangePriority}
                    key={value}
                    onBlur={() => setHoveredPriorityStars(null)}
                    onClick={() => changePriority(value)}
                    onFocus={() => setHoveredPriorityStars(value)}
                    onMouseEnter={() => setHoveredPriorityStars(value)}
                    type="button"
                  >
                    <StarIcon
                      size={17}
                      weight={value <= shownPriorityStars ? "fill" : "regular"}
                    />
                  </button>
                ))}
              </div>
              <button
                aria-label="Đặt mức ưu tiên Bình thường (0 sao)"
                className="admin-helpdesk-detail-priority__label"
                disabled={!canChangePriority}
                onBlur={() => setHoveredPriorityStars(null)}
                onClick={() => changePriority(0)}
                onFocus={() => setHoveredPriorityStars(0)}
                onMouseEnter={() => setHoveredPriorityStars(0)}
                type="button"
              >
                {priorityLabel(shownPriority)}
              </button>
            </div>
          </div>
        </header>

        <div className="admin-helpdesk-stage-bar" aria-label="Giai đoạn xử lý">
          {helpdeskStages.map((stage, index) => {
            const isCurrent = stage.value === ticket.status;
            const state = isCurrent
              ? "is-current"
              : index < currentStageIndex
                ? "is-complete"
                : "is-upcoming";
            return (
              <button
                aria-current={isCurrent ? "step" : undefined}
                className={state}
                disabled={!canChangeStatus || isCurrent}
                key={stage.value}
                onClick={() => void onUpdate({ status: stage.value })}
                type="button"
              >
                <span
                  className="admin-helpdesk-stage-bar__marker"
                  aria-hidden="true"
                />
                <span>{stage.label}</span>
              </button>
            );
          })}
        </div>

        <div className="admin-helpdesk-detail-tabs-row">
          <div
            className="admin-helpdesk-detail-tabs"
            aria-label="Nội dung yêu cầu"
            role="tablist"
          >
            {panels.map((panel) => (
              <button
                aria-controls={
                  panel.id === activePanel ? activeTabId : undefined
                }
                aria-selected={activePanel === panel.id}
                className={activePanel === panel.id ? "is-active" : ""}
                key={panel.id}
                onClick={() => setActivePanel(panel.id)}
                role="tab"
                type="button"
              >
                {panel.icon}
                <span>{panel.label}</span>
                {panel.id !== "INFO" ? <b>{panel.count}</b> : null}
              </button>
            ))}
          </div>
          {canDeleteTicket ? (
            <button
              aria-label={`Xóa vĩnh viễn yêu cầu ${ticket.code}`}
              className="admin-helpdesk-detail-delete"
              disabled={isDeleting}
              onClick={() => setIsDeleteConfirmOpen(true)}
              type="button"
            >
              <TrashIcon size={16} weight="bold" /> <span>Xóa</span>
            </button>
          ) : null}
        </div>

        <div
          className="admin-helpdesk-detail-drawer__body"
          id={activeTabId}
          role="tabpanel"
        >
          {error ? (
            <p className="admin-form-error" role="alert">
              {error}
            </p>
          ) : null}

          {activePanel === "INFO" ? (
            <>
              {canManage ? (
                <section
                  className="admin-helpdesk-detail-actions"
                  aria-label="Thao tác xử lý"
                >
                  <div className="admin-helpdesk-detail-actions__heading">
                    <span>Điều phối yêu cầu</span>
                  </div>
                  <div className="admin-helpdesk-detail-actions__controls">
                    <button
                      className="admin-button"
                      disabled={isUpdating || assignedToMe || !currentUserId}
                      onClick={() =>
                        currentUserId &&
                        void onUpdate({ assigneeId: Number(currentUserId) })
                      }
                      type="button"
                    >
                      <UserCheckIcon size={16} /> Giao cho tôi
                    </button>
                    <div className="admin-helpdesk-detail-actions__field">
                      <span>Phụ trách</span>
                      <AdminDropdown
                        ariaLabel="Chọn nhân viên phụ trách"
                        disabled={isUpdating}
                        onChange={(value) =>
                          void onUpdate({
                            assigneeId: value ? Number(value) : null,
                          })
                        }
                        options={[
                          { value: "", label: "Chưa phân công" },
                          ...agents.map((agent) => ({
                            value: agent.id,
                            label: agent.name,
                          })),
                        ]}
                        value={ticket.assignee?.id ?? ""}
                      />
                    </div>
                    <div className="admin-helpdesk-detail-actions__field">
                      <span>Nhóm hỗ trợ</span>
                      <AdminDropdown
                        ariaLabel="Chọn nhóm hỗ trợ"
                        disabled={isUpdating}
                        onChange={(value) =>
                          void onUpdate({ teamId: value || null })
                        }
                        options={[
                          { value: "", label: "Chưa phân nhóm" },
                          ...teams.map((team) => ({
                            value: team.id,
                            label: team.name,
                          })),
                        ]}
                        value={ticket.team?.id ?? ""}
                      />
                    </div>
                  </div>
                </section>
              ) : null}

              <section className="admin-helpdesk-detail-section admin-helpdesk-detail-section--summary">
                <header>
                  <UserCircleIcon size={21} weight="regular" />{" "}
                  <h3>Thông tin yêu cầu</h3>
                </header>
                <dl className="admin-helpdesk-detail-grid">
                  <InfoItem
                    label="Người yêu cầu"
                    value={
                      <span className="admin-helpdesk-detail-person">
                        <PersonAvatar
                          avatarUrl={ticket.requester.avatarUrl}
                          name={ticket.requester.name}
                        />
                        {ticket.requester.name}
                      </span>
                    }
                    detail={ticket.requester.email}
                  />
                  <InfoItem
                    label="Phòng ban"
                    value={ticket.requester.department ?? "-"}
                  />
                  <InfoItem
                    label="Nhóm hỗ trợ"
                    value={ticket.team?.name ?? "-"}
                  />
                  <InfoItem
                    label="Nhân viên phụ trách"
                    value={ticket.assignee?.name ?? "Chưa phân công"}
                  />
                  <InfoItem
                    label="Danh mục"
                    value={
                      <span className="admin-helpdesk-detail-category">
                        {categoryLabel(ticket.category)}
                      </span>
                    }
                  />
                  <InfoItem
                    label="Tags"
                    value={
                      ticket.tags.length ? (
                        <span className="admin-helpdesk-detail-tags">
                          {ticket.tags.map((tag) => (
                            <span key={tag.id}>{tag.name}</span>
                          ))}
                        </span>
                      ) : (
                        "-"
                      )
                    }
                  />
                  <InfoItem
                    label="Ngày tạo"
                    value={formatDateTime(ticket.createdAt, language)}
                  />
                  <InfoItem
                    label="Cập nhật lần cuối"
                    value={formatDateTime(ticket.updatedAt, language)}
                  />
                  <InfoItem
                    label="SLA deadline"
                    value={
                      ticket.slaDeadline
                        ? formatDateTime(ticket.slaDeadline, language)
                        : "-"
                    }
                  />
                  <InfoItem
                    label="SLA status"
                    value={slaLabel(
                      ticket.slaStatus,
                      ticket.slaDeadline,
                      language,
                    )}
                    status={ticket.slaStatus}
                  />
                </dl>
              </section>

              <section className="admin-helpdesk-detail-section admin-helpdesk-detail-section--description">
                <header>
                  <NotePencilIcon size={21} weight="regular" />{" "}
                  <h3>Mô tả yêu cầu</h3>
                </header>
                <p
                  className={`admin-helpdesk-description${visibleDescription ? "" : " is-empty"}`}
                >
                  {visibleDescription ?? "Chưa có mô tả cho yêu cầu này."}
                </p>
              </section>
            </>
          ) : null}

          {isConversationPanel ? (
            <section className="admin-helpdesk-detail-section admin-helpdesk-chatter">
              <header>
                {isInternalPanel ? (
                  <NotePencilIcon size={21} weight="regular" />
                ) : (
                  <ChatTextIcon size={21} weight="regular" />
                )}
                <h3>{isInternalPanel ? "Ghi chú nội bộ" : "Trao đổi"}</h3>
              </header>
              <div
                className="admin-helpdesk-chatter__messages"
                aria-live="polite"
                ref={messagesRef}
              >
                {activeMessages.length ? (
                  activeMessages.map((item, index) => {
                    const previous = activeMessages[index - 1];
                    const isOwn = Boolean(
                      currentUserId && item.senderId === currentUserId,
                    );
                    const shouldShowDate =
                      !previous ||
                      !isSameMessageDay(previous.createdAt, item.createdAt);

                    return (
                      <div
                        className="admin-helpdesk-chatter__entry"
                        key={item.id}
                      >
                        {shouldShowDate ? (
                          <div className="admin-helpdesk-chatter__date">
                            <span>
                              {formatConversationDate(item.createdAt, language)}
                            </span>
                          </div>
                        ) : null}
                        <article
                          className={`admin-helpdesk-chatter__message${isOwn ? " is-own" : " is-other"}${item.type === "INTERNAL_NOTE" ? " is-internal" : ""}`}
                        >
                          {!isOwn ? (
                            <span
                              className="admin-helpdesk-person-avatar"
                              aria-hidden="true"
                            >
                              {initials(item.senderName)}
                            </span>
                          ) : null}
                          <div>
                            {!isOwn || item.type === "INTERNAL_NOTE" ? (
                              <header>
                                {!isOwn ? (
                                  <strong>{item.senderName}</strong>
                                ) : null}
                                {item.type === "INTERNAL_NOTE" ? (
                                  <small>Ghi chú nội bộ</small>
                                ) : null}
                              </header>
                            ) : null}
                            <p>{item.content}</p>
                            {item.attachments.length ? (
                              <AttachmentList attachments={item.attachments} />
                            ) : null}
                            <time dateTime={item.createdAt}>
                              {formatMessageTime(item.createdAt, language)}
                            </time>
                          </div>
                          {isOwn ? (
                            <span
                              className="admin-helpdesk-person-avatar"
                              aria-hidden="true"
                            >
                              {initials(item.senderName)}
                            </span>
                          ) : null}
                        </article>
                      </div>
                    );
                  })
                ) : (
                  <p className="admin-helpdesk-chatter__empty">
                    {isInternalPanel
                      ? "Chưa có ghi chú nội bộ."
                      : "Chưa có phản hồi trong yêu cầu này."}
                  </p>
                )}
              </div>
              <form
                className="admin-helpdesk-chatter__composer"
                onSubmit={handleSend}
              >
                <div className="admin-helpdesk-chatter__input">
                  <label>
                    <span className="sr-only">
                      {isInternalPanel ? "Ghi chú nội bộ" : "Phản hồi"}
                    </span>
                    <textarea
                      rows={3}
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      placeholder={
                        isInternalPanel
                          ? "Viết ghi chú chỉ dành cho IT..."
                          : "Viết phản hồi..."
                      }
                    />
                  </label>
                  <button
                    aria-label={
                      isInternalPanel ? "Gửi ghi chú nội bộ" : "Gửi phản hồi"
                    }
                    className="admin-button admin-button--primary admin-helpdesk-chatter__send"
                    disabled={!message.trim() || isSending}
                    title={
                      isInternalPanel ? "Gửi ghi chú nội bộ" : "Gửi phản hồi"
                    }
                    type="submit"
                  >
                    {isSending ? (
                      <CircleNotchIcon className="is-spinning" size={18} />
                    ) : (
                      <PaperPlaneTiltIcon size={18} weight="fill" />
                    )}
                  </button>
                </div>
              </form>
            </section>
          ) : null}

          {activePanel === "ATTACHMENTS" ? (
            <section className="admin-helpdesk-detail-section admin-helpdesk-detail-section--attachments">
              <header>
                <PaperclipIcon size={21} weight="regular" />{" "}
                <h3>Tệp đính kèm</h3>
              </header>
              {allAttachments.length ? (
                <AttachmentList attachments={allAttachments} />
              ) : (
                <div className="admin-helpdesk-attachments-empty">
                  <PaperclipIcon size={24} weight="regular" />
                  <strong>Chưa có tệp đính kèm</strong>
                  <p>
                    Tệp đã đính kèm trong yêu cầu hoặc trao đổi sẽ hiển thị tại
                    đây.
                  </p>
                </div>
              )}
            </section>
          ) : null}
        </div>
      </aside>
      {isDeleteConfirmOpen ? (
        <AdminModalPortal>
          <div
            className="admin-helpdesk-delete-confirm-backdrop"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !isDeleting)
                setIsDeleteConfirmOpen(false);
            }}
            role="presentation"
          >
            <section
              aria-describedby="helpdesk-delete-description"
              aria-labelledby="helpdesk-delete-title"
              aria-modal="true"
              className="admin-helpdesk-delete-confirm"
              role="alertdialog"
            >
              <header>
                <span className="admin-helpdesk-delete-confirm__icon">
                  <TrashIcon size={22} weight="bold" />
                </span>
                <div>
                  <h2 id="helpdesk-delete-title">Xóa yêu cầu hỗ trợ?</h2>
                  <p id="helpdesk-delete-description">
                    {ticket.code} cùng toàn bộ trao đổi và tệp đính kèm sẽ bị
                    xóa vĩnh viễn. Không thể hoàn tác.
                  </p>
                </div>
                <button
                  aria-label="Đóng xác nhận xóa"
                  disabled={isDeleting}
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  type="button"
                >
                  <XIcon size={19} />
                </button>
              </header>
              {error ? (
                <p className="admin-form-error" role="alert">
                  {error}
                </p>
              ) : null}
              <footer>
                <button
                  className="admin-button"
                  disabled={isDeleting}
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  type="button"
                >
                  Giữ lại
                </button>
                <button
                  className="admin-button admin-button--danger"
                  disabled={isDeleting}
                  onClick={() => void confirmDelete()}
                  type="button"
                >
                  <TrashIcon size={16} weight="bold" />{" "}
                  {isDeleting ? "Đang xóa..." : "Xóa vĩnh viễn"}
                </button>
              </footer>
            </section>
          </div>
        </AdminModalPortal>
      ) : null}
    </>
  );
}

function isSameMessageDay(first: string, second: string) {
  return new Date(first).toDateString() === new Date(second).toDateString();
}

function formatConversationDate(value: string, language: "vi" | "en") {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString())
    return language === "vi" ? "Hôm nay" : "Today";
  if (date.toDateString() === yesterday.toDateString())
    return language === "vi" ? "Hôm qua" : "Yesterday";

  return date.toLocaleDateString(language === "vi" ? "vi-VN" : "en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function PersonAvatar({
  avatarUrl,
  name,
}: {
  avatarUrl: string | null;
  name: string;
}) {
  if (avatarUrl)
    return (
      <img className="admin-helpdesk-detail-avatar" alt="" src={avatarUrl} />
    );
  return (
    <span className="admin-helpdesk-detail-avatar" aria-hidden="true">
      {initials(name)}
    </span>
  );
}

function InfoItem({
  label,
  value,
  detail,
  status,
}: {
  label: string;
  value: ReactNode;
  detail?: string;
  status?: HelpdeskTicket["slaStatus"];
}) {
  return (
    <div>
      <dt>{label}</dt>
      <dd className={status ? `is-${status.toLocaleLowerCase("en-US")}` : ""}>
        {value}
        {detail ? <small>{detail}</small> : null}
      </dd>
    </div>
  );
}

function AttachmentList({
  attachments,
}: {
  attachments: NonNullable<HelpdeskTicket["attachments"]>;
}) {
  return (
    <ul className="admin-helpdesk-attachments">
      {attachments.map((attachment) => (
        <li key={attachment.id}>
          <a href={attachment.fileUrl} target="_blank" rel="noreferrer">
            <PaperclipIcon size={15} weight="regular" />
            {attachment.fileName}
          </a>
        </li>
      ))}
    </ul>
  );
}
