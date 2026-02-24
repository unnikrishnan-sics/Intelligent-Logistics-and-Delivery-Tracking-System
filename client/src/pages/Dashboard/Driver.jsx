import { useState, useEffect, useRef } from 'react';
import {
    Grid, Card, CardContent, CardHeader, Typography,
    Button, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Box, Chip, Stack, Container, IconButton, Paper, Divider,
    Avatar
} from '@mui/material';
import {
    DirectionsCar, Navigation as NavigationIcon, CheckCircle,
    LocationOn, Lock, OpenInNew, MyLocation, CameraAlt, Chat as ChatIcon
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'; // Added useMap
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import io from 'socket.io-client';
import { DataGrid } from '@mui/x-data-grid';
import { optimizeRoute } from '../../utils/RouteOptimizer';
import ChatWindow from '../../components/ChatWindow';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create Routing Machine Component
const RoutingControl = ({ start, end }) => {
    const map = useMap();

    useEffect(() => {
        if (!map || !start || !end) return;

        const routingControl = L.Routing.control({
            waypoints: [
                L.latLng(start[0], start[1]),
                L.latLng(end.lat, end.lng)
            ],
            routeWhileDragging: false,
            show: false, // Hide instruction text by default
            addWaypoints: false,
            draggableWaypoints: false,
            fitSelectedRoutes: false,
            showAlternatives: false,
            lineOptions: {
                styles: [{ color: 'blue', weight: 5, opacity: 0.7 }]
            },
            createMarker: () => null // Hide default markers (we use our own)
        }).addTo(map);

        return () => {
            // Safe cleanup
            try {
                if (map && routingControl) {
                    map.removeControl(routingControl);
                }
            } catch (e) {
                console.warn("Error removing routing control", e);
            }
        };
    }, [map, start, end]);

    return null;
};

// Custom Car Icon for Driver
const vehicleIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3097/3097136.png',
    iconSize: [45, 45],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22]
});

