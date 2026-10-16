import { Router } from 'express';

import * as userController from '../controllers/userController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';
import limiter from '../utils/limiter.js';

const router = Router();

// Rate limit every /users route before authenticateUser, which hits the database
router.use(limiter);

router.get('/view', authenticateUser, userController.viewAllUsers);
router.get('/view/:id', authenticateUser, userController.viewSingleUser);
router.put('/update/:id', authenticateUser, userController.updateUser);
router.delete('/delete/:id', authenticateUser, userController.deleteUser);

export default router;
