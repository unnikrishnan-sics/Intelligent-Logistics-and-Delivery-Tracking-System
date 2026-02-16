import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <Container maxWidth="md">
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '80vh',
                    textAlign: 'center',
                }}
            >
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Typography variant="h1" fontWeight="bold" color="primary" gutterBottom>
                        404
                    </Typography>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                >
                    <Typography variant="h4" gutterBottom>
                        Oops! Page Not Found
                    </Typography>
                    <Typography variant="body1" color="text.secondary" paragraph>
                        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
                    </Typography>

                    <Button
                        variant="contained"
                        size="large"
                        onClick={() => navigate('/')}
                        sx={{ mt: 3 }}
                    >
                        Go to Homepage
                    </Button>
                </motion.div>
            </Box>
        </Container>
    );
};

export default NotFound;
