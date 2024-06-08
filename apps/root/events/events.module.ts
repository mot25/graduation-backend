import path from "path";
import {Module} from '@nestjs/common';
import {EventsService} from './events.service';
import {MongooseModule} from "@nestjs/mongoose";
import {EventsController} from './events.controller';
import {FILE_PACKAGE_NAME, FILE_SERVICE} from "../common";
import {Event, EventSchema, User, UserSchema} from "apps/root/database/schemas";
import {EventRepository, UsersRepository} from "apps/root/database/repositories";
import {ClientsModule, Transport} from "@nestjs/microservices";

@Module({
    imports: [
        MongooseModule.forFeature([
            {name: User.name, schema: UserSchema},
            {name: Event.name, schema: EventSchema}
        ]),
        ClientsModule.register([
            {
                name: FILE_SERVICE,
                transport: Transport.GRPC,
                options: {
                    package: FILE_PACKAGE_NAME,
                    protoPath: path.join(__dirname, "proto/file.proto"),
                    url: process.env.FILES_URL
                }
            }
        ])
    ],
    controllers: [EventsController],
    providers: [EventsService, EventRepository, UsersRepository]
})

export class EventsModule {
}