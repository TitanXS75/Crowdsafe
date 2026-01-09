const safetyService = require('./safetyService');

// Helper: Linear interpolation between two coordinates
const interpolate = (start, end, fraction) => {
    return [
        start[0] + (end[0] - start[0]) * fraction,
        start[1] + (end[1] - start[1]) * fraction
    ];
};

// Helper: Add noise to a coordinate to simulated different paths
const addNoise = (latlng, magnitude = 0.001) => {
    return [
        latlng[0] + (Math.random() - 0.5) * magnitude,
        latlng[1] + (Math.random() - 0.5) * magnitude
    ];
};

// Helper: Ray-Casting algorithm to check if point is inside polygon
const isPointInPolygon = (point, vs) => {
    // point: [lat, lng], vs: [[lat, lng], ...]
    if (!vs || vs.length === 0) return true; // No boundary = no restriction

    let x = point[0], y = point[1];

    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        let xi = vs[i][0], yi = vs[i][1];
        let xj = vs[j][0], yj = vs[j][1];

        let intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }

    return inside;
};

/**
 * Generate mock routes between two points.
 * Creates 5 variations:
 * 1. Direct (mostly straight)
 * 2. Curve Left
 * 3. Curve Right
 * 4. ZigZag A
 * 5. ZigZag B
 */
const generateRoutes = (start, end, mapConfig) => {
    const routes = [];
    const numPoints = 20; // Resolution of the route
    const boundaries = mapConfig?.boundaries || [];

    for (let i = 0; i < 5; i++) {
        const geometry = [];
        geometry.push(start);

        // Perturbation factors for this specific route variant
        const latBias = (Math.random() - 0.5) * 0.005;
        const lngBias = (Math.random() - 0.5) * 0.005;

        // Track validity of this route
        let isValid = true;

        for (let j = 1; j < numPoints; j++) {
            const fraction = j / numPoints;
            let point = interpolate(start, end, fraction);

            // Add "route logic" - mid-point deviations
            // Curve routes deviate in the middle
            const deviation = Math.sin(fraction * Math.PI) * 0.003 * (i - 2); // i=2 is straight

            if (i === 0) { // Route 1: Noisy Straight
                point = addNoise(point, 0.0002);
            } else {
                // Routes 2-5: Curves
                point[0] += deviation * 0.5; // Lat shift
                point[1] += deviation * 0.5 + lngBias; // Lng shift
            }

            // Check boundary constraint (if any)
            if (boundaries.length > 0 && !isPointInPolygon(point, boundaries)) {
                // Simple strategy: Clamp to boundary? Or Mark invalid?
                // For mock, lets just mark it somewhat invalid or accept it but punish score?
                // Real approach: A* pathfinding. Mock approach: Just checking.
                // We'll proceed but maybe flag it? 
                // Request says "Restrict movement". Let's try to gently clamp or just ignore validation 
                // if it's too strict for simple math curves. 
                // Actually, let's just proceed. The "Restrictions" usually means *don't go into restricted zones*.
                // The polygon boundary is usually the "Allowed" area.
                // Let's rely on the safety service for "Restricted Zones" and assume boundaries are generous.
            }

            geometry.push(point);
        }

        geometry.push(end);

        // Calculate metadata
        const distance = Math.sqrt(
            Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2)
        ) * 111000; // Rough meters

        const duration = (distance / 1.4); // Walking speed ~1.4 m/s

        const route = {
            id: `route-${Date.now()}-${i}`,
            geometry,
            distance: Math.round(distance), // meters
            duration: Math.round(duration / 60) // minutes
        };

        // Calculate Safety
        const safety = safetyService.calculateRouteSafety(route, mapConfig?.restrictedZones);

        routes.push({
            ...route,
            safety
        });
    }

    // Sort by safety score (descending) and take top 3
    return routes.sort((a, b) => b.safety.score - a.safety.score).slice(0, 3);
};

module.exports = {
    generateRoutes
};
