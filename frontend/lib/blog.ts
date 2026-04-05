export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  publishedAt: string;
  readTime: string;
  content: string[];
};

export const blogPosts: BlogPost[] = [
  {
    slug: "how-to-buy-a-used-car-in-nigeria",
    title: "How to Buy a Reliable Used Car in Nigeria",
    excerpt:
      "A practical checklist for inspecting history, mileage, engine health, and paperwork before paying.",
    category: "Buying Guide",
    publishedAt: "2026-04-01",
    readTime: "6 min read",
    content: [
      "Start by confirming the vehicle papers: customs clearance, registration, and transfer documentation.",
      "Inspect service history and compare stated mileage with wear on interior controls.",
      "Test drive in city and highway conditions. Listen for suspension noise and monitor transmission shifts.",
      "Use an independent mechanic for a pre-purchase inspection before final payment.",
    ],
  },
  {
    slug: "car-maintenance-calendar",
    title: "Simple Car Maintenance Calendar for Busy Owners",
    excerpt:
      "Monthly and quarterly checks that keep your car healthy and avoid expensive surprises.",
    category: "Maintenance",
    publishedAt: "2026-03-22",
    readTime: "4 min read",
    content: [
      "Every month: check tire pressure, coolant level, engine oil level, and lights.",
      "Every 3 months: rotate tires and inspect brake pads for wear.",
      "Every 6 months: change oil and filter if due by mileage or age.",
      "Every year: complete full service, battery health test, and alignment check.",
    ],
  },
  {
    slug: "financing-basics-for-first-time-buyers",
    title: "Financing Basics for First-Time Car Buyers",
    excerpt:
      "Understand deposit size, tenure, and interest so your monthly payments stay affordable.",
    category: "Finance",
    publishedAt: "2026-03-15",
    readTime: "5 min read",
    content: [
      "Choose a monthly payment ceiling first, then work backward to your budget.",
      "A higher deposit reduces financed principal and total interest paid.",
      "Shorter tenure typically lowers total interest but increases monthly payment.",
      "Always compare total repayment, not just advertised monthly installment.",
    ],
  },
];

export function getBlogPostBySlug(slug: string): BlogPost | null {
  return blogPosts.find((post) => post.slug === slug) || null;
}
