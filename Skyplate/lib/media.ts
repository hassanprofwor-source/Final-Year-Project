const UPLOAD_SEGMENT = "/image/upload/";

export const optimizedImageUrl = (url?: string | null, width = 480) => {
  if (!url) return "";
  const index = url.indexOf(UPLOAD_SEGMENT);
  if (index === -1) return url;

  const rest = url.slice(index + UPLOAD_SEGMENT.length);
  if (rest.includes("f_auto") || rest.includes("w_")) return url;

  const transform = `f_auto,q_auto:eco,c_fill,g_auto,w_${width}`;
  return `${url.slice(0, index + UPLOAD_SEGMENT.length)}${transform}/${rest}`;
};
