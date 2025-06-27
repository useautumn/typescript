export interface ProductDetails {
  id?: string;
  name?: string;
  description?: string;
  buttonText?: string;
  buttonUrl?: string;
  recommendText?: string;
  everythingFrom?: string;

  price?: {
    primaryText: string;
    secondaryText?: string;
  };

  items?: {
    featureId?: string;
    primaryText?: string;
    secondaryText?: string;
  }[];
}
