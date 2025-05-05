export const products = [
  {
    name: "Hobby",
    description: "For personal projects and small-scale applications.",
    price: "Free",
    color: "bg-blue-500",
    priceNote: "up to 3 users",
    purchaseButtonText: "Start deploying",
    items: [
      {
        text: "Deploy full-stack apps in minutes",
      },
      {
        text: "Fully-managed datastores",
      },
      {
        text: "Custom domains",
      },
      {
        text: "Global CDN & regional hosting",
      },
      {
        text: "Get security out of the box",
      },
      {
        text: "Email support",
      },
    ],
  },
  {
    name: "Professional",
    description: "For teams building production applications.",
    price: "$19",
    // color: "bg-lime-600",
    priceNote: "per user/month plus compute costs*",
    purchaseButtonText: "Select plan",
    everythingFrom: "Hobby",
    items: [
      {
        text: "10 team members included",
        price: "Then $20 per member",
      },
      {
        text: "500 GB of bandwidth included",
      },
      {
        text: "Unlimited projects & environments",
      },
      {
        text: "Horizontal autoscaling",
      },
      {
        text: "Test with preview environments",
      },
      {
        text: "Isolated environments",
      },
    ],
  },
  {
    name: "Organization",
    recommended: "Best Value",
    description: "For teams with higher traffic demands and compliance needs.",
    price: "$29",
    // color: "bg-yellow-500",
    priceNote: "per user/month plus compute costs*",
    purchaseButtonText: "Select plan",
    everythingFrom: "Professional",
    items: [
      {
        text: "1 TB of bandwidth included",
        price: "Then $0.10/GB",
      },
      {
        text: "Unlimited team members",
      },
      {
        text: "Audit logs",
      },
      {
        text: "SOC 2 Type II certificate",
      },
      {
        text: "ISO 27001 certificate",
      },
    ],
  },
  {
    name: "Enterprise",
    description: "For mission critical applications with complex needs.",
    price: "Custom",
    // color: "bg-red-500",
    priceNote: "Custom pricing for your enterprise",
    purchaseButtonText: "Get in touch",
    everythingFrom: "Organization",
    items: [
      {
        text: "Centralized team management",
      },
      {
        text: "Guest users",
      },
      {
        text: "SAML SSO & SCIM",
      },
      {
        text: "Guaranteed uptime",
      },
      {
        text: "Premium support",
      },
      {
        text: "Customer success",
      },
    ],
  },
];
