import { Card, CardContent, Typography, Box, Button } from '@mui/material';
import { User } from '@/types';
import { useUserStore } from '../../store/useUserStore';

interface VerificationDocumentCardProps {
    user: User;
}

const VerificationDocumentCard = ({ user }: VerificationDocumentCardProps) => {
    const { updateUser } = useUserStore();

    const handleApprove = () => {
        if (window.confirm(`Are you sure you want to APPROVE the document for ${user.full_name}?`)) {
            updateUser(user.id, { verification_status: 'verified' });
        }
    };

    const handleReject = () => {
        const reason = window.prompt(`Please provide a reason for REJECTING the document for ${user.full_name}:`);
        if (reason && reason.trim()) {
            // THE FIX: The console.log is now removed as the audit log handles this.
            updateUser(user.id, { verification_status: 'rejected' });
        } else if (reason !== null) { 
            alert("A reason is required to reject a document.");
        }
    };

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>Verification Document</Typography>
                
                {user.verification_document_url ? (
                    <Box>
                        <a href={user.verification_document_url} target="_blank" rel="noopener noreferrer">
                            <img 
                                src={user.verification_document_url} 
                                alt={`Verification document for ${user.full_name}`}
                                style={{ width: '100%', borderRadius: '8px', border: '1px solid #ddd' }}
                            />
                        </a>
                        {user.verification_status === 'pending' && (
                            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                                <Button variant="contained" color="success" onClick={handleApprove}>Approve</Button>
                                <Button variant="outlined" color="error" onClick={handleReject}>Reject</Button>
                            </Box>
                        )}
                         {user.verification_status === 'verified' && (
                            <Typography variant="body2" color="success.main" sx={{ mt: 2 }}>Document has been verified.</Typography>
                        )}
                         {user.verification_status === 'rejected' && (
                            <Typography variant="body2" color="error.main" sx={{ mt: 2 }}>Document has been rejected.</Typography>
                        )}
                    </Box>
                ) : (
                    <Typography variant="body2" color="text.secondary">
                        No document has been uploaded by the user yet.
                    </Typography>
                )}
            </CardContent>
        </Card>
    );
};

export default VerificationDocumentCard;