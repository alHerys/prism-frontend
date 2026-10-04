export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Tindakan belum berhasil. Coba kembali.";
