# Admin Dashboard Settings Reference

This file lists everything that is expected under Admin Settings (`/admin/settings`).

## 1. Loan Defaults (`settings.finance`)
- `defaultPrice` (number)
- `defaultDownPayment` (number)
- `defaultMonths` (number)
- `defaultAnnualRate` (number)
- `disclaimer` (string)

## 2. Contact Details (`settings.contact`)
- `phone` (string)
- `email` (string)
- `address` (string)
- `hours` (string)
- `whatsappNumber` (string)
- `whatsappMessage` (string)
- `mapEmbedUrl` (string)

## 3. Homepage Trust Cards (`settings.homepage.trustCards`)
Expected as an array of objects with:
- `label` (string)
- `value` (string)

Default set in app is 4 cards:
- Years in Business
- Cars Sold
- Verified Listings
- After-Sales Support

## 4. Testimonials (`settings.homepage.testimonials`)
Expected as an array of objects with:
- `name` (string)
- `text` (string)

Default set in app is 3 testimonials.

## 5. Social Links (`settings.social`)
- `x` (string URL)
- `youtube` (string URL)
- `facebook` (string URL)
- `tiktok` (string URL)
- `instagram` (string URL)

## Full Shape (Type Reference)

```ts
settings: {
  finance: {
    defaultPrice: number;
    defaultDownPayment: number;
    defaultMonths: number;
    defaultAnnualRate: number;
    disclaimer: string;
  };
  contact: {
    phone: string;
    email: string;
    address: string;
    hours: string;
    whatsappNumber: string;
    whatsappMessage: string;
    mapEmbedUrl: string;
  };
  homepage: {
    trustCards: Array<{
      label: string;
      value: string;
    }>;
    testimonials: Array<{
      name: string;
      text: string;
    }>;
  };
  social: {
    x: string;
    youtube: string;
    facebook: string;
    tiktok: string;
    instagram: string;
  };
}
```

## Notes
- The admin page currently edits existing trust cards and testimonials, but does not provide add/remove controls.
- Backend and frontend both normalize missing values back to defaults.
