import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TJDiscipline",
    short_name: "TJDiscipline",
    description: "Điểm danh dậy sớm mỗi ngày để nuôi lớn thú cưng và cây cảnh đáng yêu của bạn.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f0c16",
    theme_color: "#0f0c16",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
