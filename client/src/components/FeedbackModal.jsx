
import { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Rating, Typography, Box, Stack
} from '@mui/material';
import { Star } from '@mui/icons-material';
import api from '../utils/api';
import toast from 'react-hot-toast';

const FeedbackModal = ({ open, onClose, orderId, type = 'Review', onSubmitSuccess }) => {
    const [rating, setRating] = useState(5);
    const [feedback, setFeedback] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!feedback.trim()) {
            toast.error('Please provide some details');
            return;
        }

        setLoading(true);
        try {
            await api.post('/reviews', {
                orderId,
                rating: type === 'Review' ? rating : undefined,
                feedback,
                type
            });
            toast.success(type === 'Review' ? 'Thank you for your rating!' : 'Report submitted successfully');
            setFeedback('');
            setRating(5);
            if (onSubmitSuccess) onSubmitSuccess();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Submission failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                {type === 'Review' ? 'Rate Your Delivery' : 'Report an Issue'}
            </DialogTitle>
            <DialogContent dividers>
                <Stack spacing={3} sx={{ mt: 1 }}>
                    {type === 'Review' && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                            <Typography component="legend">How was the driver?</Typography>
                            <Rating
                                name="simple-controlled"
                                value={rating}
                                onChange={(event, newValue) => {
                                    setRating(newValue);
                                }}
                                size="large"
                                emptyIcon={<Star style={{ opacity: 0.55 }} fontSize="inherit" />}
                            />
                        </Box>
                    )}

                    <TextField
                        autoFocus
                        margin="dense"
                        label={type === 'Review' ? "Comments (Optional)" : "Describe the issue"}
                        type="text"
                        fullWidth
                        multiline
                        rows={4}
                        variant="outlined"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        required={type === 'Complaint'}
                    />
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="inherit">Cancel</Button>
                <Button onClick={handleSubmit} variant="contained" disabled={loading} color={type === 'Complaint' ? 'error' : 'primary'}>
                    {loading ? 'Submitting...' : 'Submit'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default FeedbackModal;
