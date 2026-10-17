/*
 * Vai trò: Khôi phục phiên khách, Google Sign-In, đồng bộ/cập nhật hồ sơ với API và local cache an toàn.
 */
/* Hook React điều phối phiên đăng nhập, hồ sơ khách hàng và vòng đời bất đồng bộ. */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
/* Kiểu public của phiên/hồ sơ và Context được Provider này cung cấp. */
import type { AuthenticatedUser, CustomerProfile } from "./NguoiDungContext";
import { UserContext } from "./NguoiDungContext";
/* Service xác thực khách hàng bằng Google và khôi phục phiên từ server. */
/* Kho access token và cơ chế đăng ký hàm refresh tập trung cho API client. */
import {
  loginWithGoogleCredential,
  logoutCustomerAuthSession,
  refreshCustomerAuthSession,
  type ServerAuthenticatedUser,
} from "../../services/auth.service";
import {
  clearAccessToken,
  registerAccessTokenRefresher,
  setAccessToken,
} from "../../services/auth-token";
/* Lỗi API có mã HTTP và service quản lý hồ sơ khách hàng ở backend. */
import { ApiError } from "../../services/api";
import {
  getCustomerProfile,
  updateCustomerProfile,
  type ServerCustomerProfile,
} from "../../services/customer-profile.service";

/* Các khoá cache cũ/mới và cấu hình nạp Google Identity Services. */
const LEGACY_USER_STORAGE_KEY = "cmid-user";
const PROFILE_STORAGE_PREFIX = "cmid-customer-profile:";
const PROFILE_SYNC_STORAGE_PREFIX = "cmid-customer-profile-synced:";
const GOOGLE_SCRIPT_URL = "https://accounts.google.com/gsi/client";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

/* Mẫu hồ sơ rỗng để tránh dùng chung cùng một object mutable giữa các phiên. */
const EMPTY_CUSTOMER_PROFILE: CustomerProfile = {
  fullName: "",
  avatar: "",
  phone: "",
  birthDate: "",
  gender: "",
  city: "",
  district: "",
  ward: "",
  address: "",
};

/* Kiểu tối thiểu của response Google mà ứng dụng thực sự sử dụng. */
interface GoogleCredentialResponse {
  credential?: string;
}

/* Trạng thái callback khi hộp đăng nhập Google không thể xuất hiện. */
interface GooglePromptMomentNotification {
  isNotDisplayed?: () => boolean;
  isSkippedMoment?: () => boolean;
}

/* Một phần API Google Identity Services được khai báo để TypeScript kiểm tra an toàn. */
interface GoogleIdentity {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
        auto_select?: boolean;
        cancel_on_tap_outside?: boolean;
      }) => void;
      prompt: (
        listener?: (notification: GooglePromptMomentNotification) => void,
      ) => void;
    };
  };
}

/* Bổ sung thuộc tính `window.google` sau khi script Google được nạp động. */
declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

/* Tạo khoá cache riêng theo từng tài khoản, tránh lẫn hồ sơ giữa người dùng. */
function getProfileStorageKey(userId: string) {
  return PROFILE_STORAGE_PREFIX + userId;
}

/* Tạo khoá đánh dấu hồ sơ cục bộ đã được đồng bộ thành công lên server. */
function getProfileSyncStorageKey(userId: string) {
  return PROFILE_SYNC_STORAGE_PREFIX + userId;
}

/* Trả object mới từ mẫu hồ sơ rỗng để state không tham chiếu chung. */
function createEmptyProfile(): CustomerProfile {
  return { ...EMPTY_CUSTOMER_PROFILE };
}

/* Kiểm tra cache hồ sơ tồn tại mà không làm hỏng app khi storage bị chặn. */
function hasSavedProfile(userId: string) {
  try {
    return window.localStorage.getItem(getProfileStorageKey(userId)) !== null;
  } catch {
    return false;
  }
}

/* Kiểm tra cache đã được xác nhận đồng bộ với backend hay chưa. */
function hasSyncedProfile(userId: string) {
  try {
    return (
      window.localStorage.getItem(getProfileSyncStorageKey(userId)) === "true"
    );
  } catch {
    return false;
  }
}

/* Đánh dấu đồng bộ hoàn tất để không migrate lại dữ liệu legacy. */
function markProfileAsSynced(userId: string) {
  try {
    window.localStorage.setItem(getProfileSyncStorageKey(userId), "true");
  } catch {
    /* Server vẫn đã lưu hồ sơ; storage bị chặn chỉ khiến lần sau phải tải lại. */
  }
}

