import { Router } from 'express';
import { TeamController } from '../controllers/team.controller';
import { requireRole } from '../middlewares/role.middleware';
import { RoleType } from '../models/RolePermission.model';

const router = Router();

router.post('/', requireRole(RoleType.ADMIN), TeamController.createTeam);
router.get('/', TeamController.getAll);
router.get('/:id', TeamController.getTeam);
router.put('/:id', requireRole(RoleType.ADMIN), TeamController.updateTeam);
router.delete('/:id', requireRole(RoleType.ADMIN), TeamController.delete);

export default router;
