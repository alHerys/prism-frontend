export interface BinarySource {
  name: string;
  size: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
}
export type Delay = (milliseconds: number) => Promise<void>;
