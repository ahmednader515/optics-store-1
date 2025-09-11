// Face shape to glasses shape mapping
export const faceShapeToGlassesMapping: { [key: string]: string[] } = {
  'Heart': ['Round', 'Oval', 'Semi-Rimless', 'Cat-Eye'],
  'Diamond': ['Cat-Eye', 'Round', 'Oval', 'Rimless'],
  'Round': ['Square', 'Rectangle', 'Wayfarer', 'Browline'],
  'Square': ['Round', 'Oval', 'Rimless', 'Cat-Eye'],
  'Oval': ['Square', 'Rectangle', 'Wayfarer', 'Browline', 'Round'],
  'Rectangle': ['Round', 'Oval', 'Cat-Eye', 'Semi-Rimless'],
  'Unknown': ['Oval', 'Wayfarer', 'Browline', 'Round']
}

// Get the best recommended glasses shape for a face shape
export function getRecommendedGlassesShape(faceShape: string): string {
  const recommendations = faceShapeToGlassesMapping[faceShape] || faceShapeToGlassesMapping['Unknown']
  // Return the first (most recommended) shape
  return recommendations[0]
}

// Get all recommended glasses shapes for a face shape
export function getAllRecommendedGlassesShapes(faceShape: string): string[] {
  return faceShapeToGlassesMapping[faceShape] || faceShapeToGlassesMapping['Unknown']
}

// Face shape descriptions for better user experience
export const faceShapeDescriptions: { [key: string]: string } = {
  'Heart': 'وجه على شكل قلب - جبهة عريضة وذقن مدببة',
  'Diamond': 'وجه على شكل ماسة - عظام الوجنتين عريضة والجبهة والذقن ضيقة',
  'Round': 'وجه دائري - طول وعرض الوجه متقاربين',
  'Square': 'وجه مربع - خط الفك عريض والجبهة عريضة',
  'Oval': 'وجه بيضاوي - أطول من عرضه مع خط فك مدور',
  'Rectangle': 'وجه مستطيل - أطول من عرضه مع خط فك عريض',
  'Unknown': 'شكل الوجه غير محدد بوضوح'
}
