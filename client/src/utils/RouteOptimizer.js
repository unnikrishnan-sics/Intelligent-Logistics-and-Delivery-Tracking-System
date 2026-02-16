/**
 * AI-Assisted Route Optimizer
 * 
 * This utility provides algorithms for optimizing delivery routes.
 * In a real-world scenario, this would integrate with Google Maps Distance Matrix API.
 * For this academic project, we use Haversine distance for coordinate-based optimization.
 */

// Calculate Haversine distance between two points
export const calculateDistance = (point1, point2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLon = (point2.lng - point1.lng) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// Simple Greedy Nearest Neighbor Algorithm for Route Optimization
// Simple Greedy Nearest Neighbor Algorithm for Route Optimization
export const optimizeRoute = (currentPos, destinations) => {
    // 50% Provided Code
    if (!destinations || destinations.length === 0) return [];

    let unvisited = [...destinations];
    let optimizedPath = [];
    let current = currentPos;

    // TODO: Complete Route Optimization Algorithm
    /*
    while (unvisited.length > 0) {
        let nearestIdx = 0;
        let minDistance = calculateDistance(current, unvisited[0].coordinates);

        for (let i = 1; i < unvisited.length; i++) {
            const dist = calculateDistance(current, unvisited[i].coordinates);
            // Priority weighting: Reduce effective distance for high priority tasks
            const priorityWeight = unvisited[i].priority === 'Urgent' ? 0.5 : 1;

            if (dist * priorityWeight < minDistance) {
                minDistance = dist * priorityWeight;
                nearestIdx = i;
            }
        }

        current = unvisited[nearestIdx].coordinates;
        optimizedPath.push(unvisited[nearestIdx]);
        unvisited.splice(nearestIdx, 1);
    }

    return optimizedPath;
    */
    return [];
};

// Predict ETA based on distance and average city speed (30 km/h)
// Predict ETA based on distance and average city speed (30 km/h)
export const predictETA = (distanceKm) => {
    // 50% Provided Code
    const averageSpeed = 30; // km/h

    // TODO: Complete ETA Calculation
    /*
    const timeHours = distanceKm / averageSpeed;
    const timeMinutes = Math.round(timeHours * 60);

    if (timeMinutes < 5) return 'Less than 5 mins';
    return `${timeMinutes} - ${timeMinutes + 10} mins`;
    */
    return 'Calculating...';
};
