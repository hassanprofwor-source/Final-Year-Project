const UPLOAD_SEGMENT = "/image/upload/";

export const optimizedImageUrl = (url, width = 480) => {
  if (!url || typeof url !== "string") return url || "";
  const index = url.indexOf(UPLOAD_SEGMENT);
  if (index === -1) return url;

  const rest = url.slice(index + UPLOAD_SEGMENT.length);
  if (rest.includes("f_auto") || rest.includes("w_")) return url;

  const transform = `f_auto,q_auto:eco,c_fill,g_auto,w_${width}`;
  return `${url.slice(0, index + UPLOAD_SEGMENT.length)}${transform}/${rest}`;
};
