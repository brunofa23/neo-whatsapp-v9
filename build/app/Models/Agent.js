"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const Orm_1 = global[Symbol.for('ioc.use')]("Adonis/Lucid/Orm");
const luxon_1 = require("luxon");
class Agent extends Orm_1.BaseModel {
}
__decorate([
    (0, Orm_1.column)({ isPrimary: true }),
    __metadata("design:type", Number)
], Agent.prototype, "id", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Agent.prototype, "name", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Agent.prototype, "number_phone", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], Agent.prototype, "interval_init_query", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], Agent.prototype, "interval_final_query", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], Agent.prototype, "interval_init_message", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], Agent.prototype, "interval_final_message", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], Agent.prototype, "max_limit_message", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Agent.prototype, "status", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Boolean)
], Agent.prototype, "active", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true }),
    __metadata("design:type", luxon_1.DateTime)
], Agent.prototype, "createdAt", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", luxon_1.DateTime)
], Agent.prototype, "updatedAt", void 0);
exports.default = Agent;
//# sourceMappingURL=Agent.js.map