export interface Item {
  name: string;
  price: number | string;
  desc: string | null;
  category: string | null;
  images: string[];
  sold?: boolean;
}
