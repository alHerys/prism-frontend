export interface Asset { bytes: Buffer; mime: string; }
export interface Bundle { catalog: unknown; files: { id: string; base64: string }[]; }
export function digest(bytes: Uint8Array): string;
export function packageAssets(bundle: Bundle): Map<string, Asset>;
export function localPackage(data: string): Bundle;
export function remotePackage(url: string, expectedHash?: string): Promise<Bundle>;
