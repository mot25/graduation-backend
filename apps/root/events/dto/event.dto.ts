import {IsNotEmpty, IsOptional} from "class-validator";
import {Event, EventDate} from "apps/root/database/schemas";
import {ApiProperty, OmitType, PartialType, PickType} from "@nestjs/swagger";
import {Multer} from "multer";

export class CreateEventDto extends PickType(
    Event,
    ["name", "description", "city", "place", "address", "ageLimit",
        "price", "currency", "tags", "categories", "organizers"]
) {
    @ApiProperty({type: [EventDate], required: true, description: "Даты начал и концов мероприятий"})
    @IsNotEmpty()
    date: EventDate[];

    @ApiProperty({
        type: 'file',
        properties: {file: {type: 'string', format: 'binary'}},
        required: true
    })
    mainImage: Express.Multer.File;

    @ApiProperty({
        type: 'array',
        items: {type: 'file', items: {type: 'string', format: 'binary'}},
        required: false,
        description: "Images of events.",
        default: []
    })
    @IsOptional()
    images: Express.Multer.File[];
}

export class EventResponse {
    @ApiProperty({type: Number, description: "Код ответа", default: 1})
    code: number;

    @ApiProperty({type: Event, description: "Полученные данные"})
    data: object;
}

export class EventsResponse {
    @ApiProperty({type: Number, description: "Код ответа", default: 1})
    code: number;

    @ApiProperty({type: [Event], description: "Полученные данные"})
    data: any;
}

export class UpdateEventDto extends PartialType(OmitType(
    CreateEventDto,
    ["mainImage", "images"]
)) {
}