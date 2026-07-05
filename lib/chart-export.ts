/**
 * Chart export: rasterizes the first SVG inside a container to a PNG
 * download, on the current theme's card surface so dark exports stay dark.
 */
export async function exportChartPng(
  container: HTMLElement,
  fileName: string
): Promise<boolean> {
  const svg = container.querySelector("svg");
  if (!svg) return false;

  const clone = svg.cloneNode(true) as SVGSVGElement;
  const { width, height } = svg.getBoundingClientRect();
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));

  // Inline currentColor/CSS-variable fills so the standalone SVG keeps them.
  const styled = new XMLSerializer().serializeToString(inlineStyles(svg, clone));
  const blob = new Blob([styled], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("SVG rasterization failed"));
      image.src = url;
    });

    const scale = 2; // crisp exports
    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return false;

    const surface = getComputedStyle(document.documentElement)
      .getPropertyValue("--card")
      .trim();
    ctx.fillStyle = surface || "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    const link = document.createElement("a");
    link.download = `${fileName}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    return true;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Copy computed fill/stroke/font styles from the live SVG to the clone. */
function inlineStyles(source: SVGSVGElement, clone: SVGSVGElement): SVGSVGElement {
  const sourceNodes = source.querySelectorAll<SVGElement>("*");
  const cloneNodes = clone.querySelectorAll<SVGElement>("*");
  const props = ["fill", "stroke", "stroke-width", "font-size", "font-family", "opacity"];

  sourceNodes.forEach((node, index) => {
    const computed = getComputedStyle(node);
    const target = cloneNodes[index];
    if (!target) return;
    for (const prop of props) {
      const value = computed.getPropertyValue(prop);
      if (value) target.setAttribute(prop, value);
    }
  });
  return clone;
}
