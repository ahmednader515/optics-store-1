import * as faceapi from 'face-api.js';

// Initialize face-api.js models
let modelsLoaded = false;

export async function loadFaceApiModels() {
  if (modelsLoaded) return;
  
  try {
    // Get the base URL for the models
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const modelsPath = `${baseUrl}/models`;
    
    console.log('Loading face-api.js models from:', modelsPath);
    
    // Load the required models
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(modelsPath),
      faceapi.nets.faceLandmark68Net.loadFromUri(modelsPath),
      faceapi.nets.faceRecognitionNet.loadFromUri(modelsPath),
      faceapi.nets.faceExpressionNet.loadFromUri(modelsPath),
      faceapi.nets.ageGenderNet.loadFromUri(modelsPath)
    ]);
    
    modelsLoaded = true;
    console.log('Face-api.js models loaded successfully');
  } catch (error) {
    console.error('Error loading face-api.js models:', error);
    throw error;
  }
}

export async function detectFaceFromImageUrl(imageUrl: string) {
  try {
    // Load models if not already loaded
    await loadFaceApiModels();
    
    // Load image from URL
    const img = await faceapi.fetchImage(imageUrl);
    
    // Detect faces with landmarks
    const detections = await faceapi
      .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions()
      .withAgeAndGender();
    
    if (detections.length === 0) {
      throw new Error('No faces detected in the image');
    }
    
    // Return the first face detection
    const face = detections[0];
    
    // Convert face-api.js landmarks to our format
    const landmarks = convertFaceApiLandmarks(face.landmarks);
    
    return {
      landmarks,
      expressions: face.expressions,
      age: face.ageAndGender?.age,
      gender: face.ageAndGender?.gender,
      confidence: face.detection.score
    };
  } catch (error) {
    console.error('Face detection error:', error);
    throw error;
  }
}

// Convert face-api.js landmarks to our standard format
function convertFaceApiLandmarks(landmarks: faceapi.FaceLandmarks68) {
  const points = landmarks.positions;
  
  // face-api.js uses 68-point landmarks
  // Map them to our standard format
  return {
    // Jaw points
    contour_chin: { x: points[8].x, y: points[8].y }, // Chin
    contour_left1: { x: points[0].x, y: points[0].y }, // Left jaw
    contour_right1: { x: points[16].x, y: points[16].y }, // Right jaw
    contour_left6: { x: points[4].x, y: points[4].y }, // Left cheek
    contour_right6: { x: points[12].x, y: points[12].y }, // Right cheek
    contour_left9: { x: points[2].x, y: points[2].y }, // Left temple
    contour_right9: { x: points[14].x, y: points[14].y }, // Right temple
    
    // Eye points
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
