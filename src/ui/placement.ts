export type Placement =
  | "top" | "topLeft" | "topRight"
  | "bottom" | "bottomLeft" | "bottomRight"
  | "left" | "leftTop" | "leftBottom"
  | "right" | "rightTop" | "rightBottom";

export function resolvePlacement(placement: Placement = "top") {
  const side = placement.startsWith("top")
    ? "top"
    : placement.startsWith("bottom")
    ? "bottom"
    : placement.startsWith("left")
    ? "left"
    : "right";
  const align = /Left$|Top$/.test(placement) ? "start" : /Right$|Bottom$/.test(placement) ? "end" : "center";
  return { side, align } as const;
}

