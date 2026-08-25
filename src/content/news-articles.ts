import cityImage from '../assets/images/du-an-khu-do-thi-xanh.jpg'
import planningImage from '../assets/images/du-an-quy-hoach-do-thi.jpg'
import towerImage from '../assets/images/du-an-thap-do-thi.jpg'
import riversideImage from '../assets/images/du-an-ven-song.jpg'
import materialImage from '../assets/images/khong-gian-trung-bay-vat-lieu.jpg'
import threeDImage from '../assets/images/mo-hinh-khong-gian-3d.jpg'
import interiorImage from '../assets/images/noi-that-phong-khach-cao-cap.jpg'
import { getAdminNewsArticles, getHiddenAdminNewsSlugs } from '../pages/admin/admin-local-store'
import type { AppLanguage } from './site-content'

export const newsCategoryKeys = [
  'all',
  'material-trends',
  'design-insights',
  'new-products',
  'featured-projects',
  'cmid-news',
] as const

export type NewsCategoryKey = (typeof newsCategoryKeys)[number]
export type ArticleCategoryKey = Exclude<NewsCategoryKey, 'all'>

export interface NewsArticle {
  slug: string
  title: string
  summary: string
  date: string
  publishedAt: string
  category: ArticleCategoryKey
  image: string
  body: string[]
  highlights: string[]
  tags: string[]
  readingMinutes: number
  featured?: boolean
}

