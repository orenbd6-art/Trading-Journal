export function errorMiddleware(err, _req, res, _next) {
    console.error('❌ Error:', err.message);
    res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
}
