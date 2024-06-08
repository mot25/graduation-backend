import {TypeAction} from "../common";
import {UsersService} from "./users.service";
import {BaseResponse, ChangeUserFieldDto} from "../common/dto";
import {UpdateUserDto, UserResponse, UsersResponse} from "./dto";
import {ApiBody, ApiDefaultResponse, ApiOperation, ApiParam, ApiTags} from "@nestjs/swagger";
import {BadRequestException, Body, Controller, Get, Param, Patch, Post, UsePipes, ValidationPipe} from '@nestjs/common';

@ApiTags("Users")
@Controller("users")
export class UsersController {
    constructor(private usersService: UsersService) {
    }

    // @Post("checkTokenAndGetUser")
    // @ApiOperation({
    //     summary: "Получение юзера по токену (одному из)",
    // })
    // @ApiBody({type: GetUserByTokenDto})
    // @ApiResponse({type: UserResponse})
    // async checkTokenAndGetUser(@Body() dto: GetUserByTokenDto) {
    //     const response = await this.usersService.getUserByToken(dto);
    //     if (!response)
    //         throw new BadRequestException({code: 0, data: "Не удалось поулчить пользователя"});
    //     return {code: 1, data: response};
    // }

    @Get()
    @ApiOperation({summary: "Получение всех пользователей"})
    @ApiDefaultResponse({type: UsersResponse})
    async getUsers() {
        const records = await this.usersService.getUsers();
        return {code: 1, data: records};
    }

    @Get(":id")
    @ApiOperation({summary: "Получение пользователя по id"})
    @ApiParam({name: "id", required: true, description: "User id"})
    @ApiDefaultResponse({type: UserResponse})
    async getUserById(@Param("id") id: string) {
        const foundRecord = await this.usersService.getUserById(id);
        if (!foundRecord) {
            throw new BadRequestException({code: 0, data: "Пользователь не был найден."});
        }

        return {code: 1, data: foundRecord};
    }

    @Patch(":id")
    @ApiOperation({summary: "Обновление данных пользователя"})
    @ApiDefaultResponse({type: UserResponse})
    @UsePipes(new ValidationPipe())
    async updateUser(@Param("id") id: string, @Body() updateUserDto: UpdateUserDto) {
        const updatedRecord = await this.usersService.updateUser(id, updateUserDto);
        return {code: 1, data: updatedRecord};
    }

    @Post("changeFavouritesField")
    @ApiBody({type: ChangeUserFieldDto})
    @ApiOperation({summary: "Добавление/Удаление поля favourites"})
    @ApiDefaultResponse({type: BaseResponse})
    @UsePipes(new ValidationPipe())
    async changeFavouritesField(@Body() changeUserFieldDto: ChangeUserFieldDto) {
        if (changeUserFieldDto.action === TypeAction.ADD) {
            await this.usersService.addToFavouriteField(changeUserFieldDto);
        } else {
            await this.usersService.deleteFromFavouriteField(changeUserFieldDto);
        }
        return {code: 1, data: "Успешное изменение."};
    }

    @Post("changeEventsField")
    @ApiBody({type: ChangeUserFieldDto})
    @ApiOperation({summary: "Добавление/Удаление поля events"})
    @ApiDefaultResponse({type: BaseResponse})
    @UsePipes(new ValidationPipe())
    async changeEventsField(@Body() changeUserFieldDto: ChangeUserFieldDto) {
        if (changeUserFieldDto.action === TypeAction.ADD) {
            await this.usersService.addToEventsField(changeUserFieldDto);
        } else {
            await this.usersService.deleteFromEventsField(changeUserFieldDto);
        }
        return {code: 1, data: "Успешное изменение."};
    }

    @Post("changeOwnEventsField")
    @ApiBody({type: ChangeUserFieldDto})
    @ApiOperation({summary: "Добавление/Удаление поля ownEvents"})
    @ApiDefaultResponse({type: BaseResponse})
    @UsePipes(new ValidationPipe())
    async changeOwnEventsField(@Body() changeUserFieldDto: ChangeUserFieldDto) {
        if (changeUserFieldDto.action === TypeAction.ADD) {
            await this.usersService.addToOwnEventsField(changeUserFieldDto);
        } else {
            await this.usersService.deleteFromOwnEventsField(changeUserFieldDto);
        }
        return {code: 1, data: "Успешное изменение."};
    }
}