/* Bỏ cờ đồng bộ để phiên đăng nhập kế tiếp biết cần thử lưu lại. */
function markProfileAsPending(userId: string) {
  try {
    window.localStorage.removeItem(getProfileSyncStorageKey(userId));
  } catch {
    /* Storage có thể bị tắt, nhưng hồ sơ trong bộ nhớ vẫn phải dùng được. */
  }
}

/* Cache hồ sơ cục bộ để UI vẫn hiển thị được khi mạng/API tạm thời lỗi. */
function saveProfile(userId: string, profile: CustomerProfile) {
  try {
    window.localStorage.setItem(
      getProfileStorageKey(userId),
      JSON.stringify(profile),
    );
  } catch {
    /* Avatar lớn hoặc privacy mode không được chặn luồng checkout/hồ sơ. */
  }
}

/* Đọc cache và lọc từng trường để localStorage không đáng tin không lọt vào state. */
function getSavedProfile(userId?: string): CustomerProfile {
  if (!userId) {
    return createEmptyProfile();
  }

  try {
    const savedProfile = window.localStorage.getItem(
      getProfileStorageKey(userId),
    );
    if (!savedProfile) {
      return createEmptyProfile();
    }

    const profile = JSON.parse(savedProfile) as Partial<CustomerProfile>;
    return {
      fullName: typeof profile.fullName === "string" ? profile.fullName : "",
      avatar: typeof profile.avatar === "string" ? profile.avatar : "",
      phone: typeof profile.phone === "string" ? profile.phone : "",
      birthDate: typeof profile.birthDate === "string" ? profile.birthDate : "",
      gender:
        profile.gender === "male" ||
        profile.gender === "female" ||
        profile.gender === "other"
          ? profile.gender
          : "",
      city: typeof profile.city === "string" ? profile.city : "",
      district: typeof profile.district === "string" ? profile.district : "",
      ward: typeof profile.ward === "string" ? profile.ward : "",
      address: typeof profile.address === "string" ? profile.address : "",
    };
  } catch {
    try {
      window.localStorage.removeItem(getProfileStorageKey(userId));
    } catch {
      /* Không cần làm gì thêm khi storage không khả dụng. */
    }
    return createEmptyProfile();
  }
}

/* Chuẩn hoá khoảng trắng trước khi lưu local hoặc gửi hồ sơ lên server. */
function normalizeProfile(profile: CustomerProfile): CustomerProfile {
  return {
    fullName: profile.fullName.trim(),
    avatar: profile.avatar,
    phone: profile.phone.trim(),
    birthDate: profile.birthDate,
    gender: profile.gender,
    city: profile.city.trim(),
    district: profile.district.trim(),
    ward: profile.ward.trim(),
    address: profile.address.trim(),
  };
}

/* Ánh xạ profile backend sang cấu trúc hiển thị thống nhất ở frontend. */
function toCustomerProfile(
  serverProfile: ServerCustomerProfile,
): CustomerProfile {
  return {
    fullName: serverProfile.fullName,
    avatar: serverProfile.avatar,
    phone: serverProfile.phone,
    birthDate: serverProfile.birthDate,
    gender: serverProfile.gender,
    city: serverProfile.city,
    district: serverProfile.district,
    ward: serverProfile.ward,
    address: serverProfile.address,
  };
}

/* Gộp profile server/local theo ưu tiên để không mất dữ liệu khách vừa nhập. */
function mergeServerProfile(
  serverProfile: CustomerProfile,
  localProfile: CustomerProfile,
  preferLocalProfile: boolean,
): CustomerProfile {
  const choose = (serverValue: string, localValue: string) =>
    preferLocalProfile && localValue ? localValue : serverValue || localValue;

  return {
    fullName: choose(serverProfile.fullName, localProfile.fullName),
    /* Avatar data URL chỉ nằm ở browser cho tới khi có media storage riêng. */
    avatar: localProfile.avatar || serverProfile.avatar,
    phone: choose(serverProfile.phone, localProfile.phone),
    birthDate: choose(serverProfile.birthDate, localProfile.birthDate),
    gender: choose(
      serverProfile.gender,
      localProfile.gender,
    ) as CustomerProfile["gender"],
    city: choose(serverProfile.city, localProfile.city),
    district: choose(serverProfile.district, localProfile.district),
    ward: choose(serverProfile.ward, localProfile.ward),
    address: choose(serverProfile.address, localProfile.address),
  };
}

/* Xác định cache local có dữ liệu đủ ý nghĩa để migrate lên server không. */
function hasServerPersistableProfileData(profile: CustomerProfile) {
  return Boolean(
    profile.fullName ||
    profile.phone ||
    profile.birthDate ||
    profile.gender ||
    profile.city ||
    profile.district ||
    profile.ward ||
    profile.address,
  );
}

