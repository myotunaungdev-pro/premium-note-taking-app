export const generateOTP = () => {
    // Generate a 6-digit numeric string
    return Math.floor(100000 + Math.random() * 900000).toString();
};
