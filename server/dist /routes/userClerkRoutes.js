"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userClerkController_1 = require("../controllers/userClerkController");
const router = express_1.default.Router();
router.put("/:userId", userClerkController_1.updateUser);
exports.default = router;
