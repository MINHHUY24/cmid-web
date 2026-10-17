/*
 * Vai trò: Hook an toàn để đọc `AdminAuthContext`.
 */
/* Hook React để đọc Context đăng nhập của Admin. */
import { useContext } from "react";
import { AdminAuthContext } from "./QuanTriAuthContext";

/* Hook tập trung kiểm tra Provider, giúp các View Admin không lặp lại mã bảo vệ. */
export function useAdminAuth() {
  const context = useContext(AdminAuthContext);

  if (!context) {
    throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  }

  return context;
}
