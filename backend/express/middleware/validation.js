export const validateInputIsChinese = (req, res, next) => {
    try {
        const { sentence } = req.body;
        const threshold = 0.25;

        if (!sentence?.trim()) {
            return res.status(400).json({ // 👈 Added return
                error: 'Input validation failed',
                details: 'No input provided'
            });
        }

        const chineseChars = sentence.match(/[\u4e00-\u9fff]/g) || [];
        if (chineseChars.length / sentence.length < threshold) {
            return res.status(400).json({ // 👈 Added return
                error: 'Input validation failed',
                details: `At least ${threshold * 100}% of the text must be Chinese`
            });
        }

        req.validatedText = sentence.trim();
        next();
    } catch (error) {
        return res.status(400).json({ // 👈 Added return
            error: 'Input validation failed',
            details: error.message
        });
    }
};