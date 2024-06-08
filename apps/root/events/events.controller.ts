import {FileFieldsInterceptor} from "@nestjs/platform-express";
import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    UploadedFiles,
    UseInterceptors,
    UsePipes,
    ValidationPipe
} from '@nestjs/common';
import {
    ApiBody,
    ApiConsumes,
    ApiCreatedResponse,
    ApiDefaultResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags
} from "@nestjs/swagger";
import {EventsService} from "./events.service";
import {CreateEventDto, EventResponse, EventsResponse, UpdateEventDto} from "./dto";
import {BaseResponse, ChangeUserFieldDto} from "../common/dto";
import {RequestFiles, TypeAction} from "../common";

@ApiTags("Events")
@Controller("events")
export class EventsController {
    constructor(private eventsService: EventsService) {
    }

    @Get()
    @ApiOperation({summary: "Получение всех мероприятий"})
    @ApiOkResponse({type: EventsResponse})
    async getEvents() {
        const records = await this.eventsService.getEvents();
        return {code: 1, data: records};
    }

    @Get(":id")
    @ApiOperation({summary: "Получение мероприятия по id"})
    @ApiOkResponse({type: EventResponse})
    async getEventById(@Param("id") id: string) {
        const foundRecord = await this.eventsService.getEventById(id);
        if (!foundRecord) {
            throw new BadRequestException({code: 0, data: "Мероприятие не было найдено."});
        }

        return {code: 1, data: foundRecord};
    }

    // TODO: Сделать метод по rpc
    @Post()
    @ApiBody({type: CreateEventDto})
    @ApiConsumes('multipart/form-data')
    @ApiCreatedResponse({type: EventResponse})
    @ApiOperation({summary: "Создание нового мероприятия"})
    @UseInterceptors(FileFieldsInterceptor([
        {name: 'mainImage', maxCount: 1},
        {name: 'images', maxCount: 5},
    ]))
    async createEvent(
        @Body() createEventDto: CreateEventDto,
        @UploadedFiles() files: RequestFiles
    ) {
        const createdRecord = await this.eventsService.createEvent(createEventDto, files);
        return {code: 1, data: createdRecord};
    }

    @Patch(":id")
    @ApiOperation({summary: "Обновление существующего мероприятия"})
    @ApiDefaultResponse({type: EventResponse})
    async updateEvent(@Param("id") id: string, @Body() updateEventDto: UpdateEventDto) {
        const updatedRecord = await this.eventsService.updateEvent(id, updateEventDto);
        return {code: 1, data: updatedRecord};
    }

    @Delete(":id")
    @UsePipes(new ValidationPipe())
    @ApiOperation({summary: "Удаление мероприятия"})
    @ApiDefaultResponse({type: BaseResponse})
    async deleteUser(@Param("id") id: string) {
        await this.eventsService.deleteEvent(id);
        return {code: 1, data: "Успешное удаление."};
    }

    @Post("changeParticipantsField")
    @ApiBody({type: ChangeUserFieldDto})
    @ApiOperation({summary: "Добавление/Удаление поля participants"})
    @ApiDefaultResponse({type: BaseResponse})
    @UsePipes(new ValidationPipe())
    async changeEventsField(@Body() changeUserFieldDto: ChangeUserFieldDto) {
        if (changeUserFieldDto.action === TypeAction.ADD) {
            await this.eventsService.addToParticipantsField(changeUserFieldDto);
        } else {
            await this.eventsService.deleteFromParticipantsField(changeUserFieldDto);
        }
        return {code: 1, data: "Успешное изменение."};
    }

    @Post("changeOrganizersField")
    @ApiBody({type: ChangeUserFieldDto})
    @ApiOperation({summary: "Добавление/Удаление поля organizers"})
    @ApiDefaultResponse({type: BaseResponse})
    async changeOwnEventsField(@Body() changeUserFieldDto: ChangeUserFieldDto) {
        if (changeUserFieldDto.action === TypeAction.ADD) {
            await this.eventsService.addToOrganizersField(changeUserFieldDto);
        } else {
            await this.eventsService.deleteFromOrganizersField(changeUserFieldDto);
        }
        return {code: 1, data: "Успешное изменение."};
    }
}
