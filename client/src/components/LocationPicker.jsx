import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Box, Typography, TextField, InputAdornment, IconButton } from '@mui/material';
import { Search, MyLocation } from '@mui/icons-material';
import axios from 'axios';

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const LocationMarker = ({ position, setPosition }) => {
    useMapEvents({
        click(e) {
            setPosition([e.latlng.lat, e.latlng.lng]);
        },
    });

    return position === null ? null : (
        <Marker position={position}></Marker>
    );
};

const ChangeView = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, map.getZoom());
        }
    }, [center, map]);
    return null;
};

const LocationPicker = ({ label, onLocationSelect, initialPos }) => {
    const [position, setPosition] = useState(initialPos || [12.9716, 77.5946]); // Bangalore default
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (position) {
            onLocationSelect({ lat: position[0], lng: position[1] });
        }
    }, [position]);

    const handleSearch = async () => {
        if (!searchQuery) return;
        try {
            const response = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
            if (response.data && response.data.length > 0) {
                const { lat, lon } = response.data[0];
                setPosition([parseFloat(lat), parseFloat(lon)]);
            }
        } catch (error) {
            console.error('Search failed:', error);
        }
    };

    const handleCurrentLocation = () => {
        navigator.geolocation.getCurrentPosition((pos) => {
            setPosition([pos.coords.latitude, pos.coords.longitude]);
        });
    };

    return (
        <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>{label}</Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Search address..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton onClick={handleSearch} size="small"><Search /></IconButton>
                            </InputAdornment>
                        )
                    }}
                />
                <IconButton onClick={handleCurrentLocation} color="primary"><MyLocation /></IconButton>
            </Box>
            <Box sx={{ height: 250, borderRadius: 2, overflow: 'hidden', border: '1px solid #ddd' }}>
                <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <LocationMarker position={position} setPosition={setPosition} />
                    <ChangeView center={position} />
                </MapContainer>
            </Box>
            <Typography variant="caption" color="text.secondary">
                Selected: {position[0].toFixed(4)}, {position[1].toFixed(4)}
            </Typography>
        </Box>
    );
};

export default LocationPicker;
