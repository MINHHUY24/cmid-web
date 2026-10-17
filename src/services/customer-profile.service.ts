/*
 * Vai trò: Endpoint hồ sơ khách hàng: đọc, tạo/cập nhật profile và map dữ liệu server.
 */
/* HTTP client tự thêm token khách hàng cho endpoint hồ sơ. */
import { apiFetch } from "./api";

/* Tập giá trị giới tính backend chấp nhận. */
export type ServerCustomerGender = "" | "male" | "female" | "other";

/* Cấu trúc profile chuẩn được API trả về. */
export interface ServerCustomerProfile {
  fullName: string;
  avatar: string;
  phone: string;
  birthDate: string;
  gender: ServerCustomerGender;
  city: string;
  district: string;
  ward: string;
  address: string;
}

/* Payload cập nhật không gồm avatar vì avatar data URL chỉ lưu cục bộ hiện tại. */
export type CustomerProfileUpdate = Omit<ServerCustomerProfile, "avatar">;

type CustomerProfileResponse = {
  profile: ServerCustomerProfile;
};

/* Lấy hồ sơ của khách đang đăng nhập. */
export function getCustomerProfile() {
  return apiFetch<CustomerProfileResponse>("/auth/profile");
}

/* Gửi profile giao hàng; avatar không được gửi vì có thể là data URL rất lớn ở local. */
export function updateCustomerProfile(profile: CustomerProfileUpdate) {
  return apiFetch<CustomerProfileResponse>("/auth/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    /* Đổi chuỗi rỗng thành null để server hiểu là khách đã xoá giá trị. */
    body: JSON.stringify({
      fullName: profile.fullName,
      phone: profile.phone || null,
      birthDate: profile.birthDate || null,
      gender: profile.gender || null,
      city: profile.city || null,
      district: profile.district || null,
      ward: profile.ward || null,
      address: profile.address || null,
    }),
  });
}
