export const CENTER = [21.2514, 81.6296];

// Pothole stays red. Crack and person/obstacle were previously orange
// and blue, which blended into OSM's own highway (orange/yellow) and
// water (blue) tile colors — switched to purple/magenta, which don't
// appear in the base map palette, so all three pop against the tiles.
export const TYPE_COLORS = {
  pothole: '#C23B3B',
  crack: '#7B3FA0',
  person: '#D6336C'
};

export const TYPE_LABELS = {
  pothole: 'Pothole',
  crack: 'Crack',
  person: 'Pedestrian/Obstacle'
};

export const STATUSES = ['New', 'Acknowledged', 'Repaired'];