/* Loại avatar khỏi payload vì media được quản lý theo cơ chế khác. */
function toCustomerProfileUpdate(profile: CustomerProfile) {
  return {
    fullName: profile.fullName,
    phone: profile.phone,
    birthDate: profile.birthDate,
    gender: profile.gender,
    city: profile.city,
    district: profile.district,
    ward: profile.ward,
    address: profile.address,
  };
}

/* Chuyển response người dùng backend sang kiểu public của Context. */
function toAuthenticatedUser(user: ServerAuthenticatedUser): AuthenticatedUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    picture: user.picture,
    role: user.role,
    roleName: user.roleName,
    permissions: user.permissions,
    emailVerified: user.emailVerified,
  };
}

/* Nạp Google Identity Services đúng một lần, tái sử dụng script nếu đã tồn tại. */
function loadGoogleIdentityScript(): Promise<void> {
  if (window.google?.accounts.id) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      "script[data-google-identity]",
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Không thể tải Google Identity Services.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = GOOGLE_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.dataset.googleIdentity = "true";
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Không thể tải Google Identity Services."));
    document.head.append(script);
  });
}

/* Mở luồng Google One Tap và trả credential cho service xác thực backend. */
async function requestGoogleCredential(): Promise<string> {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error(
      "Google đăng nhập chưa được cấu hình. Thêm VITE_GOOGLE_CLIENT_ID vào file .env.",
    );
  }

  await loadGoogleIdentityScript();

  const googleIdentity = window.google?.accounts.id;

  if (!googleIdentity) {
    throw new Error(
      "Google Identity Services chưa sẵn sàng. Vui lòng thử lại.",
    );
  }

  /* Bảo vệ callback bằng timeout và chỉ resolve/reject một lần. */
  return new Promise((resolve, reject) => {
    let isSettled = false;
    const timeout = window.setTimeout(() => {
      if (!isSettled) {
        isSettled = true;
        reject(new Error("Đăng nhập Google đã hết thời gian chờ."));
      }
    }, 60_000);

    const rejectOnce = (message: string) => {
      if (isSettled) return;
      isSettled = true;
      window.clearTimeout(timeout);
      reject(new Error(message));
    };

    const resolveOnce = (credential: string) => {
      if (isSettled) return;
      isSettled = true;
      window.clearTimeout(timeout);
      resolve(credential);
    };

    googleIdentity.initialize({
      client_id: GOOGLE_CLIENT_ID,
      auto_select: false,
      cancel_on_tap_outside: true,
      callback: (response) => {
        if (!response.credential) {
          rejectOnce("Google không trả về credential hợp lệ.");
          return;
        }

        resolveOnce(response.credential);
      },
    });

    googleIdentity.prompt((notification) => {
      if (notification.isNotDisplayed?.() || notification.isSkippedMoment?.()) {
        rejectOnce(
          "Không thể mở hộp thoại Google. Vui lòng kiểm tra cấu hình Google Login.",
        );
      }
    });
  });
}

