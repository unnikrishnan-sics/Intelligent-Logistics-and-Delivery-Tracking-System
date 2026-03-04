
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container, Paper, Box, Typography, TextField, Button,
    Avatar, Grid, Card, CardContent, Divider, Stack, IconButton,
    InputAdornment,
    Chip
} from '@mui/material';
import {
    Person, Phone, Email, Edit, Save, Cancel, Badge,
    PersonOutline, LocalShipping, AdminPanelSettings
} from '@mui/icons-material';
import useAuthStore from '../store/authStore';
import api from '../utils/api';
import toast from 'react-hot-toast';

const Profile = () => {
    const { user, setUser, logout } = useAuthStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
        email: user?.email || '', // Read-only
    });

    const [phoneError, setPhoneError] = useState('');
    const emailChanged = formData.email !== user?.email;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        if (name === 'phone') {
            if (value && !/^\d*$/.test(value)) {
                setPhoneError('Phone number must contain only digits');
            } else if (value && (value.length < 10 || value.length > 15)) {
                setPhoneError('Phone number must be 10-15 digits');
            } else {
                setPhoneError('');
            }
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (phoneError || !formData.phone || !formData.name || !formData.email) {
            toast.error('Please fix the errors before saving');
            return;
        }

        setLoading(true);
        try {
            const { data } = await api.put('/auth/profile', {
                name: formData.name,
                phone: formData.phone,
                email: formData.email
            });

            if (emailChanged) {
                toast.success('Email updated. Please log in again with your new email.');
                logout();
                navigate('/login');
            } else {
                setUser(data, localStorage.getItem('token'));
                toast.success('Profile updated successfully');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Update failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="md" sx={{ py: 8 }}>
            <Box>
                <Grid container spacing={4}>
                    {/* Sidebar / Info */}
                    <Grid item xs={12} md={4}>
                        <Card sx={{
                            borderRadius: '24px',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                            overflow: 'hidden',
                            height: '100%'
                        }}>
                            <Box sx={{
                                height: '140px',
                                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                                position: 'relative'
                            }}>
                                <Avatar
                                    src={user?.avatar}
                                    sx={{
                                        width: 100,
                                        height: 100,
                                        border: '4px solid white',
                                        position: 'absolute',
                                        bottom: '-50px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    {user?.name?.charAt(0)}
                                </Avatar>
                            </Box>
                            <CardContent sx={{ pt: 8, textAlign: 'center' }}>
                                <Typography variant="h5" fontWeight="bold" gutterBottom>
                                    {user?.name}
                                </Typography>
                                <Chip
                                    label={user?.role}
                                    color="primary"
                                    variant="outlined"
                                    size="small"
                                    sx={{ mb: 3 }}
                                />
                                <Divider sx={{ my: 2 }} />
                                <Stack spacing={2} sx={{ textAlign: 'left' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Email color="action" fontSize="small" />
                                        <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Phone color="action" fontSize="small" />
                                        <Typography variant="body2" color="text.secondary">{user?.phone}</Typography>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Edit Form */}
                    <Grid item xs={12} md={8}>
                        <Paper sx={{
                            p: 4,
                            borderRadius: '24px',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                            border: '1px solid rgba(0,0,0,0.04)'
                        }}>
                            <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 4 }}>
                                Edit Profile
                            </Typography>

                            <form onSubmit={handleUpdate}>
                                <Stack spacing={3}>
                                    <TextField
                                        fullWidth
                                        label="Full Name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        variant="outlined"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <PersonOutline color="primary" />
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                                    />

                                    <TextField
                                        fullWidth
                                        label="Phone Number"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        required
                                        error={!!phoneError}
                                        helperText={phoneError}
                                        variant="outlined"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Phone color="primary" />
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                                    />

                                    <TextField
                                        fullWidth
                                        label="Email Address"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        variant="outlined"
                                        helperText={emailChanged ? "Note: Changing your email will log you out" : "Login identity"}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Email color="primary" />
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                                    />

                                    <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                                        <Button
                                            type="submit"
                                            variant="contained"
                                            size="large"
                                            disabled={loading}
                                            startIcon={<Save />}
                                            sx={{
                                                borderRadius: '12px',
                                                px: 4,
                                                py: 1.5,
                                                boxShadow: '0 8px 20px rgba(25, 118, 210, 0.3)',
                                                textTransform: 'none',
                                                fontSize: '1rem'
                                            }}
                                        >
                                            {loading ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                    </Box>
                                </Stack>
                            </form>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        </Container>
    );
};

export default Profile;
