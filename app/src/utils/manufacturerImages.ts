export const manufacturerImageMap: { [key: string]: string } = {
  "Cube": "/images/bike.png",
  "TagHeuer": "/images/watch.jpg",
  "Hercules": "/images/hercules_cycle.png",
  "BSA": "/images/bsa_cycle.png",
  "Firefox": "/images/firefox_cycle.png",
  "Giant": "/images/giant_cycle.png",
  "Trek": "/images/trek_cycle.png",
  "Avon": "/images/avon_cycle.png",
  // Add more manufacturers as needed
};

// Default image if manufacturer not found in the map
export const defaultCycleImage = "/images/default_cycle.png";

// Helper function to get image path for a manufacturer
export function getManufacturerImage(manufacturerName: string): string {
  // Convert to title case for consistency
  const formattedName = manufacturerName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
    
  return manufacturerImageMap[formattedName] || defaultCycleImage;
} 