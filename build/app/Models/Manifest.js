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
const luxon_1 = require("luxon");
const Orm_1 = global[Symbol.for('ioc.use')]("Adonis/Lucid/Orm");
class Manifest extends Orm_1.BaseModel {
    static get fillable() {
        return [
            'id',
            'chat_id',
            'mainsubject_id',
            'responsible',
            'main_subject',
            'complement',
            'report',
            'employee_involved',
            'medic_einvolved',
            'date_limit',
            'responsible_response',
            'root_cause',
            'action',
            'date_limit_action',
            'date_limit_manifest',
            'obs',
            'status',
            'justification'
        ];
    }
}
__decorate([
    (0, Orm_1.column)({ isPrimary: true }),
    __metadata("design:type", Number)
], Manifest.prototype, "id", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], Manifest.prototype, "chat_id", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], Manifest.prototype, "mainsubject_id", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Manifest.prototype, "responsible", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Manifest.prototype, "main_subject", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Manifest.prototype, "complement", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Manifest.prototype, "report", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Manifest.prototype, "employee_involved", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Manifest.prototype, "medic_einvolved", void 0);
__decorate([
    Orm_1.column.dateTime(),
    __metadata("design:type", luxon_1.DateTime)
], Manifest.prototype, "date_limit", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Manifest.prototype, "responsible_response", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Manifest.prototype, "root_cause", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Manifest.prototype, "action", void 0);
__decorate([
    Orm_1.column.dateTime(),
    __metadata("design:type", luxon_1.DateTime)
], Manifest.prototype, "date_limit_action", void 0);
__decorate([
    Orm_1.column.dateTime(),
    __metadata("design:type", luxon_1.DateTime)
], Manifest.prototype, "date_limit_manifest", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Manifest.prototype, "obs", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Manifest.prototype, "status", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Manifest.prototype, "justification", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true }),
    __metadata("design:type", luxon_1.DateTime)
], Manifest.prototype, "createdAt", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", luxon_1.DateTime)
], Manifest.prototype, "updatedAt", void 0);
exports.default = Manifest;
//# sourceMappingURL=Manifest.js.map