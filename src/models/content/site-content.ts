/*
 * Vai trò: Nội dung UI song ngữ Việt/Anh và các type `AppLanguage`, `SiteContent`.
 */
/**
 * Nguồn nội dung giao diện CMID.
 *
 * - Sửa `vi` để đổi nội dung tiếng Việt.
 * - Sửa `en` để đổi nội dung tiếng Anh tương ứng.
 * - Nội dung sản phẩm từ API có thể khai báo thêm `nameEn`, `descriptionEn`,
 *   `category.nameEn` và `brand.nameEn`; nếu chưa có, giao diện dùng bản tiếng
 *   Việt làm phương án dự phòng.
 */
/* Hai mã ngôn ngữ mà website hiện đã có bộ nội dung hoàn chỉnh. */
export type AppLanguage = "vi" | "en";

/* Hợp đồng toàn bộ chuỗi/nội dung mà View công khai có thể truy cập. */
export interface SiteContent {
  /* Nhãn điều hướng, tìm kiếm và thao tác ở Header. */
  header: {
    home: string;
    products: string;
    projects: string;
    about: string;
    news: string;
    contact: string;
    menuOpen: string;
    menuClose: string;
    productSearch: string;
    cartAria: (count: number) => string;
    hotline: string;
  };
  /* Nội dung liên hệ, liên kết và pháp lý ở Footer. */
  footer: {
    description: string;
    quickLinks: string;
    premiumProducts: string;
    contactInformation: string;
    about: string;
    catalog: string;
    projects: string;
    careers: string;
    warranty: string;
    granite: string;
    marble: string;
    tiles: string;
    bathroom: string;
    furniture: string;
    phone: string;
    office: string;
    copyright: string;
    privacy: string;
    terms: string;
  };
  /* Các câu dùng lại giữa nhiều trang và component. */
  common: {
    home: string;
    products: string;
    retry: string;
    readMore: string;
    send: string;
    required: string;
    unavailable: string;
    available: string;
    order: string;
    product: string;
  };
  /* Nhãn và mô tả dành cho giỏ hàng. */
  cart: {
    title: string;
    breadcrumb: string;
    emptyTitle: string;
    emptyDescription: string;
    browseProducts: string;
    product: string;
    unitPrice: string;
    quantity: string;
    status: string;
    amount: string;
    continueShopping: string;
    subtotal: string;
    shipping: string;
    free: string;
    total: string;
    summary: string;
    checkout: string;
    privacy: string;
    assurance: string;
    itemSummary: (count: number) => string;
    added: string;
    viewCart: string;
    closeNotification: string;
    decrease: (name: string) => string;
    increase: (name: string) => string;
    remove: (name: string) => string;
  };
  /* Nội dung form liên hệ/checkout và thông tin showroom. */
  checkout: {
    title: string;
    customerTitle: string;
    deliveryTitle: string;
    paymentTitle: string;
    noteTitle: string;
    fullName: string;
    phone: string;
    email: string;
    province: string;
    district: string;
    ward: string;
    address: string;
    saveAddress: string;
    selectDistrict: string;
    selectWard: string;
    notePlaceholder: string;
    bank: string;
    bankDescription: string;
    momo: string;
    momoDescription: string;
    cod: string;
    codDescription: string;
    card: string;
    cardDescription: string;
    redirectingToMomo: string;
    momoPendingTitle: string;
    momoPendingDescription: string;
    momoPaymentFailed: string;
    vnpayNotConfigured: string;
    paymentConfirmationTitle: string;
    paymentConfirmationDescription: string;
    paymentConfirmationSuccess: string;
    paymentConfirmationCancel: string;
    paymentNoticeTitle: string;
    paymentCancelled: string;
    vnpayQrTitle: string;
    momoQrTitle: string;
    paymentQrAmount: string;
    paymentQrOrderCode: string;
    paymentQrRecipient: string;
    paymentQrWaiting: string;
    paymentQrWaitingDescription: string;
    paymentQrTimeRemaining: string;
    paymentQrExpired: string;
    paymentQrCancel: string;
    paymentQrTestSuccess: string;
    paymentQrClose: string;
    cardFormTitle: string;
    cardNumber: string;
    cardHolder: string;
    cardExpiry: string;
    cardCvc: string;
    cardInvalid: string;
    saveCard: string;
    placeOrder: string;
    successTitle: string;
    successDescription: string;
    continueShopping: string;
    noItemsTitle: string;
    noItemsDescription: string;
  };
  /* Bộ text dành cho catalogue và bộ lọc sản phẩm. */
  product: {
    categoryEyebrow: string;
    catalogDescription: string;
    totalProducts: (total: number) => string;
    sortNewest: string;
    sortPriceAsc: string;
    sortPriceDesc: string;
    loading: string;
    loadFailed: string;
    noResults: string;
    noResultsDescription: string;
    clearFilters: string;
    addToCart: string;
    quote: string;
    directOrder: string;
    has3D: string;
    noImage: string;
    uncategorized: string;
    inStock: string;
    outOfStock: string;
    madeToOrder: string;
    viewDetail: (name: string) => string;
    filter: {
      title: string;
      mobileLabel: string;
      close: string;
      showResults: string;
      category: string;
      brand: string;
      searchBrand: string;
      price: string;
      lowestPrice: string;
      highestPrice: string;
      saleType: string;
      model3D: string;
      hasModel3D: string;
      status: string;
      reset: string;
    };
  };
  /* Nội dung đặc thù của trang chủ, hero và các section giới thiệu. */
  home: {
    heroTitle: string;
    heroHighlight: string;
    heroDescription: string;
    browseProducts: string;
    requestQuote: string;
    categories: string[];
    featuredTitle: string;
    loading: string;
    loadFailed: string;
    emptyFeatured: string;
    previousProduct: string;
    nextProduct: string;
    direct: {
      title: string;
      description: string;
      points: string[];
      action: string;
    };
    quote: {
      title: string;
      description: string;
      points: string[];
      action: string;
    };
    aboutTitle: string;
    aboutDescription: string;
    values: string[];
    learnAbout: string;
    brandsLabel: string;
    experienceEyebrow: string;
    experienceTitle: string;
    experienceDescription: string;
    experienceAction: string;
    projectsTitle: string;
    allProjects: string;
    projects: Array<{ title: string; location: string }>;
    newsTitle: string;
    allNews: string;
    news: Array<{ title: string; date: string }>;
  };
  /* Danh sách dịch vụ CMID cung cấp. */
  services: {
    eyebrow: string;
    title: string;
    description: string;
    action: string;
    list: Array<{ title: string; description: string }>;
    quote: string;
    quoteBy: string;
  };
  /* Nhóm giải pháp để trình bày trên trang chủ/nội dung. */
  solutions: {
    title: string;
    description: string;
    action: string;
    list: Array<{ title: string; description: string }>;
    eyebrow: string;
    featureTitle: string;
    featureDescription: string;
    points: string[];
  };
  /* Nhãn/description của danh sách dự án và thẻ dự án. */
  projects: {
    title: string;
    description: string;
    action: string;
    eyebrow: string;
    heading: string;
    cards: Array<{ title: string; location: string }>;
    featureEyebrow: string;
    featureTitle: string;
    featureDescription: string;
    featureLocation: string;
    details: string;
  };
  /* Nội dung giới thiệu doanh nghiệp, giá trị và lịch sử phát triển. */
  about: {
    eyebrow: string;
    title: string;
    description: string;
    action: string;
    values: Array<{ title: string; description: string }>;
    metrics: string[];
    categoriesTitle: string;
    categories: string[];
    partnersTitle: string;
    projectsTitle: string;
    projects: Array<{ title: string; location: string }>;
    reachTitle: string;
    reachDescription: string;
    reachMetrics: string[];
    timelineTitle: string;
    milestones: string[];
    ctaTitle: string;
    ctaDescription: string;
    ctaAction: string;
  };
  /* Nội dung UI của View chi tiết sản phẩm, gallery và mô hình 3D. */
  productDetail: {
    loading: string;
    loadFailed: string;
    notFound: string;
    notFoundDescription: string;
    backToCatalog: string;
    category: string;
    brand: string;
    quantity: string;
    buyNow: string;
    requestQuote: string;
    requestQuoteAndConsultation: string;
    addToCart: string;
    added: string;
    consultation: string;
    tabs: string[];
    descriptionPoints: string[];
    guide: string;
    guidePoints: string[];
    policy: string;
    policyPoints: string[];
    related: string;
    descriptionFallback: (name: string) => string;
    specs: {
      availability: string;
      purchaseType: string;
      category: string;
      brand: string;
      unit: string;
      model3D: string;
      updating: string;
      yes: string;
      no: string;
    };
  };
  /* Tiêu đề/lời dẫn ngắn cho View showroom. */
  showroom: { title: string; description: string; browseProducts: string };
  /* Text liên quan phiên khách, đăng nhập và cập nhật hồ sơ. */
  auth: {
    signIn: string;
    account: string;
    signOut: string;
    loginWelcome: string;
    loginTitle: string;
    loginDescription: string;
    googleButton: string;
    signingIn: string;
    restoringSession: string;
    googleHelp: string;
    googleSignInNotice: string;
    checkoutTitle: string;
    checkoutDescription: string;
    continueToLogin: string;
    cancel: string;
    profileTitle: string;
    overview: string;
    userInformation: string;
    orders: string;
    gifts: string;
    welcome: (name: string) => string;
    accountWelcomeDescription: string;
    memberSince: string;
    orderCount: string;
    giftCount: string;
    loyaltyPoints: string;
    recentOrderTitle: string;
    noOrders: string;
    ordersLoading: string;
    ordersLoadError: string;
    ordersRetry: string;
    orderCode: string;
    orderDate: string;
    orderItems: string;
    orderTotal: string;
    orderPayment: string;
    orderDelivery: string;
    orderFilterLabel: string;
    orderFilterAll: string;
    orderFilterPendingConfirmation: string;
    orderFilterAwaitingPickup: string;
    orderFilterAwaitingDelivery: string;
    orderFilterDelivered: string;
    orderFilterReturned: string;
    orderFilterCancelled: string;
    orderSearchPlaceholder: string;
    orderFilterEmpty: string;
    informationTitle: string;
    informationDescription: string;
    accountEmail: string;
    fullName: string;
    phone: string;
    birthDate: string;
    gender: string;
    provinceCity: string;
    district: string;
    ward: string;
    address: string;
    notUpdated: string;
    editingInformationNotice: string;
    editInformationDescription: string;
    avatar: string;
    avatarHint: string;
    changeAvatar: string;
    avatarInvalid: string;
    selectGender: string;
    searchOptions: string;
    noOptionsFound: string;
    loadingOptions: string;
    selectProvinceFirst: string;
    selectDistrictFirst: string;
    genderMale: string;
    genderFemale: string;
    genderOther: string;
    editInformation: string;
    saveChanges: string;
    cancelChanges: string;
    ordersTitle: string;
    giftsTitle: string;
    giftsDescription: string;
  };
  /* Nhãn danh mục, filter và chi tiết bài viết tin tức. */
  news: {
    title: string;
    heroDescription: string;
    search: string;
    categoriesTitle: string;
    tagsTitle: string;
    latest: string;
    sort: string;
    newest: string;
    popular: string;
    categories: string[];
    tags: string[];
    featured: { category: string; title: string; summary: string };
    articles: Array<{ category: string; title: string; summary: string }>;
    previous: string;
    next: string;
    noResults: string;
    backToNews: string;
    related: string;
    articleNotFound: string;
    articleNotFoundDescription: string;
    browseNews: string;
    readingTime: (minutes: number) => string;
  };
  /* Text cho trang liên hệ, form tư vấn và trạng thái gửi. */
  contact: {
    title: string;
    heroDescription: string;
    quickInfoLabel: string;
    phone: string;
    phoneDescription: string;
    email: string;
    emailDescription: string;
    mainShowroom: string;
    openingHours: string;
    openingHoursDescription: string;
    formTitle: string;
    formDescription: string;
    name: string;
    phoneLabel: string;
    emailLabel: string;
    subject: string;
    message: string;
    namePlaceholder: string;
    phonePlaceholder: string;
    subjectPlaceholder: string;
    messagePlaceholder: string;
    subjects: string[];
    consent: string;
    submit: string;
    success: string;
    mapTitle: string;
    mapFrameTitle: string;
    directions: string;
    showroomTitle: string;
    showroomDescription: string;
    showroomNames: string[];
    hours: string[];
  };
  assurances: Array<{ title: string; description: string }>;
}

