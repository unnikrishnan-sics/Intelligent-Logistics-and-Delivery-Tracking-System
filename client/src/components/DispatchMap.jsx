import { useState, useEffect } from 'react';
import {
    Card, CardContent, CardHeader,
    Grid, Typography, Chip, Box
} from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { LocalShipping } from '@mui/icons-material';
import { io } from 'socket.io-client';
import L from 'leaflet';

// Fix for default marker icon missing
const driverIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/1986/1986937.png',
    iconSize: [35, 35],
    iconAnchor: [17, 35],
    popupAnchor: [0, -35]
});

// Helper component to auto-center map
const MapRecenter = ({ drivers }) => {
    const map = useMap();

    useEffect(() => {
        const onlineDrivers = drivers.filter(d => d.isOnline && d.current_coordinates?.lat);

        if (onlineDrivers.length > 0) {
            const points = onlineDrivers.map(d => [d.current_coordinates.lat, d.current_coordinates.lng]);
            const bounds = L.latLngBounds(points);
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        }
    }, [drivers, map]);

    return null;
};

const DispatchMap = ({ orders, drivers }) => {
    const [localDrivers, setLocalDrivers] = useState(drivers);

    useEffect(() => {
        setLocalDrivers(drivers);
    }, [drivers]);

    useEffect(() => {
        const socket = io(import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000');

        socket.on('driver_location_updated', (data) => {
            if (data.driverId) {
                setLocalDrivers(prev => {
                    const existingIndex = prev.findIndex(d => String(d._id) === String(data.driverId));

                    if (existingIndex !== -1) {
                        // Update existing driver
                        const updated = [...prev];
                        updated[existingIndex] = {
                            ...updated[existingIndex],
                            current_coordinates: { lat: data.lat, lng: data.lng },
                            isOnline: true
                        };
                        return updated;
                    } else {
                        // Add new/unknown driver dynamically
                        return [...prev, {
                            _id: data.driverId,
                            name: data.name || 'Active Driver',
                            avatar: data.avatar || '',
                            current_coordinates: { lat: data.lat, lng: data.lng },
                            isOnline: true,
                            role: 'Driver'
                        }];
                    }
                });
            }
        });

        socket.on('driver_status_updated', (data) => {
            // data: { driverId, isOnline }
            setLocalDrivers(prev => prev.map(d =>
                d._id === data.driverId ? { ...d, isOnline: data.isOnline } : d
            ));
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    return (
        <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
            <CardHeader
                avatar={<LocalShipping color="primary" />}
                title={<Typography variant="h6" fontWeight="bold">Live Driver Locations</Typography>}
            />
            <CardContent>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                        <Box sx={{ height: 600, borderRadius: 2, overflow: 'hidden', border: '1px solid #e0e0e0' }}>
                            <MapContainer center={[12.9716, 77.5946]} zoom={12} style={{ height: '100%', width: '100%' }}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                <MapRecenter drivers={localDrivers} />

                                {localDrivers.filter(d => d.isOnline).map(d => (
                                    <Marker
                                        key={d._id}
                                        position={[
                                            d.current_coordinates?.lat || (12.97 + (Math.random() * 0.005)),
                                            d.current_coordinates?.lng || (77.59 + (Math.random() * 0.005))
                                        ]}
                                        opacity={1}
                                        icon={driverIcon}
                                    >
                                        <Popup>
                                            <b>Driver: {d.name}</b><br />
                                            <Chip
                                                label="Online"
                                                color="success"
                                                size="small"
                                                sx={{ mt: 1 }}
                                            />
                                        </Popup>
                                    </Marker>
                                ))}
                            </MapContainer>
                        </Box>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
};

export default DispatchMap;
