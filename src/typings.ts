export type Order = SingleTokenOrder | MultiTokenOrder;

export interface SingleTokenOrder {
  sellerAddress: string;
  tokenId: string;
  type: 'single';
  buyerAddress: string;
  valueGwei: string;
  form: 'accept' | 'buy';
  platform?: 'OpenSea';
}

export interface MultiTokenOrder {
  buyerAddress: string;
  sellerAddress: string[];
  tokenId: string[];
  type: 'multiple';
  valueGwei: string;
  form: 'buy';
  platform?: 'OpenSea';
}
