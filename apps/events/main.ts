import path from "path";
import {NestFactory} from '@nestjs/core';
import {EventsModule} from './events.module';
import {MicroserviceOptions, Transport} from "@nestjs/microservices";
import {EVENT_PACKAGE_NAME} from "./common";

const start = async () => {
    const app = await NestFactory.createMicroservice<MicroserviceOptions>(EventsModule, {
        transport: Transport.GRPC,
        options: {
            protoPath: path.join(__dirname, "proto/event.proto"),
            package: EVENT_PACKAGE_NAME,
            loader: {longs: Number},
            url: process.env.URL
        }
    });

    await app.listen();
};

(async () => {
    await start();
})();
