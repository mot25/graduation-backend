import {BadRequestException, HttpException, Inject, Injectable, OnModuleInit} from '@nestjs/common';
import mongoose from "mongoose";

import {CreateEventDto, UpdateEventDto} from "./dto";
import {EventRepository} from "../database/repositories";
import {
    getFullPathImage,
    getObjectId,
    getValuesAndConditions,
    parseArrayWithIds,
    parseJson,
    parseRecordsWithImages
} from "../common/utils";
import {UsersRepository} from "apps/root/database/repositories";
import {pipelineForFullEvent, pipelineForShortEvent} from "apps/root/database/pipelines";
import {ClientGrpc, RpcException} from "@nestjs/microservices";
import {catchError, lastValueFrom, throwError, timeout} from "rxjs";
import {
    FILE_SERVICE,
    FILE_SERVICE_NAME,
    FileDataResponse,
    FileResponse,
    FilesDataResponse,
    FileServiceClient,
    FilesResponse,
    GrpcErrorPayload,
    RequestFiles,
    ServerFileData,
    TypeCollection
} from "../common";
import {ChangeUserFieldDto} from "../common/dto";

@Injectable()
export class EventsService implements OnModuleInit {
    private fileService: FileServiceClient;

    constructor(
        @Inject(FILE_SERVICE) private fileClient: ClientGrpc,
        private readonly eventRepository: EventRepository,
        private readonly userRepository: UsersRepository
    ) {
    }

    onModuleInit() {
        this.fileService =
            this.fileClient.getService<FileServiceClient>(FILE_SERVICE_NAME);
    }

    getAnswerByRpc = async (func: any, params: any) => {
        const result: FileResponse | FilesResponse = await lastValueFrom(
            func(params)
                .pipe(timeout(5000))
                .pipe(catchError(error => throwError(() =>
                    new RpcException({details: error.details, code: error.code} as GrpcErrorPayload))))
        );

        if (!result || !result.message) {
            throw new BadRequestException({code: 0, data: "Не удалось получить ответ по rpc."});
        }
        if (result.statusCode !== 200) {
            throw new HttpException(result.message, result.statusCode);
        }

        const {message, data} = result.message;
        return message ? message : data;
    };

    async getEvents() {
        const resEventsRecords = await this.eventRepository.aggregate(pipelineForShortEvent);
        if (!resEventsRecords || !Array.isArray(resEventsRecords)) {
            return resEventsRecords;
        }

        return parseRecordsWithImages(resEventsRecords, TypeCollection.Events);
    }

