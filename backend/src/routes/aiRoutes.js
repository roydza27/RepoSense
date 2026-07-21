import express from 'express';

const router = express.Router();

/**
 * POST /api/ai/suggest-commit - Get AI commit suggestion
 * Delegates to git controller
 */
router.post('/suggest-commit', async (req, res) => {
  // Import here to avoid circular dependencies
  const { handleSuggestCommit } = await import('../controllers/gitController.js');
  return handleSuggestCommit(req, res);
});

export default router;
