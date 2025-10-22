import { Router } from "express";
import { MemberController } from "../controllers/member.controller";
import { requireRole } from "../middlewares/role.middleware";
import { RoleType } from "../models/RolePermission.model";

const router = Router();

router.post("/", requireRole(RoleType.ADMIN), MemberController.addUser);
router.delete("/", requireRole(RoleType.ADMIN), MemberController.removeUser);
router.put("/role", requireRole(RoleType.ADMIN), MemberController.updateRole);
router.get("/team/:teamId", MemberController.getTeamMembers);
router.get("/user/:userId", MemberController.getUserTeams);

export default router;
