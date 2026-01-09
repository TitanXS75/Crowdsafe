const crowdService = require('./crowdService');

// Weights
const WEIGHT_DENSITY = 0.7;
const WEIGHT_DISTANCE = 0.3;

// Penalties
const PENALTY_RESTRICTED = 0.9;

const calculateRouteSafety = (route, restrictedZones) => {
    // 1. Density Score (0.0 - 1.0, where 1.0 is CROWDED/BAD)
    const densityScore = crowdService.getRouteDensity(route.geometry);

    // 2. Restricted Zone Proximity (Simple Check)
    let restrictedPenalty = 0;
    if (restrictedZones && restrictedZones.length > 0) {
        // Check if any point in route is close to a restricted zone
        const isClose = route.geometry.some(pt => {
            return restrictedZones.some(zone => {
                const dLat = Math.abs(pt[0] - zone[0]);
                const dLng = Math.abs(pt[1] - zone[1]);
                return dLat < 0.0002 && dLng < 0.0002; // ~20m
            });
        });
        if (isClose) restrictedPenalty = PENALTY_RESTRICTED;
    }

    // Safety Score: 100 (Best) -> 0 (Worst)
    // Formula: 100 - (Density * 100 * 0.7) - (Penalty * 100)
    let score = 100 - (densityScore * 100 * WEIGHT_DENSITY) - (restrictedPenalty * 100);

    // Clamp
    score = Math.max(0, Math.min(100, score));

    // Label
    let label = 'SAFE';
    let color = 'green';

    if (score < 40) {
        label = 'UNSAFE';
        color = 'red';
    } else if (score < 75) {
        label = 'MODERATE';
        color = 'yellow';
    }

    return {
        score,
        label,
        color,
        details: {
            density: densityScore,
            restricted: restrictedPenalty > 0
        }
    };
};

module.exports = {
    calculateRouteSafety
};