const vi: NewsArticle[] = [
  {
    slug: 'xu-huong-vat-lieu-2025-tu-nhien-ben-vung-va-tinh-te',
    title: 'Xu hướng vật liệu 2025: Tự nhiên, bền vững và tinh tế',
    summary: 'Khám phá những vật liệu đang được ưa chuộng, tạo nên không gian sống hiện đại và có giá trị lâu dài.',
    date: '08/05/2025',
    publishedAt: '2025-05-08',
    category: 'material-trends',
    image: interiorImage,
    readingMinutes: 6,
    featured: true,
    tags: ['Xu hướng', 'Đá tự nhiên', 'Nội thất'],
    body: [
      'Năm 2025 đánh dấu sự trở lại của các vật liệu có bề mặt chân thực, bảng màu trầm ấm và giá trị sử dụng lâu dài. Đá tự nhiên, gỗ hoàn thiện mờ, kim loại ánh đồng và gạch khổ lớn được phối hợp để tạo chiều sâu thay vì chạy theo hiệu ứng phô trương.',
      'Trong những không gian cao cấp, lựa chọn vật liệu không chỉ dựa vào vẻ đẹp tại thời điểm hoàn thiện. Khả năng bảo trì, nguồn gốc rõ ràng và cảm giác chạm cũng trở thành tiêu chí quan trọng để một công trình giữ được chất lượng theo thời gian.',
      'CMID khuyến nghị bắt đầu từ công năng và ánh sáng thực tế, sau đó xây dựng bảng mẫu gồm ba đến năm chất liệu chủ đạo. Cách làm này giúp không gian có nhịp điệu nhất quán mà vẫn đủ cá tính.',
    ],
    highlights: [
      'Ưu tiên bề mặt mờ, vân tự nhiên và sắc độ trung tính ấm.',
      'Chọn vật liệu có thông tin kỹ thuật, nguồn gốc và hướng dẫn bảo trì rõ ràng.',
      'Phối ít nhóm vật liệu chủ đạo để không gian giữ được sự tinh gọn.',
    ],
  },
  {
    slug: 'khong-gian-bep-hien-dai-voi-da-tu-nhien',
    title: 'Không gian bếp hiện đại với đá tự nhiên',
    summary: 'Chọn bề mặt, tông màu và tỷ lệ phù hợp cho căn bếp sáng, bền và dễ sử dụng.',
    date: '06/05/2025',
    publishedAt: '2025-05-06',
    category: 'material-trends',
    image: materialImage,
    readingMinutes: 5,
    tags: ['Đá tự nhiên', 'Nhà bếp', 'Bề mặt'],
    body: [
      'Đá tự nhiên giúp khu vực bếp có chiều sâu và cảm giác vững chãi, đặc biệt khi được dùng đồng thời cho đảo bếp, backsplash hoặc một mảng nhấn. Điều quan trọng là chọn đúng mức độ vân để căn bếp không trở nên nặng nề.',
      'Với bếp có nhiều ánh sáng, đá tông xám ấm hoặc kem nhạt giữ tổng thể sáng sủa và dễ phối cùng gỗ. Với bếp tối, một mảng đá có đường vân rõ có thể trở thành điểm neo thị giác cho toàn bộ không gian.',
      'Trước khi chốt mẫu, hãy xem phiến đá ở kích thước thật, kiểm tra cách xử lý cạnh và trao đổi về lớp bảo vệ bề mặt phù hợp với cường độ sử dụng.',
    ],
    highlights: [
      'Xem mẫu đá dưới đúng điều kiện ánh sáng của công trình.',
      'Đồng bộ đá với màu tủ và phụ kiện kim loại.',
      'Lựa chọn giải pháp chống thấm, chống bám bẩn cho bề mặt bếp.',
    ],
  },
  {
    slug: 'phong-khach-hien-dai-voi-gach-kho-lon',
    title: 'Phòng khách hiện đại với gạch khổ lớn',
    summary: 'Một vài nguyên tắc để giữ không gian liền mạch và cân bằng ánh sáng.',
    date: '01/05/2025',
    publishedAt: '2025-05-01',
    category: 'design-insights',
    image: interiorImage,
    readingMinutes: 4,
    tags: ['Gạch ốp lát', 'Phòng khách', 'Thiết kế'],
    body: [
      'Gạch khổ lớn tạo hiệu ứng liền mạch nhờ số lượng đường ron ít hơn. Đây là một lựa chọn phù hợp cho phòng khách cần cảm giác rộng, sạch và có nền vật liệu bền vững cho các lớp nội thất phía trên.',
      'Tỷ lệ lát nên được tính cùng kích thước phòng, vị trí cửa và các trục nhìn chính. Một sơ đồ lát được chuẩn bị từ đầu sẽ hạn chế các mảng cắt nhỏ ở góc và giúp vân gạch nối tiếp tự nhiên.',
      'Để không gian có độ ấm, hãy bổ sung thảm dệt, sofa vải hoặc gỗ màu trung tính. Sự tương phản về chất liệu sẽ khiến nền gạch trở thành phông nền tinh tế thay vì lạnh.',
    ],
    highlights: [
      'Chọn quy cách gạch phù hợp tỷ lệ thực của căn phòng.',
      'Lập sơ đồ lát trước khi thi công để xử lý đường ron đẹp.',
      'Cân bằng nền gạch bằng các chất liệu mềm và ánh sáng ấm.',
    ],
  },
  {
    slug: 'giai-phap-be-mat-cao-cap-cho-khong-gian-song',
    title: 'Giải pháp bề mặt cao cấp cho không gian sống',
    summary: 'Những lựa chọn vật liệu phù hợp với nhịp sống hiện đại và yêu cầu sử dụng lâu dài.',
    date: '25/04/2025',
    publishedAt: '2025-04-25',
    category: 'new-products',
    image: threeDImage,
    readingMinutes: 5,
    tags: ['Vật liệu mới', 'Bề mặt', 'Hoàn thiện'],
    body: [
      'Một bề mặt tốt cần đồng thời giải quyết thẩm mỹ, độ bền và việc vệ sinh hằng ngày. Những dòng vật liệu mới hiện nay mang đến nhiều lựa chọn về hiệu ứng đá, xi măng, gỗ hoặc kim loại nhưng có độ ổn định cao hơn trong sử dụng.',
      'Ở khu vực có lưu lượng lớn, cần ưu tiên khả năng chống trầy, chống trơn và tính đồng nhất giữa các lô hàng. Với không gian riêng tư, cảm giác chạm và độ phản sáng thường là yếu tố quyết định trải nghiệm.',
      'Bảng mẫu của CMID được sắp theo ứng dụng để đội ngũ tư vấn có thể so sánh trực tiếp quy cách, màu sắc và giải pháp thi công trước khi đưa ra lựa chọn cuối cùng.',
    ],
    highlights: [
      'Phân loại vật liệu theo vị trí sử dụng thay vì chỉ theo màu sắc.',
      'Đánh giá độ phản sáng và độ nhám bằng mẫu thực tế.',
      'Lưu mẫu đã chốt để kiểm soát tính đồng nhất khi đặt bổ sung.',
    ],
  },
  {
    slug: 'cmid-khai-truong-khong-gian-trung-bay-moi-tai-da-nang',
    title: 'CMID khai trương không gian trưng bày mới tại Đà Nẵng',
    summary: 'Không gian để khách hàng trực tiếp trải nghiệm mẫu vật liệu và giải pháp hoàn thiện.',
    date: '15/04/2025',
    publishedAt: '2025-04-15',
    category: 'cmid-news',
    image: cityImage,
    readingMinutes: 3,
    tags: ['CMID', 'Showroom', 'Đà Nẵng'],
    body: [
      'Không gian trưng bày mới của CMID tại Đà Nẵng được tổ chức theo từng bối cảnh sử dụng để khách hàng dễ hình dung vật liệu trong công trình thực tế. Các khu vực bếp, phòng tắm, phòng khách và mặt dựng đều có bảng mẫu đi kèm.',
      'Thay vì chỉ xem từng sản phẩm riêng lẻ, khách tham quan có thể so sánh trực tiếp sự chuyển tiếp giữa đá, gạch, gỗ, sơn và thiết bị. Đội ngũ tư vấn cũng hỗ trợ xây dựng bảng vật liệu theo ngân sách và tiến độ dự án.',
      'Showroom là điểm gặp gỡ dành cho chủ nhà, kiến trúc sư và đối tác muốn trao đổi sâu hơn về giải pháp hoàn thiện đồng bộ.',
    ],
    highlights: [
      'Trải nghiệm vật liệu trong các không gian được hoàn thiện thực tế.',
      'Đặt lịch tư vấn bảng mẫu theo nhu cầu công trình.',
      'Hỗ trợ phối hợp vật liệu, quy cách và giải pháp giao hàng.',
    ],
  },
  {
    slug: 'chon-gach-san-vuon-chong-tron-va-ben-vung',
    title: 'Chọn gạch sân vườn chống trơn và bền vững',
    summary: 'Lưu ý về bề mặt, khả năng thoát nước và màu sắc cho khu vực ngoài trời.',
    date: '10/04/2025',
    publishedAt: '2025-04-10',
    category: 'design-insights',
    image: towerImage,
    readingMinutes: 4,
    tags: ['Ngoài trời', 'Gạch ốp lát', 'Sân vườn'],
    body: [
      'Khu vực ngoài trời chịu tác động liên tục từ nắng, mưa và bụi bẩn nên cần một loại gạch có bề mặt đủ nhám nhưng không khó vệ sinh. Chỉ số chống trơn nên được xem cùng với độ dốc thoát nước của nền.',
      'Màu trung tính, có hạt hoặc vân nhẹ thường giúp che vết bẩn tốt hơn các bề mặt đơn sắc. Quy cách gạch cũng ảnh hưởng đến số lượng ron và khả năng thích ứng với những khu vực có hình dạng phức tạp.',
      'Khi chọn vật liệu, hãy lấy mẫu về thử dưới điều kiện ướt và đặt cạnh cây xanh, mặt tiền hoặc đồ ngoại thất dự kiến để kiểm tra tổng thể màu sắc.',
    ],
    highlights: [
      'Ưu tiên bề mặt có độ bám phù hợp khi gặp nước.',
      'Tính trước độ dốc và hệ thống thoát nước.',
      'Chọn tông màu hài hòa với cây xanh và kiến trúc ngoại thất.',
    ],
  },
  {
    slug: 'can-ho-the-skyline-residence-va-nhung-lop-vat-lieu-am',
    title: 'Căn hộ The Skyline Residence và những lớp vật liệu ấm',
    summary: 'Sự kết hợp của đá, gỗ và ánh sáng tạo nên một tổng thể sống hài hòa.',
    date: '03/04/2025',
    publishedAt: '2025-04-03',
    category: 'featured-projects',
    image: materialImage,
    readingMinutes: 6,
    tags: ['Dự án', 'Căn hộ', 'Nội thất'],
    body: [
      'The Skyline Residence được định hướng là một không gian nghỉ ngơi trong lòng đô thị. Bảng vật liệu sử dụng đá tông kem, veneer gỗ nâu và các bề mặt vải dệt để tạo cảm giác nhẹ nhưng không đơn điệu.',
      'Điểm nhấn của dự án nằm ở cách ánh sáng phản chiếu qua từng bề mặt. Các mảng đá có vân mềm được đặt tại vị trí đón sáng, còn vật liệu gỗ được dùng để cân bằng cảm giác và định hình những vùng sinh hoạt riêng tư.',
      'Quá trình phối hợp vật liệu được thực hiện từ giai đoạn thiết kế để kiểm soát tỷ lệ, mạch nối và độ chuyển màu giữa các không gian.',
    ],
    highlights: [
      'Dùng bảng màu ấm để tạo sự kết nối giữa các khu vực.',
      'Tận dụng ánh sáng tự nhiên để làm nổi bật vân vật liệu.',
      'Kiểm soát mạch nối từ bản vẽ trước khi thi công.',
    ],
  },
  {
    slug: 'phong-tam-toi-gian-voi-thiet-bi-dong-bo',
    title: 'Phòng tắm tối giản với thiết bị đồng bộ',
    summary: 'Cách phối thiết bị, gạch và phụ kiện để khu vực riêng tư luôn gọn gàng, tiện nghi.',
    date: '26/03/2025',
    publishedAt: '2025-03-26',
    category: 'new-products',
    image: planningImage,
    readingMinutes: 4,
    tags: ['Phòng tắm', 'Thiết bị vệ sinh', 'Tối giản'],
    body: [
      'Một phòng tắm tối giản không đồng nghĩa với việc giảm bớt công năng. Điểm cốt lõi là chọn thiết bị có ngôn ngữ thiết kế nhất quán và bố trí đủ khoảng trống để thao tác hằng ngày thoải mái.',
      'Lavabo, vòi, sen tắm và phụ kiện nên có cùng tông hoàn thiện. Khi màu sắc được tiết chế, bề mặt gạch và ánh sáng gián tiếp sẽ trở thành lớp trang trí chính của căn phòng.',
      'Hệ tủ âm hoặc hộc lưu trữ kín giúp các vật dụng nhỏ không phá vỡ sự sạch sẽ của tổng thể.',
    ],
    highlights: [
      'Chọn một tông kim loại xuyên suốt cho thiết bị và phụ kiện.',
      'Ưu tiên giải pháp lưu trữ kín, dễ vệ sinh.',
      'Kết hợp ánh sáng trực tiếp ở gương và ánh sáng nền dịu.',
    ],
  },
  {
    slug: 'son-noi-that-va-cach-tao-chieu-sau-cho-khong-gian',
    title: 'Sơn nội thất và cách tạo chiều sâu cho không gian',
    summary: 'Khai thác sắc độ, độ bóng và ánh sáng để bức tường trở thành một phần của thiết kế.',
    date: '19/03/2025',
    publishedAt: '2025-03-19',
    category: 'material-trends',
    image: interiorImage,
    readingMinutes: 5,
    tags: ['Sơn nội thất', 'Màu sắc', 'Ánh sáng'],
    body: [
      'Sơn không chỉ là lớp phủ hoàn thiện mà còn quyết định cảm nhận về chiều sâu và tỷ lệ của căn phòng. Các gam đất, be, nâu hồng hoặc xám ấm đang được ưu tiên vì có thể thay đổi sắc độ nhẹ theo ánh sáng trong ngày.',
      'Độ bóng cần được chọn theo chất lượng bề mặt tường và công năng sử dụng. Sơn mờ tạo cảm giác dịu, trong khi những điểm nhấn có độ bóng vừa phải có thể giúp bề mặt bắt sáng tinh tế.',
      'Hãy thử mẫu sơn trên diện tích đủ lớn và quan sát vào sáng, trưa, tối trước khi quyết định màu cuối cùng.',
    ],
    highlights: [
      'Quan sát màu sơn dưới nhiều điều kiện ánh sáng.',
      'Chọn độ bóng phù hợp với bề mặt và nhu cầu vệ sinh.',
      'Dùng màu nhấn có chủ đích thay vì sơn khác màu toàn bộ phòng.',
    ],
  },
  {
    slug: 'da-marble-trong-sanh-don-tiep',
    title: 'Đá marble trong sảnh đón tiếp: Sang trọng từ tỷ lệ',
    summary: 'Cách dùng đá marble để tạo điểm chạm đầu tiên tinh tế mà vẫn cân bằng chi phí.',
    date: '12/03/2025',
    publishedAt: '2025-03-12',
    category: 'featured-projects',
    image: cityImage,
    readingMinutes: 5,
    tags: ['Marble', 'Sảnh đón', 'Đá tự nhiên'],
    body: [
      'Sảnh đón là nơi quyết định ấn tượng đầu tiên của một công trình. Marble có thể mang lại cảm giác sang trọng rõ nét nếu được dùng đúng tỷ lệ và đặt tại những vị trí có ánh sáng tốt.',
      'Thay vì ốp toàn bộ không gian, một mảng tường chính, quầy đón tiếp hoặc mặt sàn có viền đá có thể tạo hiệu quả mạnh hơn. Các vật liệu nền nên được giữ tiết chế để vân đá trở thành tâm điểm.',
      'Khâu chọn phiến, đánh số vân và xử lý cạnh cần được thực hiện cẩn trọng vì đây là yếu tố quyết định diện mạo cuối cùng của công trình.',
    ],
    highlights: [
      'Xác định một điểm nhấn chính thay vì lạm dụng đá.',
      'Duyệt layout vân trước khi cắt và thi công.',
      'Bổ sung lớp bảo vệ phù hợp cho khu vực có lưu lượng cao.',
    ],
  },
  {
    slug: 'thiet-ke-van-phong-linh-hoat-voi-vat-lieu-ben-vung',
    title: 'Thiết kế văn phòng linh hoạt với vật liệu bền vững',
    summary: 'Tạo môi trường làm việc có thể thay đổi theo nhóm dự án mà vẫn giữ được bản sắc thương hiệu.',
    date: '05/03/2025',
    publishedAt: '2025-03-05',
    category: 'design-insights',
    image: threeDImage,
    readingMinutes: 5,
    tags: ['Văn phòng', 'Bền vững', 'Thiết kế'],
    body: [
      'Văn phòng hiện đại cần đáp ứng nhiều trạng thái làm việc: tập trung, trao đổi nhanh, họp nhóm và nghỉ ngơi. Vật liệu bền vững, dễ bảo trì sẽ giúp không gian thích ứng tốt hơn khi cách bố trí thay đổi.',
      'Sàn có độ bền cao, vách tiêu âm và hệ nội thất mô-đun là ba lớp nên được cân nhắc sớm. Chúng vừa hỗ trợ trải nghiệm sử dụng, vừa giảm chi phí thay mới trong quá trình vận hành.',
      'Màu sắc và chất liệu có thể được dùng để định vị từng khu vực mà không cần dựng quá nhiều vách ngăn cứng.',
    ],
    highlights: [
      'Ưu tiên hệ vật liệu có vòng đời sử dụng dài.',
      'Tích hợp yếu tố tiêu âm ngay từ giai đoạn bố trí.',
      'Dùng màu sắc để phân vùng mềm và giữ không gian mở.',
    ],
  },
  {
    slug: 'lap-ke-hoach-vat-lieu-truoc-khi-hoan-thien-nha-o',
    title: 'Lập kế hoạch vật liệu trước khi hoàn thiện nhà ở',
    summary: 'Một quy trình ngắn giúp kiểm soát ngân sách, tiến độ và tính đồng bộ của toàn bộ không gian.',
    date: '26/02/2025',
    publishedAt: '2025-02-26',
    category: 'material-trends',
    image: riversideImage,
    readingMinutes: 6,
    tags: ['Kế hoạch', 'Hoàn thiện', 'Ngân sách'],
    body: [
      'Kế hoạch vật liệu nên được thực hiện song song với bản vẽ nội thất, không phải ở giai đoạn cuối của công trình. Điều này giúp đội ngũ xác định đúng quy cách, thời gian đặt hàng và các chi tiết kỹ thuật liên quan.',
      'Một bảng vật liệu hiệu quả cần có tên sản phẩm, mã màu, quy cách, vị trí sử dụng, số lượng dự kiến và phương án thay thế. Khi phát sinh thay đổi, các bên có thể cùng rà soát mà không làm mất tính thống nhất.',
      'CMID thường hỗ trợ khách hàng tổ chức bảng mẫu theo từng khu vực để quá trình duyệt và triển khai tại công trường rõ ràng hơn.',
    ],
    highlights: [
      'Chốt các hạng mục có thời gian đặt hàng dài trước.',
      'Lưu mã màu, quy cách và mẫu thật của từng vật liệu.',
      'Dự trù hao hụt hợp lý cho các bề mặt cần cắt ghép.',
    ],
  },
]

