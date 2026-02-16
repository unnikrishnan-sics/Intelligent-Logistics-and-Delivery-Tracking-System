import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    Box,
    IconButton,
    Menu,
    MenuItem,
    useMediaQuery,
    useTheme
} from '@mui/material';
import {
    Logout,
    Dashboard,
    DirectionsCar,
    Person,
    Inventory2,
    Menu as MenuIcon,
    LocalShipping
} from '@mui/icons-material';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { useState } from 'react';

const Navbar = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const location = useLocation();

    const [anchorEl, setAnchorEl] = useState(null);

    const handleLogout = () => {
        logout();
        toast.success('Logged out successfully');
        navigate('/login');
        setAnchorEl(null);
    };

    const handleMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const menuItems = [
        {
            key: 'home',
            label: 'Home',
            path: '/',
            icon: <Dashboard />,
        },
    ];

    if (user?.role === 'Admin') {
        menuItems.push({
            key: 'admin',
            label: 'Admin Panel',
            path: '/admin',
            icon: <Person />,
        });
    } else if (user?.role === 'Driver') {
        menuItems.push({
            key: 'driver',
            label: 'Deliveries',
            path: '/driver',
            icon: <DirectionsCar />,
        });
    } else if (user?.role === 'Customer') {
        menuItems.push({
            key: 'customer',
            label: 'My Orders',
            path: '/customer',
            icon: <Inventory2 />,
        });
    }

    return (
        <AppBar position="sticky" color="inherit" sx={{
            backdropFilter: 'blur(10px)',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
            <Toolbar>
                {/* Logo */}
                <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
                    <LocalShipping sx={{ color: 'primary.main', mr: 1, fontSize: 30 }} />
                    <Typography
                        variant="h6"
                        component={Link}
                        to="/"
                        sx={{
                            textDecoration: 'none',
                            color: 'primary.main',
                            fontWeight: 'bold',
                            letterSpacing: 1
                        }}
                    >
                        iLDTS
                    </Typography>
                </Box>

                {/* Desktop Menu */}
                {!isMobile && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {menuItems.map((item) => (
                            <Button
                                key={item.key}
                                component={Link}
                                to={item.path}
                                startIcon={item.icon}
                                sx={{
                                    color: location.pathname === item.path ? 'primary.main' : 'text.primary',
                                    fontWeight: location.pathname === item.path ? 'bold' : 'normal'
                                }}
                            >
                                {item.label}
                            </Button>
                        ))}

                        {user ? (
                            <Box sx={{ ml: 2, display: 'flex', alignItems: 'center' }}>
                                <Typography variant="body2" sx={{ mr: 2, fontWeight: 500 }}>
                                    {user.name}
                                </Typography>
                                <Button
                                    variant="outlined"
                                    color="error"
                                    size="small"
                                    startIcon={<Logout />}
                                    onClick={handleLogout}
                                >
                                    Logout
                                </Button>
                            </Box>
                        ) : (
                            <Box sx={{ ml: 2 }}>
                                <Button component={Link} to="/login" color="inherit">
                                    Login
                                </Button>
                                <Button
                                    component={Link}
                                    to="/register"
                                    variant="contained"
                                    color="primary"
                                    sx={{ ml: 1 }}
                                >
                                    Register
                                </Button>
                            </Box>
                        )}
                    </Box>
                )}

                {/* Mobile Menu */}
                {isMobile && (
                    <>
                        <IconButton
                            size="large"
                            edge="start"
                            color="inherit"
                            aria-label="menu"
                            onClick={handleMenu}
                        >
                            <MenuIcon />
                        </IconButton>
                        <Menu
                            id="menu-appbar"
                            anchorEl={anchorEl}
                            anchorOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            keepMounted
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            open={Boolean(anchorEl)}
                            onClose={handleClose}
                        >
                            {menuItems.map((item) => (
                                <MenuItem
                                    key={item.key}
                                    onClick={() => {
                                        navigate(item.path);
                                        handleClose();
                                    }}
                                >
                                    {item.icon} <Typography sx={{ ml: 1 }}>{item.label}</Typography>
                                </MenuItem>
                            ))}
                            {user ? (
                                <MenuItem onClick={handleLogout}>
                                    <Logout /> <Typography sx={{ ml: 1 }}>Logout</Typography>
                                </MenuItem>
                            ) : (
                                <Box>
                                    <MenuItem onClick={() => { navigate('/login'); handleClose(); }}>Login</MenuItem>
                                    <MenuItem onClick={() => { navigate('/register'); handleClose(); }}>Register</MenuItem>
                                </Box>
                            )}
                        </Menu>
                    </>
                )}
            </Toolbar>
        </AppBar>
    );
};

export default Navbar;