    async getEventById(id: string) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return null;
        }
        const foundEvent = await this.eventRepository.aggregate([
            {$match: {_id: new mongoose.Types.ObjectId(id)}},
            ...pipelineForFullEvent
        ]);
        return parseRecordsWithImages(foundEvent, TypeCollection.Events)[0];
    }

    async createEvent(createEventDto: CreateEventDto, files: RequestFiles) {
        const {mainImage = [], images = []} = files;
        const needMainImage = mainImage[0] as Express.Multer.File;
        if (!needMainImage) {
            throw new BadRequestException({code: false, data: "Не указаны необходимые параметры"});
        }

        createEventDto.address = parseJson(String(createEventDto.address));
        createEventDto.date = parseJson(`[${createEventDto.date}]`);

        createEventDto.organizers = parseArrayWithIds(createEventDto.organizers);
        createEventDto.categories = parseArrayWithIds(createEventDto.categories);
        createEventDto.tags = parseArrayWithIds(createEventDto.tags);

        const id = new mongoose.Types.ObjectId();
        const ageLimitId = getObjectId(createEventDto.ageLimit);

        const mainImageResponse = await this.getAnswerByRpc(
            this.fileService.addMainImage,
            {id: String(id), collection: TypeCollection.Events, fileData: needMainImage}
        );
        if (!mainImageResponse || typeof mainImageResponse === "string") {
            throw new BadRequestException({code: 0, data: "Не удалось загрузить картинку."});
        }
        const {image: mainImageData} = mainImageResponse as FileDataResponse;

        let extraImagesData: ServerFileData[] = [];
        if (images.length > 0) {
            const extraImagesResponse = await this.getAnswerByRpc(
                this.fileService.addExtraImages,
                {id: String(id), collection: TypeCollection.Events, filesData: images}
            );
            if (!extraImagesResponse || typeof extraImagesResponse === "string") {
                throw new BadRequestException({code: 0, data: "Не удалось загрузить картинку."});
            }
            extraImagesData = (extraImagesResponse as FilesDataResponse).images;
        }

        await this.eventRepository.create({
            _id: id,
            ...createEventDto,
            ageLimit: ageLimitId,
            mainImage: mainImageData?.imageFullName ?? "",
            images: extraImagesData.map(extraImage => extraImage.imageFullName)
        });

        for (const organizer of createEventDto.organizers) {
            await this.userRepository.findOneAndUpdate(
                {_id: organizer},
                {$addToSet: {ownEvents: id}}
            );
        }

        const foundEvent = await this.eventRepository.aggregate([
            {$match: {_id: id}},
            ...pipelineForFullEvent
        ]);

        return parseRecordsWithImages(foundEvent, TypeCollection.Events)[0];
    }

    async updateEvent(id: string, updateUserDto: UpdateEventDto) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return null;
        }

        const updatedEvent = (await this.eventRepository.findOneAndUpdate({_id: id}, updateUserDto))!;
        return parseRecordsWithImages([updatedEvent], TypeCollection.Events)[0];
    }

    async deleteEvent(id: string) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return null;
        }

        const foundEvent = await this.eventRepository.findOne({_id: id});
        if (!foundEvent) {
            throw new BadRequestException({code: 0, data: "Запись по такому id отсутсвует."});
        }

        if (foundEvent.mainImage !== "") {
            await this.getAnswerByRpc(
                this.fileService.deleteMainImage,
                {link: getFullPathImage(id, TypeCollection.Events, foundEvent.mainImage)}
            );
        }

        if (foundEvent.images.length !== 0) {
            await this.getAnswerByRpc(
                this.fileService.deleteExtraImages,
                {id: String(id), collection: TypeCollection.Events, filesData: foundEvent.images}
            );
        }

        await this.eventRepository.deleteOne({_id: id});
    }

    async addToParticipantsField(changeUserFieldDto: ChangeUserFieldDto) {
        const {id, values} = changeUserFieldDto;
        const {valuesIds, conditionIds} = getValuesAndConditions(values);

        await this.eventRepository.findOneAndUpdate(
            {_id: id},
            {$addToSet: {participants: valuesIds}}
        );

        await this.userRepository.updateMany(
            {$or: conditionIds},
            {$addToSet: {events: id}}
        );
    }

    async deleteFromParticipantsField(changeUserFieldDto: ChangeUserFieldDto) {
        const {id, values} = changeUserFieldDto;
        const {valuesIds, conditionIds} = getValuesAndConditions(values);

        await this.eventRepository.findOneAndUpdate(
            {_id: id},
            {$pullAll: {participants: valuesIds}}
        );

        await this.userRepository.updateMany(
            {$or: conditionIds},
            {$pull: {events: id}}
        );
    }

    async addToOrganizersField(changeUserFieldDto: ChangeUserFieldDto) {
        const {id, values} = changeUserFieldDto;
        const {valuesIds, conditionIds} = getValuesAndConditions(values);

        await this.eventRepository.findOneAndUpdate(
            {_id: id},
            {$addToSet: {organizers: valuesIds}}
        );

        await this.userRepository.updateMany(
            {$or: conditionIds},
            {$addToSet: {ownEvents: id}}
        );
    }

    async deleteFromOrganizersField(changeUserFieldDto: ChangeUserFieldDto) {
        const {id, values} = changeUserFieldDto;
        const {valuesIds, conditionIds} = getValuesAndConditions(values);

        await this.eventRepository.findOneAndUpdate(
            {_id: id},
            {$pullAll: {organizers: valuesIds}}
        );

        await this.userRepository.updateMany(
            {$or: conditionIds},
            {$pull: {ownEvents: id}}
        );
    }
}
