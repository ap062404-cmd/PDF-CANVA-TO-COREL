import {
  PDFDocument,
  rgb,
  StandardFonts,
  pushGraphicsState,
  popGraphicsState,
  setFillingColor,
  setStrokingColor,
  setLineWidth,
  setLineCap,
  setLineJoin,
  LineCapStyle,
  LineJoinStyle,
  moveTo,
  lineTo,
  appendBezierCurve,
  closePath,
  fill,
  stroke,
  fillAndStroke,
} from 'pdf-lib';

/**
 * Draws a mathematically exact Bezier circle (ISO 32000-1 canonical path).
 * Free of pdf-lib's misplaced Q bugs: never turns into a box in CorelDraw!
 */
function drawPureCircle(
  page: any,
  cx: number,
  cy: number,
  r: number,
  fillColor?: any,
  strokeColor?: any,
  strokeW: number = 0
): void {
  const k = r * 0.5522847498;
  const ops: any[] = [pushGraphicsState()];

  if (fillColor) {
    ops.push(setFillingColor(fillColor));
  }
  if (strokeColor && strokeW > 0) {
    ops.push(
      setStrokingColor(strokeColor),
      setLineWidth(strokeW),
      setLineCap(LineCapStyle.Round),
      setLineJoin(LineJoinStyle.Round)
    );
  }

  ops.push(
    moveTo(cx, cy + r),
    appendBezierCurve(cx + k, cy + r, cx + r, cy + k, cx + r, cy),
    appendBezierCurve(cx + r, cy - k, cx + k, cy - r, cx, cy - r),
    appendBezierCurve(cx - k, cy - r, cx - r, cy - k, cx - r, cy),
    appendBezierCurve(cx - r, cy + k, cx - k, cy + r, cx, cy + r),
    closePath()
  );

  if (fillColor && strokeColor && strokeW > 0) {
    ops.push(fillAndStroke());
  } else if (fillColor) {
    ops.push(fill());
  } else if (strokeColor && strokeW > 0) {
    ops.push(stroke());
  }

  ops.push(popGraphicsState());
  page.pushOperators(...ops);
}

/**
 * Draws an authentic Canva Directional Exit Arrow (Unified Vector Polygon).
 * Uses absolute world coordinates pointing 45° down-right: NO transformation matrices (cm),
 * guaranteeing CorelDraw imports it as a native 7-node vector arrow with NO square boxes!
 */
function drawDirectionalExitArrow(
  page: any,
  cx: number,
  cy: number,
  arrowColor: any
): void {
  // Arrow geometry:
  // Shaft half-width = 9pt (18pt thick shaft), length = 48pt
  // Arrowhead barb width = 44pt, length = 28pt
  // Rotated by -45° and translated to (cx, cy):
  const localPts: [number, number][] = [
    [-24, -9],
    [6, -9],
    [6, -22],
    [34, 0],
    [6, 22],
    [6, 9],
    [-24, 9],
  ];

  const a = -Math.PI / 4;
  const cos = Math.cos(a);
  const sin = Math.sin(a);

  const worldPts = localPts.map(([x, y]) => {
    const rx = x * cos - y * sin;
    const ry = x * sin + y * cos;
    return [parseFloat((cx + rx).toFixed(2)), parseFloat((cy + ry).toFixed(2))] as [number, number];
  });

  const ops: any[] = [
    pushGraphicsState(),
    setFillingColor(arrowColor),
    moveTo(worldPts[0][0], worldPts[0][1]),
  ];

  for (let i = 1; i < worldPts.length; i++) {
    ops.push(lineTo(worldPts[i][0], worldPts[i][1]));
  }

  ops.push(closePath(), fill(), popGraphicsState());
  page.pushOperators(...ops);
}

/**
 * Draws a continuous closed rounded rectangle border with round caps and joins.
 * Guaranteed never to clip at corners or bottom in CorelDraw!
 */
function drawContinuousRoundedBorder(
  page: any,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  strokeColor: any,
  strokeW: number
): void {
  const k = r * 0.5522847498;
  page.pushOperators(
    pushGraphicsState(),
    setStrokingColor(strokeColor),
    setLineWidth(strokeW),
    setLineCap(LineCapStyle.Round),
    setLineJoin(LineJoinStyle.Round),
    moveTo(x + r, y),
    lineTo(x + w - r, y),
    appendBezierCurve(x + w - r + k, y, x + w, y + r - k, x + w, y + r),
    lineTo(x + w, y + h - r),
    appendBezierCurve(x + w, y + h - r + k, x + w - r + k, y + h, x + w - r, y + h),
    lineTo(x + r, y + h),
    appendBezierCurve(x + r - k, y + h, x, y + h - r + k, x, y + h - r),
    lineTo(x, y + r),
    appendBezierCurve(x, y + r - k, x + r - k, y, x + r, y),
    closePath(),
    stroke(),
    popGraphicsState()
  );
}

/**
 * Draws a clean stroked vector line with explicit round caps and round joins.
 */
function drawSmoothLine(
  page: any,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  thickness: number,
  strokeColor: any
): void {
  page.pushOperators(
    pushGraphicsState(),
    setStrokingColor(strokeColor),
    setLineWidth(thickness),
    setLineCap(LineCapStyle.Round),
    setLineJoin(LineJoinStyle.Round),
    moveTo(x1, y1),
    lineTo(x2, y2),
    stroke(),
    popGraphicsState()
  );
}

