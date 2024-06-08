## Команды для запуска
```bash
# Общий запуск через докер:
sudo docker-compose up --build -d
# Остановить и удалить все созданные контейнеры
docker-compose down

# Если по отдельности:
npm run start:dev root
npm run start:dev cms
```

## Документации
```
# Документация главного сервиса (PORT: DEV - 6060, PROD - 7060)
http://localhost:PORT/root/api/docs

# Документация cms сервиса (PORT: DEV - 6061, PROD - 7061)
http://localhost:PORT/cms/api/docs
```

## Команды работы с докером
```bash
# флаг build говорит пересобрать все образы
docker-compose up --build -d
# Пересобрать контейнер
sudo docker-compose up -d --no-deps --build root
sudo docker-compose up -d --no-deps --build cms
sudo docker-compose up -d --no-deps --build files
sudo docker-compose up -d --no-deps --build auth
sudo docker-compose up -d --no-deps --build events
sudo docker-compose up -d --no-deps --build postgres-cms
sudo docker-compose up -d --no-deps --build pgadmin

docker-compose down

docker system prune
docker system prune -a --volumes

docker exec -it mycontainer sh
```

## Вспомогательные команды
```bash
# Сохдание сертификатов
openssl req -x509 -nodes -subj "/C=RU/ST=CA/L=Kaliningrad/CN=neafisha.ru" -days 3650 -newkey rsa:2048 -keyout your_private_key.pem -out your_certificate.pem

# Создание нового микросервиса
nest generate app micro-name

# Запуск определенного микросервиса
npm run start:dev micro-name

# Установка новой библиотеки
nest g library common

# Посмотреть список зайдейстованных портов
sudo ss -tulpn

# Kill process
fuser -k 8080/tcp

# Proto
protoc --plugin=./node_modules/.bin/protoc-gen-ts_proto --ts_proto_out=./ --ts_proto_opt=nestJs=true ./proto/event.proto
```

## Postgres
```bash
# Отклюить postgres
sudo service postgresql stop

// Удаление всех коллекций
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;





```
