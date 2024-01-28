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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const luxon_1 = require("luxon");
const Orm_1 = global[Symbol.for('ioc.use')]("Adonis/Lucid/Orm");
const Env_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Env"));
const Chat_1 = __importDefault(require("./Chat"));
class Customchat extends Orm_1.BaseModel {
    static get connection() {
        return Env_1.default.get('DB_CONNECTION_MAIN');
    }
    static get fillable() {
        return [
            'id',
            'chats_id',
            'idexternal',
            'reg',
            'cellphone',
            'cellphoneserialized',
            'message',
            'response',
            'returned',
            'chatname',
            'messagesent',
            'phonevalid'
        ];
    }
}
__decorate([
    (0, Orm_1.hasOne)(() => Chat_1.default, {
        foreignKey: 'id',
        localKey: 'chats_id'
    }),
    __metadata("design:type", Object)
], Customchat.prototype, "chat", void 0);
__decorate([
    (0, Orm_1.column)({ isPrimary: true }),
    __metadata("design:type", Number)
], Customchat.prototype, "id", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], Customchat.prototype, "chats_id", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], Customchat.prototype, "idexternal", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Number)
], Customchat.prototype, "reg", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Customchat.prototype, "cellphone", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Customchat.prototype, "cellphoneserialized", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Customchat.prototype, "message", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Customchat.prototype, "response", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Boolean)
], Customchat.prototype, "returned", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Customchat.prototype, "chatname", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", String)
], Customchat.prototype, "chatnumber", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Boolean)
], Customchat.prototype, "messagesent", void 0);
__decorate([
    (0, Orm_1.column)(),
    __metadata("design:type", Boolean)
], Customchat.prototype, "phonevalid", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true }),
    __metadata("design:type", luxon_1.DateTime)
], Customchat.prototype, "createdAt", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", luxon_1.DateTime)
], Customchat.prototype, "updatedAt", void 0);
exports.default = Customchat;
//# sourceMappingURL=Customchat.js.map