import mongoose from "mongoose";
import {Inject, Injectable, OnModuleInit} from '@nestjs/common';

import {UpdateUserDto} from "./dto";
import {
    AUTH_ROOT_SERVICE_NAME,
    AUTH_SERVICE,
    AuthRootServiceClient,
    getValuesAndConditions,
    parseRecordsWithImages,
    TypeCollection
} from "../common";
import {EventRepository, UsersRepository} from "apps/root/database/repositories";
import {pipelineForFullUser, pipelineForShortUser} from "apps/root/database/pipelines";
import {ClientGrpc} from "@nestjs/microservices";
import {firstValueFrom} from "rxjs";
import {ChangeUserFieldDto} from "../common/dto";

@Injectable()
export class UsersService implements OnModuleInit {
    private authService: AuthRootServiceClient;

    constructor(
        private readonly userRepository: UsersRepository,
        private readonly eventRepository: EventRepository,
        @Inject(AUTH_SERVICE) private authClient: ClientGrpc,
    ) {
    }

    onModuleInit() {
        this.authService =
            this.authClient.getService<AuthRootServiceClient>(AUTH_ROOT_SERVICE_NAME);
    }

    async getUserByToken(dto: any) {
        return await firstValueFrom(this.authService.checkTokenAndGetUser(dto));
        // this.authService.checkTokenAndGetUser(dto)
        //     .subscribe({
        //         next: (data) => {
        //             // Обработка данных
        //             console.log('Received getUserByToken:', data);
        //         },
        //         error: (error) => {
        //             // Обработка ошибки
        //             console.error('An error getUserByToken:', error);
        //         },
        //         complete: () => {
        //             // Действия при завершении потока данных
        //             console.log('Complete getUserByToken');
        //         },
        //     });
    }

    async getUsers() {
        const foundUsers = await this.userRepository.aggregate(pipelineForShortUser);
        return parseRecordsWithImages(foundUsers, TypeCollection.Users);
    }

    async getUserById(id: string) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return null;
        }

        const foundUser = await this.userRepository.aggregate([
            {$match: {_id: new mongoose.Types.ObjectId(id)}},
            ...pipelineForFullUser
        ]);
        return parseRecordsWithImages(foundUser, TypeCollection.Users)[0];
    }

    updateUser(id: string, updateUserDto: UpdateUserDto) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return null;
        }

        return this.userRepository.findOneAndUpdate({_id: id}, updateUserDto);
    }

    async addToFavouriteField(changeUserFieldDto: ChangeUserFieldDto) {
        const {id, values} = changeUserFieldDto;
        const {valuesIds, conditionIds} = getValuesAndConditions(values);

        await this.userRepository.findOneAndUpdate(
            {_id: id},
            {$addToSet: {favourites: valuesIds}}
        );

        await this.eventRepository.updateMany(
            {$or: conditionIds},
            {$addToSet: {marked: id}}
        );
    }

    async deleteFromFavouriteField(changeUserFieldDto: ChangeUserFieldDto) {
        const {id, values} = changeUserFieldDto;
        const {valuesIds, conditionIds} = getValuesAndConditions(values);

        await this.userRepository.findOneAndUpdate(
            {_id: id},
            {$pullAll: {favourites: valuesIds}}
        );

        await this.eventRepository.updateMany(
            {$or: conditionIds},
            {$pull: {marked: id}}
        );
    }

    async addToEventsField(changeUserFieldDto: ChangeUserFieldDto) {
        const {id, values} = changeUserFieldDto;
        const {valuesIds, conditionIds} = getValuesAndConditions(values);

        await this.userRepository.findOneAndUpdate(
            {_id: id},
            {$addToSet: {events: valuesIds}}
        );

        await this.eventRepository.updateMany(
            {$or: conditionIds},
            {$addToSet: {participants: id}}
        );
    }

    async deleteFromEventsField(changeUserFieldDto: ChangeUserFieldDto) {
        const {id, values} = changeUserFieldDto;
        const {valuesIds, conditionIds} = getValuesAndConditions(values);

        await this.userRepository.findOneAndUpdate(
            {_id: id},
            {$pullAll: {events: valuesIds}}
        );

        await this.eventRepository.updateMany(
            {$or: conditionIds},
            {$pull: {participants: id}}
        );
    }

    async addToOwnEventsField(changeUserFieldDto: ChangeUserFieldDto) {
        const {id, values} = changeUserFieldDto;
        const {valuesIds, conditionIds} = getValuesAndConditions(values);

        await this.userRepository.findOneAndUpdate(
            {_id: id},
            {$addToSet: {ownEvents: valuesIds}}
        );

        await this.eventRepository.updateMany(
            {$or: conditionIds},
            {$addToSet: {organizers: id}}
        );
    }

    async deleteFromOwnEventsField(changeUserFieldDto: ChangeUserFieldDto) {
        const {id, values} = changeUserFieldDto;
        const {valuesIds, conditionIds} = getValuesAndConditions(values);

        await this.userRepository.findOneAndUpdate(
            {_id: id},
            {$pullAll: {ownEvents: valuesIds}}
        );

        await this.eventRepository.updateMany(
            {$or: conditionIds},
            {$pull: {organizers: id}}
        );
    }
}
