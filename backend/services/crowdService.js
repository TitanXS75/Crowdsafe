// In-memory user location store
// userId -> { lat, lng, timestamp }
const userLocations = new Map();

// Update user location
const updateLocation = (userId, lat, lng) => {
    userLocations.set(userId, {
        lat,
        lng,
        timestamp: Date.now()
    });
};

// Calculate density near a point (simulated)
// Returns number of users within ~50 meters
const getDensityAtPoint = (lat, lng) => {
    let count = 0;
    const threshold = 0.0005; // Approx 50m in degrees (rough internal approx)

    // Clean up old entries older than 5 mins
    const now = Date.now();
    for (const [id, data] of userLocations.entries()) {
        if (now - data.timestamp > 5 * 60 * 1000) {
            userLocations.delete(id);
            continue;
        }

        const dLat = Math.abs(lat - data.lat);
        const dLng = Math.abs(lng - data.lng);

        if (dLat < threshold && dLng < threshold) {
            count++;
        }
    }

    return count;
};

// Get density score for a route (0.0 to 1.0)
const getRouteDensity = (routeGeometry) => {
    if (!routeGeometry || routeGeometry.length === 0) return 0;

    let totalDensity = 0;
    const sampleRate = Math.max(1, Math.floor(routeGeometry.length / 10)); // Sample 10 points

    let checks = 0;
    for (let i = 0; i < routeGeometry.length; i += sampleRate) {
        const point = routeGeometry[i];
        totalDensity += getDensityAtPoint(point[0], point[1]);
        checks++;
    }

    // Avg users per sampled point. If dense > 5 users, score -> 1.0
    const avgDensity = totalDensity / (checks || 1);
    return Math.min(avgDensity / 5, 1.0);
};

module.exports = {
    updateLocation,
    getRouteDensity,
    getDensityAtPoint
};
