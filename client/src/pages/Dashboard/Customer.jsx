import { useState, useEffect, useRef } from 'react';
import {
    Grid, Card, CardContent, CardHeader, Typography,
    Button, Stepper, Step, StepLabel, Box, Chip,
    Stack, Container, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, MenuItem, Paper, Avatar,
    Fab
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
    LocalShipping, Place, AccessTime,
    Visibility, Person, Add, LocationOn, Chat as ChatIcon,
    CreditCard
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import io from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import LocationPicker from '../../components/LocationPicker';
import ChatWindow from '../../components/ChatWindow';

// Fix for default marker icon missing
const driverIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/1986/1986937.png',
    iconSize: [35, 35],
    iconAnchor: [17, 35],
    popupAnchor: [0, -35]
});

// Helper component to auto-center map
const MapRecenter = ({ position }) => {
    const map = useMap();
    useEffect(() => {
        if (position) {
            map.flyTo(position, 14);
        }
    }, [position, map]);
    return null;
};
import FeedbackModal from '../../components/FeedbackModal';
import { Star, ReportProblem } from '@mui/icons-material';

const CustomerDashboard = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    // driverPos and eta moved to specialized state with persistence
    const [showOTP, setShowOTP] = useState(false);
    const [isOrderModalVisible, setIsOrderModalVisible] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const socketRef = useRef();

    // Feedback State
    const [feedbackOpen, setFeedbackOpen] = useState(false);
    const [feedbackType, setFeedbackType] = useState('Review');

    const [phoneError, setPhoneError] = useState('');
    const [formData, setFormData] = useState({
        receiver_name: '',
        receiver_phone: '',
        pickup_addr: '',
        dest_addr: '',
        weight: '1',
        priority: 'Standard',
        pickup_coordinates: { lat: 12.9716, lng: 77.5946 },
        dest_coordinates: { lat: 12.9716, lng: 77.5946 }
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/orders');
            setOrders(data.map((order, index) => ({ ...order, id: order._id || index })));
        } catch (error) {
            toast.error('Failed to fetch orders');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        socketRef.current = io(import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000');
        return () => socketRef.current.disconnect();
    }, []);

    const [driverPos, setDriverPos] = useState(() => {
        const saved = localStorage.getItem('last_driver_pos');
        return saved ? JSON.parse(saved) : null;
    });

    const [eta, setEta] = useState(() => {
        return localStorage.getItem('last_eta');
    });

    useEffect(() => {
        if (driverPos) {
            localStorage.setItem('last_driver_pos', JSON.stringify(driverPos));
        }
    }, [driverPos]);

    useEffect(() => {
        if (eta) {
            localStorage.setItem('last_eta', eta);
        }
    }, [eta]);

    useEffect(() => {
        if (selectedOrder && (selectedOrder.status === 'Out for Delivery' || selectedOrder.status === 'Picked Up' || selectedOrder.status === 'Assigned')) {
            // Join specific order room for this tracking session
            socketRef.current.emit('join_order', selectedOrder._id);

            // Listen for specific order updates (preferred)
            socketRef.current.on('location_updated', (data) => {
                if (data.lat && data.lng) {
                    setDriverPos([data.lat, data.lng]);
                    fetchETA(data.lat, data.lng);
                }
            });

            // Also listen for global driver updates as fallback
            socketRef.current.on('driver_location_updated', (data) => {
                const driverId = selectedOrder.driver_id?._id || selectedOrder.driver_id;
                if (driverId && String(data.driverId) === String(driverId)) {
                    if (data.lat && data.lng) {
                        setDriverPos([data.lat, data.lng]);
                        // Throttle ETA updates slightly if needed, but for now direct call is fine
                        fetchETA(data.lat, data.lng);
                    }
                }
            });

            // Initial fetch of driver location if available
            if (!driverPos && selectedOrder.driver_id && selectedOrder.driver_id.current_coordinates) {
                const { lat, lng } = selectedOrder.driver_id.current_coordinates;
                if (lat && lng) {
                    setDriverPos([lat, lng]);
                    fetchETA(lat, lng);
                }
            }
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.off('location_updated');
                socketRef.current.off('driver_location_updated');
            }
        };
    }, [selectedOrder, driverPos]); // Added driverPos to dependency array to ensure initial fetch only if not already set

    const fetchETA = async (lat, lng) => {
        if (!selectedOrder.dest_coordinates) return;

        try {
            const origin = `${lat},${lng}`;
            const dest = `${selectedOrder.dest_coordinates.lat},${selectedOrder.dest_coordinates.lng}`;
            const { data } = await api.get(`/tracking/eta?origin=${origin}&destination=${dest}`);
            if (data.duration) {
                setEta(data.duration);
            }
        } catch (error) {
            console.error('Failed to fetch ETA');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        if (name === 'receiver_phone') {
            if (value && !/^\d*$/.test(value)) {
                setPhoneError('Phone number must contain only digits');
            } else if (value && (value.length < 10 || value.length > 15)) {
                setPhoneError('Phone number must be 10-15 digits');
            } else {
                setPhoneError('');
            }
        }
    };

    const handleCreateOrder = async () => {
        if (!formData.receiver_name || !formData.pickup_addr || !formData.dest_addr || !formData.weight) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (phoneError || !formData.receiver_phone) {
            toast.error('Please enter a valid receiver phone number');
            return;
        }

        try {
            await api.post('/orders', formData);
            toast.success('Successful submission! Delivery request sent.');
            setIsOrderModalVisible(false);
            setFormData({
                receiver_name: '',
                receiver_phone: '',
                pickup_addr: '',
                dest_addr: '',
                weight: '',
                priority: 'Standard',
                pickup_coordinates: { lat: 12.9716, lng: 77.5946 },
                dest_coordinates: { lat: 12.9716, lng: 77.5946 }
            });
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send request');
        }
    };

    const handlePayment = async () => {
        // Simulation
        toast.success('Processing Payment...');
        setTimeout(async () => {
            toast.success('Payment Successful!');
            // Here we would api call to update isPaid
            // For now just UI feedback
        }, 1500);
    }

    const getStepStatus = (status) => {
        const statuses = ['Pending', 'Assigned', 'Picked Up', 'Out for Delivery', 'Delivered'];
        const index = statuses.indexOf(status);
        return index === -1 ? 0 : index;
    };

    const columns = [
        { field: '_id', headerName: 'Order ID', width: 100, renderCell: (params) => <Typography fontWeight="bold">{params.value.slice(-6).toUpperCase()}</Typography> },
        {
            field: 'status',
            headerName: 'Status',
            width: 150,
            renderCell: (params) => {
                const color = params.value === 'Delivered' ? 'success' : 'primary';
                return <Chip label={params.value.toUpperCase()} color={color} size="small" />;
            }
        },
        {
            field: 'priority',
            headerName: 'Priority',
            width: 120,
            renderCell: (params) => (
                <Chip label={params.value} color={params.value === 'Urgent' ? 'error' : 'default'} variant="outlined" size="small" />
            )
        },
        {
            field: 'action',
            headerName: 'Action',
            width: 120,
            renderCell: (params) => (
                <Button variant="outlined" size="small" onClick={() => { setSelectedOrder(params.row); setShowOTP(false); setIsChatOpen(false); }}>Track</Button>
            )
        }
    ];

    const steps = ['Pending', 'Assigned', 'Picked Up', 'Out for Delivery', 'Delivered'];

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, mb: 4, gap: 2 }}>
                <Typography variant="h4" fontWeight="bold" color="primary">My Shipments</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => setIsOrderModalVisible(true)} sx={{ width: { xs: '100%', md: 'auto' } }}>
                    Request New Delivery
                </Button>
            </Box>

            <Grid container spacing={4}>
                <Grid size={{ xs: 12, lg: 4 }}>
                    <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
                        <CardHeader title="Tracking History" />
                        <div style={{ height: 500, width: '100%' }}>
                            <DataGrid
                                rows={orders}
                                columns={columns}
                                pageSize={8}
                                rowsPerPageOptions={[8]}
                                disableSelectionOnClick
                                loading={loading}
                            />
                        </div>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, lg: 8 }}>
                    <AnimatePresence mode="wait">
                        {selectedOrder ? (
                            <motion.div key={selectedOrder._id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                                <Card sx={{ borderRadius: 2, boxShadow: 3, overflow: 'visible' }}>
                                    <Box sx={{ p: 3, bgcolor: 'primary.main', color: 'white', borderRadius: '8px 8px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Box>
                                            <Typography variant="h5" fontWeight="bold">Tracking: #{selectedOrder._id.slice(-6).toUpperCase()}</Typography>
                                            <Typography variant="body2" sx={{ opacity: 0.8 }}>Current Status: {selectedOrder.status}</Typography>
                                        </Box>
                                        <Box>
                                            {!selectedOrder.isPaid && selectedOrder.status === 'Pending' && (
                                                <Button variant="contained" color="secondary" startIcon={<CreditCard />} onClick={handlePayment} sx={{ mr: 2 }}>
                                                    Pay Now
                                                </Button>
                                            )}
                                            <Button variant="contained" color="warning" startIcon={<ChatIcon />} onClick={() => setIsChatOpen(!isChatOpen)} disabled title="Chat Disabled">
                                                {/*isChatOpen ? 'Close Chat' : 'Chat with Driver'*/} Chat Disabled
                                            </Button>
                                        </Box>
                                    </Box>
                                    <Box sx={{ p: 4 }}>
                                        <Stepper activeStep={getStepStatus(selectedOrder.status)} alternativeLabel sx={{ mb: 4 }}>
                                            {steps.map((label) => (
                                                <Step key={label}>
                                                    <StepLabel>{label}</StepLabel>
                                                </Step>
                                            ))}
                                        </Stepper>

                                        <Grid container spacing={3}>
                                            <Grid size={{ xs: 12, md: 7 }}>
                                                <Box sx={{ height: 400, borderRadius: 2, overflow: 'hidden', border: '1px solid #eee', position: 'relative' }}>
                                                    <MapContainer center={driverPos || [12.9716, 77.5946]} zoom={13} style={{ height: '100%', width: '100%' }}>
                                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                                        <MapRecenter position={driverPos} />
                                                        {driverPos && (
                                                            <Marker position={driverPos} icon={driverIcon}>
                                                                <Popup>Your Driver is here</Popup>
                                                            </Marker>
                                                        )}
                                                        {selectedOrder.dest_coordinates && (
                                                            <Marker position={[selectedOrder.dest_coordinates.lat, selectedOrder.dest_coordinates.lng]}>
                                                                <Popup>Destination</Popup>
                                                            </Marker>
                                                        )}


                                                    </MapContainer>
                                                </Box>
                                            </Grid>
                                            <Grid size={{ xs: 12, md: 5 }}>
                                                <Stack spacing={3}>
                                                    <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                                                        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                                            <LocationOn color="primary" />
                                                            <Box>
                                                                <Typography variant="caption" color="text.secondary">DESTINATION</Typography>
                                                                <Typography variant="body2" fontWeight="bold">{selectedOrder.dest_addr}</Typography>
                                                            </Box>
                                                        </Box>
                                                        <Box sx={{ display: 'flex', gap: 2 }}>
                                                            <AccessTime color="primary" />
                                                            <Box>
                                                                <Typography variant="caption" color="text.secondary">ESTIMATED ARRIVAL</Typography>
                                                                <Typography variant="body2" fontWeight="bold">
                                                                    {eta || (selectedOrder.status === 'Out for Delivery' ? 'Calculating...' : 'Pending')}
                                                                </Typography>
                                                            </Box>
                                                        </Box>
                                                    </Paper>

                                                    {selectedOrder.driver_id ? (
                                                        <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                                                            <Avatar sx={{ bgcolor: 'secondary.main' }}><Person /></Avatar>
                                                            <Box sx={{ flex: 1 }}>
                                                                <Typography variant="caption" color="text.secondary">YOUR DRIVER</Typography>
                                                                <Typography variant="body1" fontWeight="bold">{selectedOrder.driver_id.name}</Typography>
                                                                <Typography variant="body2" color="primary">{selectedOrder.driver_id.phone}</Typography>
                                                            </Box>
                                                            <Box>
                                                                <Button
                                                                    color="error"
                                                                    startIcon={<ReportProblem />}
                                                                    onClick={() => {
                                                                        setFeedbackType('Complaint');
                                                                        setFeedbackOpen(true);
                                                                    }}
                                                                    size="small"
                                                                >
                                                                    Report
                                                                </Button>
                                                            </Box>
                                                        </Paper>

                                                    ) : (
                                                        <Paper sx={{ p: 2, bgcolor: 'grey.50', textAlign: 'center' }}>
                                                            <Typography variant="body2" color="text.secondary">Driver assigning soon...</Typography>
                                                        </Paper>
                                                    )}

                                                    {selectedOrder.status === 'Out for Delivery' && (
                                                        <Card sx={{ bgcolor: 'secondary.main', color: 'white', p: 2, textAlign: 'center' }}>
                                                            <Typography variant="caption" gutterBottom>SECURE OTP</Typography>
                                                            <Box sx={{ my: 1 }}>
                                                                {showOTP ? (
                                                                    <Typography variant="h4" fontWeight="bold" letterSpacing={4}>{selectedOrder.otp}</Typography>
                                                                ) : (
                                                                    <Button variant="contained" color="warning" onClick={() => setShowOTP(true)}>Show OTP</Button>
                                                                )}
                                                            </Box>
                                                            <Typography variant="caption">Share this with the driver only</Typography>
                                                        </Card>
                                                    )}

                                                    {selectedOrder.status === 'Delivered' && (
                                                        <Button
                                                            variant="contained"
                                                            color="secondary"
                                                            startIcon={<Star />}
                                                            fullWidth
                                                            onClick={() => {
                                                                setFeedbackType('Review');
                                                                setFeedbackOpen(true);
                                                            }}
                                                            sx={{ mt: 2 }}
                                                        >
                                                            Rate Service
                                                        </Button>
                                                    )}
                                                </Stack>
                                            </Grid>
                                        </Grid>
                                    </Box>
                                </Card>
                            </motion.div>
                        ) : (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 500, bgcolor: 'grey.50', borderRadius: 2 }}>
                                <Box sx={{ textAlign: 'center', opacity: 0.5 }}>
                                    <LocalShipping sx={{ fontSize: 64, mb: 2 }} />
                                    <Typography variant="h6">Select an order to track</Typography>
                                </Box>
                            </Box>
                        )}
                    </AnimatePresence>
                </Grid>
            </Grid>

            {/* Floating Chat Window (Fixed Position) */}
            {/* Floating Chat Window (Disabled) */}
            {/* 
            {
                selectedOrder && isChatOpen && (
                    <Box
                        sx={{
                            position: 'fixed',
                            bottom: 30,
                            right: 30,
                            zIndex: 9999,
                            width: 'auto',
                            height: 'auto',
                            animation: 'fadeIn 0.3s ease-out',
                            '@keyframes fadeIn': {
                                '0%': { opacity: 0, transform: 'translateY(20px)' },
                                '100%': { opacity: 1, transform: 'translateY(0)' },
                            }
                        }}
                    >
                        <ChatWindow orderId={selectedOrder._id} height="500px" onClose={() => setIsChatOpen(false)} />
                    </Box>
                )
            }
            */}

            <Dialog open={isOrderModalVisible} onClose={() => setIsOrderModalVisible(false)} maxWidth="md" fullWidth>
                <DialogTitle>Request New Delivery Service</DialogTitle>
                <DialogContent>
                    <Grid container spacing={3} sx={{ mt: 1 }}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField margin="dense" fullWidth label="Receiver Name" name="receiver_name" value={formData.receiver_name} onChange={handleChange} />
                            <TextField
                                margin="dense"
                                fullWidth
                                label="Receiver Phone"
                                name="receiver_phone"
                                value={formData.receiver_phone}
                                onChange={handleChange}
                                error={!!phoneError}
                                helperText={phoneError}
                            />
                            <TextField margin="dense" fullWidth label="Pickup Address" name="pickup_addr" value={formData.pickup_addr} onChange={handleChange} />
                            <TextField margin="dense" fullWidth label="Destination Address" name="dest_addr" value={formData.dest_addr} onChange={handleChange} />
                            <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                                <TextField fullWidth label="Weight (kg)" name="weight" type="number" value={formData.weight} onChange={handleChange} />
                                <TextField select fullWidth label="Priority" name="priority" value={formData.priority} onChange={handleChange}>
                                    <MenuItem value="Standard">Standard</MenuItem>
                                    <MenuItem value="Urgent">Urgent</MenuItem>
                                </TextField>
                            </Stack>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <LocationPicker label="Pickup Location on Map" onLocationSelect={(c) => setFormData(p => ({ ...p, pickup_coordinates: c }))} />
                            <LocationPicker label="Destination Location on Map" onLocationSelect={(c) => setFormData(p => ({ ...p, dest_coordinates: c }))} />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setIsOrderModalVisible(false)}>Cancel</Button>
                    <Button onClick={handleCreateOrder} variant="contained" size="large">Submit Request</Button>
                </DialogActions>
            </Dialog>

            {/* Feedback Modal */}
            {
                selectedOrder && (
                    <FeedbackModal
                        open={feedbackOpen}
                        onClose={() => setFeedbackOpen(false)}
                        orderId={selectedOrder._id}
                        type={feedbackType}
                    />
                )
            }
        </Container >
    );
};

export default CustomerDashboard;