const en: NewsArticle[] = [
  {
    slug: 'xu-huong-vat-lieu-2025-tu-nhien-ben-vung-va-tinh-te',
    title: 'Material trends for 2025: natural, durable and refined',
    summary: 'Explore the materials shaping contemporary spaces with lasting value.',
    date: '08 May 2025', publishedAt: '2025-05-08', category: 'material-trends', image: interiorImage, readingMinutes: 6, featured: true,
    tags: ['Trends', 'Natural stone', 'Interiors'],
    body: ['In 2025, authentic surfaces, warm neutrals and enduring material value are taking centre stage. Natural stone, matte timber, bronze-toned metals and large-format tiles add depth without unnecessary spectacle.', 'For premium interiors, a material is assessed beyond its visual appeal. Maintenance, provenance and tactile quality are equally important to ensure a project remains considered over time.', 'CMID recommends starting with function and natural light, then composing a palette of three to five core materials for a coherent yet distinctive result.'],
    highlights: ['Choose matte finishes, natural grains and warm neutral shades.', 'Prioritise materials with clear technical information and maintenance guidance.', 'Keep the core material palette concise for a more refined space.'],
  },
  {
    slug: 'khong-gian-bep-hien-dai-voi-da-tu-nhien', title: 'A contemporary kitchen with natural stone', summary: 'Choose surfaces, tones and proportions for a bright, durable and practical kitchen.', date: '06 May 2025', publishedAt: '2025-05-06', category: 'material-trends', image: materialImage, readingMinutes: 5,
    tags: ['Natural stone', 'Kitchen', 'Surfaces'],
    body: ['Natural stone adds depth and a grounded quality to a kitchen, especially when used across an island, backsplash or a single focal surface. The key is selecting a vein pattern with the right amount of movement.', 'In bright kitchens, warm grey and light cream stones pair easily with timber. In darker rooms, a more expressive stone surface can anchor the composition.', 'Review full-size samples, edge details and the right protective treatment before making a final decision.'],
    highlights: ['View the stone in the project’s actual lighting conditions.', 'Coordinate stone with cabinetry and metal finishes.', 'Specify suitable stain and moisture protection for kitchen surfaces.'],
  },
  {
    slug: 'phong-khach-hien-dai-voi-gach-kho-lon', title: 'A modern living room with large-format tiles', summary: 'A few principles for a seamless room with balanced light.', date: '01 May 2025', publishedAt: '2025-05-01', category: 'design-insights', image: interiorImage, readingMinutes: 4,
    tags: ['Tiles', 'Living room', 'Design'],
    body: ['Large-format tiles create a continuous effect with fewer grout lines. They are ideal for living rooms that need a spacious, composed and durable foundation.', 'The laying pattern should be considered with room dimensions, doors and major sightlines. Planning early reduces awkward cuts and makes veining feel more continuous.', 'Introduce rugs, upholstered furniture or warm timber to bring softness and contrast to the tiled backdrop.'],
    highlights: ['Match tile size to the room’s real proportions.', 'Prepare the laying layout before installation.', 'Balance hard surfaces with soft textures and warm light.'],
  },
  {
    slug: 'giai-phap-be-mat-cao-cap-cho-khong-gian-song', title: 'Premium surface solutions for modern living', summary: 'Material choices for contemporary lifestyles and long-term use.', date: '25 Apr 2025', publishedAt: '2025-04-25', category: 'new-products', image: threeDImage, readingMinutes: 5,
    tags: ['New materials', 'Surfaces', 'Finishes'],
    body: ['A successful surface has to balance visual character, durability and daily maintenance. New material ranges offer stone, concrete, timber and metal effects with greater stability in use.', 'High-traffic areas call for scratch resistance, slip resistance and colour consistency. Private spaces can place more emphasis on tactile quality and reflected light.', 'CMID organises its samples by application so materials, formats and installation considerations can be compared before a decision is made.'],
    highlights: ['Select by application, not colour alone.', 'Assess sheen and texture with real samples.', 'Keep approved samples for future consistency.'],
  },
  {
    slug: 'cmid-khai-truong-khong-gian-trung-bay-moi-tai-da-nang', title: 'CMID opens a new material showroom in Da Nang', summary: 'A space to experience material samples and finishing solutions in person.', date: '15 Apr 2025', publishedAt: '2025-04-15', category: 'cmid-news', image: cityImage, readingMinutes: 3,
    tags: ['CMID', 'Showroom', 'Da Nang'],
    body: ['CMID’s new Da Nang showroom is organised around realistic applications, helping visitors understand materials in an architectural setting. Kitchen, bathroom, living and façade displays are paired with sample boards.', 'Rather than viewing products individually, visitors can compare how stone, tiles, timber, paint and fixtures work together. The advisory team can also prepare a palette for project budgets and schedules.', 'The showroom is a place for homeowners, architects and partners to discuss integrated finishing solutions in greater depth.'],
    highlights: ['Experience materials in finished spatial settings.', 'Book a material-board consultation for your project.', 'Receive support with formats, material coordination and delivery.'],
  },
  {
    slug: 'chon-gach-san-vuon-chong-tron-va-ben-vung', title: 'Choosing safe, durable outdoor tiles', summary: 'Consider texture, drainage and colour for exterior areas.', date: '10 Apr 2025', publishedAt: '2025-04-10', category: 'design-insights', image: towerImage, readingMinutes: 4,
    tags: ['Outdoor', 'Tiles', 'Landscape'],
    body: ['Outdoor areas face sun, rain and dirt every day, so their surfaces need reliable grip without becoming difficult to clean. Slip resistance should be considered together with floor drainage.', 'Neutral, lightly textured colours often conceal dirt more gracefully than flat solid finishes. Tile format also affects grout lines and how easily complex areas can be detailed.', 'Take a sample into wet conditions and view it alongside planting, façade materials and proposed outdoor furniture before confirming the palette.'],
    highlights: ['Choose a finish with appropriate wet grip.', 'Plan drainage slopes before finalising tiles.', 'Coordinate the tone with planting and exterior architecture.'],
  },
  {
    slug: 'can-ho-the-skyline-residence-va-nhung-lop-vat-lieu-am', title: 'The Skyline Residence and its warm material layers', summary: 'Stone, timber and light come together in a harmonious home.', date: '03 Apr 2025', publishedAt: '2025-04-03', category: 'featured-projects', image: materialImage, readingMinutes: 6,
    tags: ['Project', 'Apartment', 'Interiors'],
    body: ['The Skyline Residence was designed as a calm retreat within the city. A palette of cream stone, brown timber veneer and woven textiles feels light without becoming plain.', 'Natural light was used to reveal each surface differently. Soft-veined stone sits in brighter positions, while timber helps define more intimate living zones.', 'Material coordination began during design to control scale, joints and colour transitions throughout the apartment.'],
    highlights: ['Use a warm palette to connect adjacent spaces.', 'Let natural light reveal material movement.', 'Coordinate joints from drawings before site work begins.'],
  },
  {
    slug: 'phong-tam-toi-gian-voi-thiet-bi-dong-bo', title: 'A minimalist bathroom with coordinated fixtures', summary: 'Pair fixtures, tiles and accessories for a tidy, practical private space.', date: '26 Mar 2025', publishedAt: '2025-03-26', category: 'new-products', image: planningImage, readingMinutes: 4,
    tags: ['Bathroom', 'Fixtures', 'Minimalism'],
    body: ['A minimalist bathroom does not mean sacrificing function. The key is choosing fixtures with a common design language and retaining enough space for comfortable daily use.', 'Basins, taps, showers and accessories work best in a shared finish. With colour restrained, tile texture and layered lighting become the room’s main decorative elements.', 'Built-in cabinetry and closed storage keep small essentials from disrupting the calm composition.'],
    highlights: ['Use one metal finish across fixtures and accessories.', 'Prioritise enclosed, easy-to-clean storage.', 'Combine mirror lighting with softer ambient lighting.'],
  },
  {
    slug: 'son-noi-that-va-cach-tao-chieu-sau-cho-khong-gian', title: 'Interior paint and the art of spatial depth', summary: 'Use tone, sheen and light to make walls part of the design.', date: '19 Mar 2025', publishedAt: '2025-03-19', category: 'material-trends', image: interiorImage, readingMinutes: 5,
    tags: ['Interior paint', 'Colour', 'Light'],
    body: ['Paint is more than a finishing coat: it changes how a room feels in scale and depth. Earthy, beige, muted rose and warm grey tones are especially versatile as they shift gently throughout the day.', 'Choose sheen according to wall quality and maintenance requirements. Matte finishes feel soft, while a controlled satin accent can catch light with restraint.', 'Test paint over a generous area and observe it in the morning, afternoon and evening before confirming the final shade.'],
    highlights: ['Review colour under multiple lighting conditions.', 'Match sheen to maintenance needs and wall quality.', 'Use accent colours deliberately instead of colouring every wall.'],
  },
  {
    slug: 'da-marble-trong-sanh-don-tiep', title: 'Marble in a reception area: luxury through proportion', summary: 'Use marble for a refined first impression while keeping the budget balanced.', date: '12 Mar 2025', publishedAt: '2025-03-12', category: 'featured-projects', image: cityImage, readingMinutes: 5,
    tags: ['Marble', 'Reception', 'Natural stone'],
    body: ['A reception area sets the first impression of a project. Marble can create immediate distinction when it is used at the right scale and placed where light can reveal its character.', 'Rather than covering every surface, a feature wall, reception desk or framed floor zone often creates a stronger result. Supporting materials should remain quiet so the stone can lead.', 'Slab selection, vein layout and edge details all need careful review because they define the final appearance of the installation.'],
    highlights: ['Define one focal application instead of overusing stone.', 'Approve the vein layout before cutting.', 'Specify protection for high-traffic areas.'],
  },
  {
    slug: 'thiet-ke-van-phong-linh-hoat-voi-vat-lieu-ben-vung', title: 'Flexible workplace design with durable materials', summary: 'Create a work environment that evolves with project teams while retaining brand character.', date: '05 Mar 2025', publishedAt: '2025-03-05', category: 'design-insights', image: threeDImage, readingMinutes: 5,
    tags: ['Office', 'Sustainability', 'Design'],
    body: ['Modern workplaces need to support focus, quick exchanges, team meetings and rest. Durable, maintainable materials help a workplace adapt when layouts change over time.', 'Resilient flooring, acoustic surfaces and modular furniture are three layers worth considering early. Together they improve daily experience and limit replacement costs.', 'Colour and texture can identify zones without relying on too many solid partitions, keeping the workplace open and legible.'],
    highlights: ['Prioritise materials with a long service life.', 'Integrate acoustic performance from the planning stage.', 'Use colour to create soft zones in open layouts.'],
  },
  {
    slug: 'lap-ke-hoach-vat-lieu-truoc-khi-hoan-thien-nha-o', title: 'Planning materials before completing a home', summary: 'A short process for controlling budget, programme and consistency across the entire interior.', date: '26 Feb 2025', publishedAt: '2025-02-26', category: 'material-trends', image: riversideImage, readingMinutes: 6,
    tags: ['Planning', 'Finishes', 'Budget'],
    body: ['Material planning should happen alongside interior drawings, not at the end of a project. It helps teams identify formats, lead times and technical details before they affect the programme.', 'An effective material schedule records product names, colour codes, formats, locations, anticipated quantities and alternatives. When changes arise, everyone can review them without losing consistency.', 'CMID helps clients organise material boards by area so approvals and site implementation are clearer from the outset.'],
    highlights: ['Confirm long-lead items first.', 'Keep colour codes, formats and physical samples together.', 'Allow sensible waste for cut and patterned surfaces.'],
  },
]

export const newsArticles: Record<AppLanguage, NewsArticle[]> = { vi, en }

export function getNewsArticles(language: AppLanguage): NewsArticle[] {
  const adminArticles = getAdminNewsArticles(language)
  const adminSlugs = new Set(adminArticles.map((article) => article.slug))
  const hiddenSlugs = new Set(getHiddenAdminNewsSlugs())
  return [
    ...adminArticles,
    ...newsArticles[language].filter((article) => !adminSlugs.has(article.slug) && !hiddenSlugs.has(article.slug)),
  ]
}
