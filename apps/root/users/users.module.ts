import path from "path";
import {Module} from '@nestjs/common';
import {UsersController} from './users.controller';
import {UsersService} from './users.service';
import {MongooseModule} from "@nestjs/mongoose";
import {Event, EventSchema, User, UserSchema} from "apps/root/database/schemas";
import {EventRepository, UsersRepository} from "apps/root/database/repositories";
import {ClientsModule, Transport} from "@nestjs/microservices";
import {AUTH_PACKAGE_NAME, AUTH_SERVICE} from "../common";

@Module({
    imports: [
        MongooseModule.forFeature([
            {name: User.name, schema: UserSchema},
            {name: Event.name, schema: EventSchema}
        ]),
        ClientsModule.register([
            {
                name: AUTH_SERVICE,
                transport: Transport.GRPC,
                options: {
                    package: AUTH_PACKAGE_NAME,
                    protoPath: path.join(__dirname, "proto/auth.proto")
                    // url: "localhost:6061"
                }
            }
        ])
    ],
    controllers: [UsersController],
    providers: [UsersService, UsersRepository, EventRepository],
    exports: [UsersService]
})
export class UsersModule {}
