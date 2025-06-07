export interface ProductInterface {
  id: string;
  title: string;
  description: string;
  price: number;
  condition: string;
  category: string;
  metadata: Record<string, any>;
  images: string[];
}
