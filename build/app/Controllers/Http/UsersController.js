"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const User_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/User"));
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
const Hash_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Hash"));
class UsersController {
    async index({ response }) {
        try {
            const data = await User_1.default.query();
            return response.status(200).send(data);
        }
        catch (error) {
            return error;
        }
    }
    async store({ request, response }) {
        const body = request.only(User_1.default.fillable);
        try {
            const data = await User_1.default.create(body);
            return response.status(201).send(data);
        }
        catch (error) {
            return error;
        }
    }
    async update({ params, request, response }) {
        console.log('user update:', params.id);
        const body = request.only(User_1.default.fillable);
        try {
            const data = await User_1.default.query().where('id', params.id)
                .update(body);
            return response.status(201).send(data);
        }
        catch (error) {
            return error;
        }
    }
    async login({ auth, request, response }) {
        const body = request.only(User_1.default.fillable);
        const user = await User_1.default
            .query()
            .where('username', body.username)
            .first();
        if (!user) {
            throw new BadRequestException_1.default("error", 401, "Invalid User");
        }
        if (!(await Hash_1.default.verify(user.password, body.password))) {
            throw new BadRequestException_1.default("error", 401, "Invalid Password");
        }
        const token = await auth.use('api').generate(user, {
            expiresIn: '7 days',
            name: user.username
        });
        return response.status(200).send({ token, user });
    }
}
exports.default = UsersController;
//# sourceMappingURL=UsersController.js.map