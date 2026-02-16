import { Typography, Button, Stack, Card, CardContent, Grid, Box, Container } from '@mui/material';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowForward, LocalShipping, Security, Public } from '@mui/icons-material';

const Home = () => {
    return (
        <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
            {/* Hero Section */}
            <Container maxWidth="lg" sx={{
                minHeight: '80vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                py: { xs: 8, md: 10 },
                position: 'relative'
            }}>
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <Box sx={{
                        mb: 4,
                        position: 'relative',
                        display: 'inline-block'
                    }}>
                        <LocalShipping sx={{ fontSize: { xs: 60, md: 80 }, color: 'primary.main', mb: 2 }} />
                    </Box>

                    <Typography
                        variant="h2"
                        component="h1"
                        gutterBottom
                        sx={{
                            fontWeight: 800,
                            background: 'linear-gradient(45deg, #0F4C81 30%, #2BB673 90%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            fontSize: { xs: '2.5rem', md: '4rem' },
                            lineHeight: 1.2,
                            mb: 3
                        }}
                    >
                        Intelligent Logistics & <br /> Delivery Tracking
                    </Typography>

                    <Typography
                        variant="h5"
                        color="text.secondary"
                        paragraph
                        sx={{
                            maxWidth: '800px',
                            mx: 'auto',
                            mb: 5,
                            fontSize: { xs: '1rem', md: '1.25rem' },
                            lineHeight: 1.6
                        }}
                    >
                        Optimize your supply chain with our AI-powered platform. Experience real-time GPS tracking, smart route planning, and secure delivery verification—all in one place.
                    </Typography>

                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={3}
                        justifyContent="center"
                        alignItems="center"
                    >
                        <Button
                            component={Link}
                            to="/register"
                            variant="contained"
                            size="large"
                            endIcon={<ArrowForward />}
                            sx={{
                                px: 5,
                                py: 1.5,
                                borderRadius: '50px',
                                fontSize: '1.1rem',
                                textTransform: 'none',
                                boxShadow: '0 4px 14px 0 rgba(15, 76, 129, 0.39)',
                                background: 'linear-gradient(45deg, #0F4C81 30%, #1976d2 90%)',
                                '&:hover': {
                                    boxShadow: '0 6px 20px 0 rgba(15, 76, 129, 0.23)',
                                    transform: 'translateY(-2px)'
                                },
                                transition: 'all 0.3s ease'
                            }}
                        >
                            Get Started
                        </Button>
                        <Button
                            component={Link}
                            to="/login"
                            variant="outlined"
                            size="large"
                            sx={{
                                px: 5,
                                py: 1.5,
                                borderRadius: '50px',
                                fontSize: '1.1rem',
                                textTransform: 'none',
                                borderWidth: '2px',
                                borderColor: 'primary.main',
                                '&:hover': {
                                    borderWidth: '2px',
                                    backgroundColor: 'rgba(15, 76, 129, 0.04)',
                                    transform: 'translateY(-2px)'
                                },
                                transition: 'all 0.3s ease'
                            }}
                        >
                            Track Order
                        </Button>
                    </Stack>
                </motion.div>
            </Container>

            {/* Features Section */}
            <Box sx={{
                py: { xs: 8, md: 12 },
                background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.5) 100%)'
            }}>
                <Container maxWidth="lg">
                    <Typography
                        variant="h3"
                        align="center"
                        gutterBottom
                        sx={{
                            mb: 8,
                            fontWeight: 'bold',
                            color: 'text.primary'
                        }}
                    >
                        Why Choose iLDTS?
                    </Typography>

                    <Grid container spacing={4}>
                        {[
                            {
                                title: 'Real-Time Tracking',
                                icon: <Public sx={{ fontSize: 50, color: 'primary.main' }} />,
                                desc: 'Monitor your fleet with precision. Get live updates on vehicle locations and delivery status worldwide.'
                            },
                            {
                                title: 'Smart Route Optimization',
                                icon: <LocalShipping sx={{ fontSize: 50, color: 'secondary.main' }} />,
                                desc: 'AI-driven algorithms calculate the most efficient paths, reducing fuel costs and delivery times.'
                            },
                            {
                                title: 'Secure Verification',
                                icon: <Security sx={{ fontSize: 50, color: 'primary.main' }} />,
                                desc: 'Advanced OTP delivery confirmation ensures packages are handed to the right person, every time.'
                            }
                        ].map((item, index) => (
                            <Grid size={{ xs: 12, md: 4 }} key={index}>
                                <motion.div
                                    whileHover={{ y: -10 }}
                                    transition={{ type: 'spring', stiffness: 300 }}
                                >
                                    <Card
                                        sx={{
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            p: 4,
                                            textAlign: 'center',
                                            background: 'rgba(255, 255, 255, 0.7)',
                                            backdropFilter: 'blur(10px)',
                                            borderRadius: 4,
                                            border: '1px solid rgba(255, 255, 255, 0.5)',
                                            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
                                            transition: 'all 0.3s ease'
                                        }}
                                        elevation={0}
                                    >
                                        <Box sx={{
                                            p: 2,
                                            borderRadius: '50%',
                                            backgroundColor: 'rgba(255,255,255,0.9)',
                                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                            mb: 3
                                        }}>
                                            {item.icon}
                                        </Box>
                                        <CardContent sx={{ p: 0 }}>
                                            <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 2 }}>
                                                {item.title}
                                            </Typography>
                                            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                                                {item.desc}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>
        </Box>
    );
};

export default Home;
