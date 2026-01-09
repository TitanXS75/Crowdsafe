import { useEffect, useRef, useState } from 'react';

interface UseGoogleMapOptions {
    center: google.maps.LatLngLiteral;
    zoom: number;
    mapTypeControl?: boolean;
    streetViewControl?: boolean;
    fullscreenControl?: boolean;
}

export const useGoogleMap = (
    mapRef: React.RefObject<HTMLDivElement>,
    options: UseGoogleMapOptions
) => {
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (!mapRef.current || map) return;

        const newMap = new google.maps.Map(mapRef.current, {
            center: options.center,
            zoom: options.zoom,
            mapTypeControl: options.mapTypeControl ?? true,
            streetViewControl: options.streetViewControl ?? false,
            fullscreenControl: options.fullscreenControl ?? true,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            styles: [
                {
                    featureType: 'poi',
                    elementType: 'labels',
                    stylers: [{ visibility: 'off' }]
                }
            ]
        });

        setMap(newMap);
        setIsLoaded(true);
    }, [mapRef.current]);

    return { map, isLoaded };
};
