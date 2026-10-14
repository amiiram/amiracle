/**
 * Media kinds supported by `ProjectMedia`. Pure helpers only — no JSX — so
 * both server and client modules can share the option list and the coercion
 * without pulling in React.
 */
export type MediaTypeOption = "image" | "video" | "embed";

export const mediaTypeOptions: ReadonlyArray<{
  value: MediaTypeOption;
  label: string;
}> = [
  { value: "image", label: "Image" },
  { value: "video", label: "Video" },
  { value: "embed", label: "Embed" },
];

/** Coerces stored values to a known option, defaulting to images. */
export function toMediaType(value: string): MediaTypeOption {
  return mediaTypeOptions.some((option) => option.value === value)
    ? (value as MediaTypeOption)
    : "image";
}