/* Provider điều phối toàn bộ phiên khách: đăng nhập, refresh token và profile. */
export function UserProvider({ children }: { children: ReactNode }) {
  /* State phiên, profile, trạng thái khởi động/đăng nhập và mốc refresh token. */
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [profile, setProfile] = useState<CustomerProfile>(createEmptyProfile);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [nextSessionRefreshAt, setNextSessionRefreshAt] = useState<
    number | null
  >(null);
  /* Các phiên bản tăng dần chặn response cũ ghi đè phiên/hồ sơ mới hơn. */
  const authGenerationRef = useRef(0);
  const profileRevisionRef = useRef(0);

  /* Áp dụng người dùng và nạp ngay profile cache để giao diện phản hồi tức thời. */
  const applyAuthenticatedUser = useCallback((nextUser: AuthenticatedUser) => {
    setUser(nextUser);
    setProfile(getSavedProfile(nextUser.id));
  }, []);

  /* Xoá toàn bộ dấu vết phiên trong memory/token khi logout hay refresh thất bại. */
  const clearCustomerSession = useCallback(() => {
    clearAccessToken();
    setUser(null);
    setProfile(createEmptyProfile());
    setNextSessionRefreshAt(null);
  }, []);

  /* Áp dụng session server, lên lịch refresh tiếp theo và trả user đã chuẩn hoá. */
  const applyAuthenticatedSession = useCallback(
    (session: Awaited<ReturnType<typeof refreshCustomerAuthSession>>) => {
      setAccessToken(session.accessToken);
      setNextSessionRefreshAt(
        Date.now() + session.accessTokenExpiresIn * 1_000,
      );

      const authenticatedUser = toAuthenticatedUser(session.user);
      applyAuthenticatedUser(authenticatedUser);
      return authenticatedUser;
    },
    [applyAuthenticatedUser],
  );

  /* Nạp profile server, gộp cache local và migrate dữ liệu legacy khi cần. */
  const hydrateCustomerProfile = useCallback(
    (nextUser: AuthenticatedUser, authGeneration: number) => {
      /* Snapshot cache và revision hiện tại để tránh race condition giữa các lần lưu. */
      const localProfile = getSavedProfile(nextUser.id);
      const shouldMigrateLocalProfile =
        hasSavedProfile(nextUser.id) &&
        !hasSyncedProfile(nextUser.id) &&
        hasServerPersistableProfileData(localProfile);
      const profileRevision = profileRevisionRef.current;

      /* Ưu tiên không chặn UI: gọi profile bất đồng bộ rồi cập nhật nếu phiên còn hiện tại. */
      void getCustomerProfile()
        .then(({ profile: serverProfile }) => {
          if (
            authGenerationRef.current !== authGeneration ||
            profileRevisionRef.current !== profileRevision
          ) {
            return;
          }

          const mergedProfile = normalizeProfile(
            mergeServerProfile(
              toCustomerProfile(serverProfile),
              localProfile,
              shouldMigrateLocalProfile,
            ),
          );
          setProfile(mergedProfile);
          saveProfile(nextUser.id, mergedProfile);

          /* Nếu không phải dữ liệu legacy, server hiện tại đã là nguồn chuẩn. */
          if (!shouldMigrateLocalProfile) {
            markProfileAsSynced(nextUser.id);
            return;
          }

          /* Migrate dữ liệu profile cũ từ localStorage một lần lên server. */
          void updateCustomerProfile(toCustomerProfileUpdate(mergedProfile))
            .then(({ profile: savedProfile }) => {
              if (
                authGenerationRef.current !== authGeneration ||
                profileRevisionRef.current !== profileRevision
              ) {
                return;
              }

              const canonicalProfile = normalizeProfile(
                mergeServerProfile(
                  toCustomerProfile(savedProfile),
                  mergedProfile,
                  false,
                ),
              );
              setProfile(canonicalProfile);
              saveProfile(nextUser.id, canonicalProfile);
              markProfileAsSynced(nextUser.id);
              setUser((currentUser) =>
                currentUser?.id === nextUser.id && canonicalProfile.fullName
                  ? { ...currentUser, name: canonicalProfile.fullName }
                  : currentUser,
              );
            })
            .catch(() => {
              /* Giữ cache local và thử lại lần sau, không biến checkout đã xong thành lỗi. */
              markProfileAsPending(nextUser.id);
            });
        })
        .catch(() => {
          /* API lỗi thì vẫn dùng cache và để cờ pending cho lần refresh sau. */
        });
    },
    [],
  );

  /* Khởi động Provider: xoá cache user legacy, thử khôi phục session và hydrate profile. */
  useEffect(() => {
    /* Tăng generation để phân biệt bootstrap cũ với phiên vừa đăng nhập/đăng xuất. */
    let isCurrent = true;
    const authGeneration = ++authGenerationRef.current;

    try {
      window.localStorage.removeItem(LEGACY_USER_STORAGE_KEY);
    } catch {
      /* Không có localStorage vẫn phải cho phép người dùng duyệt website. */
    }

    void refreshCustomerAuthSession()
      .then((session) => {
        if (!isCurrent || authGenerationRef.current !== authGeneration) return;

        const authenticatedUser = applyAuthenticatedSession(session);
        hydrateCustomerProfile(authenticatedUser, authGeneration);
      })
      .catch(() => {
        if (!isCurrent || authGenerationRef.current !== authGeneration) return;
        clearCustomerSession();
      })
      .finally(() => {
        if (isCurrent && authGenerationRef.current === authGeneration) {
          setIsAuthLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [applyAuthenticatedSession, clearCustomerSession, hydrateCustomerProfile]);

  /* Đặt một timer refresh token sớm một phút trước thời điểm hết hạn. */
  useEffect(() => {
    if (!user || nextSessionRefreshAt === null) return undefined;

    const authGeneration = authGenerationRef.current;
    const refreshDelay = Math.max(
      5_000,
      nextSessionRefreshAt - Date.now() - 60_000,
    );
    const refreshTimer = window.setTimeout(() => {
      void refreshCustomerAuthSession()
        .then((session) => {
          if (authGenerationRef.current !== authGeneration) return;

          const authenticatedUser = applyAuthenticatedSession(session);
          hydrateCustomerProfile(authenticatedUser, authGeneration);
        })
        .catch(() => {
          if (authGenerationRef.current !== authGeneration) return;

          /* Mạng tạm mất không phải logout: thử lại ngắn hạn để tránh đá khách ra vô cớ. */
          setNextSessionRefreshAt(Date.now() + 30_000);
        });
    }, refreshDelay);

    return () => window.clearTimeout(refreshTimer);
  }, [
    applyAuthenticatedSession,
    hydrateCustomerProfile,
    nextSessionRefreshAt,
    user,
  ]);

  /* Đăng ký refresh token cho API client khi request nhận được tín hiệu cần làm mới token. */
  useEffect(
    () =>
      registerAccessTokenRefresher("customer", async () => {
        const authGeneration = authGenerationRef.current;

        try {
          const session = await refreshCustomerAuthSession();
          if (authGenerationRef.current !== authGeneration) return null;

          const authenticatedUser = applyAuthenticatedSession(session);
          hydrateCustomerProfile(authenticatedUser, authGeneration);
          return session.accessToken;
        } catch (error) {
          if (
            authGenerationRef.current === authGeneration &&
            error instanceof ApiError &&
            error.status === 401
          ) {
            clearCustomerSession();
          }
          return null;
        }
      }),
    [applyAuthenticatedSession, clearCustomerSession, hydrateCustomerProfile],
  );

  /* Đăng nhập Google, nhận session backend rồi đồng bộ profile của khách. */
  const signInWithGoogle = useCallback(async () => {
    setIsSigningIn(true);

    try {
      const credential = await requestGoogleCredential();
      const session = await loginWithGoogleCredential(credential);
      const authGeneration = ++authGenerationRef.current;
      const authenticatedUser = applyAuthenticatedSession(session);
      hydrateCustomerProfile(authenticatedUser, authGeneration);
      setIsAuthLoading(false);
      return authenticatedUser;
    } finally {
      setIsSigningIn(false);
    }
  }, [applyAuthenticatedSession, hydrateCustomerProfile]);

  /* Cập nhật lạc quan: hiển thị/lưu cache trước, sau đó đồng bộ backend an toàn. */
  const updateProfile = useCallback(
    async (nextProfile: CustomerProfile) => {
      if (!user) {
        return;
      }

      /* Tăng revision để request cũ không thể ghi đè lần chỉnh sửa mới hơn. */
      const normalizedProfile = normalizeProfile(nextProfile);
      const authGeneration = authGenerationRef.current;
      const profileRevision = ++profileRevisionRef.current;
      saveProfile(user.id, normalizedProfile);
      markProfileAsPending(user.id);
      setProfile(normalizedProfile);

      try {
        const { profile: savedProfile } = await updateCustomerProfile(
          toCustomerProfileUpdate(normalizedProfile),
        );
        if (
          authGenerationRef.current !== authGeneration ||
          profileRevisionRef.current !== profileRevision
        ) {
          return;
        }

        const canonicalProfile = normalizeProfile(
          mergeServerProfile(
            toCustomerProfile(savedProfile),
            normalizedProfile,
            false,
          ),
        );
        setProfile(canonicalProfile);
        saveProfile(user.id, canonicalProfile);
        markProfileAsSynced(user.id);
        setUser((currentUser) =>
          currentUser?.id === user.id && canonicalProfile.fullName
            ? { ...currentUser, name: canonicalProfile.fullName }
            : currentUser,
        );
      } catch {
        /* Giữ state local, đánh dấu pending và thử lại sau thay vì báo sai luồng đơn hàng. */
        markProfileAsPending(user.id);
      }
    },
    [user],
  );

  /* Huỷ phiên ngay ở trình duyệt rồi thông báo backend để xoá refresh session. */
  const signOut = useCallback(async () => {
    ++authGenerationRef.current;
    clearCustomerSession();

    try {
      await logoutCustomerAuthSession();
    } catch {
      /* UI đã xoá phiên ngay cả khi request logout gặp lỗi mạng. */
    }
  }, [clearCustomerSession]);

  /* Memo hoá public API của UserContext để hạn chế render lại consumer không cần thiết. */
  const value = useMemo(
    () => ({
      user,
      profile,
      isAuthLoading,
      isSigningIn,
      signInWithGoogle,
      updateProfile,
      signOut,
    }),
    [
      isAuthLoading,
      isSigningIn,
      profile,
      signInWithGoogle,
      signOut,
      updateProfile,
      user,
    ],
  );

  /* Cung cấp toàn bộ state/hành động phiên khách cho các View phía dưới. */
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
