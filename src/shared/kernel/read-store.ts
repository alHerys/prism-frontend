export interface ReadStore<T> {
  getSnapshot: () => T;
  subscribe: (listener: () => void) => () => void;
}