const DriverDashboard = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeOrder, setActiveOrder] = useState(null);
    const [isOTPModalVisible, setIsOTPModalVisible] = useState(false);
    const [isPickupModalVisible, setIsPickupModalVisible] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [otp, setOtp] = useState('');
    const [pickupImage, setPickupImage] = useState('');
    const [currentPos, setCurrentPos] = useState([12.9716, 77.5946]); // Bangalore default
    const socketRef = useRef();

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/orders');
            // Filter only assigned or in-progress orders
            const assignedOrders = data.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled');

            // Apply Route Optimization logic
            const formattedOrders = assignedOrders.map(o => ({
                ...o,
                id: o._id,
                coordinates: o.dest_coordinates // For optimizer
            }));

            const optimized = optimizeRoute({ lat: currentPos[0], lng: currentPos[1] }, formattedOrders);
            setOrders(optimized);

            // Auto-set active order if one is already in progress
            const ongoingOrder = optimized.find(o => o.status === 'Out for Delivery' || o.status === 'Assigned' || o.status === 'Picked Up');
            if (ongoingOrder) {
                setActiveOrder(ongoingOrder);
            }
        } catch (error) {
            toast.error('Failed to fetch orders');
        } finally {
            setLoading(false);
        }
    };

    // Use ref to keep track of activeOrder inside the closure of watchPosition
    const activeOrderRef = useRef(activeOrder);

    useEffect(() => {
        activeOrderRef.current = activeOrder;
    }, [activeOrder]);

    useEffect(() => {
        fetchData();
        socketRef.current = io(import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000');

        // Announce Driver Online
        const user = JSON.parse(localStorage.getItem('userInfo'));
        if (user && user._id) {
            socketRef.current.emit('driver_connect', user._id);
        }

        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                setCurrentPos([latitude, longitude]);

                // Always announce location for fleet tracking
                const user = JSON.parse(localStorage.getItem('userInfo'));
                if (user && user._id) {
                    socketRef.current.emit('driver_location_ping', {
                        driverId: user._id,
                        lat: latitude,
                        lng: longitude,
                        name: user.name, // Send name for map display
                        avatar: user.avatar
                    });
                }

                const currentOrder = activeOrderRef.current;
                if (currentOrder) {
                    // console.log('Sending location update for order:', currentOrder._id);
                    socketRef.current.emit('update_location', {
                        driverId: user?._id, // Add driverId to payload
                        orderId: currentOrder._id,
                        lat: latitude,
                        lng: longitude
                    });
                }
            },
            (err) => {
                console.error('Geolocation error:', err);
                toast.error(`Location Error: ${err.message}`);
            },
            { enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 }
        );

        return () => {
            navigator.geolocation.clearWatch(watchId);
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, []);

    // Re-fetch when active order status might have changed
    useEffect(() => {
        if (!activeOrder) fetchData();
    }, [activeOrder]);

    const handleStatusUpdate = async (order, status, extraData = {}) => {
        try {
            await api.put(`/orders/${order._id}/status`, { status, ...extraData });
            toast.success(`Order status updated to ${status}`);

            if (status === 'Out for Delivery') setActiveOrder(order);
            if (status === 'Picked Up') {
                fetchData();
            }
            fetchData();
        } catch (error) {
            toast.error('Update failed');
        }
    };

    const handlePickupSubmit = async () => {
        if (!pickupImage) {
            toast.error('Please upload a pickup proof image');
            return;
        }
        await handleStatusUpdate(activeOrder, 'Picked Up', { pickup_proof: pickupImage });
        setIsPickupModalVisible(false);
        setActiveOrder(prev => ({ ...prev, status: 'Picked Up' }));
    };

    const verifyOTP = async () => {
        try {
            await api.put(`/orders/${activeOrder._id}/verify`, { otp });
            toast.success('OTP Verified! Order Delivered');
            setIsOTPModalVisible(false);
            setActiveOrder(null);
            setOtp('');
            fetchData();
        } catch (error) {
            toast.error('Invalid OTP. Please try again.');
        }
    };

    const openNavigation = (lat, lng) => {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onloadend = () => {
            setPickupImage(reader.result);
        };
        if (file) {
            reader.readAsDataURL(file);
        }
    };

    const columns = [
        { field: 'id', headerName: 'ID', width: 80, renderCell: (p) => p.value.slice(-4).toUpperCase() },
        { field: 'dest_addr', headerName: 'Address', flex: 1 },
        { field: 'priority', headerName: 'Priority', width: 100, renderCell: (p) => <Chip label={p.value} size="small" color={p.value === 'Urgent' ? 'error' : 'default'} /> },
        {
            field: 'status',
            headerName: 'Status',
            width: 140,
            renderCell: (p) => <Chip label={p.value} size="small" variant="outlined" />
        },
        {
            field: 'action',
            headerName: 'Action',
            width: 180,
            renderCell: (params) => {
                const order = params.row;
                if (order.status === 'Assigned') {
                    return (
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={() => setActiveOrder(order)}
                        >
                            Start Mission
                        </Button>
                    )
                } else if (order.status === 'Picked Up') {
                    return (
                        <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleStatusUpdate(order, 'Out for Delivery')}
                        >
                            Start Delivery
                        </Button>
                    )
                } else if (order.status === 'Out for Delivery') {
                    return <Chip label="In Progress" color="success" size="small" />
                }
                return null;
            }
        }
    ];

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2 }}>
                <Typography variant="h4" fontWeight="bold" color="primary">Driver Hub</Typography>
                <Chip icon={<MyLocation fontSize="small" />} label="Live Tracking Active" color="success" variant="outlined" />
            </Box>

            <Grid container spacing={4}>
                <Grid size={{ xs: 12, lg: 8 }}>
                    {activeOrder && (activeOrder.status === 'Out for Delivery' || activeOrder.status === 'Assigned' || activeOrder.status === 'Picked Up') ? (
                        <Card sx={{ borderRadius: 2, boxShadow: 3, mb: 4, border: '2px solid', borderColor: activeOrder.status === 'Assigned' ? 'orange' : 'primary.main' }}>
                            <CardHeader
                                title={activeOrder.status === 'Assigned' ? "Pickup Mission" : "Active Delivery"}
                                subheader={activeOrder.status === 'Assigned' ? "Go to Pickup Location" : "Deliver to Customer"}
                                action={
                                    <Stack direction="row" spacing={1}>
                                        <Button startIcon={<ChatIcon />} variant="outlined" onClick={() => setIsChatOpen(!isChatOpen)} disabled>
                                            {/*isChatOpen ? 'Close Chat' : 'Chat'*/} Chat Disabled
                                        </Button>
                                        <Button startIcon={<OpenInNew />} onClick={() => {
                                            const target = activeOrder.status === 'Assigned' ? activeOrder.pickup_coordinates : activeOrder.dest_coordinates;
                                            openNavigation(target?.lat || 0, target?.lng || 0)
                                        }}>
                                            Map
                                        </Button>
                                    </Stack>
                                }
                            />
                            <Divider />
                            <CardContent>
                                <Grid container spacing={3}>
                                    <Grid size={{ xs: 12, md: 7 }}>
                                        <Box sx={{ height: 400, borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
                                            <MapContainer center={currentPos} zoom={14} key={`${activeOrder._id}-${activeOrder.status}`} style={{ height: '100%', width: '100%' }}>
                                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                                <Marker position={currentPos} icon={vehicleIcon}><Popup>Your Vehicle</Popup></Marker>

                                                {(activeOrder.status === 'Assigned') ? (
                                                    <>
                                                        <Marker position={[activeOrder.pickup_coordinates?.lat || currentPos[0], activeOrder.pickup_coordinates?.lng || currentPos[1]]}>
                                                            <Popup>Pickup Location</Popup>
                                                        </Marker>
                                                        {activeOrder.pickup_coordinates && (
                                                            <RoutingControl start={currentPos} end={activeOrder.pickup_coordinates} />
                                                        )}
                                                    </>
                                                ) : (
                                                    <>
                                                        <Marker position={[activeOrder.dest_coordinates.lat, activeOrder.dest_coordinates.lng]}>
                                                            <Popup>Destination</Popup>
                                                        </Marker>
                                                        {activeOrder.dest_coordinates && (
                                                            <RoutingControl start={currentPos} end={activeOrder.dest_coordinates} />
                                                        )}
                                                    </>
                                                )}
                                            </MapContainer>
                                        </Box>
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 5 }}>
                                        <Stack spacing={2}>
                                            <Paper sx={{ p: 2, bgcolor: activeOrder.status === 'Assigned' ? 'warning.light' : 'primary.light', color: activeOrder.status === 'Assigned' ? 'warning.contrastText' : 'primary.contrastText' }}>
                                                <Typography variant="caption">{activeOrder.status === 'Assigned' ? "PICKUP FROM" : "DELIVER TO"}</Typography>
                                                <Typography variant="h6" fontWeight="bold">
                                                    {activeOrder.status === 'Assigned' ? (activeOrder.sender?.name || 'Warehouse') : activeOrder.receiver_name}
                                                </Typography>
                                                <Typography variant="body2">
                                                    {activeOrder.status === 'Assigned' ? activeOrder.pickup_addr : activeOrder.dest_addr}
                                                </Typography>
                                            </Paper>

                                            {activeOrder.status === 'Assigned' && (
                                                <Button variant="contained" color="warning" size="large" fullWidth onClick={() => {
                                                    setPickupImage('');
                                                    setIsPickupModalVisible(true);
                                                }} startIcon={<CameraAlt />}>
                                                    Arrived & Confirm Pickup
                                                </Button>
                                            )}

                                            {activeOrder.status === 'Picked Up' && (
                                                <Button variant="contained" color="primary" size="large" fullWidth onClick={() => handleStatusUpdate(activeOrder, 'Out for Delivery')}>
                                                    Start Route (Out for Delivery)
                                                </Button>
                                            )}

                                            {activeOrder.status === 'Out for Delivery' && (
                                                <Button variant="contained" color="success" size="large" fullWidth onClick={() => setIsOTPModalVisible(true)} startIcon={<CheckCircle />}>
                                                    Confirm Delivery (OTP)
                                                </Button>
                                            )}

                                            <Button variant="outlined" color="error" fullWidth onClick={() => setActiveOrder(null)}>
                                                Minimize / Back to List
                                            </Button>
                                        </Stack>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    ) : (
                        <Paper sx={{ p: 10, textAlign: 'center', bgcolor: 'grey.50', borderRadius: 2, mb: 4 }}>
                            <DirectionsCar sx={{ fontSize: 64, color: 'disabled', mb: 2 }} />
                            <Typography variant="h5" color="text.secondary">No Active Delivery</Typography>
                            <Typography variant="body2" color="text.secondary">Select a task from your schedule to begin.</Typography>
                        </Paper>
                    )}

                    <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
                        <CardHeader title="Optimized Daily Schedule" subheader="Sorted by proximity and priority" />
                        <div style={{ height: 400, width: '100%' }}>
                            <DataGrid
                                rows={orders.filter(o => !activeOrder || o._id !== activeOrder._id)}
                                columns={columns}
                                pageSize={5}
                                rowsPerPageOptions={[5]}
                                disableSelectionOnClick
                                loading={loading}
                            />
                        </div>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, lg: 4 }}>
                    <Card sx={{ borderRadius: 2, boxShadow: 3, mb: 3 }}>
                        <CardHeader title="Route Overview" />
                        <CardContent>
                            <Stack spacing={2}>
                                {orders.map((order, idx) => (
                                    <Box key={order._id} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                        <Typography variant="h6" color="primary">{idx + 1}</Typography>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="body2" fontWeight="bold">{order.receiver_name}</Typography>
                                            <Typography variant="caption" color="text.secondary" noWrap display="block">{order.dest_addr}</Typography>
                                        </Box>
                                        <Chip label={order.priority} size="small" color={order.priority === 'Urgent' ? 'error' : 'default'} />
                                    </Box>
                                ))}
                                {orders.length === 0 && <Typography variant="body2" color="text.secondary">All clear!</Typography>}
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Floating Chat Window (Disabled) */}
            {/*activeOrder && isChatOpen && (
                <Box sx={{ position: 'fixed', bottom: 30, right: 30, zIndex: 9999 }}>
                    <ChatWindow orderId={activeOrder._id} height="500px" onClose={() => setIsChatOpen(false)} />
                </Box>
            )*/}

            {/* OTP Modal */}
            <Dialog open={isOTPModalVisible} onClose={() => setIsOTPModalVisible(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ textAlign: 'center' }}>
                    <Lock fontSize="large" color="primary" sx={{ mb: 1 }} />
                    <Typography variant="h6">Enter Customer OTP</Typography>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" align="center" paragraph>
                        Ask the customer for the 6-digit code shown in their app.
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                        <TextField
                            placeholder="0 0 0 0 0 0"
                            fullWidth
                            inputProps={{ maxLength: 6, style: { textAlign: 'center', letterSpacing: '8px', fontSize: '24px' } }}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
                    <Button onClick={verifyOTP} variant="contained" size="large">Complete Delivery</Button>
                </DialogActions>
            </Dialog>

            {/* Pickup Confirmation Modal */}
            <Dialog open={isPickupModalVisible} onClose={() => setIsPickupModalVisible(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ textAlign: 'center' }}>
                    <CameraAlt fontSize="large" color="primary" sx={{ mb: 1 }} />
                    <Typography variant="h6">Confirm Pickup</Typography>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" align="center" paragraph>
                        Please upload a photo of the package to confirm pickup.
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, my: 2 }}>
                        <Button
                            variant="outlined"
                            component="label"
                            startIcon={<CameraAlt />}
                        >
                            Upload Image
                            <input
                                type="file"
                                hidden
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        if (file.size > 5 * 1024 * 1024) {
                                            toast.error('File too large (Max 5MB)');
                                            return;
                                        }
                                        handleImageUpload(e);
                                    }
                                }}
                            />
                        </Button>
                        {pickupImage && (
                            <Box sx={{ width: '100%', height: 200, borderRadius: 2, overflow: 'hidden', border: '1px solid #ddd' }}>
                                <img src={pickupImage} alt="Pickup Proof" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </Box>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
                    <Button onClick={handlePickupSubmit} variant="contained" size="large" disabled={!pickupImage}>
                        Confirm Pickup
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default DriverDashboard;
