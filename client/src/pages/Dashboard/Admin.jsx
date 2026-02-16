import { useState, useEffect } from 'react';
import {
    Grid, Card, CardContent, Typography, Button,
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, MenuItem, Box, Chip, IconButton,
    Container, Tab, Tabs, Stack, Tooltip, Rating
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
    Add, LocalShipping, CheckCircle, Schedule, Person,
    Refresh, Delete, Map as MapIcon, BarChart, RateReview
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ChartTooltip, Legend } from 'recharts';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import DispatchMap from '../../components/DispatchMap';
import LocationPicker from '../../components/LocationPicker';
import ChatIcon from '@mui/icons-material/Chat';
import ChatWindow from '../../components/ChatWindow';

const AdminDashboard = () => {
    const [tab, setTab] = useState(0);
    const [orders, setOrders] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [analytics, setAnalytics] = useState({});
    const [loading, setLoading] = useState(false);
    const [isOrderModalVisible, setIsOrderModalVisible] = useState(false);
    const [isChatModalVisible, setIsChatModalVisible] = useState(false);
    const [selectedChatOrderId, setSelectedChatOrderId] = useState(null);

    // Form States
    const [formData, setFormData] = useState({
        receiver_name: '',
        receiver_phone: '',
        pickup_addr: '',
        dest_addr: '',
        weight: '',
        sender_id: '',
        priority: 'Standard',
        pickup_coordinates: { lat: 12.9716, lng: 77.5946 },
        dest_coordinates: { lat: 12.9716, lng: 77.5946 }
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [ordersRes, driversRes, analyticsRes, usersRes, reviewsRes] = await Promise.all([
                api.get('/orders'),
                api.get('/admin/drivers'),
                api.get('/admin/analytics'),
                api.get('/admin/customers'), // Reusing customers for now, we'll see if we need a global user list
                api.get('/reviews')
            ]);

            // Fetch all users (Admins should be able to see everyone)
            const allUsersRes = await api.get('/admin/drivers'); // Temporary, should be a general user endpoint
            const customersRes = await api.get('/admin/customers');
            setAllUsers([...allUsersRes.data, ...customersRes.data].map(u => ({ ...u, id: u._id })));

            setOrders(ordersRes.data.map((order, index) => ({ ...order, id: order._id || index })));
            setDrivers(driversRes.data);
            setReviews(reviewsRes?.data?.map((r, i) => ({ ...r, id: r._id || i })) || []);
            setAnalytics(analyticsRes.data);
        } catch (error) {
            toast.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCreateOrder = async () => {
        // Validation
        if (!formData.receiver_name || !formData.receiver_phone || !formData.pickup_addr || !formData.dest_addr || !formData.weight) {
            toast.error('Please fill in all required fields');
            return;
        }
        if (!/^\d{10,15}$/.test(formData.receiver_phone)) {
            toast.error('Receiver phone must be 10-15 digits');
            return;
        }
        if (Number(formData.weight) <= 0) {
            toast.error('Weight must be greater than 0');
            return;
        }

        try {
            await api.post('/orders', formData);
            toast.success('Order created successfully');
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
            toast.error('Failed to create order');
        }
    };

    const handleAssignDriver = async (orderId, driverId) => {
        try {
            await api.put(`/orders/${orderId}/assign`, { driver_id: driverId });
            toast.success('Driver assigned');
            fetchData();
        } catch (error) {
            toast.error('Failed to assign driver');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await api.delete(`/admin/users/${userId}`);
                toast.success('User deleted');
                fetchData();
            } catch (error) {
                toast.error(error.response?.data?.message || 'Delete failed');
            }
        }
    };

    const handleApproveUser = async (userId) => {
        try {
            await api.put(`/admin/users/${userId}/approve`);
            toast.success('User approved successfully');
            fetchData();
        } catch (error) {
            toast.error('Failed to approve user');
        }
    };

    const handleExportManifest = () => {
        const headers = ['Order ID', 'Receiver', 'Address', 'Status', 'Weight', 'Priority'];
        const csvContent = [
            headers.join(','),
            ...orders.map(o => [
                o._id,
                o.receiver_name,
                `"${o.dest_addr}"`,
                o.status,
                o.weight,
                o.priority
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `manifest_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const orderColumns = [
        { field: '_id', headerName: 'Order ID', width: 100, renderCell: (params) => params.value.slice(-6).toUpperCase() },
        { field: 'receiver_name', headerName: 'Receiver', width: 150 },
        { field: 'dest_addr', headerName: 'Destination', flex: 1 },
        {
            field: 'status',
            headerName: 'Status',
            width: 130,
            renderCell: (params) => {
                let color = 'warning';
                if (params.value === 'Delivered') color = 'success';
                if (params.value === 'Out for Delivery') color = 'info';
                if (params.value === 'Cancelled') color = 'error';
                return <Chip label={params.value} color={color} size="small" />;
            }
        },
        {
            field: 'driver_id',
            headerName: 'Driver',
            width: 200,
            renderCell: (params) => (
                <TextField
                    select
                    size="small"
                    value={params.row.driver_id?._id || params.row.driver_id || ''}
                    onChange={(e) => handleAssignDriver(params.row._id, e.target.value)}
                    sx={{ width: '100%' }}
                >
                    <MenuItem value=""><em>Unassigned</em></MenuItem>
                    {drivers.map((driver) => (
                        <MenuItem key={driver._id} value={driver._id}>
                            {driver.name}
                        </MenuItem>
                    ))}
                </TextField>
            )
        }
    ];

    const userColumns = [
        { field: 'name', headerName: 'Name', width: 200 },
        { field: 'email', headerName: 'Email', width: 250 },
        { field: 'role', headerName: 'Role', width: 120, renderCell: (params) => <Chip label={params.value} size="small" variant="outlined" color={params.value === 'Driver' ? 'primary' : 'secondary'} /> },
        {
            field: 'isApproved',
            headerName: 'Status',
            width: 120,
            renderCell: (params) => (
                <Chip
                    label={params.value ? 'Active' : 'Pending'}
                    color={params.value ? 'success' : 'warning'}
                    size="small"
                />
            )
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 180,
            renderCell: (params) => (
                <Stack direction="row" spacing={1}>
                    {!params.row.isApproved && (
                        <Button
                            variant="contained"
                            color="success"
                            size="small"
                            onClick={() => handleApproveUser(params.row._id)}
                        >
                            Approve
                        </Button>
                    )}
                    <IconButton onClick={() => handleDeleteUser(params.row._id)} color="error" size="small">
                        <Delete />
                    </IconButton>
                </Stack>
            )
        }
    ];

    const reviewColumns = [
        { field: 'type', headerName: 'Type', width: 120, renderCell: (params) => <Chip label={params.value} color={params.value === 'Complaint' ? 'error' : 'success'} size="small" /> },
        { field: 'createdAt', headerName: 'Date', width: 120, renderCell: (params) => new Date(params.value).toLocaleDateString() },
        {
            field: 'rating',
            headerName: 'Rating',
            width: 140,
            renderCell: (params) => (
                params.row.type === 'Review' ? <Rating value={params.value} readOnly size="small" /> : 'N/A'
            )
        },
        { field: 'feedback', headerName: 'Feedback / Issue', flex: 1 },
        { field: 'driver', headerName: 'Driver', width: 150, valueGetter: (params) => params.row?.driver?.name || 'Unknown' },
        { field: 'customer', headerName: 'Customer', width: 150, valueGetter: (params) => params.row?.customer?.name || 'Unknown' },
        { field: 'order', headerName: 'Order ID', width: 100, valueGetter: (params) => params.row?.order?.id ? params.row.order.id.slice(-6).toUpperCase() : 'N/A' }
    ];

    const chartData = [
        { name: 'Pending', value: analytics.pendingOrders || 0, color: '#FFB84D' },
        { name: 'Delivered', value: analytics.deliveredOrders || 0, color: '#4CAF50' },
        { name: 'Out for Delivery', value: analytics.outForDeliveryOrders || 0, color: '#2196F3' },
    ];

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, mb: 4, gap: 2 }}>
                <Typography variant="h4" fontWeight="bold" color="primary">iLDTS Dispatch Center</Typography>
                <Stack direction="row" spacing={2} sx={{ width: { xs: '100%', md: 'auto' }, justifyContent: { xs: 'flex-end', md: 'flex-start' } }}>
                    <IconButton onClick={fetchData} color="primary"><Refresh /></IconButton>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => setIsOrderModalVisible(true)}
                        fullWidth={false} // explicit
                    >
                        New Order
                    </Button>
                </Stack>
            </Box>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <Card sx={{ bgcolor: 'primary.main', color: 'white', borderRadius: 2, boxShadow: 3 }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                            <LocalShipping sx={{ fontSize: 40, mr: 2 }} />
                            <Box>
                                <Typography variant="subtitle2">Total Logistics</Typography>
                                <Typography variant="h4" fontWeight="bold">{analytics.totalOrders || 0}</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <Card sx={{ bgcolor: 'success.main', color: 'white', borderRadius: 2, boxShadow: 3 }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                            <CheckCircle sx={{ fontSize: 40, mr: 2 }} />
                            <Box>
                                <Typography variant="subtitle2">Delivered</Typography>
                                <Typography variant="h4" fontWeight="bold">{analytics.deliveredOrders || 0}</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <Card sx={{ bgcolor: 'warning.main', color: 'white', borderRadius: 2, boxShadow: 3 }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                            <Schedule sx={{ fontSize: 40, mr: 2 }} />
                            <Box>
                                <Typography variant="subtitle2">Pending Ops</Typography>
                                <Typography variant="h4" fontWeight="bold">{analytics.pendingOrders || 0}</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <Card sx={{ bgcolor: 'info.main', color: 'white', borderRadius: 2, boxShadow: 3 }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                            <Person sx={{ fontSize: 40, mr: 2 }} />
                            <Box>
                                <Typography variant="subtitle2">Active Fleet</Typography>
                                <Typography variant="h4" fontWeight="bold">{analytics.totalDrivers || 0}</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={tab} onChange={(e, v) => setTab(v)}>
                    <Tab icon={<LocalShipping sx={{ mr: 1 }} />} label="Orders" iconPosition="start" />
                    <Tab icon={<Person sx={{ mr: 1 }} />} label="User Management" iconPosition="start" />
                    <Tab icon={<MapIcon sx={{ mr: 1 }} />} label="Live Fleet Map" iconPosition="start" />
                    <Tab icon={<BarChart sx={{ mr: 1 }} />} label="Analytics" iconPosition="start" />
                    <Tab icon={<RateReview sx={{ mr: 1 }} />} label="Reviews & Reports" iconPosition="start" />
                </Tabs>
            </Box>

            {tab === 0 && (
                <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
                    <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="outlined"
                            startIcon={<BarChart />}
                            onClick={handleExportManifest}
                            disabled={orders.length === 0}
                        >
                            Export Manifest (CSV)
                        </Button>
                    </Box>
                    <div style={{ height: 500, width: '100%' }}>
                        <DataGrid
                            rows={orders}
                            columns={orderColumns}
                            pageSize={8}
                            rowsPerPageOptions={[8]}
                            disableSelectionOnClick
                            loading={loading}
                        />
                    </div>
                </Card>
            )}

            {tab === 1 && (
                <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
                    <div style={{ height: 500, width: '100%' }}>
                        <DataGrid
                            rows={allUsers}
                            columns={userColumns}
                            pageSize={8}
                            rowsPerPageOptions={[8]}
                            disableSelectionOnClick
                            loading={loading}
                        />
                    </div>
                </Card>
            )}

            {tab === 2 && (
                <Box sx={{ height: 600, borderRadius: 2, overflow: 'hidden', boxShadow: 3 }}>
                    <DispatchMap orders={orders} drivers={drivers} />
                </Box>
            )}

            {tab === 3 && (
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Card sx={{ p: 3, borderRadius: 2, height: 400 }}>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>Order Status Breakdown</Typography>
                            <ResponsiveContainer width="100%" height="90%">
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        innerRadius={80}
                                        outerRadius={120}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <ChartTooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Card sx={{ p: 3, borderRadius: 2, height: 400, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>Performance Metrics</Typography>
                            <Typography variant="body2" color="text.secondary" align="center">
                                Detailed delivery performance and route efficiency metrics will be displayed here as more data is collected.
                            </Typography>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {tab === 4 && (
                <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
                    <div style={{ height: 500, width: '100%' }}>
                        <DataGrid
                            rows={reviews}
                            columns={reviewColumns}
                            pageSize={8}
                            rowsPerPageOptions={[8]}
                            disableSelectionOnClick
                            loading={loading}
                        />
                    </div>
                </Card>
            )}

            <Dialog open={isOrderModalVisible} onClose={() => setIsOrderModalVisible(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>Create New Delivery Order</DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <Grid container spacing={4}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Order Details</Typography>
                            <TextField
                                select
                                margin="dense"
                                fullWidth
                                label="Select Customer (Optional)"
                                name="sender_id"
                                value={formData.sender_id}
                                onChange={handleChange}
                            >
                                <MenuItem value="">
                                    <em>None (Self)</em>
                                </MenuItem>
                                {allUsers.filter(u => u.role === 'Customer').map((user) => (
                                    <MenuItem key={user._id} value={user._id}>
                                        {user.name} ({user.email})
                                    </MenuItem>
                                ))}
                            </TextField>
                            <TextField margin="dense" fullWidth label="Receiver Name" name="receiver_name" value={formData.receiver_name} onChange={handleChange} />
                            <TextField margin="dense" fullWidth label="Receiver Phone" name="receiver_phone" value={formData.receiver_phone} onChange={handleChange} />
                            <TextField margin="dense" fullWidth label="Pickup Address" name="pickup_addr" value={formData.pickup_addr} onChange={handleChange} />
                            <TextField margin="dense" fullWidth label="Destination Address" name="dest_addr" value={formData.dest_addr} onChange={handleChange} />
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 6 }}>
                                    <TextField margin="dense" fullWidth label="Weight (kg)" name="weight" type="number" value={formData.weight} onChange={handleChange} />
                                </Grid>
                                <Grid size={{ xs: 6 }}>
                                    <TextField select margin="dense" fullWidth label="Priority" name="priority" value={formData.priority} onChange={handleChange}>
                                        <MenuItem value="Standard">Standard</MenuItem>
                                        <MenuItem value="Urgent">Urgent</MenuItem>
                                        <MenuItem value="High Priority">High Priority</MenuItem>
                                    </TextField>
                                </Grid>
                            </Grid>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <LocationPicker
                                label="Set Pickup Location"
                                onLocationSelect={(coords) => setFormData(prev => ({ ...prev, pickup_coordinates: coords }))}
                            />
                            <LocationPicker
                                label="Set Destination Location"
                                onLocationSelect={(coords) => setFormData(prev => ({ ...prev, dest_coordinates: coords }))}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
                    <Button onClick={() => setIsOrderModalVisible(false)} color="inherit">Cancel</Button>
                    <Button onClick={handleCreateOrder} variant="contained" color="primary" size="large">
                        Confirm & Create Order
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Chat Modal (Disabled) */}
            {/* 
            <Dialog
                open={isChatModalVisible}
                onClose={() => setIsChatModalVisible(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: '16px', bgcolor: 'transparent', boxShadow: 'none' }
                }}
            >
                {selectedChatOrderId && (
                    <ChatWindow
                        orderId={selectedChatOrderId}
                        height="600px"
                        onClose={() => setIsChatModalVisible(false)}
                    />
                )}
            </Dialog>
            */}
        </Container>
    );
};

export default AdminDashboard;
