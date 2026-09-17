const LOCAL_API_RE = /localhost|127\.0\.0\.1|192\.168\.|10\.|172\.(1[6-9]|2\d|3[0-1])\./;

export const resolveApiUrl = (configured?: string, metroHostUri?: string) => {
  const metroHost = metroHostUri?.split(":")[0];
  const metroIsLan =
    !!metroHost && metroHost !== "localhost" && metroHost !== "127.0.0.1";
  const configuredIsLan = !!configured && LOCAL_API_RE.test(configured);
  if (metroIsLan && (!configured || configuredIsLan)) {
    return `http://${metroHost}:5000`;
  }
  return configured;
};
