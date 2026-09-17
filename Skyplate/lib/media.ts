const UPLOAD_SEGMENT = "/image/upload/";

const withUnsplashCrop = (url: string, width: number) => {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("auto", "format");
    parsed.searchParams.set("fit", "crop");
    parsed.searchParams.set("w", String(width));
    parsed.searchParams.set("h", String(width));
    parsed.searchParams.set("q", "80");
    return parsed.toString();
  } catch {
    return url;
  }
};

export const optimizedImageUrl = (url?: string | null, width = 480) => {
  if (!url || url === "undefined") return "";

  const index = url.indexOf(UPLOAD_SEGMENT);
  if (index !== -1) {
    const rest = url.slice(index + UPLOAD_SEGMENT.length);
    if (rest.includes("f_auto") || rest.includes("w_")) return url;
    const transform = `f_auto,q_auto:eco,c_fill,g_auto,w_${width}`;
    return `${url.slice(0, index + UPLOAD_SEGMENT.length)}${transform}/${rest}`;
  }

  if (/images\.unsplash\.com/i.test(url)) {
    return withUnsplashCrop(url, width);
  }

  return url;
};
