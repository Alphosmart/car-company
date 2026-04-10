export type MegaMenuItem = {
  title: string;
  description: string;
  href: string;
};

export type MegaMenuGroup = {
  id: "vehicles" | "ownership-tools" | "network" | "sell-swap";
  label: string;
  tagline: string;
  items: MegaMenuItem[];
};

export const megaMenuGroups: MegaMenuGroup[] = [
  {
    id: "vehicles",
    label: "Vehicles",
    tagline: "Luxury Cars, Power Bikes and Executive Transport",
    items: [
      {
        title: "Browse All Vehicles",
        description: "Complete inventory at your fingertips",
        href: "/cars",
      },
      {
        title: "Executive Class Cars",
        description: "S-Class, 7 Series, A8 and premium sedans",
        href: "/cars?segment=executive",
      },
      {
        title: "Sport and Performance",
        description: "AMG, M-Series, Porsche and track-ready options",
        href: "/cars?segment=sport-performance",
      },
      {
        title: "Luxury SUVs",
        description: "G-Wagon, Range Rover, Cayenne and family comfort",
        href: "/cars?segment=luxury-suv",
      },
      {
        title: "Electric Vehicles",
        description: "Tesla, Cybertruck and modern EV options",
        href: "/cars?fuelType=electric",
      },
      {
        title: "Daily Luxury",
        description: "Reliable luxury for city and highway driving",
        href: "/cars?segment=daily-luxury",
      },
      {
        title: "Power Bikes",
        description: "BMW, Kawasaki, Ducati and high-performance bikes",
        href: "/cars?vehicleType=bike",
      },
      {
        title: "Vans and Buses",
        description: "Executive transport and cargo-ready options",
        href: "/cars?vehicleType=van-bus",
      },
    ],
  },
  {
    id: "ownership-tools",
    label: "Ownership Tools",
    tagline: "Smart Tools to Buy, Finance and Verify Your Car",
    items: [
      {
        title: "AI Car Match",
        description: "Answer questions to get recommendations",
        href: "/tools/ai-car-match",
      },
      {
        title: "Loan Calculator",
        description: "Estimate monthly vehicle financing",
        href: "/tools/loan-calculator",
      },
      {
        title: "Compare Vehicles",
        description: "Side-by-side specs and feature comparison",
        href: "/tools/compare",
      },
      {
        title: "Value Estimator",
        description: "Estimate your trade-in value instantly",
        href: "/tools/value-estimator",
      },
      {
        title: "Car History Check",
        description: "Get verification and ownership records",
        href: "/tools/history-check",
      },
    ],
  },
  {
    id: "network",
    label: "Sarkin Mota Network",
    tagline: "Experts, Partners and an Automotive Community",
    items: [
      {
        title: "Car Concierge",
        description: "Personalized buying and sourcing assistance",
        href: "/network/concierge",
      },
      {
        title: "Auto Experts",
        description: "Certified inspections and advisory support",
        href: "/network/experts",
      },
      {
        title: "Car Clubs",
        description: "Join enthusiasts and member events",
        href: "/network/clubs",
      },
      {
        title: "Verified Customs",
        description: "Premium customization and restoration services",
        href: "/network/customs",
      },
      {
        title: "Verified Technicians",
        description: "Certified mechanics and service professionals",
        href: "/network/technicians",
      },
      {
        title: "Partner with Us",
        description: "Dealers, vendors and inspection partners",
        href: "/network/partner-with-us",
      },
    ],
  },
  {
    id: "sell-swap",
    label: "Sell or Swap",
    tagline: "Sell Faster, Swap Smarter and Earn the Best Value",
    items: [
      {
        title: "Sell Your Vehicle",
        description: "List your car or bike in minutes",
        href: "/sell/sell-your-vehicle",
      },
      {
        title: "Trade-In / Swap",
        description: "Upgrade by exchanging your current vehicle",
        href: "/sell/trade-in-swap",
      },
      {
        title: "Instant Valuation",
        description: "Get a quick market estimate",
        href: "/sell/instant-valuation",
      },
      {
        title: "Seller Dashboard",
        description: "Track listings, leads and offer status",
        href: "/sell/dashboard",
      },
    ],
  },
];

export const singleNavLinks = [
  { href: "/blog", label: "Blog" },
  { href: "/news-events", label: "News and Events" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact Us" },
  { href: "/login", label: "Login" },
] as const;

export const toolsPageContent: Record<
  string,
  { title: string; description: string }
> = {
  "ai-car-match": {
    title: "AI Car Match",
    description:
      "Tell us your budget, style and usage to receive personalized vehicle suggestions.",
  },
  "loan-calculator": {
    title: "Loan Calculator",
    description:
      "Estimate repayment plans based on down payment, tenure and interest rate.",
  },
  compare: {
    title: "Compare Vehicles",
    description:
      "Select multiple vehicles and evaluate performance, comfort, cost and reliability side by side.",
  },
  "value-estimator": {
    title: "Value Estimator",
    description:
      "Get a fast estimate of your current vehicle value using market trends and condition.",
  },
  "history-check": {
    title: "Car History Check",
    description:
      "Run VIN or chassis verification to uncover ownership, incidents and service records.",
  },
};

export const networkPageContent: Record<
  string,
  { title: string; description: string }
> = {
  concierge: {
    title: "Car Concierge",
    description:
      "Get one-on-one support for sourcing, inspection and purchase decisions.",
  },
  experts: {
    title: "Auto Experts",
    description:
      "Work with experienced specialists for technical advice and pre-purchase checks.",
  },
  clubs: {
    title: "Car Clubs",
    description:
      "Join community drives, private meetups and owner networking events.",
  },
  customs: {
    title: "Verified Customs",
    description:
      "Discover trusted workshops for premium upgrades and transformations.",
  },
  technicians: {
    title: "Verified Technicians",
    description:
      "Book certified technicians for maintenance and diagnostics.",
  },
  "partner-with-us": {
    title: "Partner with Us",
    description:
      "Apply to join the Sarkin Mota network as a trusted service partner.",
  },
};

export const sellPageContent: Record<
  string,
  { title: string; description: string }
> = {
  "sell-your-vehicle": {
    title: "Sell Your Vehicle",
    description:
      "Create a listing and connect with verified buyers across the network.",
  },
  "trade-in-swap": {
    title: "Trade-In / Swap",
    description:
      "Exchange your current vehicle for a better match with transparent valuation support.",
  },
  "instant-valuation": {
    title: "Instant Valuation",
    description:
      "See an estimated selling range in minutes before listing.",
  },
  dashboard: {
    title: "Seller Dashboard",
    description:
      "Track inquiries, offer updates and listing performance in one place.",
  },
};
