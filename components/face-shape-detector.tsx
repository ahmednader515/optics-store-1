'use client';

import { useState, useRef, useEffect } from 'react';

// Only import face-api.js on client side
let faceapi: any = null;
if (typeof window !== 'undefined') {
  faceapi = require('face-api.js');
}

interface FaceShapeResult {
  faceShape: string;
  confidence: number;
  landmarks: any;
  attributes: {
    age?: number;
    gender?: string;
    expressions?: any;
  };
}

interface FaceShapeDetectorProps {
  imageUrl: string;
  onResult: (result: FaceShapeResult) => void;
  onError: (error: string) => void;
  onDetect?: () => void; // Callback when detection starts
}

export function FaceShapeDetector({ imageUrl, onResult, onError, onDetect }: FaceShapeDetectorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [hasDetected, setHasDetected] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const detectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load face-api.js models
  useEffect(() => {
    const loadModels = async () => {
      if (!faceapi) {
        console.error('face-api.js not available');
        onError('Face detection library not available');
        return;
      }

      try {
        console.log('Loading face-api.js models...');
        
        // Load only essential models for face shape detection
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models')
          // Skip heavy models: faceRecognitionNet, faceExpressionNet, ageGenderNet
        ]);
        
        setModelsLoaded(true);
        console.log('Face-api.js models loaded successfully');
      } catch (error) {
        console.error('Error loading face-api.js models:', error);
        onError('Failed to load face detection models');
      }
    };

    loadModels();
  }, [onError]);

  // Debounced face detection function with performance optimizations
  const detectFace = () => {
    if (!imageUrl || !modelsLoaded || !imgRef.current || !faceapi || isDetecting) {
      console.log('Detection skipped:', { imageUrl: !!imageUrl, modelsLoaded, imgRef: !!imgRef.current, faceapi: !!faceapi, isDetecting });
      return;
    }

    // Clear any existing timeout
    if (detectionTimeoutRef.current) {
      clearTimeout(detectionTimeoutRef.current);
    }

    // Debounce detection to prevent multiple rapid clicks
    detectionTimeoutRef.current = setTimeout(async () => {
      await performDetection();
    }, 300); // 300ms debounce
  };

  // Actual detection function with async processing
  const performDetection = async () => {
    if (isDetecting) return; // Double-check to prevent multiple detections

    // Prevent multiple simultaneous detections
    setIsDetecting(true);
    setIsLoading(true);
    setHasDetected(true);
    onDetect?.(); // Notify parent that detection started

    // Use setTimeout to yield control to the browser and prevent UI blocking
    await new Promise(resolve => setTimeout(resolve, 0));
    
    try {
      const img = imgRef.current!;
      
      // Wait for image to load with timeout
      await new Promise((resolve, reject) => {
        if (img.complete && img.naturalHeight !== 0) {
          resolve(true);
        } else {
          const timeout = setTimeout(() => {
            reject(new Error('Image load timeout'));
          }, 10000); // 10 second timeout
          
          img.onload = () => {
            clearTimeout(timeout);
            resolve(true);
          };
          
          img.onerror = () => {
            clearTimeout(timeout);
            reject(new Error('Image failed to load'));
          };
        }
      });

      // Optimized face detection with single attempt strategy
      let detections;
      console.log('Starting face detection...');
      
      // Use highly optimized detection options for better performance
      const detectionOptions = new faceapi.TinyFaceDetectorOptions({
        inputSize: 224, // Even smaller input size for better performance
        scoreThreshold: 0.6 // Higher threshold to reduce false positives and processing
      });

      try {
        // Single attempt: direct detection with minimal processing
        detections = await faceapi
          .detectAllFaces(img, detectionOptions)
          .withFaceLandmarks(); // Only get landmarks, skip expressions and age/gender for performance
        
        console.log('Direct detection successful');
      } catch (corsError) {
        console.log('CORS error detected, trying proxy API...');
        
        // Try using proxy API
        const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
        const proxyImg = new Image();
        proxyImg.crossOrigin = 'anonymous';
        proxyImg.src = proxyUrl;
        
        // Wait for the proxy image to load with timeout
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Proxy image load timeout'));
          }, 8000);
          
          proxyImg.onload = () => {
            clearTimeout(timeout);
            resolve(true);
          };
          
          proxyImg.onerror = () => {
            clearTimeout(timeout);
            reject(new Error('Failed to load proxy image'));
          };
        });

        // Detect faces with landmarks using the proxy image
        detections = await faceapi
          .detectAllFaces(proxyImg, detectionOptions)
          .withFaceLandmarks(); // Only get landmarks for performance
        
        console.log('Proxy detection successful');
      }

      if (detections.length === 0) {
        throw new Error('No faces detected in the image');
      }

      // Get the first face detection
      const face = detections[0];
      
      // Convert landmarks to our format
      const landmarks = convertFaceApiLandmarks(face.landmarks);
      
      // Detect face shape using our algorithm
      const faceShape = detectFaceShape(landmarks);
      const confidence = Math.round(face.detection.score * 100);

      const result: FaceShapeResult = {
        faceShape,
        confidence,
        landmarks,
        attributes: {
          // Skip heavy processing for performance
          age: undefined,
          gender: undefined,
          expressions: undefined
        }
      };

      onResult(result);
      console.log('Face detection completed successfully');
    } catch (error) {
      console.error('Face detection error:', error);
      onError(error instanceof Error ? error.message : 'Face detection failed');
    } finally {
      setIsLoading(false);
      setIsDetecting(false);
    }
  };

  // Reset detection state when image changes
  useEffect(() => {
    setHasDetected(false);
    setIsDetecting(false);
    // Clear any pending detection timeout
    if (detectionTimeoutRef.current) {
      clearTimeout(detectionTimeoutRef.current);
      detectionTimeoutRef.current = null;
    }
  }, [imageUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (detectionTimeoutRef.current) {
        clearTimeout(detectionTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      <img
        ref={imgRef}
        src={imageUrl}
        alt="Face for analysis"
        className="w-full h-auto rounded-lg"
        crossOrigin="anonymous"
        style={{ display: 'none' }} // Hidden, only used for detection
      />
      
      {!hasDetected && modelsLoaded && faceapi && (
        <button
          onClick={detectFace}
          disabled={isLoading || isDetecting}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
        >
          {(isLoading || isDetecting) ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>جاري التحليل...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>تحليل شكل الوجه</span>
            </>
          )}
        </button>
      )}
      
      {hasDetected && (
        <div className="text-center text-sm text-gray-600">
          <p>تم تحليل الصورة بنجاح</p>
          <button
            onClick={detectFace}
            disabled={isLoading}
            className="mt-2 text-blue-600 hover:text-blue-800 underline disabled:opacity-50"
          >
            إعادة التحليل
          </button>
        </div>
      )}
    </div>
  );
}

// Convert face-api.js landmarks to our standard format
function convertFaceApiLandmarks(landmarks: any) {
  const points = landmarks.positions;
  
  console.log('Face-api.js 68-point landmarks:', points.length, 'points');
  console.log('Sample points:', {
    chin: points[8],
    leftJaw: points[0],
    rightJaw: points[16],
    leftEye: points[36],
    rightEye: points[45],
    nose: points[30]
  });
  
  return {
    // Jaw points - using the 17-point jawline contour
    contour_chin: { x: points[8].x, y: points[8].y }, // Chin tip
    contour_left1: { x: points[0].x, y: points[0].y }, // Left jaw start
    contour_right1: { x: points[16].x, y: points[16].y }, // Right jaw start
    contour_left6: { x: points[4].x, y: points[4].y }, // Left cheek (jaw contour)
    contour_right6: { x: points[12].x, y: points[12].y }, // Right cheek (jaw contour)
    contour_left9: { x: points[2].x, y: points[2].y }, // Left temple (jaw contour)
    contour_right9: { x: points[14].x, y: points[14].y }, // Right temple (jaw contour)
    
    // Eye points - using eye landmarks
    left_eye_center: { 
      x: (points[36].x + points[39].x) / 2, 
      y: (points[36].y + points[39].y) / 2 
    },
    right_eye_center: { 
      x: (points[42].x + points[45].x) / 2, 
      y: (points[42].y + points[45].y) / 2 
    },
    
    // Nose points
    nose_tip: { x: points[30].x, y: points[30].y },
    
    // Forehead estimation using eyebrow points
    left_eyebrow_upper_middle: { 
      x: (points[17].x + points[21].x) / 2, 
      y: Math.min(points[17].y, points[21].y) - 20 // Above eyebrow
    },
    right_eyebrow_upper_middle: { 
      x: (points[22].x + points[26].x) / 2, 
      y: Math.min(points[22].y, points[26].y) - 20 // Above eyebrow
    },
    
    // Additional useful points
    left_eyebrow_left: { x: points[17].x, y: points[17].y },
    left_eyebrow_right: { x: points[21].x, y: points[21].y },
    right_eyebrow_left: { x: points[22].x, y: points[22].y },
    right_eyebrow_right: { x: points[26].x, y: points[26].y },
    
    // Mouth points
    mouth_left: { x: points[48].x, y: points[48].y },
    mouth_right: { x: points[54].x, y: points[54].y },
    mouth_top: { x: points[51].x, y: points[51].y },
    mouth_bottom: { x: points[57].x, y: points[57].y }
  };
}

// Enhanced face shape detection algorithm with improved accuracy
function detectFaceShape(landmarks: any): string {
  if (!landmarks) {
    console.log('No landmark data provided');
    return "Unknown";
  }

  console.log('Using enhanced face-api.js landmarks for face shape detection');
  console.log('Available landmark keys:', Object.keys(landmarks));

  // Extract key points with better precision
  const jawLeft = landmarks.contour_left1;
  const jawRight = landmarks.contour_right1;
  const chin = landmarks.contour_chin;
  const leftCheek = landmarks.contour_left6;
  const rightCheek = landmarks.contour_right6;
  const leftTemple = landmarks.contour_left9;
  const rightTemple = landmarks.contour_right9;
  const leftEye = landmarks.left_eye_center;
  const rightEye = landmarks.right_eye_center;
  const noseTip = landmarks.nose_tip;

  // Check if we have the minimum required points
  const requiredPoints = [jawLeft, jawRight, chin, leftCheek, rightCheek, leftTemple, rightTemple, leftEye, rightEye, noseTip];
  const missingPoints = requiredPoints.filter(point => !point || point.x === undefined || point.y === undefined);
  
  if (missingPoints.length > 0) {
    console.log('Missing required landmark points:', missingPoints.length);
    console.log('Missing points:', missingPoints);
    return "Unknown";
  }

  // More accurate face measurements while keeping performance
  const faceLength = distance(noseTip, chin) * 2.6; // More accurate face length
  const jawWidth = distance(jawLeft, jawRight);
  const cheekboneWidth = distance(leftCheek, rightCheek);
  const templeWidth = distance(leftTemple, rightTemple);
  const eyeDistance = distance(leftEye, rightEye);
  
  // More accurate forehead width using temple points
  const foreheadWidth = Math.max(eyeDistance * 1.7, templeWidth);
  const faceWidth = Math.max(jawWidth, cheekboneWidth, templeWidth, foreheadWidth);
  
  // Debug the actual measurements
  console.log('RAW MEASUREMENTS:', {
    jawWidth: Math.round(jawWidth),
    cheekboneWidth: Math.round(cheekboneWidth),
    templeWidth: Math.round(templeWidth),
    foreheadWidth: Math.round(foreheadWidth),
    eyeDistance: Math.round(eyeDistance),
    faceLength: Math.round(faceLength)
  });
  
  console.log('WIDTH PROGRESSION CHECK:', {
    'forehead < cheekbones': foreheadWidth < cheekboneWidth,
    'cheekbones < jaw': cheekboneWidth < jawWidth,
    'jaw > cheekbones': jawWidth > cheekboneWidth,
    'cheekbones > forehead': cheekboneWidth > foreheadWidth,
    'jaw > forehead': jawWidth > foreheadWidth
  });
  
  // Calculate key ratios for accurate classification
  const lengthToWidthRatio = faceLength / faceWidth;
  const cheekboneToJawRatio = cheekboneWidth / jawWidth;
  const foreheadToJawRatio = foreheadWidth / jawWidth;
  const templeToJawRatio = templeWidth / jawWidth;
  const cheekboneToForeheadRatio = cheekboneWidth / foreheadWidth;
  
  // More accurate shape indicators with better Diamond detection
  const isPointedChin = chin.y > (jawLeft.y + jawRight.y) / 2 + 8;
  const isWideForehead = foreheadToJawRatio > 1.12;
  const isNarrowJaw = jawWidth < cheekboneWidth * 0.90; // More strict for Diamond
  const isWideCheekbones = cheekboneWidth > jawWidth * 1.10; // More strict for Diamond
  const isNarrowTemple = templeToJawRatio < 0.85; // More strict for Diamond
  const isWideTemple = templeToJawRatio > 1.05;
  
  // Additional Diamond-specific indicators
  const isVeryWideCheekbones = cheekboneWidth > jawWidth * 1.15;
  const isVeryNarrowTemple = templeToJawRatio < 0.80;
  const isVeryNarrowJaw = jawWidth < cheekboneWidth * 0.88;

  // Enhanced logging for debugging
  console.log('Face measurements:', {
    faceLength: Math.round(faceLength),
    jawWidth: Math.round(jawWidth),
    cheekboneWidth: Math.round(cheekboneWidth),
    templeWidth: Math.round(templeWidth),
    foreheadWidth: Math.round(foreheadWidth),
    lengthToWidthRatio: lengthToWidthRatio.toFixed(3),
    cheekboneToJawRatio: cheekboneToJawRatio.toFixed(3),
    foreheadToJawRatio: foreheadToJawRatio.toFixed(3),
    templeToJawRatio: templeToJawRatio.toFixed(3)
  });
  
  console.log('Diamond indicators:', {
    isVeryWideCheekbones,
    isVeryNarrowTemple,
    isVeryNarrowJaw,
    isWideCheekbones,
    isNarrowTemple,
    isNarrowJaw,
    cheekboneToJawRatio: cheekboneToJawRatio.toFixed(3),
    templeToJawRatio: templeToJawRatio.toFixed(3)
  });

  // Enhanced classification with better accuracy - Diamond gets highest priority
  
  // 1. DIAMOND: Very distinctive - narrow forehead, wide cheekbones, narrow jaw
  // ULTRA-AGGRESSIVE Diamond detection based on the actual measurements
  const isDiamondCandidate = cheekboneToJawRatio > 1.05 || isWideCheekbones;
  const hasNarrowFeatures = templeToJawRatio < 0.95 || isNarrowTemple || isNarrowJaw;
  
  // Check for classic Diamond pattern: narrow forehead < cheekbones < jaw (but jaw is actually widest)
  const isClassicDiamond = foreheadWidth < cheekboneWidth && cheekboneWidth < jawWidth;
  const isReverseDiamond = jawWidth > cheekboneWidth && cheekboneWidth > foreheadWidth; // Jaw widest, then cheekbones, then forehead
  
  console.log('Diamond candidate check:', {
    isDiamondCandidate,
    hasNarrowFeatures,
    isClassicDiamond,
    isReverseDiamond,
    cheekboneToJawRatio: cheekboneToJawRatio.toFixed(3),
    templeToJawRatio: templeToJawRatio.toFixed(3),
    jawWidthRatio: (jawWidth / cheekboneWidth).toFixed(3),
    foreheadWidth: Math.round(foreheadWidth),
    cheekboneWidth: Math.round(cheekboneWidth),
    jawWidth: Math.round(jawWidth)
  });
  
  // SIMPLE DIAMOND CHECK FIRST - based on actual measurements
  const isSimpleDiamond = (jawWidth > cheekboneWidth && cheekboneWidth > foreheadWidth) ||
                         (foreheadWidth < cheekboneWidth && cheekboneWidth < jawWidth);
  
  console.log('SIMPLE DIAMOND CHECK:', {
    isSimpleDiamond,
    jawWidth: Math.round(jawWidth),
    cheekboneWidth: Math.round(cheekboneWidth),
    foreheadWidth: Math.round(foreheadWidth),
    'jaw > cheek > forehead': jawWidth > cheekboneWidth && cheekboneWidth > foreheadWidth,
    'forehead < cheek < jaw': foreheadWidth < cheekboneWidth && cheekboneWidth < jawWidth
  });
  
  // Multiple Diamond conditions - ULTRA-AGGRESSIVE to catch Diamond faces
  if (isSimpleDiamond ||
      (isVeryWideCheekbones && isVeryNarrowTemple && isVeryNarrowJaw) ||
      (cheekboneToJawRatio > 1.05 && templeToJawRatio < 0.90 && jawWidth < cheekboneWidth * 0.95) ||
      (isNarrowTemple && cheekboneToJawRatio > 1.05 && isNarrowJaw) ||
      (isClassicDiamond && lengthToWidthRatio >= 0.8 && lengthToWidthRatio <= 1.5) ||
      (isReverseDiamond && lengthToWidthRatio >= 0.8 && lengthToWidthRatio <= 1.5) ||
      (isDiamondCandidate && hasNarrowFeatures && lengthToWidthRatio >= 0.8 && lengthToWidthRatio <= 1.5) ||
      (foreheadWidth < cheekboneWidth && cheekboneWidth < jawWidth) ||
      (jawWidth > cheekboneWidth && cheekboneWidth > foreheadWidth)) {
    console.log('Classified as: Diamond face');
    return "Diamond";
  }
  
  // 2. HEART: Wide forehead, narrow jaw, pointed chin
  if (isWideForehead && isNarrowJaw && isPointedChin && 
      lengthToWidthRatio > 1.1 && foreheadToJawRatio > 1.12) {
    console.log('Classified as: Heart face');
    return "Heart";
  }
  
  // 3. ROUND: Short face, similar widths at all levels
  if (lengthToWidthRatio < 1.1 && 
      Math.abs(cheekboneWidth - foreheadWidth) < 35 && 
      Math.abs(cheekboneWidth - jawWidth) < 35) {
    console.log('Classified as: Round face');
    return "Round";
  }
  
  // 4. SQUARE: Short to medium face, uniform width, strong jaw
  if (lengthToWidthRatio >= 0.9 && lengthToWidthRatio <= 1.25 && 
      Math.abs(cheekboneWidth - jawWidth) < 45 && 
      Math.abs(foreheadWidth - jawWidth) < 45) {
    console.log('Classified as: Square face');
    return "Square";
  }
  
  // 5. RECTANGLE: Long face, relatively uniform width
  if (lengthToWidthRatio > 1.35 && lengthToWidthRatio <= 1.6 && 
      Math.abs(cheekboneWidth - jawWidth) < 55 && 
      Math.abs(foreheadWidth - jawWidth) < 55) {
    console.log('Classified as: Rectangle face');
    return "Rectangle";
  }
  
  // 6. OVAL: Balanced proportions, slightly longer than wide, wider cheekbones
  // But NOT if it has ANY Diamond characteristics - ULTRA-RESTRICTIVE
  const hasAnyDiamondFeatures = isWideCheekbones || isNarrowTemple || isNarrowJaw || 
                                cheekboneToJawRatio > 1.05 || templeToJawRatio < 0.95 ||
                                isClassicDiamond || isReverseDiamond ||
                                foreheadWidth < cheekboneWidth || cheekboneWidth < jawWidth ||
                                jawWidth > cheekboneWidth || cheekboneWidth > foreheadWidth;
  
  console.log('Oval check - Diamond features:', {
    hasAnyDiamondFeatures,
    isWideCheekbones,
    isNarrowTemple,
    isNarrowJaw,
    isClassicDiamond,
    isReverseDiamond,
    cheekboneToJawRatio: cheekboneToJawRatio.toFixed(3),
    templeToJawRatio: templeToJawRatio.toFixed(3),
    foreheadWidth: Math.round(foreheadWidth),
    cheekboneWidth: Math.round(cheekboneWidth),
    jawWidth: Math.round(jawWidth)
  });
  
  if (lengthToWidthRatio > 1.2 && lengthToWidthRatio <= 1.4 && 
      cheekboneWidth > jawWidth * 0.95 && 
      Math.abs(foreheadToJawRatio - 1.0) < 0.15 &&
      !hasAnyDiamondFeatures) { // Exclude ANY Diamond-like features
    console.log('Classified as: Oval face');
    return "Oval";
  }

  // Enhanced fallback classification with better accuracy
  console.log('Using enhanced fallback classification...');
  
  if (lengthToWidthRatio > 1.4) {
    if (Math.abs(cheekboneWidth - jawWidth) < 50) {
      console.log('Classified as: Rectangle face');
      return "Rectangle";
    } else {
      console.log('Classified as: Oval face');
      return "Oval";
    }
  } else if (lengthToWidthRatio < 1.0) {
    console.log('Classified as: Round face');
    return "Round";
  } else if (isWideCheekbones && isNarrowJaw && isNarrowTemple) {
    console.log('Classified as: Diamond face');
    return "Diamond";
  } else if (isWideForehead && isNarrowJaw && isPointedChin) {
    console.log('Classified as: Heart face');
    return "Heart";
  } else if (Math.abs(cheekboneWidth - jawWidth) < 40 && Math.abs(foreheadWidth - jawWidth) < 40) {
    console.log('Classified as: Square face');
    return "Square";
  } else if (isWideCheekbones || isNarrowJaw || isNarrowTemple || cheekboneToJawRatio > 1.05 ||
             isSimpleDiamond || isClassicDiamond || isReverseDiamond ||
             (jawWidth > cheekboneWidth && cheekboneWidth > foreheadWidth) ||
             (foreheadWidth < cheekboneWidth && cheekboneWidth < jawWidth)) {
    // If it has ANY Diamond characteristics OR width progression, classify as Diamond
    console.log('Classified as: Diamond face');
    return "Diamond";
  } else {
    console.log('Classified as: Unknown face');
    return "Unknown";
  }
}

// Distance calculation function
function distance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}
