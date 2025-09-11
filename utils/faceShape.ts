type Point = { x: number; y: number };

function distance(p1: Point | undefined, p2: Point | undefined): number {
  if (!p1 || !p2 || p1.x === undefined || p1.y === undefined || p2.x === undefined || p2.y === undefined) {
    return 0;
  }
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

export function detectFaceShape(landmarks: any): string {
  if (!landmarks) {
    console.log('No landmark data provided');
    return "Unknown";
  }

  console.log('Using Rosto.io landmarks for face shape detection');
  console.log('Available landmark keys:', Object.keys(landmarks));

  // Rosto.io landmark structure (adjust based on actual API response)
  // Common landmark names across APIs
  const jawLeft = landmarks.contour_left1 || landmarks.left_jaw || landmarks.jaw_left;
  const jawRight = landmarks.contour_right1 || landmarks.right_jaw || landmarks.jaw_right;
  const chin = landmarks.contour_chin || landmarks.chin;
  const leftCheek = landmarks.contour_left6 || landmarks.left_cheek || landmarks.cheek_left;
  const rightCheek = landmarks.contour_right6 || landmarks.right_cheek || landmarks.cheek_right;
  const leftTemple = landmarks.contour_left9 || landmarks.left_temple || landmarks.temple_left;
  const rightTemple = landmarks.contour_right9 || landmarks.right_temple || landmarks.temple_right;
  const leftEye = landmarks.left_eye_center || landmarks.left_eye || landmarks.eye_left;
  const rightEye = landmarks.right_eye_center || landmarks.right_eye || landmarks.eye_right;
  const noseTip = landmarks.nose_tip || landmarks.nose;

  // Check if we have the minimum required points
  const requiredPoints = [jawLeft, jawRight, chin, leftCheek, rightCheek, leftTemple, rightTemple, leftEye, rightEye, noseTip];
  const missingPoints = requiredPoints.filter(point => !point || point.x === undefined || point.y === undefined);
  
  if (missingPoints.length > 0) {
    console.log('Missing required landmark points:', missingPoints.length);
    console.log('Available points:', {
      jawLeft: !!jawLeft,
      jawRight: !!jawRight,
      chin: !!chin,
      leftCheek: !!leftCheek,
      rightCheek: !!rightCheek,
      leftTemple: !!leftTemple,
      rightTemple: !!rightTemple,
      leftEye: !!leftEye,
      rightEye: !!rightEye,
      noseTip: !!noseTip
    });
    return "Unknown";
  }

  // Calculate face measurements using landmarks
  const faceLength = distance(noseTip, chin) * 2.2; // Full face length from nose to chin
  const jawWidth = distance(jawLeft, jawRight);
  const cheekboneWidth = distance(leftCheek, rightCheek);
  const eyeDistance = distance(leftEye, rightEye);
  
  // Use eye distance as a reference for forehead width (more realistic)
  const foreheadWidth = eyeDistance * 1.4; // Forehead is typically 1.4x eye distance
  const faceWidth = Math.max(jawWidth, cheekboneWidth, foreheadWidth); // Use the widest part as face width
  
  // Calculate ratios
  const lengthToWidthRatio = faceLength / faceWidth;
  const cheekboneToJawRatio = cheekboneWidth / jawWidth;
  const foreheadToJawRatio = foreheadWidth / jawWidth;
  const cheekboneToForeheadRatio = cheekboneWidth / foreheadWidth;

  console.log('Landmark-based measurements:', {
    faceLength: Math.round(faceLength),
    jawWidth: Math.round(jawWidth),
    cheekboneWidth: Math.round(cheekboneWidth),
    foreheadWidth: Math.round(foreheadWidth),
    eyeDistance: Math.round(eyeDistance)
  });

  console.log('Face ratios:', {
    lengthToWidthRatio: lengthToWidthRatio.toFixed(3),
    cheekboneToJawRatio: cheekboneToJawRatio.toFixed(3),
    foreheadToJawRatio: foreheadToJawRatio.toFixed(3),
    cheekboneToForeheadRatio: cheekboneToForeheadRatio.toFixed(3)
  });

  // Classification rules based on landmark measurements
  console.log('Classification checks:', {
    isSquare: lengthToWidthRatio >= 0.9 && lengthToWidthRatio <= 1.1 && Math.abs(cheekboneWidth - jawWidth) < 50,
    isRound: lengthToWidthRatio < 1.0 && Math.abs(cheekboneWidth - foreheadWidth) < 30,
    isOval: lengthToWidthRatio > 1.2 && cheekboneWidth > jawWidth,
    isHeart: lengthToWidthRatio > 1.0 && foreheadToJawRatio > 1.0 && chin.y > (jawLeft.y + jawRight.y) / 2,
    isDiamond: lengthToWidthRatio >= 0.8 && lengthToWidthRatio <= 1.2 && 
               cheekboneToJawRatio > 1.1 && cheekboneToForeheadRatio > 1.0
  });

  // Heart: Wide forehead, narrow jaw, pointed chin
  if (lengthToWidthRatio > 1.0 && foreheadToJawRatio > 1.0 && chin.y > (jawLeft.y + jawRight.y) / 2) {
    console.log('Classified as: Heart');
    return "Heart";
  }
  
  // Diamond: Wide cheekbones, narrow forehead and jaw
  if (lengthToWidthRatio >= 0.8 && lengthToWidthRatio <= 1.2 && 
      cheekboneToJawRatio > 1.1 && cheekboneToForeheadRatio > 1.0) {
    console.log('Classified as: Diamond');
    return "Diamond";
  }
  
  // Round: Short face, similar cheekbone and forehead width
  if (lengthToWidthRatio < 1.0 && Math.abs(cheekboneWidth - foreheadWidth) < 30) {
    console.log('Classified as: Round');
    return "Round";
  }
  
  // Square: Face length ≈ width, similar jaw and cheekbone width
  if (lengthToWidthRatio >= 0.9 && lengthToWidthRatio <= 1.1 && Math.abs(cheekboneWidth - jawWidth) < 50) {
    console.log('Classified as: Square');
    return "Square";
  }
  
  // Oval: Longer face, wider cheekbones than jaw
  if (lengthToWidthRatio > 1.2 && cheekboneWidth > jawWidth) {
    console.log('Classified as: Oval');
    return "Oval";
  }

  // Rectangle: Longer face but not as long as oval
  if (lengthToWidthRatio > 1.0 && lengthToWidthRatio <= 1.2) {
    console.log('Classified as: Rectangle');
    return "Rectangle";
  }

  console.log('Classified as: Unknown (no rules matched)');
  return "Unknown";
}