/* Dữ liệu nội dung hoàn chỉnh; mỗi bản phải tuân thủ chính xác `SiteContent`. */
export const siteContent: Record<AppLanguage, SiteContent> = {
  /* Bộ tiếng Việt là nội dung mặc định cho khách truy cập Việt Nam. */
  vi: {
    header: {
      home: "Trang chủ",
      products: "Sản phẩm",
      projects: "Dự án",
      about: "Về chúng tôi",
      news: "Tin tức",
      contact: "Liên hệ",
      menuOpen: "Mở menu",
      menuClose: "Đóng menu",
      productSearch: "Tìm kiếm sản phẩm",
      cartAria: (count) => `Giỏ hàng, ${count} sản phẩm`,
      hotline: "Hotline:",
    },
    footer: {
      description:
        "Công ty Cổ phần Vật liệu Xây dựng & Trang trí Nội thất TP. HCM. Đơn vị cung cấp giải pháp đá tự nhiên cao cấp và kiến trúc tinh tế.",
      quickLinks: "Liên kết nhanh",
      premiumProducts: "Sản phẩm cao cấp",
      contactInformation: "Thông tin liên hệ",
      about: "Về chúng tôi",
      catalog: "Danh mục sản phẩm",
      projects: "Công trình tiêu biểu",
      careers: "Tuyển dụng",
      warranty: "Chính sách bảo hành",
      granite: "Đá Granite tự nhiên",
      marble: "Đá Marble vân ngọc",
      tiles: "Gạch ốp lát cao cấp",
      bathroom: "Thiết bị phòng tắm",
      furniture: "Nội thất chế tác",
      phone: "SĐT:",
      office: "Trụ sở:",
      copyright:
        "© 2025 CMID Jsc. Bảo lưu mọi quyền. Thiết kế bởi CMID Architectures.",
      privacy: "Chính sách bảo mật",
      terms: "Điều khoản sử dụng",
    },
    common: {
      home: "Trang chủ",
      products: "Sản phẩm",
      retry: "Thử lại",
      readMore: "Đọc thêm",
      send: "Gửi",
      required: "Bắt buộc",
      unavailable: "Liên hệ",
      available: "Còn hàng",
      order: "Đặt hàng",
      product: "sản phẩm",
    },
    cart: {
      title: "Giỏ hàng",
      breadcrumb: "Giỏ hàng",
      emptyTitle: "Giỏ hàng của bạn đang trống",
      emptyDescription:
        "Khám phá vật liệu và nội thất phù hợp cho không gian của bạn.",
      browseProducts: "Xem sản phẩm",
      product: "Sản phẩm",
      unitPrice: "Đơn giá",
      quantity: "Số lượng",
      status: "Trạng thái",
      amount: "Thành tiền",
      continueShopping: "Tiếp tục mua hàng",
      subtotal: "Tạm tính",
      shipping: "Phí vận chuyển",
      free: "Miễn phí",
      total: "Tổng cộng",
      summary: "Tóm tắt đơn hàng",
      checkout: "Tiến hành thanh toán",
      privacy: "Thông tin của bạn được bảo mật tuyệt đối.",
      assurance:
        "CMID xác nhận đơn hàng qua điện thoại hoặc email trước khi giao.",
      itemSummary: (count) => `Đơn hàng của bạn (${count} sản phẩm)`,
      added: "Đã thêm vào giỏ hàng",
      viewCart: "Xem giỏ",
      closeNotification: "Đóng thông báo",
      decrease: (name) => `Giảm số lượng ${name}`,
      increase: (name) => `Tăng số lượng ${name}`,
      remove: (name) => `Xóa ${name} khỏi giỏ hàng`,
    },
    checkout: {
      title: "Thanh toán",
      customerTitle: "Thông tin khách hàng",
      deliveryTitle: "Địa chỉ giao hàng",
      paymentTitle: "Phương thức thanh toán",
      noteTitle: "Ghi chú đơn hàng",
      fullName: "Họ và tên",
      phone: "Số điện thoại",
      email: "Email",
      province: "Tỉnh / Thành phố",
      district: "Quận / Huyện",
      ward: "Phường / Xã",
      address: "Địa chỉ chi tiết",
      saveAddress: "Lưu địa chỉ này cho lần sau",
      selectDistrict: "Chọn quận / huyện",
      selectWard: "Chọn phường / xã",
      notePlaceholder:
        "Nhập ghi chú hoặc yêu cầu đặc biệt cho đơn hàng nếu có...",
      bank: "Quét mã VNPAY-QR",
      bankDescription: "Quét mã VNPAY-QR bằng ứng dụng ngân hàng để thanh toán.",
      momo: "Ví MoMo",
      momoDescription: "Thanh toán an toàn bằng Ví MoMo.",
      cod: "Thanh toán khi nhận hàng",
      codDescription: "Thanh toán bằng tiền mặt khi nhận hàng.",
      card: "Thanh toán bằng thẻ",
      cardDescription: "Hỗ trợ Visa, MasterCard, JCB và ATM nội địa.",
      redirectingToMomo: "Đang tạo phiên thanh toán và chuyển bạn đến MoMo…",
      momoPendingTitle: "Đang xác nhận thanh toán MoMo",
      momoPendingDescription: "MoMo đang gửi kết quả giao dịch về CMID. Đơn hàng sẽ được xác nhận ngay khi hệ thống nhận được kết quả.",
      momoPaymentFailed: "Giao dịch MoMo chưa thành công. Bạn có thể thử lại hoặc chọn một phương thức khác.",
      vnpayNotConfigured: "Phương thức VNPAY/thẻ hiện chưa sẵn sàng. Vui lòng chọn Ví MoMo hoặc thanh toán khi nhận hàng.",
      paymentConfirmationTitle: "Xác nhận thanh toán",
      paymentConfirmationDescription: "Vui lòng xác nhận để hoàn tất đơn hàng của bạn.",
      paymentConfirmationSuccess: "Hoàn tất thanh toán",
      paymentConfirmationCancel: "Quay lại",
      paymentNoticeTitle: "Thanh toán chưa hoàn tất",
      paymentCancelled: "Đơn hàng chưa được tạo. Bạn có thể thanh toán lại khi sẵn sàng.",
      vnpayQrTitle: "Quét mã VNPAY-QR",
      momoQrTitle: "Thanh toán bằng Ví MoMo",
      paymentQrAmount: "Số tiền thanh toán",
      paymentQrOrderCode: "Mã đơn hàng",
      paymentQrRecipient: "Người nhận",
      paymentQrWaiting: "Đang chờ thanh toán",
      paymentQrWaitingDescription: "Đơn hàng sẽ được xác nhận ngay khi giao dịch thành công.",
      paymentQrTimeRemaining: "Thời gian thanh toán còn lại",
      paymentQrExpired: "Đã hết thời gian thanh toán. Vui lòng tạo lại đơn hàng để nhận mã QR mới.",
      paymentQrCancel: "Hủy",
      paymentQrTestSuccess: "Thanh toán thành công (test)",
      paymentQrClose: "Đóng cửa sổ thanh toán",
      cardFormTitle: "Thông tin thẻ",
      cardNumber: "Số thẻ",
      cardHolder: "Tên chủ thẻ",
      cardExpiry: "Ngày hết hạn",
      cardCvc: "CVC",
      cardInvalid: "Vui lòng điền đầy đủ thông tin thẻ hợp lệ để tiếp tục.",
      saveCard: "Lưu thẻ này cho lần sau",
      placeOrder: "Tiến hành đặt hàng",
      successTitle: "CMID đã nhận đơn hàng của bạn",
      successDescription:
        "Chúng tôi sẽ liên hệ qua số điện thoại hoặc email để xác nhận đơn hàng và phương án giao nhận.",
      continueShopping: "Tiếp tục mua sắm",
      noItemsTitle: "Bạn chưa có sản phẩm để thanh toán",
      noItemsDescription:
        "Thêm sản phẩm vào giỏ hàng trước khi tiếp tục đặt hàng.",
    },
    product: {
      categoryEyebrow: "Danh mục CMID",
      catalogDescription:
        "Vật liệu và nội thất cao cấp cho không gian sống đẳng cấp",
      totalProducts: (total) => `${total} sản phẩm`,
      sortNewest: "Sắp xếp: Mới nhất",
      sortPriceAsc: "Giá: Thấp đến cao",
      sortPriceDesc: "Giá: Cao đến thấp",
      loading: "Đang tải sản phẩm…",
      loadFailed: "Không thể tải sản phẩm",
      noResults: "Không tìm thấy sản phẩm phù hợp",
      noResultsDescription: "Thử điều chỉnh lại bộ lọc để xem thêm sản phẩm.",
      clearFilters: "Xóa bộ lọc",
      addToCart: "Thêm vào giỏ hàng",
      quote: "Liên hệ báo giá",
      directOrder: "Mua trực tiếp",
      has3D: "Có mô hình 3D",
      noImage: "Chưa có ảnh",
      uncategorized: "Chưa phân loại",
      inStock: "Còn hàng",
      outOfStock: "Hết hàng",
      madeToOrder: "Đặt hàng",
      viewDetail: (name) => `Xem chi tiết ${name}`,
      filter: {
        title: "Bộ lọc sản phẩm",
        mobileLabel: "Bộ lọc",
        close: "Đóng bộ lọc",
        showResults: "Xem sản phẩm",
        category: "Danh mục",
        brand: "Thương hiệu",
        searchBrand: "Tìm thương hiệu...",
        price: "Khoảng giá (VNĐ)",
        lowestPrice: "Giá thấp nhất",
        highestPrice: "Giá cao nhất",
        saleType: "Loại bán",
        model3D: "3D",
        hasModel3D: "Có mô hình 3D",
        status: "Trạng thái",
        reset: "Xóa bộ lọc",
      },
    },
    home: {
      heroTitle: "Giải pháp vật liệu xây dựng",
      heroHighlight: "& nội thất cao cấp",
      heroDescription:
        "CMID mang đến những sản phẩm chính hãng, chất lượng vượt trội cho mọi không gian sống và công trình.",
      browseProducts: "Khám phá sản phẩm",
      requestQuote: "Yêu cầu báo giá",
      categories: [
        "Xi măng & Bê tông",
        "Gạch ốp lát",
        "Sơn & Chống thấm",
        "Thiết bị vệ sinh",
        "Đá tự nhiên",
        "Cửa & Phụ kiện",
        "Trần & Vách",
        "Nội thất phòng khách",
        "Nội thất phòng ăn",
        "Nội thất văn phòng",
      ],
      featuredTitle: "Sản phẩm nổi bật",
      loading: "Đang tải sản phẩm",
      loadFailed: "Không thể tải sản phẩm",
      emptyFeatured: "Chưa có sản phẩm nổi bật",
      previousProduct: "Xem sản phẩm trước",
      nextProduct: "Xem sản phẩm tiếp theo",
      direct: {
        title: "Mua trực tiếp",
        description: "Sản phẩm có sẵn, giao hàng nhanh chóng.",
        points: [
          "Đặt hàng dễ dàng",
          "Thanh toán linh hoạt",
          "Giao hàng toàn quốc",
        ],
        action: "Mua ngay",
      },
      quote: {
        title: "Yêu cầu báo giá",
        description: "Giải pháp tối ưu cho công trình và dự án.",
        points: [
          "Báo giá nhanh chóng",
          "Chiết khấu dự án",
          "Tư vấn chuyên sâu",
        ],
        action: "Gửi yêu cầu",
      },
      aboutTitle: "Về CMID",
      aboutDescription:
        "CMID đồng hành cùng khách hàng từ khâu chọn vật liệu đến hoàn thiện không gian sống và công trình.",
      values: [
        "Sản phẩm chính hãng",
        "Chất lượng hàng đầu",
        "Giải pháp đa dạng",
        "Dịch vụ chuyên nghiệp",
      ],
      learnAbout: "Tìm hiểu về CMID",
      brandsLabel: "Đối tác và thương hiệu",
      experienceEyebrow: "Trải nghiệm 3D",
      experienceTitle: "Kiến tạo không gian của bạn",
      experienceDescription:
        "Khám phá sản phẩm trong không gian trực quan và hình dung vẻ đẹp của ngôi nhà.",
      experienceAction: "Trải nghiệm ngay",
      projectsTitle: "Dự án tiêu biểu",
      allProjects: "Xem tất cả dự án",
      projects: [
        { title: "Khu đô thị xanh", location: "TP. Thủ Đức, TP. Hồ Chí Minh" },
        { title: "Tháp đô thị", location: "Quận 1, TP. Hồ Chí Minh" },
        {
          title: "Khu căn hộ ven sông",
          location: "TP. Thủ Đức, TP. Hồ Chí Minh",
        },
        { title: "Đô thị sinh thái", location: "Phía Nam, TP. Hồ Chí Minh" },
      ],
      newsTitle: "Tin tức & cảm hứng",
      allNews: "Xem tất cả tin tức",
      news: [
        {
          title: "Xu hướng gạch ốp lát cho không gian hiện đại",
          date: "10/04/2026",
        },
        {
          title: "Thiết kế phòng khách sang trọng với vật liệu tự nhiên",
          date: "08/04/2026",
        },
        { title: "Giải pháp chống thấm hiệu quả mùa mưa", date: "05/04/2026" },
      ],
    },
    services: {
      eyebrow: "Đồng hành cùng dự án",
      title: "Dịch vụ CMID",
      description:
        "CMID đồng hành từ ý tưởng đến hiện thực, mang đến giải pháp toàn diện với tiêu chuẩn cao và trải nghiệm xứng tầm.",
      action: "Liên hệ tư vấn",
      list: [
        {
          title: "Tư vấn giải pháp",
          description:
            "Lắng nghe nhu cầu, phân tích hiện trạng và đề xuất phương án phù hợp.",
        },
        {
          title: "Thiết kế 3D",
          description:
            "Hình dung không gian tương lai với vật liệu, màu sắc và tỷ lệ trực quan.",
        },
        {
          title: "Thi công & lắp đặt",
          description:
            "Điều phối chuyên nghiệp, hỗ trợ giao hàng và lắp đặt theo tiến độ.",
        },
        {
          title: "Bảo hành tận tâm",
          description:
            "Đồng hành sau bàn giao bằng chính sách rõ ràng và phản hồi nhanh chóng.",
        },
      ],
      quote:
        "“CMID không chỉ cung cấp vật liệu cao cấp, mà còn mang đến một hành trình hoàn thiện chỉn chu cho từng không gian.”",
      quoteBy: "Đội ngũ tư vấn CMID",
    },
    solutions: {
      title: "Giải pháp không gian",
      description:
        "CMID kết hợp vật liệu, thiết bị và nội thất cao cấp để kiến tạo không gian hài hòa về thẩm mỹ, công năng và chất lượng bền vững.",
      action: "Khám phá giải pháp",
      list: [
        {
          title: "Không gian sống",
          description: "Vật liệu và nội thất đồng điệu cho từng nhịp sống.",
        },
        {
          title: "Công trình thương mại",
          description: "Giải pháp đồng bộ cho sảnh đón, khách sạn và bán lẻ.",
        },
        {
          title: "Văn phòng",
          description: "Không gian làm việc bền vững, hiệu quả và chỉn chu.",
        },
        {
          title: "Hoàn thiện dự án",
          description: "Từ lựa chọn vật liệu đến bàn giao đúng tiêu chuẩn.",
        },
      ],
      eyebrow: "Giải pháp CMID",
      featureTitle: "Vật liệu chuẩn mực, không gian vượt trội.",
      featureDescription:
        "Mỗi dự án được CMID bắt đầu từ việc lắng nghe nhu cầu sử dụng, sau đó tuyển chọn vật liệu và nội thất phù hợp nhất với phong cách, ngân sách và tiến độ thi công.",
      points: [
        "Tư vấn theo diện tích và công năng thực tế.",
        "Đồng bộ màu sắc, bề mặt và chi tiết hoàn thiện.",
        "Báo giá rõ ràng, hỗ trợ xuyên suốt dự án.",
      ],
    },
    projects: {
      title: "Dự án tiêu biểu",
      description:
        "Những không gian được CMID đồng hành từ lựa chọn vật liệu đến từng chi tiết hoàn thiện.",
      action: "Khám phá dự án",
      eyebrow: "Dấu ấn CMID",
      heading: "Công trình đồng điệu cùng chất liệu",
      cards: [
        { title: "Khu đô thị xanh", location: "TP. Thủ Đức, TP. Hồ Chí Minh" },
        { title: "Tháp đô thị", location: "Quận 1, TP. Hồ Chí Minh" },
        {
          title: "Khu căn hộ ven sông",
          location: "TP. Thủ Đức, TP. Hồ Chí Minh",
        },
      ],
      featureEyebrow: "Dự án nổi bật",
      featureTitle: "Không gian sống được đầu tư đến từng chi tiết",
      featureDescription:
        "CMID cung cấp hệ vật liệu hoàn thiện và nội thất phù hợp với tinh thần kiến trúc, mang đến trải nghiệm sống tinh tế và bền vững theo thời gian.",
      featureLocation: "TP. Thủ Đức, TP. Hồ Chí Minh",
      details: "Xem chi tiết dự án",
    },
    about: {
      eyebrow: "Giới thiệu CMID",
      title: "CMID – VẬT LIỆU XÂY DỰNG & NỘI THẤT UY TÍN",
      description:
        "CMID mang đến sản phẩm và giải pháp được chọn lọc, đồng hành cùng khách hàng kiến tạo không gian sống đáng giá.",
      action: "Liên hệ hợp tác",
      values: [
        {
          title: "Sứ mệnh",
          description:
            "Cung cấp vật liệu và giải pháp nội thất chất lượng, góp phần nâng tầm không gian sống và giá trị công trình.",
        },
        {
          title: "Tầm nhìn",
          description:
            "Trở thành thương hiệu phân phối vật liệu xây dựng và trang trí nội thất được khách hàng tin chọn.",
        },
        {
          title: "Giá trị cốt lõi",
          description:
            "Chất lượng, tận tâm, minh bạch và tinh thần đồng hành bền vững trong từng lựa chọn.",
        },
      ],
      metrics: [
        "Năm kinh nghiệm",
        "Khách hàng tin tưởng",
        "Thương hiệu đối tác",
        "Dự án đã triển khai",
      ],
      categoriesTitle: "Danh mục sản phẩm và giải pháp",
      categories: [
        "Gạch ốp lát",
        "Thiết bị vệ sinh",
        "Đá tự nhiên",
        "Sơn và chống thấm",
        "Nội thất",
        "Giải pháp tổng thể",
      ],
      partnersTitle: "Đối tác thương hiệu",
      projectsTitle: "Dự án tiêu biểu",
      projects: [
        { title: "Khu đô thị xanh", location: "TP. Thủ Đức, TP. Hồ Chí Minh" },
        { title: "Tháp đô thị", location: "Quận 1, TP. Hồ Chí Minh" },
        { title: "Quy hoạch ven sông", location: "TP. Hồ Chí Minh" },
        { title: "Khu đô thị ven sông", location: "Đồng Nai" },
      ],
      reachTitle: "Phân phối toàn quốc",
      reachDescription:
        "CMID xây dựng mạng lưới phân phối rộng khắp, sẵn sàng phục vụ khách hàng và công trình trên toàn quốc.",
      reachMetrics: [
        "Showroom trải nghiệm",
        "Tỉnh thành phân phối",
        "Đại lý và đối tác",
      ],
      timelineTitle: "Quá trình phát triển",
      milestones: [
        "Thành lập CMID, khởi đầu với lĩnh vực gạch ốp lát.",
        "Mở rộng danh mục sản phẩm và hệ thống phân phối.",
        "Hợp tác cùng các thương hiệu quốc tế.",
        "Ra mắt giải pháp nội thất toàn diện.",
        "Không ngừng đổi mới và kiến tạo giá trị bền vững.",
      ],
      ctaTitle: "Đồng hành cùng bạn kiến tạo không gian hoàn hảo",
      ctaDescription:
        "Đội ngũ CMID luôn sẵn sàng tư vấn giải pháp phù hợp cho nhu cầu và dự án của bạn.",
      ctaAction: "Liên hệ tư vấn",
    },
    productDetail: {
      loading: "Đang tải thông tin sản phẩm…",
      loadFailed: "Không thể tải thông tin sản phẩm",
      notFound: "Không tìm thấy sản phẩm",
      notFoundDescription: "Sản phẩm này không tồn tại hoặc đã được cập nhật.",
      backToCatalog: "Quay lại danh sách sản phẩm",
      category: "Danh mục",
      brand: "Thương hiệu",
      quantity: "Số lượng",
      buyNow: "Mua ngay",
      requestQuote: "Yêu cầu báo giá",
      requestQuoteAndConsultation: "Yêu cầu báo giá & tư vấn",
      addToCart: "Thêm vào giỏ",
      added: "Đã thêm vào giỏ",
      consultation: "Yêu cầu tư vấn",
      tabs: ["Mô tả", "Thông số kỹ thuật", "Hướng dẫn", "Chính sách bán hàng"],
      descriptionPoints: [
        "Phù hợp với nhiều giải pháp hoàn thiện không gian.",
        "Chất lượng được CMID tư vấn theo nhu cầu sử dụng.",
        "Hỗ trợ báo giá và giao hàng trên toàn quốc.",
      ],
      guide:
        "Liên hệ CMID để được tư vấn lựa chọn sản phẩm, số lượng và phương án giao hàng phù hợp cho công trình của bạn.",
      guidePoints: [
        "Kiểm tra quy cách, số lượng trước khi đặt hàng.",
        "Bảo quản sản phẩm theo hướng dẫn của nhà sản xuất.",
        "Đội ngũ CMID sẵn sàng hỗ trợ giải đáp khi cần.",
      ],
      policy:
        "CMID cung cấp chính sách báo giá rõ ràng, giao hàng an toàn và hỗ trợ sau bán hàng cho từng nhóm sản phẩm.",
      policyPoints: [
        "Tư vấn điều kiện đổi trả trước khi xác nhận đơn hàng.",
        "Hỗ trợ báo giá dự án theo số lượng và tiến độ thực tế.",
        "Liên hệ CMID để biết chính sách áp dụng cho sản phẩm này.",
      ],
      related: "Sản phẩm liên quan",
      descriptionFallback: (name) =>
        `${name} là lựa chọn phù hợp cho không gian cần tính thẩm mỹ, độ bền và sự đồng bộ trong hoàn thiện. CMID hỗ trợ tư vấn giải pháp theo nhu cầu sử dụng thực tế của công trình.`,
      specs: {
        availability: "Tình trạng",
        purchaseType: "Loại bán",
        category: "Danh mục",
        brand: "Thương hiệu",
        unit: "Đơn vị tính",
        model3D: "Mô hình 3D",
        updating: "Đang cập nhật",
        yes: "Có sẵn",
        no: "Chưa có",
      },
    },
    showroom: {
      title: "Hệ thống showroom",
      description:
        "CMID đang chuẩn bị thông tin showroom để bạn trải nghiệm sản phẩm trực tiếp.",
      browseProducts: "Xem sản phẩm",
    },
    auth: {
      signIn: 'Đăng nhập',
      account: 'Tài khoản',
      signOut: 'Đăng xuất',
      loginWelcome: 'Chào mừng trở lại',
      loginTitle: 'Đăng nhập CMID',
      loginDescription: 'Đăng nhập bằng tài khoản Google để theo dõi đơn hàng, ưu đãi và các dịch vụ riêng của bạn.',
      googleButton: 'Tiếp tục với Google',
      signingIn: 'Đang đăng nhập…',
      restoringSession: 'Đang khôi phục phiên đăng nhập…',
      googleHelp: 'Vui lòng chọn tài khoản Google trong cửa sổ bảo mật của Google.',
      googleSignInNotice: 'Google sẽ mở cửa sổ bảo mật để bạn chọn tài khoản.',
      checkoutTitle: 'Vui lòng đăng nhập để thanh toán',
      checkoutDescription: 'Đăng nhập để lưu đơn hàng, theo dõi giao nhận và nhận ưu đãi dành riêng cho thành viên CMID.',
      continueToLogin: 'Đến trang đăng nhập',
      cancel: 'Để sau',
      profileTitle: 'Tài khoản của tôi',
      overview: 'Tổng quan',
      userInformation: 'Thông tin người dùng',
      orders: 'Đơn hàng',
      gifts: 'Quà tặng',
      welcome: (name) => `Xin chào, ${name}`,
      accountWelcomeDescription: 'Cảm ơn bạn đã đồng hành cùng CMID. Những ưu đãi và đơn hàng của bạn sẽ được cập nhật tại đây.',
      memberSince: 'Thành viên CMID',
      orderCount: 'Đơn hàng',
      giftCount: 'Quà tặng',
      loyaltyPoints: 'Điểm tích lũy',
      recentOrderTitle: 'Đơn hàng gần đây',
      noOrders: 'Bạn chưa có đơn hàng nào. Hãy bắt đầu khám phá các sản phẩm của CMID.',
      ordersLoading: 'Đang tải đơn hàng...',
      ordersLoadError: 'Không thể tải đơn hàng lúc này. Vui lòng thử lại sau.',
      ordersRetry: 'Tải lại đơn hàng',
      orderCode: 'Mã đơn',
      orderDate: 'Ngày đặt',
      orderItems: 'Sản phẩm',
      orderTotal: 'Tổng thanh toán',
      orderPayment: 'Thanh toán',
      orderDelivery: 'Giao đến',
      orderFilterLabel: 'Lọc đơn hàng theo trạng thái',
      orderFilterAll: 'Tất cả',
      orderFilterPendingConfirmation: 'Chờ xác nhận',
      orderFilterAwaitingPickup: 'Chờ lấy hàng',
      orderFilterAwaitingDelivery: 'Chờ giao hàng',
      orderFilterDelivered: 'Đã giao',
      orderFilterReturned: 'Trả hàng',
      orderFilterCancelled: 'Đã hủy',
      orderSearchPlaceholder: 'Tìm sản phẩm',
      orderFilterEmpty: 'Bạn chưa có đơn hàng nào cả.',
      informationTitle: 'Thông tin người dùng',
      informationDescription: 'Quản lý thông tin cá nhân và thông tin liên hệ của bạn.',
      accountEmail: 'Email tài khoản',
      fullName: 'Họ và tên',
      phone: 'Số điện thoại',
      birthDate: 'Ngày sinh',
      gender: 'Giới tính',
      provinceCity: 'Tỉnh / Thành phố',
      district: 'Quận / Huyện',
      ward: 'Phường / Xã',
      address: 'Địa chỉ',
      notUpdated: 'Chưa cập nhật',
      editingInformationNotice: 'Cập nhật các thông tin liên hệ bên dưới rồi nhấn Lưu thay đổi.',
      editInformationDescription: 'Cập nhật thông tin cá nhân và địa chỉ liên hệ của bạn.',
      avatar: 'Ảnh đại diện',
      avatarHint: 'JPG, PNG tối đa 2MB',
      changeAvatar: 'Đổi ảnh',
      avatarInvalid: 'Vui lòng chọn ảnh JPG hoặc PNG, tối đa 2MB.',
      selectGender: 'Chọn giới tính',
      searchOptions: 'Tìm kiếm nhanh...',
      noOptionsFound: 'Không tìm thấy kết quả phù hợp.',
      loadingOptions: 'Đang tải danh sách...',
      selectProvinceFirst: 'Chọn Tỉnh / Thành phố trước.',
      selectDistrictFirst: 'Chọn Quận / Huyện trước.',
      genderMale: 'Nam',
      genderFemale: 'Nữ',
      genderOther: 'Khác',
      editInformation: 'Chỉnh sửa thông tin',
      saveChanges: 'Lưu thay đổi',
      cancelChanges: 'Hủy bỏ',
      ordersTitle: 'Đơn hàng của tôi',
      giftsTitle: 'Quà tặng thành viên',
      giftsDescription: 'Ưu đãi và quà tặng theo hạng thành viên sẽ được cập nhật tại đây.',
    },
    news: {
      title: "Tin tức",
      heroDescription:
        "Cập nhật xu hướng, kiến thức và những thông tin mới nhất từ CMID.",
      search: "Tìm kiếm tin tức...",
      categoriesTitle: "Danh mục",
      tagsTitle: "Thẻ chủ đề",
      latest: "Những bài viết mới nhất về vật liệu và không gian sống",
      sort: "Sắp xếp",
      newest: "Mới nhất",
      popular: "Đọc nhiều",
      categories: [
        "Tất cả",
        "Xu hướng vật liệu",
        "Kinh nghiệm thiết kế",
        "Sản phẩm mới",
        "Dự án nổi bật",
        "Tin tức CMID",
      ],
      tags: [
        "Nội thất",
        "Gạch ốp lát",
        "Thiết bị vệ sinh",
        "Đá tự nhiên",
        "Thiết kế",
        "Xu hướng",
      ],
      featured: {
        category: "Xu hướng vật liệu",
        title: "Xu hướng vật liệu 2025: Tự nhiên, bền vững và tinh tế",
        summary:
          "Khám phá những vật liệu đang được ưa chuộng, tạo nên không gian sống hiện đại và có giá trị lâu dài.",
      },
      articles: [
        {
          category: "Xu hướng vật liệu",
          title: "Không gian bếp hiện đại với đá tự nhiên",
          summary:
            "Chọn bề mặt, tông màu và tỷ lệ phù hợp cho căn bếp sáng, bền và dễ sử dụng.",
        },
        {
          category: "Kinh nghiệm thiết kế",
          title: "Phòng khách hiện đại với gạch khổ lớn",
          summary:
            "Một vài nguyên tắc để giữ không gian liền mạch và cân bằng ánh sáng.",
        },
        {
          category: "Sản phẩm mới",
          title: "Giải pháp bề mặt cao cấp cho không gian sống",
          summary:
            "Những lựa chọn vật liệu phù hợp với nhịp sống hiện đại và yêu cầu sử dụng lâu dài.",
        },
        {
          category: "Tin tức CMID",
          title: "CMID khai trương không gian trưng bày mới tại Đà Nẵng",
          summary:
            "Không gian để khách hàng trực tiếp trải nghiệm mẫu vật liệu và giải pháp hoàn thiện.",
        },
        {
          category: "Kinh nghiệm thiết kế",
          title: "Chọn gạch sân vườn chống trơn và bền vững",
          summary:
            "Lưu ý về bề mặt, khả năng thoát nước và màu sắc cho khu vực ngoài trời.",
        },
        {
          category: "Dự án nổi bật",
          title: "Căn hộ The Skyline Residence và những lớp vật liệu ấm",
          summary:
            "Sự kết hợp của đá, gỗ và ánh sáng tạo nên một tổng thể sống hài hòa.",
        },
      ],
      previous: "Trang trước",
      next: "Trang sau",
      noResults: "Không tìm thấy bài viết phù hợp.",
      backToNews: "Quay lại tin tức",
      related: "Bài viết liên quan",
      articleNotFound: "Không tìm thấy bài viết",
      articleNotFoundDescription: "Bài viết này không tồn tại hoặc đã được cập nhật.",
      browseNews: "Xem tất cả tin tức",
      readingTime: (minutes) => `${minutes} phút đọc`,
    },
    contact: {
      title: "Liên hệ",
      heroDescription:
        "CMID luôn sẵn sàng lắng nghe và hỗ trợ bạn lựa chọn giải pháp phù hợp.",
      quickInfoLabel: "Thông tin liên hệ nhanh",
      phone: "Điện thoại",
      phoneDescription: "Hỗ trợ tư vấn mỗi ngày",
      email: "Email",
      emailDescription: "Phản hồi trong vòng 24 giờ",
      mainShowroom: "Showroom chính",
      openingHours: "Giờ làm việc",
      openingHoursDescription: "Hẹn trước để được phục vụ tốt hơn",
      formTitle: "Gửi yêu cầu liên hệ",
      formDescription:
        "Để lại thông tin, đội ngũ CMID sẽ liên hệ với bạn sớm nhất.",
      name: "Họ và tên",
      phoneLabel: "Số điện thoại",
      emailLabel: "Email",
      subject: "Chủ đề",
      message: "Nội dung tin nhắn",
      namePlaceholder: "Nhập họ và tên",
      phonePlaceholder: "Nhập số điện thoại",
      subjectPlaceholder: "Chọn chủ đề quan tâm",
      messagePlaceholder: "Cho CMID biết nhu cầu của bạn...",
      subjects: [
        "Tư vấn sản phẩm",
        "Báo giá dự án",
        "Hẹn showroom",
        "Hỗ trợ đơn hàng",
      ],
      consent: "Tôi đồng ý để CMID lưu thông tin nhằm phản hồi yêu cầu này.",
      submit: "Gửi thông tin",
      success: "CMID đã nhận yêu cầu của bạn. Chúng tôi sẽ liên hệ sớm nhất.",
      mapTitle: "Bản đồ showroom",
      mapFrameTitle: "Bản đồ showroom chính CMID",
      directions: "Chỉ đường",
      showroomTitle: "Hệ thống showroom",
      showroomDescription:
        "Ghé thăm CMID để xem trực tiếp vật liệu, mẫu hoàn thiện và không gian trưng bày.",
      showroomNames: [
        "Showroom chính TP. Hồ Chí Minh",
        "Showroom Quận 7",
        "Showroom Bình Dương",
      ],
      hours: [
        "08:00 - 18:00, Thứ 2 - Chủ nhật",
        "08:30 - 17:30, Thứ 2 - Thứ 7",
        "08:00 - 17:30, Thứ 2 - Thứ 7",
      ],
    },
    assurances: [
      { title: "Sản phẩm chính hãng", description: "Cam kết chất lượng" },
      { title: "Giao hàng toàn quốc", description: "Nhanh chóng, an toàn" },
      { title: "Đổi trả dễ dàng", description: "Trong 7 ngày" },
      { title: "Báo giá dự án", description: "Tối ưu chi phí" },
      { title: "Tư vấn chuyên nghiệp", description: "Hỗ trợ tận tâm" },
    ],
  },
  /* Bộ tiếng Anh giữ nguyên cấu trúc để View chuyển ngôn ngữ không cần điều kiện riêng. */
  en: {
    header: {
      home: "Home",
      products: "Products",
      projects: "Projects",
      about: "About us",
      news: "News",
      contact: "Contact",
      menuOpen: "Open menu",
      menuClose: "Close menu",
      productSearch: "Search products",
      cartAria: (count) => `Cart, ${count} product${count === 1 ? "" : "s"}`,
      hotline: "Hotline:",
    },
    footer: {
      description:
        "CMID Building Materials & Interior Decoration JSC. A trusted provider of premium natural-stone and refined architectural solutions.",
      quickLinks: "Quick links",
      premiumProducts: "Premium products",
      contactInformation: "Contact information",
      about: "About us",
      catalog: "Product catalogue",
      projects: "Featured projects",
      careers: "Careers",
      warranty: "Warranty policy",
      granite: "Natural granite",
      marble: "Veined marble",
      tiles: "Premium tiles",
      bathroom: "Bathroom fixtures",
      furniture: "Custom furniture",
      phone: "Tel:",
      office: "Head office:",
      copyright:
        "© 2025 CMID Jsc. All rights reserved. Designed by CMID Architectures.",
      privacy: "Privacy policy",
      terms: "Terms of use",
    },
    common: {
      home: "Home",
      products: "Products",
      retry: "Try again",
      readMore: "Read more",
      send: "Send",
      required: "Required",
      unavailable: "Contact us",
      available: "In stock",
      order: "Made to order",
      product: "item",
    },
    cart: {
      title: "Shopping cart",
      breadcrumb: "Cart",
      emptyTitle: "Your cart is empty",
      emptyDescription: "Explore materials and interiors that suit your space.",
      browseProducts: "Browse products",
      product: "Product",
      unitPrice: "Unit price",
      quantity: "Quantity",
      status: "Status",
      amount: "Amount",
      continueShopping: "Continue shopping",
      subtotal: "Subtotal",
      shipping: "Shipping",
      free: "Free",
      total: "Total",
      summary: "Order summary",
      checkout: "Proceed to checkout",
      privacy: "Your information is kept completely confidential.",
      assurance: "CMID confirms each order by phone or email before delivery.",
      itemSummary: (count) =>
        `Your order (${count} item${count === 1 ? "" : "s"})`,
      added: "Added to cart",
      viewCart: "View cart",
      closeNotification: "Close notification",
      decrease: (name) => `Decrease quantity of ${name}`,
      increase: (name) => `Increase quantity of ${name}`,
      remove: (name) => `Remove ${name} from cart`,
    },
    checkout: {
      title: "Checkout",
      customerTitle: "Customer information",
      deliveryTitle: "Delivery address",
      paymentTitle: "Payment method",
      noteTitle: "Order notes",
      fullName: "Full name",
      phone: "Phone number",
      email: "Email",
      province: "Province / City",
      district: "District",
      ward: "Ward",
      address: "Detailed address",
      saveAddress: "Save this address for next time",
      selectDistrict: "Select district",
      selectWard: "Select ward",
      notePlaceholder: "Add a note or special request for this order...",
      bank: "VNPAY-QR scan",
      bankDescription: "Scan a VNPAY-QR code with your banking app to pay.",
      momo: "MoMo wallet",
      momoDescription: "Pay securely with your MoMo wallet.",
      cod: "Cash on delivery",
      codDescription: "Pay in cash when your order arrives.",
      card: "Pay by card",
      cardDescription:
        "Visa, MasterCard, JCB and domestic ATM cards are supported.",
      redirectingToMomo: "Creating your payment session and redirecting you to MoMo…",
      momoPendingTitle: "Confirming your MoMo payment",
      momoPendingDescription: "MoMo is sending the transaction result to CMID. Your order will be confirmed as soon as it arrives.",
      momoPaymentFailed: "The MoMo transaction was not successful. You can try again or choose another payment method.",
      vnpayNotConfigured: "VNPAY/card payments are not available yet. Please choose the MoMo wallet or cash on delivery.",
      paymentConfirmationTitle: "Confirm payment",
      paymentConfirmationDescription: "Please confirm to complete your order.",
      paymentConfirmationSuccess: "Complete payment",
      paymentConfirmationCancel: "Go back",
      paymentNoticeTitle: "Payment not completed",
      paymentCancelled: "No order was created. You can try the payment again when you are ready.",
      vnpayQrTitle: "Scan VNPAY-QR code",
      momoQrTitle: "Pay with MoMo wallet",
      paymentQrAmount: "Payment amount",
      paymentQrOrderCode: "Order code",
      paymentQrRecipient: "Recipient",
      paymentQrWaiting: "Waiting for payment",
      paymentQrWaitingDescription: "Your order will be confirmed as soon as the transaction succeeds.",
      paymentQrTimeRemaining: "Payment time remaining",
      paymentQrExpired: "Payment time has expired. Please create a new order to receive a new QR code.",
      paymentQrCancel: "Cancel",
      paymentQrTestSuccess: "Payment successful (test)",
      paymentQrClose: "Close payment window",
      cardFormTitle: "Card information",
      cardNumber: "Card number",
      cardHolder: "Cardholder name",
      cardExpiry: "Expiry date",
      cardCvc: "CVC",
      cardInvalid: "Enter complete, valid card details to continue.",
      saveCard: "Save this card for next time",
      placeOrder: "Place order",
      successTitle: "CMID has received your order",
      successDescription:
        "We will contact you by phone or email to confirm your order and delivery arrangement.",
      continueShopping: "Continue shopping",
      noItemsTitle: "There are no items to check out",
      noItemsDescription: "Add products to your cart before placing an order.",
    },
    product: {
      categoryEyebrow: "CMID catalogue",
      catalogDescription:
        "Premium materials and interiors for exceptional living spaces",
      totalProducts: (total) => `${total} products`,
      sortNewest: "Sort: Newest",
      sortPriceAsc: "Price: Low to high",
      sortPriceDesc: "Price: High to low",
      loading: "Loading products…",
      loadFailed: "Unable to load products",
      noResults: "No matching products found",
      noResultsDescription: "Try adjusting your filters to see more products.",
      clearFilters: "Clear filters",
      addToCart: "Add to cart",
      quote: "Request a quote",
      directOrder: "Buy now",
      has3D: "3D model available",
      noImage: "No image available",
      uncategorized: "Uncategorized",
      inStock: "In stock",
      outOfStock: "Out of stock",
      madeToOrder: "Made to order",
      viewDetail: (name) => `View details for ${name}`,
      filter: {
        title: "Product filters",
        mobileLabel: "Filters",
        close: "Close filters",
        showResults: "Show products",
        category: "Category",
        brand: "Brand",
        searchBrand: "Search brands...",
        price: "Price range (VND)",
        lowestPrice: "Lowest price",
        highestPrice: "Highest price",
        saleType: "Purchase type",
        model3D: "3D",
        hasModel3D: "3D model available",
        status: "Availability",
        reset: "Clear filters",
      },
    },
    home: {
      heroTitle: "Building material solutions",
      heroHighlight: "& premium interiors",
      heroDescription:
        "CMID brings authentic, high-quality products to every living space and project.",
      browseProducts: "Explore products",
      requestQuote: "Request a quote",
      categories: [
        "Cement & concrete",
        "Tiles",
        "Paint & waterproofing",
        "Bathroom fixtures",
        "Natural stone",
        "Doors & hardware",
        "Ceilings & walls",
        "Living room furniture",
        "Dining furniture",
        "Office furniture",
      ],
      featuredTitle: "Featured products",
      loading: "Loading products",
      loadFailed: "Unable to load products",
      emptyFeatured: "No featured products yet",
      previousProduct: "View previous products",
      nextProduct: "View next products",
      direct: {
        title: "Buy directly",
        description: "In-stock products with fast delivery.",
        points: ["Easy ordering", "Flexible payment", "Nationwide delivery"],
        action: "Shop now",
      },
      quote: {
        title: "Request a quote",
        description: "A tailored solution for projects and developments.",
        points: ["Fast quotations", "Project pricing", "Specialist advice"],
        action: "Send request",
      },
      aboutTitle: "About CMID",
      aboutDescription:
        "CMID partners with customers from material selection through to completing their living space or project.",
      values: [
        "Authentic products",
        "Leading quality",
        "Flexible solutions",
        "Professional service",
      ],
      learnAbout: "Discover CMID",
      brandsLabel: "Partners and brands",
      experienceEyebrow: "3D experience",
      experienceTitle: "Create your space",
      experienceDescription:
        "Explore products in a visual space and imagine the beauty of your home.",
      experienceAction: "Experience it now",
      projectsTitle: "Featured projects",
      allProjects: "View all projects",
      projects: [
        {
          title: "Green urban district",
          location: "Thu Duc City, Ho Chi Minh City",
        },
        { title: "Urban tower", location: "District 1, Ho Chi Minh City" },
        {
          title: "Riverside apartments",
          location: "Thu Duc City, Ho Chi Minh City",
        },
        { title: "Eco city", location: "Southern Ho Chi Minh City" },
      ],
      newsTitle: "News & inspiration",
      allNews: "View all news",
      news: [
        { title: "Tile trends for contemporary spaces", date: "10/04/2026" },
        {
          title: "A sophisticated living room with natural materials",
          date: "08/04/2026",
        },
        {
          title: "Effective waterproofing solutions for the rainy season",
          date: "05/04/2026",
        },
      ],
    },
    services: {
      eyebrow: "Your project partner",
      title: "CMID services",
      description:
        "CMID works with you from concept to completion, delivering an integrated solution with elevated standards and a thoughtful experience.",
      action: "Talk to an advisor",
      list: [
        {
          title: "Solution consultation",
          description:
            "We listen, assess your current needs and recommend the right approach.",
        },
        {
          title: "3D design",
          description:
            "Visualise your future space through materials, colours and considered proportions.",
        },
        {
          title: "Installation & delivery",
          description:
            "Professional coordination, delivery and installation support aligned to the schedule.",
        },
        {
          title: "Dedicated warranty",
          description: "Clear policies and responsive support after handover.",
        },
      ],
      quote:
        "“CMID does more than supply premium materials; we deliver a considered completion journey for every space.”",
      quoteBy: "CMID advisory team",
    },
    solutions: {
      title: "Space solutions",
      description:
        "CMID combines premium materials, fixtures and furniture to create spaces balanced in beauty, function and lasting quality.",
      action: "Explore solutions",
      list: [
        {
          title: "Living spaces",
          description:
            "Materials and furniture in harmony with every lifestyle.",
        },
        {
          title: "Commercial projects",
          description:
            "Coordinated solutions for lobbies, hotels and retail spaces.",
        },
        {
          title: "Workplaces",
          description:
            "Durable, efficient and carefully considered work environments.",
        },
        {
          title: "Project completion",
          description:
            "From material selection to handover at the expected standard.",
        },
      ],
      eyebrow: "CMID solutions",
      featureTitle: "Exceptional materials, exceptional spaces.",
      featureDescription:
        "Every CMID project starts by understanding practical needs, then selecting materials and furniture that fit its style, budget and schedule.",
      points: [
        "Advice based on real area and functional requirements.",
        "Coordinated colours, surfaces and finishing details.",
        "Transparent quotations and support throughout the project.",
      ],
    },
    projects: {
      title: "Featured projects",
      description:
        "Spaces where CMID supports every step, from material selection to the finishing details.",
      action: "Explore projects",
      eyebrow: "CMID milestones",
      heading: "Projects in harmony with their materials",
      cards: [
        {
          title: "Green urban district",
          location: "Thu Duc City, Ho Chi Minh City",
        },
        { title: "Urban tower", location: "District 1, Ho Chi Minh City" },
        {
          title: "Riverside apartments",
          location: "Thu Duc City, Ho Chi Minh City",
        },
      ],
      featureEyebrow: "Featured project",
      featureTitle: "A living space considered down to every detail",
      featureDescription:
        "CMID provides a system of finishes and furniture aligned with the architectural vision, creating a refined and lasting living experience.",
      featureLocation: "Thu Duc City, Ho Chi Minh City",
      details: "View project details",
    },
    about: {
      eyebrow: "About CMID",
      title:
        "CMID, a trusted provider of building materials and interior finishes",
      description:
        "CMID brings a curated range of products and solutions, helping customers create spaces that truly matter.",
      action: "Partner with us",
      values: [
        {
          title: "Mission",
          description:
            "To provide quality materials and interior solutions that elevate living spaces and project value.",
        },
        {
          title: "Vision",
          description:
            "To become the building-material and interior-finish distributor customers trust.",
        },
        {
          title: "Core values",
          description:
            "Quality, dedication, transparency and a sustainable partnership in every choice.",
        },
      ],
      metrics: [
        "Years of experience",
        "Trusted customers",
        "Partner brands",
        "Completed projects",
      ],
      categoriesTitle: "Product categories and solutions",
      categories: [
        "Tiles",
        "Bathroom fixtures",
        "Natural stone",
        "Paint & waterproofing",
        "Furniture",
        "Integrated solutions",
      ],
      partnersTitle: "Brand partners",
      projectsTitle: "Featured projects",
      projects: [
        {
          title: "Green urban district",
          location: "Thu Duc City, Ho Chi Minh City",
        },
        { title: "Urban tower", location: "District 1, Ho Chi Minh City" },
        { title: "Riverside masterplan", location: "Ho Chi Minh City" },
        { title: "Riverside urban district", location: "Dong Nai" },
      ],
      reachTitle: "Nationwide distribution",
      reachDescription:
        "CMID has built an extensive distribution network, ready to serve customers and projects across Vietnam.",
      reachMetrics: [
        "Experience showrooms",
        "Provinces and cities served",
        "Dealers and partners",
      ],
      timelineTitle: "Our journey",
      milestones: [
        "CMID was founded, initially focused on tiles.",
        "Expanded the product portfolio and distribution network.",
        "Partnered with international brands.",
        "Launched integrated interior solutions.",
        "Continued to innovate and create lasting value.",
      ],
      ctaTitle: "Let’s create your perfect space together",
      ctaDescription:
        "The CMID team is ready to advise on the right solution for your needs and project.",
      ctaAction: "Talk to an advisor",
    },
    productDetail: {
      loading: "Loading product information…",
      loadFailed: "Unable to load product information",
      notFound: "Product not found",
      notFoundDescription: "This product does not exist or has been updated.",
      backToCatalog: "Back to product catalogue",
      category: "Category",
      brand: "Brand",
      quantity: "Quantity",
      buyNow: "Buy now",
      requestQuote: "Request a quote",
      requestQuoteAndConsultation: "Request a quote & consultation",
      addToCart: "Add to cart",
      added: "Added to cart",
      consultation: "Request consultation",
      tabs: ["Description", "Specifications", "Guidance", "Sales policy"],
      descriptionPoints: [
        "Suitable for a wide range of space-finishing solutions.",
        "CMID provides advice based on your practical requirements.",
        "Quotation and nationwide delivery support are available.",
      ],
      guide:
        "Contact CMID for guidance on product selection, quantity and an appropriate delivery plan for your project.",
      guidePoints: [
        "Check specifications and quantity before ordering.",
        "Store the product according to the manufacturer’s instructions.",
        "The CMID team is ready to help whenever needed.",
      ],
      policy:
        "CMID provides transparent quotations, safe delivery and after-sales support for every product group.",
      policyPoints: [
        "Review return conditions before confirming an order.",
        "Receive project pricing support based on quantity and schedule.",
        "Contact CMID to learn the policy applicable to this product.",
      ],
      related: "Related products",
      descriptionFallback: (name) =>
        `${name} is a thoughtful choice for spaces that need visual appeal, durability and a consistent finish. CMID can advise on the right solution for your project.`,
      specs: {
        availability: "Availability",
        purchaseType: "Purchase type",
        category: "Category",
        brand: "Brand",
        unit: "Unit",
        model3D: "3D model",
        updating: "Updating",
        yes: "Available",
        no: "Not available",
      },
    },
    showroom: {
      title: "Showroom network",
      description:
        "CMID is preparing showroom information so you can experience our products in person.",
      browseProducts: "Browse products",
    },
    auth: {
      signIn: 'Sign in',
      account: 'Account',
      signOut: 'Sign out',
      loginWelcome: 'Welcome back',
      loginTitle: 'Sign in to CMID',
      loginDescription: 'Sign in with Google to track your orders, rewards and personalised CMID services.',
      googleButton: 'Continue with Google',
      signingIn: 'Signing in…',
      restoringSession: 'Restoring your signed-in session…',
      googleHelp: 'Choose your Google account in the secure Google window.',
      googleSignInNotice: 'Google will open a secure window so you can choose your account.',
      checkoutTitle: 'Please sign in to check out',
      checkoutDescription: 'Sign in to save your order, track delivery and receive member-only CMID offers.',
      continueToLogin: 'Go to sign in',
      cancel: 'Maybe later',
      profileTitle: 'My account',
      overview: 'Overview',
      userInformation: 'User information',
      orders: 'Orders',
      gifts: 'Gifts',
      welcome: (name) => `Hello, ${name}`,
      accountWelcomeDescription: 'Thank you for being part of CMID. Your offers and orders will appear here.',
      memberSince: 'CMID member',
      orderCount: 'Orders',
      giftCount: 'Gifts',
      loyaltyPoints: 'Loyalty points',
      recentOrderTitle: 'Recent orders',
      noOrders: 'You do not have any orders yet. Start exploring CMID products.',
      ordersLoading: 'Loading orders...',
      ordersLoadError: 'We could not load your orders right now. Please try again later.',
      ordersRetry: 'Reload orders',
      orderCode: 'Order code',
      orderDate: 'Ordered on',
      orderItems: 'Items',
      orderTotal: 'Order total',
      orderPayment: 'Payment',
      orderDelivery: 'Delivery address',
      orderFilterLabel: 'Filter orders by status',
      orderFilterAll: 'All',
      orderFilterPendingConfirmation: 'Awaiting confirmation',
      orderFilterAwaitingPickup: 'Awaiting pickup',
      orderFilterAwaitingDelivery: 'Awaiting delivery',
      orderFilterDelivered: 'Delivered',
      orderFilterReturned: 'Returned',
      orderFilterCancelled: 'Cancelled',
      orderSearchPlaceholder: 'Search products',
      orderFilterEmpty: 'You do not have any orders yet.',
      informationTitle: 'User information',
      informationDescription: 'Manage your personal details and contact information.',
      accountEmail: 'Account email',
      fullName: 'Full name',
      phone: 'Phone number',
      birthDate: 'Date of birth',
      gender: 'Gender',
      provinceCity: 'Province / City',
      district: 'District',
      ward: 'Ward',
      address: 'Address',
      notUpdated: 'Not updated',
      editingInformationNotice: 'Update the contact details below, then select Save changes.',
      editInformationDescription: 'Update your personal details and contact address.',
      avatar: 'Profile image',
      avatarHint: 'JPG or PNG, up to 2MB',
      changeAvatar: 'Change image',
      avatarInvalid: 'Please choose a JPG or PNG image up to 2MB.',
      selectGender: 'Select gender',
      searchOptions: 'Search quickly...',
      noOptionsFound: 'No matching results found.',
      loadingOptions: 'Loading options...',
      selectProvinceFirst: 'Choose a province or city first.',
      selectDistrictFirst: 'Choose a district first.',
      genderMale: 'Male',
      genderFemale: 'Female',
      genderOther: 'Other',
      editInformation: 'Edit information',
      saveChanges: 'Save changes',
      cancelChanges: 'Cancel',
      ordersTitle: 'My orders',
      giftsTitle: 'Member gifts',
      giftsDescription: 'Member-tier offers and gifts will be updated here.',
    },
    news: {
      title: "News",
      heroDescription:
        "Discover trends, expert knowledge and the latest news from CMID.",
      search: "Search news...",
      categoriesTitle: "Categories",
      tagsTitle: "Topics",
      latest: "The latest articles on materials and living spaces",
      sort: "Sort",
      newest: "Newest",
      popular: "Most read",
      categories: [
        "All",
        "Material trends",
        "Design insights",
        "New products",
        "Featured projects",
        "CMID news",
      ],
      tags: [
        "Interiors",
        "Tiles",
        "Bathroom fixtures",
        "Natural stone",
        "Design",
        "Trends",
      ],
      featured: {
        category: "Material trends",
        title: "Material trends 2025: Natural, durable and refined",
        summary:
          "Explore the materials shaping contemporary spaces with enduring value.",
      },
      articles: [
        {
          category: "Material trends",
          title: "A contemporary kitchen with natural stone",
          summary:
            "Choose surfaces, colours and proportions for a bright, durable and practical kitchen.",
        },
        {
          category: "Design insights",
          title: "A modern living room with large-format tiles",
          summary: "A few principles for a seamless space with balanced light.",
        },
        {
          category: "New products",
          title: "Premium surface solutions for modern living",
          summary:
            "Material choices that suit contemporary lifestyles and long-term use.",
        },
        {
          category: "CMID news",
          title: "CMID opens a new showroom in Da Nang",
          summary:
            "A place for customers to experience materials and finishing solutions firsthand.",
        },
        {
          category: "Design insights",
          title: "Choosing safe, durable outdoor tiles",
          summary:
            "Consider surface texture, drainage and colour for exterior areas.",
        },
        {
          category: "Featured projects",
          title: "The Skyline Residence and its warm material palette",
          summary:
            "Stone, timber and light come together in a harmonious living environment.",
        },
      ],
      previous: "Previous page",
      next: "Next page",
      noResults: "No matching articles were found.",
      backToNews: "Back to news",
      related: "Related articles",
      articleNotFound: "Article not found",
      articleNotFoundDescription: "This article does not exist or has been updated.",
      browseNews: "Browse all news",
      readingTime: (minutes) => `${minutes} min read`,
    },
    contact: {
      title: "Contact",
      heroDescription:
        "CMID is ready to listen and help you choose the right solution.",
      quickInfoLabel: "Quick contact information",
      phone: "Phone",
      phoneDescription: "Consultation support every day",
      email: "Email",
      emailDescription: "Reply within 24 hours",
      mainShowroom: "Main showroom",
      openingHours: "Opening hours",
      openingHoursDescription: "Please book ahead for the best service",
      formTitle: "Send an enquiry",
      formDescription:
        "Leave your details and the CMID team will contact you as soon as possible.",
      name: "Full name",
      phoneLabel: "Phone number",
      emailLabel: "Email",
      subject: "Subject",
      message: "Message",
      namePlaceholder: "Enter your full name",
      phonePlaceholder: "Enter your phone number",
      subjectPlaceholder: "Choose a topic",
      messagePlaceholder: "Tell CMID what you need...",
      subjects: [
        "Product consultation",
        "Project quotation",
        "Showroom appointment",
        "Order support",
      ],
      consent:
        "I agree that CMID may retain my details to respond to this request.",
      submit: "Send enquiry",
      success: "CMID has received your enquiry. We will get in touch shortly.",
      mapTitle: "Showroom map",
      mapFrameTitle: "CMID main showroom map",
      directions: "Get directions",
      showroomTitle: "Showroom network",
      showroomDescription:
        "Visit CMID to experience materials, finishes and display spaces in person.",
      showroomNames: [
        "Ho Chi Minh City main showroom",
        "District 7 showroom",
        "Binh Duong showroom",
      ],
      hours: [
        "08:00 - 18:00, Monday - Sunday",
        "08:30 - 17:30, Monday - Saturday",
        "08:00 - 17:30, Monday - Saturday",
      ],
    },
    assurances: [
      { title: "Authentic products", description: "Quality guaranteed" },
      { title: "Nationwide delivery", description: "Fast and safe" },
      { title: "Easy returns", description: "Within 7 days" },
      { title: "Project quotations", description: "Cost-effective solutions" },
      { title: "Professional advice", description: "Dedicated support" },
    ],
  },
};