/**
 * Generates an authentic Canva-like sample PDF containing the exact signage layout:
 * - 2 Blue Signboards: "KELUAR" (with direction arrow) & "PARKIR DISABILITAS" (with wheelchair symbol)
 * - Inner white rounded borders (continuous closed path with round corners)
 * - Authentic vector exit arrow (clean shaft + arrowhead vector shape)
 * - White circle with preserved Bezier curve
 * - Horizontal white divider lines with explicit stroke parameters
 * - Canva metadata structure
 */
export async function generateSampleCanvaPdf(): Promise<{ buffer: ArrayBuffer; fileName: string }> {
  const pdfDoc = await PDFDocument.create();
  
  // Set authentic Canva metadata
  pdfDoc.setTitle('Rambu Signboard Keluar & Parkir Disabilitas - Canva Design');
  pdfDoc.setAuthor('Canva Designer');
  pdfDoc.setProducer('Canva (canva.com)');
  pdfDoc.setCreator('Canva PDF Exporter Engine');
  pdfDoc.setCreationDate(new Date());

  // A4 Landscape: 841.89 x 595.28 points
  const page = pdfDoc.addPage([841.89, 595.28]);
  const { width, height } = page.getSize();

  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // White canvas background
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: rgb(0.98, 0.98, 0.99),
  });

  const blueColor = rgb(0.0, 0.1, 0.82); // Vibrant blue
  const whiteColor = rgb(1, 1, 1);

  // Sign dimensions: 2 signs side-by-side
  const signW = 340;
  const signH = 500;
  const signY = (height - signH) / 2; // ~47.6pt from bottom

  // ==========================================
  // SIGN 1: "KELUAR" (Left Sign)
  // ==========================================
  const sign1X = 55;

  // 1. Blue base rectangle
  page.drawRectangle({
    x: sign1X,
    y: signY,
    width: signW,
    height: signH,
    color: blueColor,
  });

  // 2. White rounded inner border (continuous closed vector path with rounded corners)
  const borderInset = 12;
  const borderX = sign1X + borderInset;
  const borderY = signY + borderInset;
  const borderW = signW - borderInset * 2;
  const borderH = signH - borderInset * 2;

  drawContinuousRoundedBorder(page, borderX, borderY, borderW, borderH, 16, whiteColor, 3.5);

  // 3. Large White Circle for Arrow (Canonical Bezier Circle: Never converts to box!)
  const circleX = sign1X + signW / 2;
  const circleY = signY + signH - 170;
  drawPureCircle(page, circleX, circleY, 55, whiteColor);

  // 4. Directional Exit Arrow (Unified 7-Node Vector Polygon in Absolute Coordinates)
  drawDirectionalExitArrow(page, circleX, circleY, blueColor);

  // 5. Horizontal Divider Line above "KELUAR" (Round caps and joins)
  const dividerY = signY + 125;
  drawSmoothLine(page, borderX, dividerY, borderX + borderW, dividerY, 3.5, whiteColor);

  // 6. Bold Text: "KELUAR"
  page.drawText('KELUAR', {
    x: sign1X + 35,
    y: signY + 45,
    size: 64,
    font: helveticaBold,
    color: whiteColor,
  });

  // ==========================================
  // SIGN 2: "PARKIR DISABILITAS" (Right Sign)
  // ==========================================
  const sign2X = sign1X + signW + 50; // 445

  // 1. Blue base rectangle
  page.drawRectangle({
    x: sign2X,
    y: signY,
    width: signW,
    height: signH,
    color: blueColor,
  });

  // 2. White rounded inner border (continuous closed vector path with rounded corners)
  const border2X = sign2X + borderInset;
  const border2Y = signY + borderInset;

  drawContinuousRoundedBorder(page, border2X, border2Y, borderW, borderH, 16, whiteColor, 3.5);

  // 3. Large "P" Icon
  page.drawText('P', {
    x: sign2X + 35,
    y: signY + signH - 145,
    size: 115,
    font: helveticaBold,
    color: whiteColor,
  });

  // 4. Wheelchair Symbol Icon (White circle head + seat + wheel)
  const wcX = sign2X + 215;
  const wcY = signY + signH - 180;
  // Head (Circle with radius 11)
  drawPureCircle(page, wcX, wcY + 50, 11, whiteColor);
  // Body torso
  drawSmoothLine(page, wcX - 5, wcY + 25, wcX + 5, wcY - 25, 14, whiteColor);
  // Arm rest
  drawSmoothLine(page, wcX + 5, wcY - 5, wcX + 35, wcY - 5, 14, whiteColor);
  // Wheel circle (Stroked circle with 12pt stroke)
  drawPureCircle(page, wcX, wcY - 35, 26, undefined, whiteColor, 12);
  // Legs
  drawSmoothLine(page, wcX + 10, wcY - 25, wcX + 35, wcY - 25, 14, whiteColor);
  drawSmoothLine(page, wcX + 35, wcY - 25, wcX + 45, wcY - 60, 14, whiteColor);

  // 5. Horizontal Divider Line above "PARKIR"
  drawSmoothLine(page, border2X, dividerY, border2X + borderW, dividerY, 3.5, whiteColor);

  // 6. Bold Text: "PARKIR" & "DISABILITAS"
  page.drawText('PARKIR', {
    x: sign2X + 85,
    y: signY + 75,
    size: 34,
    font: helveticaBold,
    color: whiteColor,
  });

  page.drawText('DISABILITAS', {
    x: sign2X + 40,
    y: signY + 30,
    size: 34,
    font: helveticaBold,
    color: whiteColor,
  });

  const pdfBytes = await pdfDoc.save();
  return {
    buffer: pdfBytes.buffer as ArrayBuffer,
    fileName: 'Rambu_Keluar_dan_Parkir_Disabilitas_Canva.pdf',
  };
}
